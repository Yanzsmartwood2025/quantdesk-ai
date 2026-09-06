#!/usr/bin/env bash
set -euo pipefail

echo "=== OCI Hunter: Starting execution ==="

if [[ -z "${OCI_TENANCY_OCID:-}" ]]; then
  echo "Error: OCI_TENANCY_OCID is not set."
  exit 1
fi

if [[ -z "${OCI_REGION:-}" ]]; then
  echo "Error: OCI_REGION is not set."
  exit 1
fi

# 1. Fetch Availability Domains
echo "Fetching Availability Domains..."
ADS_JSON=$(oci iam availability-domain list --compartment-id "$OCI_TENANCY_OCID" --region "$OCI_REGION" --output json)
AD_NAMES=$(echo "$ADS_JSON" | jq -r '.data[].name' | sort)

if [[ -z "$AD_NAMES" ]]; then
  echo "Error: Could not retrieve Availability Domains."
  exit 1
fi

echo "Availability Domains found:"
echo "$AD_NAMES"

# 2. Fetch Public Subnet
echo "Fetching public subnet..."
SUBNETS_JSON=$(oci network subnet list --compartment-id "$OCI_TENANCY_OCID" --region "$OCI_REGION" --output json)
SUBNET_ID=$(echo "$SUBNETS_JSON" | jq -r '.data[] | select(.["prohibit-public-ip-on-vnic"] == false or .["prohibit-public-ip-on-vnic"] == null) | .id' | head -n 1)

if [[ -z "$SUBNET_ID" || "$SUBNET_ID" == "null" ]]; then
  echo "Error: Could not find a public subnet in tenancy $OCI_TENANCY_OCID."
  exit 1
fi
echo "Selected Subnet OCID: $SUBNET_ID"

# 3. Fetch Image (Canonical Ubuntu 24.04 or 22.04 for x86_64)
echo "Fetching latest Canonical Ubuntu image..."
IMAGES_JSON=$(oci compute image list --compartment-id "$OCI_TENANCY_OCID" --region "$OCI_REGION" --shape "VM.Standard.E2.1.Micro" --output json)

IMAGE_ID=$(echo "$IMAGES_JSON" | jq -r '.data[] | select(.["operating-system"] == "Canonical Ubuntu" and (.name | test("24\\.04|22\\.04")) and (.["operating-system-version"] | test("24\\.04|22\\.04"))) | .id' | head -n 1)

# Fallback: filter by display-name / name containing Canonical-Ubuntu
if [[ -z "$IMAGE_ID" || "$IMAGE_ID" == "null" ]]; then
  IMAGE_ID=$(echo "$IMAGES_JSON" | jq -r '.data[] | select(.name | test("Canonical-Ubuntu-(24\\.04|22\\.04)")) | .id' | head -n 1)
fi

# General fallback for any Ubuntu image
if [[ -z "$IMAGE_ID" || "$IMAGE_ID" == "null" ]]; then
  IMAGE_ID=$(oci compute image list --compartment-id "$OCI_TENANCY_OCID" --region "$OCI_REGION" --output json | jq -r '.data[] | select(.name | test("Canonical-Ubuntu-(24\\.04|22\\.04)")) | .id' | head -n 1)
fi

if [[ -z "$IMAGE_ID" || "$IMAGE_ID" == "null" ]]; then
  echo "Error: Could not find suitable Ubuntu 24.04/22.04 image."
  exit 1
fi
echo "Selected Image OCID: $IMAGE_ID"

# SSH Authorized Keys Metadata
SSH_KEY_METADATA=""
if [[ -n "${SSH_PUBLIC_KEY:-}" ]]; then
  # Format metadata json string properly
  SSH_KEY_METADATA=$(jq -n --arg ssh_key "$SSH_PUBLIC_KEY" '{"ssh_authorized_keys": $ssh_key}')
fi

DISPLAY_NAME="oci-micro-instance-$(date +%s)"
SHAPE="VM.Standard.E2.1.Micro"

SUCCESS=false
INSTANCE_ID=""
ASSIGNED_AD=""

# 4. Hunting loop: 3 rounds, 20s pause between rounds
for ROUND in {1..3}; do
  echo "--- Round $ROUND of 3 ---"

  for AD in $AD_NAMES; do
    echo "Attempting launch in Availability Domain: $AD..."

    LAUNCH_CMD=(
      oci compute instance launch
      --compartment-id "$OCI_TENANCY_OCID"
      --availability-domain "$AD"
      --shape "$SHAPE"
      --display-name "$DISPLAY_NAME"
      --image-id "$IMAGE_ID"
      --subnet-id "$SUBNET_ID"
      --assign-public-ip true
      --region "$OCI_REGION"
      --output json
    )

    if [[ -n "$SSH_KEY_METADATA" ]]; then
      LAUNCH_CMD+=(--metadata "$SSH_KEY_METADATA")
    fi

    # Execute launch command and capture output/error silently
    RESPONSE=$("${LAUNCH_CMD[@]}" 2>&1 || true)

    # Check if response contains instance ID
    INST_ID=$(echo "$RESPONSE" | jq -r '.data.id // empty' 2>/dev/null || true)

    if [[ -n "$INST_ID" && "$INST_ID" != "null" ]]; then
      echo "🎉 INSTANCE CREATED SUCCESSFULLY!"
      echo "Instance ID: $INST_ID"
      INSTANCE_ID="$INST_ID"
      ASSIGNED_AD="$AD"
      SUCCESS=true
      break 2
    else
      echo "Capacity unavailable or error encountered in $AD. Response summary:"
      echo "$RESPONSE" | grep -E "Out of host capacity|ServiceError|Code:|Message:" || echo "$RESPONSE" | head -n 3
    fi
  done

  if [[ $ROUND -lt 3 ]]; then
    echo "Waiting 20 seconds before next round..."
    sleep 20
  fi
done

if [[ "$SUCCESS" == "true" ]]; then
  echo "Fetching public IP for instance $INSTANCE_ID..."
  PUBLIC_IP="Pending/Unavailable"

  # Wait a few seconds for VNIC attachment to populate public IP
  for i in {1..6}; do
    echo "Polling VNIC attachments (attempt $i/6)..."
      VNIC_ATTACHMENTS=$(oci compute instance list-vnics --instance-id "$INSTANCE_ID" --region "$OCI_REGION" --output json 2>/dev/null || true)
    VNIC_ID=$(echo "$VNIC_ATTACHMENTS" | jq -r '.data[0]."vnic-id" // empty' 2>/dev/null || true)

    if [[ -n "$VNIC_ID" && "$VNIC_ID" != "null" ]]; then
        VNIC_INFO=$(oci network vnic get --vnic-id "$VNIC_ID" --region "$OCI_REGION" --output json 2>/dev/null || true)
      IP=$(echo "$VNIC_INFO" | jq -r '.data["public-ip"] // empty' 2>/dev/null || true)
      if [[ -n "$IP" && "$IP" != "null" ]]; then
        PUBLIC_IP="$IP"
        break
      fi
    fi
    sleep 5
  done

  echo "Assigned Public IP: $PUBLIC_IP"

  # Send Telegram Notification
  if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
    echo "Sending Telegram alert..."
    MSG="✅ *Instancia AMD Micro capturada con éxito*

*Shape:* \`$SHAPE\`
*AD:* \`$ASSIGNED_AD\`
*IP Pública:* \`$PUBLIC_IP\`
*Instance ID:* \`$INSTANCE_ID\`"

    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=${MSG}" \
      -d "parse_mode=Markdown" > /dev/null || true
  fi

  # Disable Workflow
  echo "Disabling workflow oci-hunter.yml to stop further cron executions..."
  gh workflow disable oci-hunter.yml || echo "Failed to disable workflow automatically via gh CLI."

  exit 0
else
  echo "No capacity available across all 3 rounds. Step finishing silently with exit 0."
  exit 0
fi
