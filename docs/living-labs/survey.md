# Living Labs survey — Google Form setup

Copy every title and option **exactly**. The cleaning script (`feedback-sheet.gs`) finds answers by the
English start of each question title and by keywords in the options, so changing the English
wording breaks it. The Romanian half can be edited freely.

## Form settings (gear icon → Settings)

- Responses → **Collect email addresses: Do not collect** (the script would mix it up with Q12)
- Responses → **Limit to 1 response: OFF** (people re-test after each change; that is the point)
- Presentation → Confirmation message: `Thank you! Mulțumim! Come back after the next update`

## Form title and description

**Title:** `Timișoara City Hub — 2-minute survey / Sondaj de 2 minute`

**Description:**

```
We are a student team at UniHack building one app for Timișoara: events, outage alerts, transit
changes, safety and smell reports, a neighbourhood forum and an AI city assistant. Your answers
decide what we build next. Anonymous, about 2 minutes.

Suntem o echipă de studenți la UniHack și construim o aplicație pentru Timișoara. Răspunsurile tale
decid ce construim mai departe. Anonim, cam 2 minute.
```

---

## Section 1 (default section)

**Q1 · Multiple choice · Required**
`Who are you? / Cine ești?`

- `Timișoara resident / Locuitor al Timișoarei`
- `Romanian student / Student român`
- `International student / Student internațional`
- `New to the city (under 1 year) / Nou în oraș (sub 1 an)`
- `Visitor or tourist / Vizitator sau turist`
- Turn on **"Add 'Other'"**

**Q2 · Multiple choice · Required**
`Age / Vârsta`

- `Under 18 / Sub 18`
- `18–24`
- `25–34`
- `35–49`
- `50–64`
- `65+`

**Q3 · Multiple choice grid · Not required**
`How much does each problem affect you? / Cât de mult te afectează fiecare problemă?`

Rows:

- `Not enough small events or things to do / Prea puține evenimente mici sau lucruri de făcut`
- `Hard to find practical info (transport, pharmacies, opening hours) / Greu de găsit informații practice`
- `Not feeling safe in some areas at night / Nu mă simt în siguranță în unele zone noaptea`
- `Heating, hot water or power cuts / Întreruperi la căldură, apă caldă sau curent`
- `Tram and bus changes I don't hear about / Modificări la tramvaie și autobuze despre care nu aflu`
- `Bad smells in the city / Mirosuri neplăcute în oraș`
- `No one to go to events with / Nu am cu cine să merg la evenimente`
- `No place to ask neighbours for help / Niciun loc unde să cer ajutor vecinilor`
- `Finding parking / Găsirea unui loc de parcare`  ← delete this row if [PARKIE_MODULE] is not about parking

Columns:

- `1 Not at all / Deloc`
- `2`
- `3`
- `4`
- `5 A lot / Foarte mult`

**Q4 · Checkboxes · Required**
`Which features would you use? / Ce funcții ai folosi?`

- `Small events near me / Evenimente mici lângă mine`
- `Practical info for visitors / Informații practice pentru vizitatori`
- `Report unsafe spots / Raportează locuri nesigure`
- `Alerts for heat, water and power cuts at my address / Alerte de întreruperi la adresa mea`
- `Live tram and bus changes / Modificări live la tramvaie și autobuze`
- `Report bad smells / Raportează mirosuri neplăcute`
- `Find someone to go to events with / Găsește pe cineva cu care să mergi la evenimente`
- `Neighbourhood forum (lost pets, help) / Forum de cartier (animale pierdute, ajutor)`
- `Parking / Parcare`
- `AI city assistant you can talk to / Asistent AI al orașului cu care poți vorbi`

**Q5 · Multiple choice · Required**
`Which ONE would you use most? / Pe care ai folosi-o cel mai des?`

Same 10 options as Q4 (tip: build Q4, then duplicate it and change the type to Multiple choice).

**Q6 · Linear scale 1–5 · Required**
`How likely are you to install an app like this? / Cât de probabil este să instalezi o astfel de aplicație?`

- Label 1: `Not likely / Puțin probabil`
- Label 5: `Very likely / Foarte probabil`

**Q7 · Multiple choice · Required · "Go to section based on answer" ON**
`Have you tried our app? / Ai încercat aplicația noastră?`

- `Yes / Da` → **Go to section 2 (About the app)**
- `No / Nu` → **Go to section 3 (Last thing)**

---

## Section 2 — `About the app / Despre aplicație`

**Q8 · Checkboxes · Not required**
`Which part did you try? / Ce parte ai încercat?`

Same 10 options as Q4.

**Q9 · Linear scale 1–5 · Required**
`How good is the app so far? / Cât de bună este aplicația până acum?`

- Label 1: `Bad / Slabă`
- Label 5: `Great / Excelentă`

**Q10 · Paragraph · Not required**
`What was confusing or broken? / Ce a fost confuz sau nu a funcționat?`

After section 2: **Continue to next section**.

---

## Section 3 — `Last thing / Ultimul lucru`

**Q11 · Paragraph · Not required**
`What is missing or what would you change? / Ce lipsește sau ce ai schimba?`

**Q12 · Short answer · Not required · Response validation: Text → Email**
`Email if you want to test new versions (optional) / Email dacă vrei să testezi versiuni noi (opțional)`

The email stays only in the raw responses tab. The script records just "has email: yes/no" and never
sends it to our API.
