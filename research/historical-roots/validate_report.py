#!/usr/bin/env python3
"""Sanity checks for the generated historical-root report."""

import json
from pathlib import Path


path = Path(__file__).with_name("historical-root-links.json")
payload = json.loads(path.read_text(encoding="utf-8"))
links = payload["links"]
novel = payload["novel_ocr_candidates"]

assert len(payload["sources"]) == 2
assert {source["source"] for source in payload["sources"]} == {"masta", "laurent"}
assert all(link["occurrences"] for link in links)
assert all(link["confidence"] in {"confirme", "fort", "a verifier"} for link in links)
assert any(link["historical_form"] == "Wanald8zik" and link["root"] == "aldam" for link in links)
assert any(link["historical_form"] == "Wanalm8muk" and link["root"] == "aldam" for link in links)
assert any(link["historical_form"] == "Nodab8nkad" and link["root"] == "ab8n" for link in links)
assert any(link["historical_form"] == "Kdakinna" and link["root"] == "dakina" for link in links)
assert sum(item["confidence"] == "fort" for item in novel) >= 80
assert not any(item["historical_form"] == "almost" for item in novel)
assert len(payload["current_reference"]) >= 440

print(
    f"Rapport valide: {len(links)} liens localises, "
    f"{len(payload['unlocated_catalogue_candidates'])} non localises, "
    f"{len(novel)} jetons OCR."
)
