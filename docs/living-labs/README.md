# Living Labs: setup (P4)

Files in this folder:

- `survey.md`: every question of the Google Form, exact wording
- `feedback-sheet.gs`: Apps Script that cleans responses, builds a summary and later sends them to our API
- `living-labs-log.md`: the log of feedback → change → result, which becomes the pitch evidence

## Setup, in order

### 1. Build the form (about 15 min)

1. Go to forms.google.com → Blank form.
2. Follow `survey.md` top to bottom: settings, title, description, then Q1–Q12 with the three sections.
   - Sections: the "Add section" icon in the right-hand toolbar (two stacked rectangles).
   - Q7 branching: Q7's ⋮ menu → "Go to section based on answer".
3. Click **Preview** (eye icon) and submit one test answer as "Yes" and one as "No" to check the branching.

### 2. Link it to a Sheet

1. In the form: **Responses** tab → **Link to Sheets** → Create a new spreadsheet.
2. Open the spreadsheet. You will see the responses tab with your two test answers.

### 3. Add the script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the empty `myFunction` code, paste the whole of `feedback-sheet.gs`, and press save (💾).
3. Rename the project (top left) to `Living Labs`.

### 4. Add the trigger

1. In Apps Script, left sidebar: **Triggers** (alarm clock icon) → **Add Trigger** (bottom right).
2. Choose:
   - function: `onFormSubmit`
   - deployment: `Head`
   - event source: `From spreadsheet`
   - event type: `On form submit`
3. Save. Google asks for permission → choose your account → "Advanced" → "Go to Living Labs (unsafe)"
   → Allow. ("Unsafe" only means Google hasn't reviewed your own script.)

### 5. Test it

1. Reload the spreadsheet. A **Living Labs** menu appears.
2. **Living Labs → Process all responses.** New `clean` and `summary` tabs appear with your two test answers.
3. Submit one more answer through the form and check that it shows up in `clean` by itself within a few seconds.
4. Delete the test rows from both the responses tab and `clean`, then run **Process all responses** again.

### 6. Set the version and share

1. **Living Labs → Set app version…** → `v0` (no app yet, so this is the baseline).
2. Form → **Send** → link icon → shorten URL → copy. Put it at the top of `living-labs-log.md`.
3. Make a QR code: open the form link in Chrome → right-click the page → "Create QR code for this page".
4. Share the link and the QR code.

## Later: send survey answers to our API

When P2's API and the M11 feedback route are live, in Apps Script go to **Project Settings (⚙) →
Script properties** and add:

| Property | Value |
| --- | --- |
| `API_URL` | the M11 ingest URL from P2/P4, e.g. `https://<api-host>/v1/m/feedback/ingest` |
| `API_TOKEN` | the token P2 gives you |
| `FORWARD_ENABLED` | `true` |

Then run **Living Labs → Retry failed API sends** to send everything collected so far.

## Rules while the hackathon runs

- Every time we ship a change that came from feedback: add a row to the log, then
  **Set app version…** to the next version (v0.1, v0.2, …).
- Don't edit the English wording of questions; the script depends on it. Romanian text is safe to change.
- Don't rename the `clean` or `summary` tabs.
