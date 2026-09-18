# Handoff: state, decisions, backlog

Prototype built in a Claude chat session on 2026-09-16/17 and published as a
claude.ai artifact. This repo is that prototype restructured so the build is one
command and deterministic. `dist/index.html` is the published page.

## The brief (Wilson's words, condensed)

An interactive "biography" of the New Testament that connects names across books,
using the WEB translation, focused on Acts and the epistles and especially the
salutations that close Paul's letters. Each name colored by attestation; names
with multiple attestation linked to each other. Delivered as HTML.

## What exists

- 169 people, 466 name-bearing verses, Acts through Jude. 79 Acts only, 65 one
  letter, 8 several letters, 17 Acts and letters.
- Hero: Romans 16:21–23 rendered live, every name tappable.
- Thread map: one row per book, one dot per person named; selecting a person
  draws an SVG thread through their dots, dashed lines to conjectural identities.
- Three tabs: By book (a role-grouped cast list for letters with role data, a
  flat chip list for Acts and any book without it, plus "Read the verses" with
  inline names), All names (search over names and aka), Across books (grid of
  associates in 2+ books, `kind="official"` excluded, column groups by corpus).
- Detail panel (bottom sheet on phones, sticky column on desktop): description,
  attestation by corpus, conjecture cards, verses by book (role shown next to
  the book heading when set), co-named people (same verse = weight 2, adjacent
  verse = 1, top 14).
- Legend buttons filter by attestation class everywhere.

## Editorial decisions already made (change deliberately, not by accident)

| Decision | Why |
|---|---|
| Scope is Acts–Jude; Gospels and Revelation excluded | The brief. `gospels=True` only flags "also named in the Gospels". |
| Jesus, OT figures, angels, "Caesar" excluded | Contemporaries named as persons only. Claudius and Aretas are in. |
| Secure identities merged, conjectures linked | See CLAUDE.md rule 4. Eleven links exist in `LINKS`. |
| 2 Tim 4:20 Erastus filed with the Acts 19:22 assistant | Arguable: "remained at Corinth" could point to the treasurer of Rom 16:23. Noted in both entries. A three-way split is the stricter option. |
| Alexander of 1 Tim 1:20 and the coppersmith of 2 Tim 4:14 kept separate, linked `probable` | Same reasoning as above: do not inflate attestation. |
| Pilate is class `both` via 1 Tim 6:13, but `kind="official"` keeps him out of the Across-books grid | The attestation math is honest and stays visible in his own panel; the grid is specifically about associates, and a confessional aside naming a Roman prefect isn't that. `kind="official"` also covers Claudius, Herod Antipas, Herod Agrippa I, Gallio, Claudius Lysias, Felix, Festus, Drusilla, Agrippa II, Bernice, Aretas — state figures who never appear as believers or co-workers. Sergius Paulus and Publius stay `associate`: one believes, the other hosts Paul. |
| Corpus grouping: undisputed Paul (Rom, 1–2 Cor, Gal, Phil, 1 Thess, Phlm), disputed (Eph, Col, 2 Thess), Pastorals, Hebrews + catholic letters | Shown in the panel and grid headers only; not yet part of the color. |
| Aquila and Prisca are two entries | They are two people; co-naming shows the pairing. |

Wilson prefers sharp analytical distinctions over blended ones, primary sources
over secondary, and direct disagreement where warranted. When a call is arguable,
make it, say why in `desc` or the link note, and flag it in the PR description.

## Backlog, in suggested order

1. ~~**Project hygiene.**~~ Done 2026-09-17: `git init`, pushed to
   `github.com/wilsonpruitt/nt-prosopography` (public), GitHub Action rebuilds
   from source on every push/PR and fails if `dist/index.html` drifts. Hosted
   on Vercel (project `nt-prosopography`), live at `ntnames.wrootpress.com`.
2. **Attestation by corpus.** Partly done 2026-09-17: added a `kind` field
   (`"associate"` default, `"official"` for Pilate, Claudius, Herod Antipas,
   Herod Agrippa I, Gallio, Claudius Lysias, Felix, Festus, Drusilla, Agrippa
   II, Bernice, Aretas) and excluded `kind="official"` from the "Across books"
   grid, so a governor named once in a letter's aside no longer reads as a
   cross-corpus associate. Attestation color/class (`cls`) is untouched —
   still mechanically `both`/`letters`/`letter`/`acts`, still shown honestly
   in the detail panel; only the grid's associate list changed. **Still open:**
   the independent-corpus-count second visual channel (ring segments on dots,
   small numeral on chips) for Acts / undisputed Paul / disputed Paul /
   Pastorals / catholic — deferred because today it would only ever display a
   "2" on one person (Pilate); revisit if scope extends to the Gospels (item
   8), where public figures and cross-attestation both multiply.
3. ~~**Roles in the salutations.**~~ Done 2026-09-17: added `roles={book:role}`
   to `P()` — one role per (person, letter), not literally per verse: co-sender,
   addressee, carrier, scribe, sendsgreetings, greeted, opponent; unlisted is
   "mentioned" (default, no entry needed). 94 (person, book) assignments across
   68 people, sourced from the opening/closing verses themselves (dumped and
   read directly from `web/`, never from memory — see the extraction method in
   the PR). `build.py` validates every role against a fixed taxonomy and against
   the person's actual attestation (a role on a book they don't appear in, or
   on `ACT`, is now a hard `BAD ROLE` build failure). Solo letter-authors (Paul,
   James, Peter, Jude) get no role in their own letter — the taxonomy is for
   people appearing as characters in someone else's letter. The "By book" tab
   now renders a genuine cast list per letter (grouped by role, "Also named"
   catch-all) instead of a flat chip list, and the detail panel shows the role
   next to each book heading. Worth a look: Romans 16, Colossians 4, Philemon.
   **Judgment calls worth knowing about, not re-litigating:** Phygelus, Hermogenes,
   and Demas-in-2-Timothy are filed `opponent` for desertion/worldliness, not
   only false teaching — the taxonomy has no separate "deserted" bucket and
   filing them `mentioned` would misfile them next to neutral figures like
   Chloe. Household heads named only via their household being greeted
   (Aristobulus, Narcissus) stay `mentioned`, not `greeted` — they aren't
   personally addressed. Demetrius in 3 John is `carrier`, following the
   common reading that 3 John's closing testimonial doubles as this letter's
   own bearer's commendation; the text doesn't say so outright.
4. **Greek name forms.** Add `greek` per person (NA28/SBLGNT nominative, polytonic;
   Gentium Book Plus already covers it). Source from the SBLGNT text
   programmatically (CC BY 4.0) rather than from memory, and note Majority Text
   variants where WEB's English reflects them. Make Greek searchable.
5. **Places.** `place` field(s) per person (Corinth, Ephesus, Colossae, Rome...)
   and a filter. Possible later tie-in with Wilson's Topographia Sacra project;
   do not couple the repos yet.
6. **Kinship and household relations** as typed edges distinct from identity
   conjectures: spouse, sibling, parent, cousin, household, host. Currently only
   in `desc` prose.
7. **Deep links.** `#p=<id>` selects a person on load; `#b=<code>` scrolls to a
   book. Update hash on select. Needed before sharing links to entries.
8. **Extend scope** to the Gospels and Revelation behind a toggle, keeping
   Acts–Jude as the default. Large disambiguation job (Marys, Simons, Judases).
9. **Accessibility pass.** Arrow-key navigation in the thread map, focus return
   when the sheet closes, `aria-live` politeness check, contrast check on the
   ochre token in light mode.
10. **Tests.** Assert counts (people, verses, per-class) in a small pytest so data
    edits that change them are visible in review. Snapshot `dist/index.html` size.

## Known rough edges

- On phones the bottom sheet covers most of the thread map when a dot is tapped.
  Consider a collapsed "peek" state for the sheet.
- `verseHTML` highlights every match of a person's pattern in a verse. Fine now;
  check again after adding Gospel-scope Jameses and Marys.
- The grid omits single-book people by design; there is no toggle yet.
- Acts "Read the verses" renders about 330 verses at once. Acceptable; could be
  chapter accordions.
- Descriptions were written in one pass by the assistant and spot-checked, not
  reviewed line by line by Wilson. References are machine-verified; prose is not.

## Sources and licenses

- WEB text: eBible.org `engwebp_vpl.zip`, public domain. Not committed; fetched.
- Fonts: Gentium Book Plus (SIL OFL), Source Sans 3 (OFL), via Google Fonts.
- No other third-party code.
