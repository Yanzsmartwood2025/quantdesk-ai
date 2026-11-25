"""No network, no broker, no credentials: isolated educational tests."""
import unittest

from research.educational_evidence_review import (
    AgentNote,
    fictional_example,
    review,
)


class EvidenceReviewTests(unittest.TestCase):
    def test_fictional_discussion_requires_human_review(self):
        result = fictional_example()
        self.assertEqual(result["decision"], "human_review_required")
        self.assertTrue(result["disagreement"])
        self.assertTrue(result["agreement_is_not_proof"])
        self.assertEqual(result["external_network_calls"], 0)
        self.assertEqual(result["automated_actions"], 0)

    def test_missing_sources_fail_closed(self):
        notes = (
            AgentNote("observer", "A", "supported", ("unknown",), 0.8),
            AgentNote("challenger", "A", "supported", ("known",), 0.8),
            AgentNote("reviewer", "A", "supported", ("known",), 0.8),
        )
        result = review({"known": "fictional"}, notes)
        self.assertEqual(result["decision"], "human_review_required")
        self.assertEqual(result["unknown_evidence_ids"], ["unknown"])

    def test_unanimity_with_sources_is_a_quality_label_not_a_decision(self):
        notes = tuple(AgentNote(role, "A", "supported", ("a",), .5)
                      for role in ("observer", "challenger", "reviewer"))
        result = review({"a": "fictional"}, notes)
        self.assertEqual(result["decision"], "evidence_cited_agreement")
        self.assertTrue(result["agreement_is_not_proof"])

    def test_missing_role_fails(self):
        notes = tuple(AgentNote("observer", "A", "supported", ("a",), .6)
                      for _ in range(3))
        with self.assertRaisesRegex(ValueError, "exactly_three"):
            review({"a": "fictional"}, notes)

    def test_uncited_role_fails_closed(self):
        notes = (
            AgentNote("observer", "A", "supported", ("a",), .5),
            AgentNote("challenger", "A", "supported", (), .5),
            AgentNote("reviewer", "A", "supported", ("a",), .5),
        )
        result = review({"a": "fictional"}, notes)
        self.assertEqual(result["decision"], "human_review_required")
        self.assertEqual(result["uncited_roles"], ["challenger"])

    def test_invalid_confidence_fails(self):
        with self.assertRaisesRegex(ValueError, "confidence_out_of_range"):
            AgentNote("observer", "A", "supported", (), 1.1)


if __name__ == "__main__":
    unittest.main()
