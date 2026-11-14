# Visitor info content (m02-visitor-info)

Source text for the visitor info module. Each entry has an id, a category, Romanian and English text,
a source and a `checked` date. Entries marked `verify: yes` contain a price or schedule that changes;
the app must show them with "verifică / check before you travel". Do not add facts here without a source.

Categories: `emergency`, `transport`, `arrival`, `tourist-info`, `money`, `city-alerts`

---

## emergency-112
- category: emergency
- verify: no
- source: EU single emergency number
- checked: 2026-11-14
- ro_title: Urgențe: sună la 112
- ro: Pentru ambulanță, pompieri sau poliție sună la 112. Apelul este gratuit și funcționează de pe orice telefon, inclusiv fără cartelă SIM.
- en_title: Emergencies: call 112
- en: For an ambulance, the fire service or the police, call 112. The call is free and works from any phone, even without a SIM card.

## transport-ticket
- category: transport
- verify: yes
- source: https://stpt.ro/EN/payment.html ; https://www.g4media.ro/se-scumpesc-biletele-pentru-transportul-in-comun-din-timisoara-si-zona-metropolitana-un-bilet-pentru-60-de-minute-costa-5-lei-cresterea-e-de-25.html
- checked: 2026-11-14
- ro_title: Bilet de tramvai, autobuz și troleibuz
- ro: Un bilet este valabil 60 de minute și poți schimba vehiculul în acest timp. Costă 5 lei. Același bilet e valabil pe tramvaie, autobuze, troleibuze și liniile expres.
- en_title: Tram, bus and trolleybus ticket
- en: One ticket is valid for 60 minutes and you can change vehicles during that time. It costs 5 lei. The same ticket works on trams, buses, trolleybuses and express lines.

## transport-how-to-pay
- category: transport
- verify: yes
- source: https://stpt.ro/EN/payment.html ; https://visit-timisoara.com/useful-info/
- checked: 2026-11-14
- ro_title: Cum plătești călătoria
- ro: Cel mai simplu: apropie cardul bancar contactless de validatorul din vehicul. Poți plăti și prin SMS la 7442 (scrie B și numărul liniei, de exemplu "B 4"), în aplicațiile 24pay sau mobilPay, sau cu bilet de hârtie de la chioșcurile STPT, pe care îl validezi la urcare.
- en_title: How to pay for a ride
- en: The easiest way: tap your contactless bank card on the validator inside the vehicle. You can also pay by SMS to 7442 (text B and the line number, for example "B 4"), in the 24pay or mobilPay apps, or with a paper ticket from an STPT kiosk, which you validate when you board.

## transport-operator
- category: transport
- verify: no
- source: https://stpt.ro/EN/payment.html
- checked: 2026-11-14
- ro_title: Cine operează transportul public
- ro: Transportul public este operat de STPT (Societatea de Transport Public Timișoara). Orare și hărți: stpt.ro.
- en_title: Who runs public transport
- en: Public transport is run by STPT (Societatea de Transport Public Timișoara). Timetables and maps: stpt.ro.

## arrival-airport
- category: arrival
- verify: yes
- source: https://2026.europe.foss4g.org/venue/getting-to-timisoara/ ; https://www.airportsdata.net/airport-TSR-transportation/
- checked: 2026-11-14
- ro_title: De la aeroport în oraș
- ro: Aeroportul "Traian Vuia" (TSR) este la aproximativ 12 km de centru. Linia expres E4 merge la Bastion, în centru. Linia expres E4b merge la Gara de Nord. Se folosește biletul obișnuit de 60 de minute. Există și taxi, Bolt și Uber.
- en_title: From the airport to the city
- en: Traian Vuia Airport (TSR) is about 12 km from the centre. Express line E4 goes to Bastion, in the centre. Express line E4b goes to the main railway station, Gara de Nord. The normal 60-minute ticket is valid. Taxis, Bolt and Uber are also available.

## arrival-train
- category: arrival
- verify: no
- source: https://2026.europe.foss4g.org/venue/getting-to-timisoara/
- checked: 2026-11-14
- ro_title: Gara de Nord
- ro: Gara principală este Timișoara Nord. Spre centru circulă troleibuzele 11 și 14 și tramvaiul 2. Verifică devierile din 2026 în secțiunea Transport a aplicației.
- en_title: Main railway station
- en: The main station is Timișoara Nord. Trolleybuses 11 and 14 and tram 2 connect it with the centre. Check the 2026 detours in the Transit section of the app.

## tourist-info-centre
- category: tourist-info
- verify: yes
- source: https://timisoara2023.eu/en/locations/touristic-infocenter-victory-square/
- checked: 2026-11-14
- ro_title: Centrul de informare turistică
- ro: Infocentrul Turistic al Primăriei este în Piața Victoriei, pe strada Alba Iulia nr. 2. Oferă hărți, broșuri și informații despre cazare, transport, obiective și evenimente. Verifică programul înainte să mergi.
- en_title: Tourist information centre
- en: The City Hall Tourist Infocenter is in Victory Square (Piața Victoriei), at Alba Iulia Street no. 2. It offers maps, brochures and information on accommodation, transport, sights and events. Check opening hours before you go.

## money-currency
- category: money
- verify: no
- source: general (Romania's currency)
- checked: 2026-11-14
- ro_title: Bani și plăți
- ro: Moneda este leul (RON), nu euro. Cardurile sunt acceptate aproape peste tot, inclusiv în transportul public. Pentru piețe și chioșcuri mici e util să ai câțiva lei cash.
- en_title: Money and payments
- en: The currency is the Romanian leu (RON), not the euro. Cards are accepted almost everywhere, including on public transport. For markets and small kiosks it helps to carry a little cash in lei.

## city-alerts-pointer
- category: city-alerts
- verify: no
- source: this app (m04-utilities, m05-transit)
- checked: 2026-11-14
- ro_title: Avarii și devieri
- ro: Pentru întreruperi de apă caldă, căldură sau curent și pentru linii suspendate ori deviate, întreabă asistentul sau deschide secțiunile Utilități și Transport. Acolo informațiile se actualizează.
- en_title: Outages and detours
- en: For hot water, heating or power cuts and for suspended or detoured lines, ask the assistant or open the Utilities and Transit sections. That information is kept up to date there.

---

## Not included yet (needs a local check before adding)
- Non-stop pharmacies: names and addresses. Do not invent; add only with a source.
- Tourist infocenter opening hours.
- Night transport lines.
