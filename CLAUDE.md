# Named in Acts and the Letters

An interactive prosopography of the New Testament from Acts to Jude. Every person
named in those books is an entry; every entry lists the verses that use the name,
quoted from the World English Bible (WEB, public domain). Names are colored by
attestation and linked across books. Output is one self-contained HTML file.

Owner: Wilson Pruitt (Wroot Press). Read `docs/HANDOFF.md` before starting work:
it has the current state, the editorial decisions already made, and the backlog.

## Commands

```bash
scripts/fetch_web.sh        # once: download WEB verse-per-line text into web/ (gitignored)
python3 src/build.py -v     # build dist/index.html; -v prints warnings + attestation report
python3 tests/shot.py       # Playwright smoke test: phone + desktop, writes tests/shots/*.png
```

`build.py` exits 1 on NO MATCH / EMPTY / OVERLAP warnings. Treat those as failures.
UNCLAIMED warnings list ambiguous names (John, James, Simon...) found in the text
that no entry claims. Each one must be either claimed or knowingly out of scope
(the remaining ones are Old Testament figures and "Herod's palace").

## Layout

- `src/data.py` : the dataset. `PEOPLE` (one `P(...)` per person) and `LINKS`
  (conjectural identifications). This is where almost all scholarly work happens.
- `src/build.py` : matches names against WEB, resolves overlaps, computes
  attestation class and co-naming, injects JSON into the template.
- `src/template.html` : all markup, CSS and JS. `/*DATA*/` is the injection point.
- `dist/index.html` : built output, committed so it can be opened or deployed as is.

## Rules that must hold

1. **Never type scripture text by hand.** Verse text comes only from the WEB file
   via `build.py`. Citations are verified by the build, not by memory.
2. **Attestation means the name is used in that verse.** No pronouns, no unnamed
   references (Timothy's mother in Acts 16:1 does not attest Eunice).
3. **Use WEB spellings in patterns.** WEB follows the Byzantine Majority Text:
   Justus (not Titius Justus), Nymphas, Amplias, Joses, Judah at Acts 9:11. Put
   critical-text forms in `aka` and explain in `desc`.
4. **Merge only secure identifications; link conjectures.** Silas/Silvanus,
   Prisca/Priscilla, Cephas/Peter, John Mark are single entries. Sopater/Sosipater,
   the Gaiuses, the Erastuses etc. stay separate and get a `LINKS` row with
   `probable` or `possible` plus the argument in one or two sentences. Merging a
   conjecture would silently promote someone into a higher attestation color.
5. **People who share a name are separate entries** with explicit `refs`. Any
   ambiguous name needs explicit refs, never the auto-match.
6. **Descriptions are short, factual, and sourced from the text itself.** Extra-
   biblical claims (Gallio inscription, Erastus pavement, Irenaeus on Linus) are
   labeled as such. No devotional or speculative color.
7. **Single file, no build tooling beyond Python stdlib.** Fonts from Google Fonts
   with real fallbacks; no other network requests. Must work from `file://`.
8. **Both themes, phone first.** Colors are tokens on `:root`, redefined for dark.
   No horizontal page scroll at 390px. Run `tests/shot.py` and look at the shots.

## Data model cheat sheet

```python
P(id, name, desc, pats, refs=None, aka=None, gospels=False, exclude=None, kind="associate")
```
- `pats`: regexes in WEB spelling. Longest match wins when spans overlap.
- `refs=None`: every match in Acts–Jude. Otherwise a list of `"ACT 12:12"`,
  `"ACT 8:5-40"` (range, pattern must still match), or `(ref, pattern_override)`.
- Book codes are eBible's: `ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT
  PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD` (note PHI, JAM, 1JO).
- Attestation class is computed: `both` (Acts + ≥1 letter), `letters` (≥2 letters,
  no Acts), `letter` (1 letter), `acts`. Never edited by hand.
- `kind="official"` marks a Roman/Herodian/Nabataean state figure (governor, king,
  emperor, tribune) who is never a believer or co-worker — Pilate, Claudius, the
  Herods, Felix, Festus, Gallio, Aretas, etc. Excluded from the "Across books"
  grid so an incidental mention (e.g. Pilate in 1 Tim 6:13) doesn't read as a
  cross-corpus associate. Does not affect `cls`, which stays mechanically honest.
  A believing or hospitable contemporary (Sergius Paulus, Publius) stays the
  default `"associate"`.
