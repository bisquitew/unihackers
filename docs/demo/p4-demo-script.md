# P4 demo: "from a notice on the door to a spoken answer" (about 2.5 minutes)

One story that shows Gemini (vision + structured output + function calling), ElevenLabs (speech in and out),
Auth0 (admin + MFA before a city-wide alert) and Solana (tickets verified on devnet), all inside the same app.

## Before the demo (10 minutes)

1. Print `docs/demo/notice-aquatim.png` (or show it on a second phone). It is a made-up notice, stamped "ANUNȚ FICTIV".
2. In `apps/app/.env` (create it, never commit it) put one line, so every screen talks to the same server:
   `EXPO_PUBLIC_API_URL=http://localhost:8000`
3. Start the API from the repo root: `npm start` (the same `server.ts` that Docker and CI run).
4. Start the app from **PowerShell** (not Git Bash): `cd apps/app` then `npx expo start --web`, open `http://localhost:8081` in Chrome.
5. In Chrome allow the microphone for localhost once (click the mic button, then "Allow").
6. Rehearse once. Every server restart forgets published alerts, so do the real run on a freshly started API.

## The run

| # | Say | Do | What the judges see |
|---|---|---|---|
| 1 | "Pe ușa blocului apare un anunț de la Aquatim. Majoritatea oamenilor îl ratează." | Hold up the printed notice. | — |
| 2 | "Îl fotografiem." | Home → Utilities (Avarii) → **📷 Ai văzut un anunț pe ușa blocului? Scanează-l** → **Fă sau alege o poză** → photo of the notice. | In about 2 s Gemini fills a draft: Aquatim, apă rece, lucrare programată, cartierul **Iosefin**, 3 streets with house numbers, **18.11 08:00 – 16:00**. |
| 3 | "Gemini nu ghicește: ce nu poate citi apare ca avertisment, iar omul verifică." | Point at the editable fields. | Editable draft, no warnings for a clear photo. |
| 4 | "Dar nu oricine poate trimite o alertă pentru tot orașul." | Show that **Publică alerta** is grey. Turn on **Mod operator (demo)**. | Publishing needs an admin with two-step login (Auth0 MFA policy, the same rule as P2's outage API). |
| 5 | "Operatorul confirmă." | **Publică alerta** → **Vezi în Avarii & Utilități**. | The new card "Oprire apă rece — Iosefin" is in the list. Tap **🔊 Ascultă**: ElevenLabs reads it in Romanian. |
| 6 | "Și acum orice locuitor poate întreba, cu vocea." | Home → **Assistant** tile. Turn on **🔊 Citește răspunsurile cu voce**. Tap **🎤**, say: **„Am apă marți pe strada Văcărescu?”**, tap **⏹**. | The question appears as text (ElevenLabs speech-to-text), Gemini calls the outage tool and answers out loud: "Marți… pe strada Văcărescu… între 08:00 și 16:00". |
| 7 (bonus) | "Biletele la evenimente sunt pe Solana." | Type or say: **„Ce bilete am?”** and open the Explorer link. | Tickets and POAP badges; every link was checked live on Solana devnet first. |

Sentence to close: "O poză devine o alertă oficială în 10 secunde, iar orice locuitor o poate afla vorbind cu aplicația."

## If something goes wrong

- **Gemini answers "prea multe cereri" (busy)**: wait 5 seconds and repeat; space the questions out.
- **Microphone blocked**: type the same question in the chat; the answer is still read aloud.
- **Photo upload fails**: use `docs/demo/notice-aquatim.png` from the file picker instead of the camera.
- **The answer is in English**: ask again in Romanian; the assistant follows the language of the last message.
- **No alert in step 6**: the app is probably on port 3001; check `apps/app/.env` (step 2 of the preparation) and restart Expo.

## Second notice for questions

`docs/demo/notice-electrica.png`: Rețele Electrice Banat, Complex Studențesc, 20.11 09:00 – 14:00.
Ask afterwards: **„Am curent joi pe strada Pădurea Verde?”**
