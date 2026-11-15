# Living Labs log

Evidence for the Vest Ventures Living Labs Award: we validated with real users, iterated on their
feedback, and can show the improvement in numbers. Add an entry **every time** we hear something
or change something; small entries count. Numbers come from the `summary` tab of the survey sheet.

Survey link: `<paste form link>` · Sheet: `<paste sheet link>` (team only)

## Version history

Bump `APP_VERSION` in the sheet (Living Labs menu → Set app version…) every time a change from
this log ships, so responses are grouped per version.

| Version | Hour | What changed | Because of (entry IDs) |
| --- | --- | --- | --- |
| v0 | 0 | Idea only, no app yet (baseline survey) | — |

## Numbers per version

Copy from the `summary` tab → BY APP VERSION.

| Version | Responses | Avg install likelihood (1–5) | Testers | Avg app rating (1–5) |
| --- | --- | --- | --- | --- |
| v0 | 39 | 4.26 | 3 | 5.0 |

v0 responses came in on 14 Nov 2026, 12:30–21:37. Who answered: 25 students, 7 residents, 4 visitors,
1 international student, 1 newcomer, 1 other; 30 of 39 are aged 18–24. By city: 18 Timișoara, 18 elsewhere in
Romania, 3 abroad. Install likelihood: 18 × 5, 14 × 4, 6 × 3, 1 × 2 (32 of 39 answered 4 or 5).

### Problems and features (v0, 39 responses)

"Hurts a lot" = 4 or 5 on the 1–5 problem scale.

| Module | Avg problem (1–5) | Hurts a lot | Would use | Top pick | Timișoara only: avg / top pick |
| --- | --- | --- | --- | --- | --- |
| parkie (parking) | **3.51** | **23** | 23 | **14** | **3.94** / **6** |
| m01-events | 3.24 | 18 | 23 | 7 | 3.39 / 4 |
| m06-smell | 2.92 | 16 | 14 | 2 | 3.11 / 0 |
| m03-safety | 2.79 | 13 | 23 | 6 | 2.94 / 3 |
| m07-buddy | 2.72 | 12 | 15 | 1 | 2.83 / 1 |
| m05-transit | 2.69 | 13 | 21 | 3 | 2.89 / 2 |
| m08-forum | 2.62 | 12 | 19 | 1 | 2.89 / 0 |
| m04-utilities | 2.38 | 7 | 20 | 1 | 2.67 / 0 |
| m02-visitor-info | 2.36 | 8 | 16 | 0 | 2.44 / 0 |
| m10-assistant | — | — | 18 | 3 | — |

## Feedback → change entries

Source is one of: `survey`, `in-app`, `interview`, `live test`.

| ID | Hour | Source | What we heard (how many people) | Change we made | Module | Shipped in | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LL-01 | 14 Nov | survey | Parking is the biggest problem: top pick for 14 of 39 (next: events, 7), 23 of 39 say it hurts a lot, avg 3.94 among Timișoara respondents | planned: make parking the main feature on Home | parkie | | |
| LL-02 | 14 Nov | survey | Safe routes and dangerous spots on a map, in real time (3 written answers) | planned | m03-safety | | |
| LL-03 | 14 Nov | survey | One map that shows everything (events, reports, places) with filters (2 written answers) | planned | map | | |
| LL-04 | 14 Nov | survey | Rather ask locals than an AI that may be outdated (1 written answer) | planned | m10-assistant, m08-forum | | |
| LL-05 | 14 Nov | survey | Utilities alerts: top pick for only 1 of 39, avg problem 2.38 | planned: keep as an alert, not the main feature | m04-utilities | | |

## Live-test script (5 minutes, in person)

Use with other hackers, mentors, anyone walking by. One person runs it, one takes notes.

1. "Are you from Timișoara, a student here, or visiting?"
2. Hand them the phone: "Try to find out whether your building has hot water today." (or any
   task for the module being tested). Do not help; note where they get stuck.
3. "What did you expect to happen there?"
4. "What would make you open this every week?"
5. "Can you fill this 2-minute survey?" → show the QR code.

Write each person as a row above (Source: `live test`) and count how many people hit the same
problem; "4 of 6 testers couldn't find X" is exactly the kind of number judges want.

## Pitch numbers (fill in at the end)

- Total people involved: …
- Survey responses: … · Live tests: … · In-app feedback: …
- Changes shipped because of feedback: …
- Avg app rating went from … (v…) to … (v…)
- Most wanted module by real users: …
