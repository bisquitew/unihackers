// Romanian for the app. The keys are the English text as it appears in the code; a key with {} is a template (the parts that
// match {} are carried over in order). Text that is not listed here stays in English. See packages/ui/src/locale.ts.
import { registerDictionary } from '@hub/ui';

const months: [string, string][] = [
  ['Jan', 'ian.'], ['Feb', 'feb.'], ['Mar', 'mar.'], ['Apr', 'apr.'], ['May', 'mai'], ['Jun', 'iun.'],
  ['Jul', 'iul.'], ['Aug', 'aug.'], ['Sept', 'sept.'], ['Sep', 'sept.'], ['Oct', 'oct.'], ['Nov', 'nov.'], ['Dec', 'dec.'],
];
const days: [string, string][] = [
  ['Monday', 'Luni'], ['Tuesday', 'Marți'], ['Wednesday', 'Miercuri'], ['Thursday', 'Joi'], ['Friday', 'Vineri'], ['Saturday', 'Sâmbătă'], ['Sunday', 'Duminică'],
];

const generated: Record<string, string> = {
  Today: 'Astăzi', Tonight: 'Diseară', Tomorrow: 'Mâine', Yesterday: 'Ieri', now: 'acum',
  'Today at {}': 'Astăzi la {}', 'Tonight at {}': 'Diseară la {}', 'Tomorrow at {}': 'Mâine la {}',
  '{}m ago': 'acum {} min', '{}h ago': 'acum {} h',
};
for (const [en, ro] of days) {
  generated[en] = ro;
  generated[`${en} at {}`] = `${ro} la {}`;
}
for (const [en, ro] of months) {
  generated[`{} ${en}`] = `{} ${ro}`;
  generated[`{} ${en} at {}`] = `{} ${ro} la {}`;
}

registerDictionary('ro', {
  ...generated,

  // ---- tabs, titles, sections
  Home: 'Acasă', Map: 'Hartă', Community: 'Comunitate', Profile: 'Profil', Alerts: 'Alerte', Assistant: 'Asistent',
  Overview: 'Prezentare', Settings: 'Setări', 'Profile sections': 'Secțiunile profilului', 'Community sections': 'Secțiunile comunității',
  Events: 'Evenimente', Forum: 'Forum', Buddies: 'Parteneri', Wallet: 'Portofel', Buddy: 'Partener', Chats: 'Conversații',
  'Right now': 'Chiar acum', 'This week': 'Săptămâna aceasta', Explore: 'Explorează',
  'Your things': 'Ale tale', Help: 'Ajutor', Account: 'Cont', Language: 'Limbă', Appearance: 'Aspect', 'Map look': 'Aspectul hărții',
  Light: 'Luminos', Dark: 'Întunecat', System: 'Sistem', Auto: 'Automat', Day: 'Zi', Golden: 'Apus', Night: 'Noapte',
  'System follows your phone\'s setting.': 'Sistem urmează setarea telefonului.',
  'Auto follows the time of day, and Night in dark mode.': 'Automat urmează ora din zi, iar în modul întunecat folosește Noaptea.',
  Română: 'Română', English: 'English',

  // ---- greetings and home
  'Good night,': 'Noapte bună,', 'Good morning,': 'Bună dimineața,', 'Good afternoon,': 'Bună ziua,', 'Good evening,': 'Bună seara,', there: 'tu',
  'Ask hop about {}': 'Întreabă hop despre {}', 'All quiet': 'Liniște', 'No outages or transit changes right now.': 'Nicio avarie sau schimbare de transport acum.',
  'Nothing else planned yet': 'Nimic altceva planificat încă', 'Host an event in the Community tab.': 'Organizează un eveniment din fila Comunitate.',
  '{} free spots, {}': '{} locuri libere, {}', '{} people are going': '{} persoane merg', '{} going': '{} merg', 'Find a buddy': 'Găsește un partener',
  'Alerts, {} new': 'Alerte, {} noi', 'Alert not found': 'Alerta nu a fost găsită', 'It may have been resolved. Go back to your alerts.': 'Poate a fost rezolvată. Înapoi la alerte.',
  'Alert settings': 'Setările alertelor', 'For your places': 'Pentru locurile tale', 'Around the city': 'În oraș',
  'Tonight at 19:30, Faber. Free. Bring a blanket.': 'Diseară la 19:30, Faber. Gratuit. Adu o pătură.',
  'Visitor info': 'Info vizitatori', Feedback: 'Păreri', Safety: 'Siguranță', Smell: 'Miros', Transit: 'Transport', Parking: 'Parcări',

  // ---- map
  'Add a pin': 'Adaugă un pin', 'List pins on the map': 'Listează pinii de pe hartă', 'On the map': 'Pe hartă', 'Pins on the map': 'Pinii de pe hartă',
  'What shows on the map': 'Ce se vede pe hartă', 'Choose what shows on the map': 'Alege ce se vede pe hartă', 'Show on the map': 'Arată pe hartă',
  'Show on map': 'Arată pe hartă', 'Your places on the map': 'Locurile tale pe hartă', 'Show where I am': 'Arată unde sunt', 'Centre the map on you': 'Centrează harta pe tine',
  'Choose the spot': 'Alege locul', 'Move the map, or tap where the pin should go.': 'Mișcă harta sau atinge locul unde să fie pinul.', 'Place pin here': 'Pune pinul aici',
  'Change spot': 'Schimbă locul', 'New pin': 'Pin nou', 'Save pin': 'Salvează pinul', 'Delete pin': 'Șterge pinul', 'Pin details': 'Detaliile pinului',
  'No pins yet. Long-press the map to add one.': 'Niciun pin încă. Ține apăsat pe hartă ca să adaugi unul.', Places: 'Locuri', 'Your pins': 'Pinii tăi',
  'Share with neighbours': 'Distribuie vecinilor', 'Only me': 'Doar eu', 'Only you can see it.': 'Doar tu îl vezi.', 'Neighbours see the pin, not your name.{}': 'Vecinii văd pinul, nu numele tău.{}',
  Title: 'Titlu', Type: 'Tip', Optional: 'Opțional', Name: 'Nume', Reset: 'Resetează', Save: 'Salvează', Cancel: 'Anulează', Close: 'Închide', Back: 'Înapoi',
  'Back to {}': 'Înapoi la {}', Done: 'Gata', Edit: 'Editează', Open: 'Deschide', Publish: 'Publică', Post: 'Postează', Send: 'Trimite', Continue: 'Continuă',
  Stop: 'Oprește', 'Try again': 'Încearcă din nou', 'Loading…': 'Se încarcă…', Refresh: 'Reîmprospătează', All: 'Toate', Check: 'Verifică',
  Neighbours: 'Vecini', Local: 'Local', 'Lost pet': 'Animal pierdut', 'Lost pets': 'Animale pierdute', 'Lost & Found Pets Network': 'Rețeaua animalelor pierdute și găsite',

  // ---- events
  'Host an event': 'Organizează un eveniment', 'Publish event': 'Publică evenimentul', 'Event details': 'Detaliile evenimentului', 'Filter events': 'Filtrează evenimentele',
  'Clear filters': 'Șterge filtrele', 'Nothing matches yet': 'Nimic nu se potrivește încă', 'Try another type or area, or host the first one.': 'Încearcă alt tip sau altă zonă, sau organizează primul eveniment.',
  'Add a title and a venue to publish.': 'Adaugă un titlu și un loc ca să publici.', 'Get a ticket': 'Ia un bilet', 'View my ticket': 'Vezi biletul meu',
  'You are going': 'Mergi', Going: 'Merg', 'Going to': 'Mergi la', 'Who it is for': 'Pentru cine', 'All ages': 'Toate vârstele', Students: 'Studenți', Family: 'Familie',
  Anywhere: 'Oriunde', Area: 'Zonă', Price: 'Preț', 'Price in lei': 'Preț în lei', Paid: 'Cu plată', Free: 'Gratuit', '{} lei': '{} lei', When: 'Când', Where: 'Unde', Venue: 'Locul',
  'What will happen': 'Ce se va întâmpla', 'Browse events': 'Vezi evenimentele', 'What is it about?': 'Despre ce este?', 'Which event?': 'Care eveniment?',
  Cinema: 'Cinema', Music: 'Muzică', Workshop: 'Atelier', Workshops: 'Ateliere', Showcase: 'Expoziție', Social: 'Social',
  'We could not reserve your spot. Check your connection and try again.': 'Nu am putut rezerva locul tău. Verifică conexiunea și încearcă din nou.',
  '. Your ticket is in the wallet, ready to scan at the door.': '. Biletul tău este în portofel, gata de scanat la intrare.',
  'Wallet details': 'Detaliile portofelului', 'Refresh balance': 'Actualizează soldul', 'Get free test coins': 'Ia monede de test gratuite',

  // ---- wallet
  Tickets: 'Bilete', Badges: 'Insigne', 'Tickets and badges': 'Bilete și insigne', 'Door check-in': 'Check-in la intrare', Ticket: 'Bilet', Badge: 'Insignă',
  'No tickets yet': 'Niciun bilet încă', 'No badges yet': 'Nicio insignă încă', 'Get a ticket from an event and it will show up here, ready to scan at the door.': 'Ia un bilet de la un eveniment și va apărea aici, gata de scanat la intrare.',
  'You earn a badge when your ticket is scanned at the door. It proves you were there.': 'Primești o insignă când biletul tău este scanat la intrare. Dovedește că ai fost acolo.',
  'Valid for entry': 'Valid pentru intrare', 'Valid for entry. Show this code at the door.': 'Valid pentru intrare. Arată acest cod la intrare.', 'Used at the door': 'Folosit la intrare',
  'Already checked in': 'Deja înregistrat', 'Checked in, badge given': 'Înregistrat, insignă acordată', 'Not let in': 'Nu a intrat', 'Everyone is checked in': 'Toți sunt înregistrați',
  'Try the door scan': 'Încearcă scanarea la intrare', Scan: 'Scanează', 'Ticket ID': 'ID bilet', 'Transaction on Solana devnet': 'Tranzacție pe Solana devnet', 'View on Solana Explorer': 'Vezi în Solana Explorer',
  'Owner wallet': 'Portofel proprietar', Balance: 'Sold', 'Network position': 'Poziția rețelei', 'You were at': 'Ai fost la', 'is checked in and earned the badge "': 'este înregistrat și a primit insigna "',
  'Get a ticket for another event to try the scan again.': 'Ia un bilet pentru alt eveniment ca să încerci scanarea din nou.',
  'For event hosts: scan a guest\'s ticket at the door to let them in and give them an attendance badge. This is a demo with the tickets in this wallet.': 'Pentru organizatori: scanează biletul unui invitat la intrare ca să-l lași să intre și să-i dai o insignă de prezență. Este o demonstrație cu biletele din acest portofel.',
  'Your tickets and badges are recorded on Solana devnet, a practice network. The coins here are free test coins with no real value.': 'Biletele și insignele tale sunt înregistrate pe Solana devnet, o rețea de test. Monedele de aici sunt monede de test gratuite, fără valoare reală.',
  '{}, {}. Show ticket': '{}, {}. Arată biletul', '{}, {}. Show badge': '{}, {}. Arată insigna', Used: 'Folosit',

  // ---- forum
  'New post': 'Postare nouă', 'Start the conversation with a new post.': 'Începe conversația cu o postare nouă.', 'No posts here yet': 'Nicio postare aici încă',
  'Add a title and some details to publish.': 'Adaugă un titlu și câteva detalii ca să publici.', Details: 'Detalii', Comments: 'Comentarii', 'Comments, {}': 'Comentarii, {}',
  'Be the first to answer': 'Fii primul care răspunde', 'No replies yet': 'Niciun răspuns încă', 'Write a reply': 'Scrie un răspuns', Reply: 'Răspunde', 'Send reply': 'Trimite răspunsul',
  'Flagged for review': 'Marcat pentru verificare', Reported: 'Raportat', Groups: 'Grupuri', 'Join group': 'Intră în grup', Joined: 'Ai intrat', 'Remove this post?': 'Ștergi această postare?',
  'Remove post': 'Șterge postarea', Remove: 'Șterge', 'Keep post': 'Păstrează postarea', 'Keep it': 'Păstreaz-o', 'It will be taken off the forum for everyone. This cannot be undone.': 'Va fi scoasă de pe forum pentru toată lumea. Nu se poate anula.',
  'What your neighbours are talking about': 'Despre ce vorbesc vecinii tăi', 'Nothing flagged': 'Nimic marcat', 'Every post is verified. The feed is clean.': 'Toate postările sunt verificate. Fluxul este curat.',
  'Posts that residents flagged for spam or inappropriate content.': 'Postări marcate de locuitori ca spam sau conținut nepotrivit.', 'Flagged {} {}: {}': 'Marcat de {} {}: {}',
  'neighbours confirmed this': 'vecini au confirmat asta', '{} neighbours confirmed this': '{} vecini au confirmat asta',

  // ---- buddies and chat
  'Find company': 'Găsește companie', 'Find someone to go with': 'Găsește pe cineva cu care să mergi', 'People to go with': 'Oameni cu care să mergi', 'Go together': 'Mergeți împreună',
  'People going to events who would like company': 'Oameni care merg la evenimente și vor companie', 'People going to': 'Oameni care merg la', 'who would like company.': 'care vor companie.',
  'No one yet': 'Nimeni încă', 'No one has asked yet. Be the first.': 'Nimeni nu a cerut încă. Fii primul.', 'Be the first to ask for company at an event.': 'Fii primul care cere companie la un eveniment.',
  'Buddy profile': 'Profil partener', 'A good way to start': 'O idee de început', 'Back to the list': 'Înapoi la listă', 'Back to chats': 'Înapoi la conversații', 'Post request': 'Postează cererea',
  'About you': 'Despre tine', 'What do you study or like to talk about?': 'Ce studiezi sau despre ce îți place să vorbești?', 'Interests, separated by commas': 'Interese, separate prin virgulă',
  'cinema, jazz, photography': 'cinema, jazz, fotografie', 'Tell others who you are and which event you are going to. They can start a chat with you.': 'Spune-le celorlalți cine ești și la ce eveniment mergi. Pot începe o conversație cu tine.',
  Message: 'Mesaj', 'Send message': 'Trimite mesajul', 'Write a message': 'Scrie un mesaj', 'No chats yet': 'Nicio conversație încă', 'Open a profile and tap Message. Your conversations live here.': 'Deschide un profil și apasă Mesaj. Conversațiile tale apar aici.',
  'Buddies sections': 'Secțiunile partenerilor', 'You:': 'Tu:', 'Hey! Glad you reached out about {}.': 'Bună! Mă bucur că ai scris despre {}.', '% match': '% potrivire',

  // ---- profile
  'Your name': 'Numele tău', 'Edit your name': 'Editează-ți numele', 'This is how you appear to other people. It does not change your account.': 'Așa apari pentru ceilalți. Nu schimbă contul tău.',
  'Sign-in and security': 'Autentificare și securitate', 'How you sign in': 'Cum te autentifici', 'Account type': 'Tip de cont', 'Your account': 'Contul tău', 'Your neighbourhood': 'Cartierul tău',
  'What you can do': 'Ce poți face', 'Sign out': 'Deconectează-te', 'Send feedback': 'Trimite o părere', 'Tell the team what to fix': 'Spune-i echipei ce să repare', Guest: 'Vizitator',
  'Safety and city alerts': 'Alerte de siguranță și ale orașului', 'Event reminders': 'Memento-uri pentru evenimente', 'Community replies': 'Răspunsuri din comunitate',
  'Water, traffic and warnings near you': 'Apă, trafic și avertismente din apropierea ta', 'Before an event you have a ticket for': 'Înainte de un eveniment pentru care ai bilet', 'Answers to your posts and messages': 'Răspunsuri la postările și mesajele tale',
  'Pin Home, Work or a spot you like': 'Fixează Acasă, Serviciu sau un loc care îți place',
  'Signed in with {}': 'Autentificat cu {}', 'Not signed in': 'Neautentificat', 'App version': 'Versiunea aplicației',

  // ---- login
  'Your city, in one place.': 'Orașul tău, într-un singur loc.', 'Events and tickets': 'Evenimente și bilete', 'Find something on, and keep your tickets with you.': 'Găsește ce se întâmplă și ține-ți biletele la tine.',
  'Match with others heading to the same event.': 'Fii potrivit cu alții care merg la același eveniment.', 'The city, live': 'Orașul, live', 'Parking, transit and alerts near you.': 'Parcări, transport și alerte lângă tine.',
  'Continue with Google': 'Continuă cu Google', 'Continue with email': 'Continuă cu e-mailul', Email: 'E-mail', 'you@example.com': 'tu@exemplu.com',
  'City staff? Sign in on the web dashboard. Sign-in is simulated in this demo build.': 'Personal municipal? Autentifică-te în panoul web. Autentificarea este simulată în această versiune demo.',
  'City staff accounts sign in on the web dashboard, not in the app.': 'Conturile personalului municipal se autentifică în panoul web, nu în aplicație.',
  'Staff accounts sign in on the website dashboard, not in the app.': 'Conturile personalului se autentifică în panoul de pe site, nu în aplicație.', 'This is for city staff': 'Aceasta este pentru personalul municipal',
  'City dashboard': 'Panoul orașului', 'Scan a notice': 'Scanează un anunț',

  // ---- assistant, tour, feedback
  'City assistant': 'Asistentul orașului', 'Try asking': 'Încearcă să întrebi', 'Ask a question': 'Pune o întrebare', 'Your question': 'Întrebarea ta', 'Looking it up…': 'Caut informații…',
  'Ask about events, outages, trams, lost pets or parking. Ask in Romanian or English.': 'Întreabă despre evenimente, avarii, tramvaie, animale pierdute sau parcări. Poți întreba în română sau engleză.',
  'Read answers aloud': 'Citește răspunsurile cu voce tare', 'Listening… tap the microphone again when you are done (30 s at most)': 'Te ascult… apasă din nou pe microfon când ai terminat (maximum 30 s)',
  'Sources:': 'Surse:', 'Source:': 'Sursa:', 'Tour language': 'Limba turului', 'Listen to the story of each stop.': 'Ascultă povestea fiecărei opriri.',
  'Voice works in the browser for now. You can read the text below.': 'Vocea funcționează deocamdată în browser. Poți citi textul de mai jos.', 'Stops skipped in tour.md:': 'Opriri omise din tour.md:',
  'The tour has no stops yet (docs/voice/tour.md).': 'Turul nu are încă opriri (docs/voice/tour.md).', Listen: 'Ascultă',
  'How is the app?': 'Cum este aplicația?', 'About which part?': 'Despre ce parte?', 'The app in general': 'Aplicația în general', 'Tell us more': 'Spune-ne mai multe', 'Send another': 'Trimite încă una',
  'We are building this app during the hackathon, with your feedback. It takes a minute.': 'Construim această aplicație în timpul hackathonului, cu părerile tale. Durează un minut.',
  'What worked, what did not, what is missing?': 'Ce a mers, ce nu, ce lipsește?', 'Thank you!': 'Mulțumim!', 'We read every message. What we change because of you shows up in the list of changes.': 'Citim fiecare mesaj. Ce schimbăm datorită ție apare în lista de schimbări.',
  'Take the 2 minute survey': 'Completează sondajul de 2 minute', 'See what we changed because of you': 'Vezi ce am schimbat datorită ție', 'What we changed': 'Ce am schimbat', 'Because you told us': 'Pentru că ne-ai spus',
  'Every version built during the hackathon, and the feedback that led to it.': 'Fiecare versiune construită în timpul hackathonului și părerile care au dus la ea.', 'Rating: {} out of 5': 'Notă: {} din 5',

  // ---- reports (smell, safety), utilities, transit, parking, visitor info
  'Smell reports': 'Sesizări de miros', 'One tap and you have reported it. The data helps the city find the source.': 'O atingere și ai raportat. Datele ajută orașul să găsească sursa.',
  'Tell us about problems with a place: light, noise, empty buildings, spots where you do not feel safe.': 'Spune-ne despre problemele unui loc: lumină, zgomot, clădiri goale, locuri unde nu te simți în siguranță.',
  'What did you notice?': 'Ce ai observat?', 'How strong?': 'Cât de puternic?', 'Strength from 1 to 5': 'Intensitate de la 1 la 5', 'Where?': 'Unde?', 'Use my location': 'Folosește locația mea', 'Using your location': 'Folosim locația ta',
  'Note (optional)': 'Notă (opțional)', 'Describe the place, not the people. No names or contact details.': 'Descrie locul, nu oamenii. Fără nume sau date de contact.', 'Send report': 'Trimite sesizarea',
  'Choose what you noticed and where.': 'Alege ce ai observat și unde.', 'Your report is on the map. The more neighbours report, the clearer the picture.': 'Sesizarea ta apare pe hartă. Cu cât raportează mai mulți vecini, cu atât imaginea e mai clară.',
  'Location is off. Pick an area instead, or turn it on in Settings.': 'Locația este oprită. Alege o zonă sau pornește-o din Setări.', 'Could not find you. Pick an area instead.': 'Nu te-am găsit. Alege o zonă.',
  'Could not send. Try again.': 'Nu s-a putut trimite. Încearcă din nou.', 'Burnt rubber': 'Cauciuc ars', Smoke: 'Fum', Sewage: 'Canalizare', Chemical: 'Chimic', Garbage: 'Gunoi', Other: 'Altceva',
  'Poor lighting': 'Iluminat slab', 'Noise at night': 'Zgomot noaptea', 'Abandoned building': 'Clădire abandonată', 'Feeling unsafe': 'Mă simt nesigur', 'Wind from': 'Vânt dinspre', 'Where it may come from': 'De unde ar putea veni',
  '{} reports · mostly {}': '{} sesizări · mai ales {}', 'No reports in the last 24 hours': 'Nicio sesizare în ultimele 24 de ore', 'No reports in the last 7 days': 'Nicio sesizare în ultimele 7 zile',
  'Reports by area, last 7 days': 'Sesizări pe zone, ultimele 7 zile', '{}% at night': '{}% noaptea', "Residents' reports about places, unverified. They are not police statistics.": 'Sesizări ale locuitorilor despre locuri, neverificate. Nu sunt statistici ale poliției.',
  'Outages and utilities': 'Avarii și utilități', 'Heating, hot water, water and power works across the city.': 'Lucrări la căldură, apă caldă, apă și curent în tot orașul.', 'Is my street affected?': 'Este afectată strada mea?',
  'Street or neighbourhood': 'Stradă sau cartier', 'Active outages': 'Avarii active', 'No active outages': 'Nicio avarie activă', 'Everything is running.': 'Totul funcționează.', 'Affected.': 'Afectată.', 'All clear.': 'Totul în regulă.',
  'Could not check right now. Try again.': 'Nu se poate verifica acum. Încearcă din nou.', 'Tram and bus lines, and the detours in force.': 'Linii de tramvai și autobuz și devierile în vigoare.', 'Is my stop affected?': 'Este afectată stația mea?',
  Lines: 'Linii', 'On a detour.': 'Pe traseu deviat.', 'Line {}: {}': 'Linia {}: {}', 'Normal route': 'Traseu normal', Normal: 'Normal', Suspended: 'Suspendată', Rerouted: 'Deviată', 'Temporary replacement': 'Înlocuire temporară',
  '{} free spots in {} lots, updated live.': '{} locuri libere în {} parcări, actualizat live.', '{} of {} free': '{} din {} libere', '{}, {} of {} free': '{}, {} din {} libere', '{} percent free': '{} la sută libere',
  'Practical info': 'Informații practice', 'Good to know when you arrive in the city.': 'Ce e bine să știi când ajungi în oraș.', 'Check before you travel': 'Verifică înainte de drum', 'Could not load the information.': 'Nu s-au putut încărca informațiile.',
  'No information in this category.': 'Nu am găsit informații în această categorie.', 'Unplanned breakdown': 'Avarie neplanificată', 'Scheduled maintenance': 'Mentenanță programată', Investigating: 'În investigare', 'Work in progress': 'Lucrări în desfășurare',
  'Expected back about {}': 'Revenire estimată în jurul orei {}', 'Restore time to be confirmed': 'Ora de revenire va fi confirmată', 'Keep away from the area': 'Evită zona', 'Works in progress': 'Lucrări în desfășurare',
  '{} · {} m around': '{} · {} m în jur', 'until {}': 'până la {}', 'Until Dec': 'Până în decembrie', 'Severity: {}': 'Gravitate: {}', 'Expected to end {}': 'Se estimează că se termină {}', 'End date to be confirmed': 'Data de final va fi confirmată',
  'Free spots, counted from each lot’s camera.': 'Locuri libere, numărate de camera fiecărei parcări.', 'Unirii, Iulius, Gara…': 'Unirii, Iulius, Gara…', 'Directions': 'Navighează', 'Busy': 'Aglomerat', 'Full': 'Plin', 'Available': 'Disponibil', 'Nothing matches.': 'Nimic nu se potrivește.', 'Lots, {}% free': 'Parcări, {}% libere', '{} of {} spots free': '{} din {} locuri libere',
  'This account cannot sign in to the mobile app.': 'Acest cont nu se poate autentifica în aplicația mobilă.', 'Sign-in is simulated in this demo build.': 'Autentificarea este simulată în această versiune demo.',
  'Reported {}': 'Raportat {}', 'Announced': 'Anunțat',
  'Keep away from the area · {} m around': 'Evită zona · {} m în jur', 'Works in progress · {} m around': 'Lucrări în desfășurare · {} m în jur',
});
