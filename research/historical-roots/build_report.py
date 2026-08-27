#!/usr/bin/env python3
"""Build a page-traceable Masta/Laurent root comparison report.

The script is deliberately conservative: exact and manually documented links are
reported separately from automatic structural candidates.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable

from pypdf import PdfReader


CURRENT_SOURCE_MARKERS = (
    "bomsawin",
    "nicole",
    "document de langue",
    "ndakina",
    "w8banaki",
    "caodanak",
    "conseil des abenakis",
    "dictionnaireabenakis",
    "locuteur natif",
    "locutrice native",
)
HISTORICAL_SOURCE_MARKERS = (
    "masta",
    "laurent",
    "day",
    "gordon",
    "bruchac",
    "swarthmore",
    "ling073",
)
DOUBTFUL_NOTES = re.compile(
    r"forme construite|a confirmer|sens a confirmer|reconstruite|a faire valider|"
    r"non attestee|par analogie|hypothese|a valider|non glosee",
    re.I,
)
TOKEN_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ8]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿ8]+)*")
PERSON_PREFIXES = ("nd'", "kd'", "wd'", "n'", "k'", "w'")
INFLECTION_SUFFIXES = (
    "w8ganal", "w8gan", "gamikw", "gamigw", "higan", "nigan", "zigan",
    "winno", "m8mek", "idjik", "w8gan", "d8zo", "t8zo", "bena", "onda",
    "owen", "m8gan", "k8gan", "kw8gan", "d8gan", "mek", "muk", "zik",
    "kat", "kad", "oak", "jik", "awi", "owi", "oda", "gan", "sis",
    "ak", "al", "ol", "ok", "is",
)
FRENCH_STOPWORDS = {
    "a", "au", "aux", "avec", "ce", "ces", "cette", "dans", "de", "des",
    "du", "elle", "en", "et", "il", "la", "le", "les", "leur", "leurs",
    "lui", "ne", "nos", "notre", "nous", "on", "ou", "par", "pas", "pour",
    "qui", "sa", "se", "ses", "son", "sur", "un", "une", "vous",
}
ENGLISH_STOPWORDS = {
    "a", "about", "after", "all", "also", "an", "and", "are", "as", "at",
    "be", "been", "before", "between", "book", "but", "by", "can", "does",
    "english", "for", "from", "had", "has", "have", "he", "her", "his", "i",
    "in", "indian", "is", "it", "its", "language", "means", "not", "of", "on",
    "one", "or", "page", "part", "she", "that", "the", "their", "there", "they",
    "this", "to", "was", "water", "we", "were", "which", "with", "word", "you",
    "almost", "already", "another", "around", "because", "being", "called", "came",
    "each", "every", "first", "good", "great", "here", "however", "large", "little",
    "long", "more", "most", "much", "name", "same", "some", "than", "then", "very",
}


@dataclass(frozen=True)
class SourceSpec:
    key: str
    label: str
    year: int
    path: Path
    printed_offset: int
    url: str


def fold(value: str) -> str:
    value = str(value or "").replace("’", "'").replace("‘", "'")
    value = value.replace("ô", "8").replace("Ô", "8")
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return value.lower()


def canonical(value: str) -> str:
    value = fold(value)
    value = re.sub(r"[^a-z8'-]+", " ", value)
    return " ".join(value.split())


def tokens(value: str) -> list[str]:
    return [canonical(token) for token in TOKEN_RE.findall(value) if canonical(token)]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def simplified_gloss(value: str) -> set[str]:
    words = re.findall(r"[a-z]{3,}", fold(value))
    normalized = set()
    for word in words:
        if word in FRENCH_STOPWORDS:
            continue
        if len(word) > 4 and word.endswith("s"):
            word = word[:-1]
        normalized.add(word)
    return normalized


def gloss_overlap(left: str, right: str) -> float:
    a, b = simplified_gloss(left), simplified_gloss(right)
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))


def stem_variants(form: str) -> dict[str, str]:
    """Return conservative stems and the operation that produced each stem."""
    form = canonical(form)
    if " " in form or not form:
        return {form: "forme complete"} if form else {}
    result = {form: "forme complete"}
    bases = [(form, "forme complete")]
    for prefix in PERSON_PREFIXES:
        if form.startswith(prefix) and len(form) - len(prefix) >= 4:
            bases.append((form[len(prefix):], f"sans prefixe personnel {prefix}"))
    for base, base_label in list(bases):
        result.setdefault(base, base_label)
        for suffix in INFLECTION_SUFFIXES:
            if base.endswith(suffix) and len(base) - len(suffix) >= 4:
                result.setdefault(
                    base[:-len(suffix)],
                    f"{base_label}; sans suffixe {suffix}",
                )
    return result


def current_row(row: dict) -> bool:
    source = fold(row.get("source", ""))
    notes = fold(row.get("notes", ""))
    if any(marker in source for marker in HISTORICAL_SOURCE_MARKERS):
        return False
    if not any(marker in source for marker in CURRENT_SOURCE_MARKERS):
        if "usage actuel signale par guillaum labrecque-houle" not in notes:
            return False
    if row.get("cat") in {"archive", "corpus", "system"}:
        return False
    if row.get("aln8ba") == "__version__" or "⚠" in str(row.get("fr", "")):
        return False
    return not DOUBTFUL_NOTES.search(fold(row.get("notes", "")))


def historical_source(row: dict) -> str | None:
    source = fold(row.get("source", ""))
    if "masta" in source:
        return "masta"
    if "laurent" in source:
        return "laurent"
    return None


def read_pages(spec: SourceSpec) -> list[dict]:
    reader = PdfReader(str(spec.path))
    pages = []
    for index, page in enumerate(reader.pages, 1):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        printed = index + spec.printed_offset if index + spec.printed_offset > 0 else None
        pages.append({
            "pdf_page": index,
            "printed_page": printed,
            "chars": len(text.strip()),
            "text": text,
            "canonical": canonical(text),
            "lines": lines,
            "tokens": tokens(text),
        })
    return pages


def line_context(page: dict, form: str) -> str:
    sought = canonical(form)
    sought_tokens = set(sought.split())
    for line in page["lines"]:
        normalized = canonical(line)
        if sought and (sought in normalized or sought_tokens & set(normalized.split())):
            return re.sub(r"\s+", " ", line).strip()[:240]
    return ""


def locate(form: str, pages: list[dict]) -> list[dict]:
    wanted = canonical(form)
    wanted_tokens = wanted.split()
    if not wanted:
        return []
    found = []
    phrase_pattern = re.compile(r"(?<![a-z8])" + re.escape(wanted) + r"(?![a-z8])")
    compact_wanted = re.sub(r"[ '-]", "", wanted)
    for page in pages:
        page_text = page["canonical"]
        page_tokens = page["tokens"]
        exact_phrase = bool(phrase_pattern.search(page_text))
        exact_tokens = all(token in page_tokens for token in wanted_tokens)
        compact_ocr = False
        if len(compact_wanted) >= 6:
            compact_ocr = any(
                compact_wanted in re.sub(r"[ '-]", "", canonical(line))
                for line in page["lines"]
            )
        if exact_phrase or exact_tokens or compact_ocr:
            found.append({
                "pdf_page": page["pdf_page"],
                "printed_page": page["printed_page"],
                "context": line_context(page, form),
                "match": "exact" if exact_phrase else ("ocr-spacing" if compact_ocr else "tokens"),
            })
    return found[:12]


def longest_common_substring(left: str, right: str) -> str:
    matcher = SequenceMatcher(None, left, right, autojunk=False)
    block = max(matcher.get_matching_blocks(), key=lambda item: item.size)
    return left[block.a:block.a + block.size]


def choose_relation(hist_form: str, hist_gloss: str, current: dict) -> dict | None:
    hist = canonical(hist_form)
    modern = canonical(current["aln8ba"])
    if not hist or not modern or " " in hist or " " in modern:
        return None
    if hist == modern:
        return {
            "relation": "forme identique",
            "confidence": "confirme",
            "root": hist,
            "evidence": "Graphie identique dans la source historique et le referentiel actuel.",
        }

    hist_stems = stem_variants(hist)
    modern_stems = stem_variants(modern)
    shared = sorted(set(hist_stems) & set(modern_stems), key=len, reverse=True)
    if shared and len(shared[0]) >= 4:
        root = shared[0]
        semantic = gloss_overlap(hist_gloss, current.get("fr", ""))
        if semantic >= 0.4:
            return {
                "relation": "meme base apres flexion",
                "confidence": "fort",
                "root": root,
                "evidence": f"{hist_stems[root]} / {modern_stems[root]}; recouvrement de sens {semantic:.0%}.",
            }
        return {
            "relation": "meme base graphique apres flexion",
            "confidence": "a verifier",
            "root": root,
            "evidence": f"{hist_stems[root]} / {modern_stems[root]}; aucun accord de sens automatique suffisant.",
        }

    common = longest_common_substring(hist, modern)
    ratio = SequenceMatcher(None, hist, modern, autojunk=False).ratio()
    semantic = gloss_overlap(hist_gloss, current.get("fr", ""))
    if len(common) >= 5 and len(common) / min(len(hist), len(modern)) >= 0.65:
        confidence = "fort" if semantic >= 0.5 and ratio >= 0.72 else "a verifier"
        return {
            "relation": "racine graphique commune",
            "confidence": confidence,
            "root": common,
            "evidence": f"Segment commun {common}; similarite graphique {ratio:.0%}; recouvrement de sens {semantic:.0%}.",
        }
    return None


def manual_links(overrides: dict, rows: list[dict]) -> list[dict]:
    by_form = defaultdict(list)
    for row in rows:
        by_form[canonical(row.get("aln8ba", ""))].append(row)
    links = []
    for family in overrides.get("documented_families", []):
        current_rows = []
        for form in family["current_forms"]:
            current_rows.extend(by_form.get(canonical(form), []))
        for historical in family["historical_forms"]:
            links.append({
                "historical_form": historical,
                "historical_gloss": "",
                "current_forms": [row.get("aln8ba") for row in current_rows] or family["current_forms"],
                "current_glosses": [row.get("fr", "") for row in current_rows],
                "root": family["root"],
                "relation": family["relation"],
                "confidence": "confirme",
                "evidence": family["evidence"],
                "historical_ids": [],
                "current_ids": [row.get("id") for row in current_rows],
                "manual": True,
            })
    return links


def build_links(rows: list[dict], overrides: dict, pages_by_source: dict[str, list[dict]]) -> list[dict]:
    current = [row for row in rows if current_row(row)]
    for item in overrides.get("current_usage", []):
        current.append({
            "id": f"override:{canonical(item['form'])}",
            "aln8ba": item["form"],
            "fr": item.get("meaning", ""),
            "source": item.get("evidence", ""),
            "cat": "override",
        })

    historical = [row for row in rows if historical_source(row)]
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in historical:
        source = historical_source(row)
        for token in tokens(row.get("aln8ba", "")):
            if len(token.replace("'", "")) >= 3:
                grouped[(source, token)].append(row)

    links = []
    for (source, hist_token), hist_rows in sorted(grouped.items()):
        hist_gloss = " · ".join(dict.fromkeys(str(row.get("fr", "")) for row in hist_rows if row.get("fr")))
        candidates = []
        for modern in current:
            relation = choose_relation(hist_token, hist_gloss, modern)
            if relation:
                candidates.append((modern, relation))
        if not candidates:
            continue
        rank = {"confirme": 0, "fort": 1, "a verifier": 2}
        candidates.sort(key=lambda item: (
            rank[item[1]["confidence"]],
            -len(item[1]["root"]),
            canonical(item[0].get("aln8ba", "")),
        ))
        best_rank = rank[candidates[0][1]["confidence"]]
        selected = [item for item in candidates if rank[item[1]["confidence"]] == best_rank][:5]
        primary = selected[0][1]
        links.append({
            "source": source,
            "historical_form": hist_token,
            "historical_gloss": hist_gloss,
            "historical_ids": sorted({row.get("id") for row in hist_rows if row.get("id")}),
            "current_forms": [item[0].get("aln8ba") for item in selected],
            "current_glosses": [item[0].get("fr", "") for item in selected],
            "current_ids": [item[0].get("id") for item in selected],
            "root": primary["root"],
            "relation": primary["relation"],
            "confidence": primary["confidence"],
            "evidence": primary["evidence"],
            "occurrences": locate(hist_token, pages_by_source[source]),
            "manual": False,
        })

    for manual in manual_links(overrides, rows):
        for source in ("masta", "laurent"):
            occurrences = locate(manual["historical_form"], pages_by_source[source])
            if occurrences:
                entry = dict(manual)
                entry["source"] = source
                entry["occurrences"] = occurrences
                links.append(entry)

    unique = {}
    for link in links:
        key = (link["source"], canonical(link["historical_form"]))
        existing = unique.get(key)
        if not existing or (link["manual"] and not existing["manual"]):
            unique[key] = link
    return sorted(unique.values(), key=lambda item: (
        item["source"],
        {"confirme": 0, "fort": 1, "a verifier": 2}[item["confidence"]],
        canonical(item["historical_form"]),
    ))


def current_reference(rows: list[dict], overrides: dict) -> list[dict]:
    reference = [
        {
            "id": row.get("id"),
            "aln8ba": row.get("aln8ba"),
            "fr": row.get("fr"),
            "source": row.get("source"),
        }
        for row in rows if current_row(row)
    ]
    for item in overrides.get("current_usage", []):
        reference.append({
            "id": f"override:{canonical(item['form'])}",
            "aln8ba": item["form"],
            "fr": item.get("meaning", ""),
            "source": item.get("evidence", ""),
        })
    unique = {canonical(item["aln8ba"]): item for item in reference}
    return sorted(unique.values(), key=lambda item: canonical(item["aln8ba"]))


def novel_ocr_candidates(
    rows: list[dict],
    links: list[dict],
    pages_by_source: dict[str, list[dict]],
) -> list[dict]:
    """Find uncatalogued page tokens that contain a strong current root signature."""
    known_historical = {
        token
        for row in rows if historical_source(row)
        for token in tokens(row.get("aln8ba", ""))
    }
    current = [row for row in rows if current_row(row)]
    signatures = []
    for row in current:
        for token in tokens(row.get("aln8ba", "")):
            for stem, operation in stem_variants(token).items():
                if len(stem) >= 5:
                    signatures.append((stem, row, operation))
    candidates = {}
    for source, pages in pages_by_source.items():
        for page in pages:
            for token in page["tokens"]:
                if token in known_historical or token in ENGLISH_STOPWORDS or len(token) < 6:
                    continue
                if token.isalpha() and "8" not in token and "'" not in token:
                    # Plain English tokens are admitted only when morphology is very close.
                    plain_word = True
                else:
                    plain_word = False
                best = None
                for stem, row, operation in signatures:
                    current_token = canonical(row["aln8ba"])
                    if token == current_token:
                        score = (1.0, 1.0, len(token))
                        candidate = (score, token, row, "forme actuelle identique sur la page", "fort")
                        if not best or score > best[0]:
                            best = candidate
                        continue
                    if stem not in token:
                        continue
                    coverage = len(stem) / len(token)
                    if coverage < 0.62:
                        continue
                    ratio = SequenceMatcher(None, token, canonical(row["aln8ba"]), autojunk=False).ratio()
                    if plain_word and ratio < 0.78:
                        continue
                    score = (coverage, ratio, len(stem))
                    if not best or score > best[0]:
                        best = (score, stem, row, operation, "a verifier")
                if not best:
                    continue
                key = (source, token, best[1], best[2]["id"])
                entry = candidates.setdefault(key, {
                    "source": source,
                    "historical_form": token,
                    "current_form": best[2]["aln8ba"],
                    "current_id": best[2]["id"],
                    "root": best[1],
                    "confidence": best[4],
                    "evidence": f"Jeton OCR non catalogue contenant {best[1]} ({best[3]}).",
                    "occurrences": [],
                })
                if len(entry["occurrences"]) < 8:
                    entry["occurrences"].append({
                        "pdf_page": page["pdf_page"],
                        "printed_page": page["printed_page"],
                        "context": line_context(page, token),
                    })
    return sorted(candidates.values(), key=lambda item: (item["source"], item["historical_form"]))


def page_audit(spec: SourceSpec, pages: list[dict]) -> dict:
    return {
        "source": spec.key,
        "label": spec.label,
        "year": spec.year,
        "file": str(spec.path.resolve()),
        "sha256": sha256(spec.path),
        "url": spec.url,
        "pdf_pages": len(pages),
        "text_characters": sum(page["chars"] for page in pages),
        "pages_without_text": [page["pdf_page"] for page in pages if page["chars"] == 0],
        "pages_under_100_characters": [page["pdf_page"] for page in pages if page["chars"] < 100],
    }


def md_escape(value: object) -> str:
    return str(value or "").replace("|", "\\|").replace("\n", " ")


def page_label(occurrences: list[dict]) -> str:
    labels = []
    for occurrence in occurrences[:4]:
        printed = occurrence.get("printed_page")
        pdf_page = occurrence.get("pdf_page")
        labels.append(f"p. {printed} (PDF {pdf_page})" if printed else f"PDF {pdf_page}")
    return ", ".join(labels) if labels else "non localisee automatiquement"


def write_markdown(path: Path, payload: dict) -> None:
    counts = Counter(link["confidence"] for link in payload["links"])
    lines = [
        "# Racines connues retrouvees chez Laurent (1884) et Masta (1932)",
        "",
        f"Generation : {payload['generated_on']}",
        "",
        "## Portee et prudence",
        "",
        "Ce rapport rapproche les graphies historiques des formes actuelles documentees dans le projet. "
        "Une date ancienne ne rend pas une forme obsolete. Inversement, une ressemblance de lettres ne "
        "prouve pas a elle seule une racine. Les liens `a verifier` ne doivent jamais alimenter automatiquement "
        "le traducteur, les lecons ou les jeux.",
        "",
        "## Controle OCR",
        "",
        "| Source | Pages PDF | Caracteres extraits | Pages sans texte | SHA-256 |",
        "|---|---:|---:|---|---|",
    ]
    for source in payload["sources"]:
        lines.append(
            f"| {md_escape(source['label'])} | {source['pdf_pages']} | {source['text_characters']} | "
            f"{md_escape(', '.join(map(str, source['pages_without_text'])) or 'aucune')} | `{source['sha256']}` |"
        )
    lines.extend([
        "",
        "Les pages sans couche texte ont ete controlees visuellement. Elles correspondent a des couvertures, "
        "des versos blancs, une photographie ou des pages separatrices; aucune page lexicale n'est absente.",
        "",
        "## Resume",
        "",
        f"- {len(payload['current_reference'])} formes actuelles strictes dans le referentiel.",
        f"- {len(payload['links'])} formes historiques reliees a au moins une racine ou forme actuelle.",
        f"- {len(payload['unlocated_catalogue_candidates'])} formes de la base encore non localisees mot pour mot dans la couche OCR.",
        f"- {counts['confirme']} liens confirmes ou identiques.",
        f"- {counts['fort']} liens structuraux forts.",
        f"- {counts['a verifier']} rapprochements a verifier.",
        f"- {sum(item['confidence'] == 'fort' for item in payload['novel_ocr_candidates'])} formes actuelles identiques retrouvees directement dans les pages mais absentes du catalogue historique.",
        f"- {sum(item['confidence'] == 'a verifier' for item in payload['novel_ocr_candidates'])} jetons OCR non catalogues a examiner separement.",
        "",
    ])
    for confidence, title in (
        ("confirme", "Liens confirmes et formes identiques"),
        ("fort", "Liens structuraux forts"),
        ("a verifier", "Candidats graphiques a verifier"),
    ):
        subset = [link for link in payload["links"] if link["confidence"] == confidence]
        lines.extend([
            f"## {title}",
            "",
            "| Source | Forme historique | Sens historique | Racine | Forme(s) actuelle(s) | Relation | Page | Preuve |",
            "|---|---|---|---|---|---|---|---|",
        ])
        for link in subset:
            lines.append(
                f"| {link['source'].title()} | **{md_escape(link['historical_form'])}** | "
                f"{md_escape(link['historical_gloss'])} | `{md_escape(link['root'])}` | "
                f"{md_escape(' · '.join(link['current_forms']))} | {md_escape(link['relation'])} | "
                f"{md_escape(page_label(link.get('occurrences', [])))} | {md_escape(link['evidence'])} |"
            )
        lines.append("")
    lines.extend([
        "## Formes actuelles identiques retrouvees dans les pages",
        "",
        "Ces formes apparaissent mot pour mot dans les pages historiques et dans le referentiel actuel, mais elles "
        "n'etaient pas rattachees au corpus historique dans la base exportee.",
        "",
        "| Source | Forme | Forme actuelle | Page | Contexte |",
        "|---|---|---|---|---|",
    ])
    for item in payload["novel_ocr_candidates"]:
        if item["confidence"] != "fort":
            continue
        context = item["occurrences"][0]["context"] if item["occurrences"] else ""
        lines.append(
            f"| {item['source'].title()} | **{md_escape(item['historical_form'])}** | "
            f"{md_escape(item['current_form'])} | {md_escape(page_label(item['occurrences']))} | {md_escape(context)} |"
        )
    lines.extend([
        "",
        "## Jetons OCR non catalogues a examiner",
        "",
        "Cette annexe est volontairement exclue des totaux de liens. Elle sert de liste de travail pour verifier "
        "de possibles formes oubliees, mais elle contient necessairement des erreurs OCR et peut contenir des mots anglais.",
        "",
        "| Source | Jeton OCR | Racine candidate | Forme actuelle | Page | Contexte |",
        "|---|---|---|---|---|---|",
    ])
    for item in payload["novel_ocr_candidates"]:
        if item["confidence"] != "a verifier":
            continue
        context = item["occurrences"][0]["context"] if item["occurrences"] else ""
        lines.append(
            f"| {item['source'].title()} | {md_escape(item['historical_form'])} | `{md_escape(item['root'])}` | "
            f"{md_escape(item['current_form'])} | {md_escape(page_label(item['occurrences']))} | {md_escape(context)} |"
        )
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--masta-pdf", type=Path, required=True)
    parser.add_argument("--laurent-pdf", type=Path, required=True)
    parser.add_argument("--words-json", type=Path, required=True)
    parser.add_argument("--overrides", type=Path, default=Path(__file__).with_name("overrides.json"))
    parser.add_argument("--output-json", type=Path, default=Path(__file__).with_name("historical-root-links.json"))
    parser.add_argument("--output-md", type=Path, default=Path(__file__).with_name("historical-root-links.md"))
    args = parser.parse_args()

    specs = [
        SourceSpec(
            "masta",
            "Henry Lorne Masta - Abenaki Indian Legends, Grammar and Place Names",
            1932,
            args.masta_pdf,
            -6,
            "https://archive.org/details/McGillLibrary-rbsc_abenaki-indian-legends_Ind0446-18027",
        ),
        SourceSpec(
            "laurent",
            "Joseph Laurent - New Familiar Abenakis and English Dialogues",
            1884,
            args.laurent_pdf,
            0,
            "https://www.canadiana.ca/view/oocihm.08895",
        ),
    ]
    for spec in specs:
        if not spec.path.is_file():
            parser.error(f"PDF introuvable: {spec.path}")
    rows = json.loads(args.words_json.read_text(encoding="utf-8"))
    overrides = json.loads(args.overrides.read_text(encoding="utf-8"))
    pages_by_source = {spec.key: read_pages(spec) for spec in specs}
    all_links = build_links(rows, overrides, pages_by_source)
    links = [link for link in all_links if link.get("occurrences")]
    unlocated = [link for link in all_links if not link.get("occurrences")]
    novel = novel_ocr_candidates(rows, links, pages_by_source)
    reference = current_reference(rows, overrides)
    payload = {
        "schema_version": 1,
        "generated_on": date.today().isoformat(),
        "method": {
            "principle": "Exact and documented links are separated from automatic structural candidates.",
            "automatic_candidates_feed_product": False,
        },
        "sources": [page_audit(spec, pages_by_source[spec.key]) for spec in specs],
        "current_reference": reference,
        "links": links,
        "unlocated_catalogue_candidates": unlocated,
        "novel_ocr_candidates": novel,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_md.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_markdown(args.output_md, payload)
    counts = Counter(link["confidence"] for link in links)
    print(f"Referentiel actuel: {len(reference)}")
    print(f"Liens: {len(links)} {dict(counts)}")
    print(f"Non localises: {len(unlocated)}")
    print(f"Jetons OCR a verifier: {len(novel)}")
    print(args.output_json.resolve())
    print(args.output_md.resolve())


if __name__ == "__main__":
    main()
