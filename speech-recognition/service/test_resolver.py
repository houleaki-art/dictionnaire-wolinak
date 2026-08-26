import unittest

from resolver import canonical_text, resolve_transcript


class ResolverTests(unittest.TestCase):
    def test_preserves_aln8ba_characters(self):
        self.assertEqual(canonical_text(" T8ni aliwizian? "), "t8ni aliwizian")
        self.assertEqual(canonical_text("Nd’aliwizi"), "nd'aliwizi")
        self.assertEqual(canonical_text("Kwaï"), "kwaï")

    def test_short_form_requires_exact_output(self):
        self.assertEqual(resolve_transcript("h8", ["8h8", "8ka"])["status"], "unresolved")
        self.assertEqual(resolve_transcript("8h8", ["8h8", "8ka"])["status"], "matched-exact")

    def test_unique_long_form_can_accept_one_character(self):
        result = resolve_transcript("t8ni aliwizia", ["T8ni aliwizian", "Nd'aliwizi Mali"])
        self.assertEqual(result["status"], "matched-unique")
        self.assertEqual(result["match"], "T8ni aliwizian")

    def test_ambiguous_output_is_not_forced(self):
        result = resolve_transcript("ndaloki", ["Nd'aloka", "Nd'aloko"])
        self.assertEqual(result["status"], "unresolved")


if __name__ == "__main__":
    unittest.main()

