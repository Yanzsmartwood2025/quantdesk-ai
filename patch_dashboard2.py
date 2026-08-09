file_path = "web/src/components/dashboard/Dashboard.tsx"
with open(file_path, "r") as f:
    content = f.read()

search_empty_state_text = """      ) : isDataEmpty ? (
        <EmptyState message={`Esperando las primeras velas y señales para ${instrument.replace('_', '/')}...`} />"""

replace_empty_state_text = """      ) : isDataEmpty ? (
        <EmptyState message={`Esperando las primeras velas y señales para ${instrumentLabels[instrument] || instrument.replace('_', '/')}...`} />"""

content = content.replace(search_empty_state_text, replace_empty_state_text)

with open(file_path, "w") as f:
    f.write(content)
