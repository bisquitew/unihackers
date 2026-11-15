# P4 demo: "from a notice on the door to a spoken answer" (about 3 minutes)

One story that shows Gemini (vision + structured output + function calling), ElevenLabs (speech in and out),
Auth0 (staff with MFA before a city-wide alert), Tiger Data (where the reports live) and Solana (checked live
through Solana's official MCP servers). City staff work on the **website**; residents use the **app**.

## Before the demo (10 minutes)

1. Print `docs/demo/notice-aquatim.png` (or show it on a second phone). It is a made-up notice, stamped "ANUNȚ FICTIV".
2. Start the API from the repo root: `npm start` (the same `server.ts` that Docker and CI run). Keep `DATABASE_URL` in
   the root `.env` for Tiger Cloud; without it everything still works in memory and the dashboards say "simulated".
3. Start the website: `npm run dev:web`, open `http://localhost:3000` in Chrome (window 1, the staff view).
4. Start the app from **PowerShell** (not Git Bash), with enough memory for the bundler:
   `$env:NODE_OPTIONS='--max-old-space-size=6144'` then `cd apps/app` and `npx expo start --web`;
   open `http://localhost:8081` in a second Chrome window (the resident view). The app talks to port 8000 by itself.
5. In the app: **Continue with email**, type any address that is not a staff one (e.g. `ana@example.com`).
6. In Chrome allow the microphone for localhost once (click the mic button in the assistant, then "Allow").
7. Open every page you will show once, so the bundler has built them. Rehearse once. Every API restart forgets
   published alerts, so do the real run on a freshly started API.

## The run

| # | Say | Do | What the judges see |
|---|---|---|---|
| 1 | "Pe ușa blocului apare un anunț de la Aquatim. Majoritatea oamenilor îl ratează." | Hold up the printed notice. | — |
| 2 | "Un angajat al primăriei îl fotografiază." | **Website**: Log in → **City admin** → **Dashboard** → **Scan a notice** → **Take or choose a photo** → the notice. | In about 2 s Gemini fills a draft: Aquatim, cold water, planned works, **Iosefin**, 3 streets with house numbers, **18.11 08:00 – 16:00**. The photo stays next to it. |
| 3 | "Gemini nu ghicește: ce nu poate citi apare ca avertisment, iar omul verifică." | Point at the editable fields. | Every field can be changed; anything unclear is listed under "Check these". |
| 4 | "Dar nu oricine poate trimite o alertă pentru tot orașul." | Point at **Second check done for this session**. | Only city staff with a second check (Auth0 MFA) can publish. A staff account cannot even sign in inside the app. |
| 5 | "Angajatul confirmă." | **Publish alert**. | "Published. … is live for residents." |
| 6 | "Și locuitorul o vede imediat." | **App**: Home → Utilities. Tap **🔊 Ascultă** on the new card. | The card "Oprire apă rece — Iosefin" is in the list; ElevenLabs reads it in Romanian. |
| 7 | "Și poate întreba, cu vocea." | App → **Assistant**. Turn on **🔊 Citește răspunsurile cu voce**. Tap **🎤**, say **„Am apă miercuri pe strada Văcărescu?”**, tap **⏹**. | The question appears as text (ElevenLabs speech-to-text); Gemini calls the outage tool and answers out loud: "Miercuri, 18 noiembrie… pe strada Văcărescu… între 08:00 și 16:00". |
| 8 (bonus) | "Biletele sunt pe Solana, iar asistentul întreabă Solana direct." | Type **„Ce bilete am?”**, then **„Ce este devnet pe Solana?”** | Tickets and POAP badges with links checked on devnet; then a short answer from the official Solana docs, with its link (Solana's Developer MCP server). |
| 9 (bonus, staff) | "Datele stau în Tiger Data." | Website → Dashboard → **Database**. | "Live on Tiger Cloud", real compression, 5 hypertables (incl. smell and safety reports), PM2.5 and noise from the hourly continuous aggregate. |

Sentence to close: "O poză devine o alertă oficială în 10 secunde, iar orice locuitor o poate afla vorbind cu aplicația."

## If something goes wrong

- **"Gemini is busy right now"** (Google's model under high demand, 503): wait 5 seconds and pick the photo again; space the questions out.
- **Microphone blocked**: type the same question in the chat; the answer is still read aloud.
- **Photo upload fails**: use `docs/demo/notice-aquatim.png` from the file picker instead of the camera.
- **"A second check is needed"** on publish: click **Verify with passkey**, then publish again.
- **The answer is in English**: ask again in Romanian; the assistant follows the language of the last message.
- **No new card in Utilities**: the app and the website must use the same API (port 8000). If `apps/app/.env` sets `EXPO_PUBLIC_API_URL`, it must be `http://localhost:8000`.
- **Database says "simulated"**: Tiger Cloud took too long once; reload the Database page.
- **Do not ask "is my jazz ticket real?"** until P3 re-mints the demo tickets: the live check is honest and says the
  on-chain record belongs to another test event (Timișoara Design Days 2026).

## Second notice for questions

`docs/demo/notice-electrica.png`: Rețele Electrice Banat, Complex Studențesc, 20.11 09:00 – 14:00.
Ask afterwards: **„Am curent vineri pe strada Pădurea Verde?”**
