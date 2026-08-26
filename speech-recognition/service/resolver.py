import re
import unicodedata


def canonical_text(value: str) -> str:
    text = unicodedata.normalize("NFC", str(value or "")).lower()
    text = re.sub(r"[’ʻ`]", "'", text)
    text = re.sub(r"[‐‑‒–—]", "-", text)
    text = re.sub(r'[.,!?;:()\[\]{}«»"]', " ", text)
    return re.sub(r"\s+", " ", text).strip()


def levenshtein(left: str, right: str) -> int:
    a = list(canonical_text(left))
    b = list(canonical_text(right))
    previous = list(range(len(b) + 1))
    for index, left_character in enumerate(a, start=1):
        current = [index]
        for column, right_character in enumerate(b, start=1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[column] + 1,
                    previous[column - 1] + (left_character != right_character),
                )
            )
        previous = current
    return previous[-1]


def resolve_transcript(raw_transcript: str, lexicon: list[dict | str]) -> dict:
    raw = canonical_text(raw_transcript)
    if not raw:
        return {"status": "unresolved", "raw": "", "match": None, "reason": "empty"}

    approved: dict[str, str] = {}
    for entry in lexicon:
        text = entry if isinstance(entry, str) else entry.get("aln8ba", "")
        key = canonical_text(text)
        if key and key not in approved:
            approved[key] = text

    if raw in approved:
        return {"status": "matched-exact", "raw": raw, "match": approved[raw], "distance": 0}

    max_distance = 0 if len(raw) < 6 else min(2, max(1, int(len(raw) * 0.12)))
    ranked = sorted(
        (
            {"key": key, "text": text, "distance": levenshtein(raw, key)}
            for key, text in approved.items()
        ),
        key=lambda item: (item["distance"], item["key"]),
    )
    best = ranked[0] if ranked else None
    second = ranked[1] if len(ranked) > 1 else None
    gap = second["distance"] - best["distance"] if best and second else float("inf")
    if best and best["distance"] <= max_distance and gap >= 2:
        return {
            "status": "matched-unique",
            "raw": raw,
            "match": best["text"],
            "distance": best["distance"],
            "reason": "unique-nearest-green-form",
        }
    return {
        "status": "unresolved",
        "raw": raw,
        "match": None,
        "reason": "ambiguous" if best and best["distance"] <= max_distance else "outside-approved-lexicon",
    }

