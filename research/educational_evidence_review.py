"""Educational evidence-review exercise. Not connected to any financial API or bot.

This module evaluates the quality of a *fictional* discussion; it never
produces an operational instruction or contacts a network service.
"""
from __future__ import annotations

from dataclasses import dataclass
import json
from typing import Mapping, Sequence

ALLOWED_ROLES = frozenset({"observer", "challenger", "reviewer"})
ALLOWED_STANCES = frozenset({"supported", "challenged", "uncertain"})


@dataclass(frozen=True)
class AgentNote:
    role: str
    claim: str
    stance: str
    evidence_ids: tuple[str, ...]
    confidence: float

    def __post_init__(self) -> None:
        if self.role not in ALLOWED_ROLES:
            raise ValueError("unknown_role")
        if self.stance not in ALLOWED_STANCES:
            raise ValueError("unknown_stance")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence_out_of_range")
        if not self.claim.strip():
            raise ValueError("empty_claim")


def review(evidence: Mapping[str, str], notes: Sequence[AgentNote]) -> dict:
    """Audit citations and disagreements. Conservatively request review.

    Agreement is not proof: even when all agents agree this assessment
    remains an educational quality report, not a real-world decision.
    """
    roles = [note.role for note in notes]
    if len(notes) != 3 or set(roles) != ALLOWED_ROLES:
        raise ValueError("exactly_three_distinct_roles_required")
    unknown = sorted({
        evidence_id
        for note in notes
        for evidence_id in note.evidence_ids
        if evidence_id not in evidence
    })
    uncited = sorted(note.role for note in notes if not note.evidence_ids)
    stances = {note.stance for note in notes}
    claims = {note.claim.strip() for note in notes}
    unanimous = len(stances) == 1 and stances == {"supported"} and len(claims) == 1
    reliable_citations = not unknown and not uncited and bool(evidence)
    return {
        "decision": (
            "evidence_cited_agreement"
            if unanimous and reliable_citations
            else "human_review_required"
        ),
        "agreement_is_not_proof": True,
        "roles": roles,
        "stances": {note.role: note.stance for note in notes},
        "unknown_evidence_ids": unknown,
        "uncited_roles": uncited,
        "disagreement": len(stances) > 1 or len(claims) > 1,
        "average_reported_confidence": round(
            sum(note.confidence for note in notes) / len(notes), 3
        ),
        "external_network_calls": 0,
        "automated_actions": 0,
    }


def fictional_example() -> dict:
    """Invented classroom experiment; figures are deliberately fictional."""
    references = {
        "lab-a": "Fictional classroom observation: a paper plane flew 3 metres.",
        "lab-b": "Fictional second observation: a paper plane flew 2 metres.",
    }
    notes = (
        AgentNote("observer", "The second result is shorter.", "supported", ("lab-a", "lab-b"), 0.9),
        AgentNote("challenger", "The observations may vary by launch.", "uncertain", ("lab-a",), 0.8),
        AgentNote("reviewer", "More repetitions are necessary.", "challenged", ("lab-a", "lab-b"), 0.7),
    )
    return review(references, notes)


if __name__ == "__main__":
    print(json.dumps(fictional_example(), ensure_ascii=False, indent=2))
