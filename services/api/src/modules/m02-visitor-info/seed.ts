// GENERATED from docs/visitor-info/content.md by generate-seed.ts. Do not edit by hand:
// change content.md, then run: cd services/api && npx tsx src/modules/m02-visitor-info/generate-seed.ts
import type { VisitorInfoEntry } from './types.ts';

export const seedVisitorInfo: VisitorInfoEntry[] = [
  {
    "id": "emergency-112",
    "category": "emergency",
    "verify": false,
    "sources": [
      "EU single emergency number"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Urgențe: sună la 112",
      "text": "Pentru ambulanță, pompieri sau poliție sună la 112. Apelul este gratuit și funcționează de pe orice telefon, inclusiv fără cartelă SIM."
    },
    "en": {
      "title": "Emergencies: call 112",
      "text": "For an ambulance, the fire service or the police, call 112. The call is free and works from any phone, even without a SIM card."
    }
  },
  {
    "id": "transport-ticket",
    "category": "transport",
    "verify": true,
    "sources": [
      "https://stpt.ro/EN/payment.html",
      "https://www.g4media.ro/se-scumpesc-biletele-pentru-transportul-in-comun-din-timisoara-si-zona-metropolitana-un-bilet-pentru-60-de-minute-costa-5-lei-cresterea-e-de-25.html"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Bilet de tramvai, autobuz și troleibuz",
      "text": "Un bilet este valabil 60 de minute și poți schimba vehiculul în acest timp. Costă 5 lei. Același bilet e valabil pe tramvaie, autobuze, troleibuze și liniile expres."
    },
    "en": {
      "title": "Tram, bus and trolleybus ticket",
      "text": "One ticket is valid for 60 minutes and you can change vehicles during that time. It costs 5 lei. The same ticket works on trams, buses, trolleybuses and express lines."
    }
  },
  {
    "id": "transport-how-to-pay",
    "category": "transport",
    "verify": true,
    "sources": [
      "https://stpt.ro/EN/payment.html",
      "https://visit-timisoara.com/useful-info/"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Cum plătești călătoria",
      "text": "Cel mai simplu: apropie cardul bancar contactless de validatorul din vehicul. Poți plăti și prin SMS la 7442 (scrie B și numărul liniei, de exemplu \"B 4\"), în aplicațiile 24pay sau mobilPay, sau cu bilet de hârtie de la chioșcurile STPT, pe care îl validezi la urcare."
    },
    "en": {
      "title": "How to pay for a ride",
      "text": "The easiest way: tap your contactless bank card on the validator inside the vehicle. You can also pay by SMS to 7442 (text B and the line number, for example \"B 4\"), in the 24pay or mobilPay apps, or with a paper ticket from an STPT kiosk, which you validate when you board."
    }
  },
  {
    "id": "transport-operator",
    "category": "transport",
    "verify": false,
    "sources": [
      "https://stpt.ro/EN/payment.html"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Cine operează transportul public",
      "text": "Transportul public este operat de STPT (Societatea de Transport Public Timișoara). Orare și hărți: stpt.ro."
    },
    "en": {
      "title": "Who runs public transport",
      "text": "Public transport is run by STPT (Societatea de Transport Public Timișoara). Timetables and maps: stpt.ro."
    }
  },
  {
    "id": "arrival-airport",
    "category": "arrival",
    "verify": true,
    "sources": [
      "https://2026.europe.foss4g.org/venue/getting-to-timisoara/",
      "https://www.airportsdata.net/airport-TSR-transportation/"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "De la aeroport în oraș",
      "text": "Aeroportul \"Traian Vuia\" (TSR) este la aproximativ 12 km de centru. Linia expres E4 merge la Bastion, în centru. Linia expres E4b merge la Gara de Nord. Se folosește biletul obișnuit de 60 de minute. Există și taxi, Bolt și Uber."
    },
    "en": {
      "title": "From the airport to the city",
      "text": "Traian Vuia Airport (TSR) is about 12 km from the centre. Express line E4 goes to Bastion, in the centre. Express line E4b goes to the main railway station, Gara de Nord. The normal 60-minute ticket is valid. Taxis, Bolt and Uber are also available."
    }
  },
  {
    "id": "arrival-train",
    "category": "arrival",
    "verify": false,
    "sources": [
      "https://2026.europe.foss4g.org/venue/getting-to-timisoara/"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Gara de Nord",
      "text": "Gara principală este Timișoara Nord. Spre centru circulă troleibuzele 11 și 14 și tramvaiul 2. Verifică devierile din 2026 în secțiunea Transport a aplicației."
    },
    "en": {
      "title": "Main railway station",
      "text": "The main station is Timișoara Nord. Trolleybuses 11 and 14 and tram 2 connect it with the centre. Check the 2026 detours in the Transit section of the app."
    }
  },
  {
    "id": "tourist-info-centre",
    "category": "tourist-info",
    "verify": true,
    "sources": [
      "https://timisoara2023.eu/en/locations/touristic-infocenter-victory-square/"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Centrul de informare turistică",
      "text": "Infocentrul Turistic al Primăriei este în Piața Victoriei, pe strada Alba Iulia nr. 2. Oferă hărți, broșuri și informații despre cazare, transport, obiective și evenimente. Verifică programul înainte să mergi."
    },
    "en": {
      "title": "Tourist information centre",
      "text": "The City Hall Tourist Infocenter is in Victory Square (Piața Victoriei), at Alba Iulia Street no. 2. It offers maps, brochures and information on accommodation, transport, sights and events. Check opening hours before you go."
    }
  },
  {
    "id": "money-currency",
    "category": "money",
    "verify": false,
    "sources": [
      "general (Romania's currency)"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Bani și plăți",
      "text": "Moneda este leul (RON), nu euro. Cardurile sunt acceptate aproape peste tot, inclusiv în transportul public. Pentru piețe și chioșcuri mici e util să ai câțiva lei cash."
    },
    "en": {
      "title": "Money and payments",
      "text": "The currency is the Romanian leu (RON), not the euro. Cards are accepted almost everywhere, including on public transport. For markets and small kiosks it helps to carry a little cash in lei."
    }
  },
  {
    "id": "city-alerts-pointer",
    "category": "city-alerts",
    "verify": false,
    "sources": [
      "this app (m04-utilities, m05-transit)"
    ],
    "checked": "2026-11-14",
    "ro": {
      "title": "Avarii și devieri",
      "text": "Pentru întreruperi de apă caldă, căldură sau curent și pentru linii suspendate ori deviate, întreabă asistentul sau deschide secțiunile Utilități și Transport. Acolo informațiile se actualizează."
    },
    "en": {
      "title": "Outages and detours",
      "text": "For hot water, heating or power cuts and for suspended or detoured lines, ask the assistant or open the Utilities and Transit sections. That information is kept up to date there."
    }
  }
];
