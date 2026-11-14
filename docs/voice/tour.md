# Narrated walking tour (m10 voice)

Stops for the `/m/tour` screen. The app reads them from `GET /v1/m/assistant/tour` and plays each one through
`POST /v1/m/assistant/tts` (ElevenLabs), in Romanian or English.

How to add a stop: copy the block below, give it a new id (a-z, 0-9, "-"), and fill every field on one line.
Keep each text under about 600 characters (the voice reads at most 800 per stop). Only facts you have checked.

Fields: `title_ro`, `title_en`, `lat`, `lng` (decimal degrees), `ro`, `en`.

---

## piata-victoriei
- title_ro: Piața Victoriei și Opera
- title_en: Victory Square and the Opera
- lat: 45.7543
- lng: 21.2257
- ro: Bine ai venit în Piața Victoriei, inima Timișoarei. În decembrie 1989, aici s-au adunat zeci de mii de oameni, iar de la balconul Operei Timișoara a fost declarată primul oraș liber din România. Privește în jur: clădirile elegante de pe ambele laturi ale pieței sunt construite la început de secol douăzeci, în stilul Secession.
- en: Welcome to Victory Square, the heart of Timișoara. In December 1989, tens of thousands of people gathered here, and from the balcony of the Opera Timișoara was declared the first free city in Romania. Look around: the elegant buildings on both sides of the square date from the early twentieth century, in the Secession style.

## catedrala-mitropolitana
- title_ro: Catedrala Mitropolitană
- title_en: The Metropolitan Cathedral
- lat: 45.7508
- lng: 21.2243
- ro: La capătul sudic al pieței se ridică Catedrala Mitropolitană ortodoxă, construită între 1936 și 1946. Acoperișul ei din țigle colorate formează modele geometrice care se văd de departe. Intră în liniște, dacă vrei: înăuntru sunt picturi murale și un muzeu de artă religioasă.
- en: At the southern end of the square stands the Orthodox Metropolitan Cathedral, built between 1936 and 1946. Its roof of coloured tiles forms geometric patterns you can see from far away. Step inside quietly if you like: there are painted walls and a museum of religious art.

## piata-libertatii
- title_ro: Piața Libertății
- title_en: Liberty Square
- lat: 45.7564
- lng: 21.2275
- ro: Piața Libertății este una dintre cele mai vechi piețe ale orașului. Aici vezi Vechea Primărie, o clădire barocă din secolul al optsprezecelea. Timișoara are o istorie de oraș al premierelor: în 1884 a fost primul oraș din Europa continentală cu străzi iluminate electric.
- en: Liberty Square is one of the oldest squares in the city. Here you can see the Old Town Hall, an eighteenth-century baroque building. Timișoara is a city of firsts: in 1884 it became the first city in mainland Europe with electric street lighting.

## piata-unirii
- title_ro: Piața Unirii
- title_en: Union Square
- lat: 45.7578
- lng: 21.2290
- ro: Piața Unirii este piața barocă a Timișoarei. Pe o latură este Domul romano-catolic, pe cealaltă catedrala ortodoxă sârbă, semn al orașului în care au trăit împreună multe comunități. În mijloc, Statuia Sfintei Treimi amintește de epidemia de ciumă din secolul al optsprezecelea.
- en: Union Square is Timișoara's baroque square. On one side stands the Roman Catholic Cathedral, on the other the Serbian Orthodox Cathedral, a sign of a city where many communities have lived side by side. In the middle, the Holy Trinity statue remembers the plague epidemic of the eighteenth century.

## bastionul-theresia
- title_ro: Bastionul Theresia
- title_en: The Theresia Bastion
- lat: 45.7581
- lng: 21.2318
- ro: Ultima oprire este Bastionul Theresia, una dintre puținele părți rămase din vechea cetate a Timișoarei, construită în secolul al optsprezecelea. Astăzi, între zidurile groase de cărămidă găsești muzee, cafenele și restaurante. Mulțumim că te-ai plimbat cu noi prin Timișoara!
- en: Our last stop is the Theresia Bastion, one of the few surviving parts of Timișoara's old fortress, built in the eighteenth century. Today, inside its thick brick walls, you will find museums, cafés and restaurants. Thank you for walking through Timișoara with us!
