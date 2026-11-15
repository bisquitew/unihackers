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
  Events: 'Evenimente', Forum: 'Forum', Buddies: 'Cu cine?', Wallet: 'Portofel', Buddy: 'Companie', Chats: 'Conversații',
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
  '{} free spots, {}': '{} locuri libere, {}', '{} people are going': '{} persoane merg', '{} going': '{} merg', 'Find a buddy': 'Găsește companie',
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
  'Buddy profile': 'Profil', 'A good way to start': 'O idee de început', 'Back to the list': 'Înapoi la listă', 'Back to chats': 'Înapoi la conversații', 'Post request': 'Postează cererea',
  'About you': 'Despre tine', 'What do you study or like to talk about?': 'Ce studiezi sau despre ce îți place să vorbești?', 'Interests, separated by commas': 'Interese, separate prin virgulă',
  'cinema, jazz, photography': 'cinema, jazz, fotografie', 'Tell others who you are and which event you are going to. They can start a chat with you.': 'Spune-le celorlalți cine ești și la ce eveniment mergi. Pot începe o conversație cu tine.',
  Message: 'Mesaj', 'Send message': 'Trimite mesajul', 'Write a message': 'Scrie un mesaj', 'No chats yet': 'Nicio conversație încă', 'Open a profile and tap Message. Your conversations live here.': 'Deschide un profil și apasă Mesaj. Conversațiile tale apar aici.',
  'Buddies sections': 'Secțiunile „Cu cine?”', 'You:': 'Tu:', 'Hey! Glad you reached out about {}.': 'Bună! Mă bucur că ai scris despre {}.', '% match': '% potrivire',

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
  'Strength {}/5': 'Intensitate {}/5', 'Reported by a resident': 'Raportat de un locuitor', 'Safety reports': 'Sesizări de siguranță', 'Line {} is {}': 'Linia {} este {}',
  Outages: 'Avarii', 'What are you most looking forward to at this event?': 'Ce aștepți cel mai mult de la acest eveniment?',
  'This ticket is not in your wallet.': 'Acest bilet nu este în portofelul tău.', 'This ticket was already used at the door.': 'Acest bilet a fost deja folosit la intrare.',
  'We could not check this ticket. Try again.': 'Nu am putut verifica acest bilet. Încearcă din nou.',
  'Hospital with emergency care': 'Spital cu urgențe', 'Hospital with emergency care, {}. In an emergency call 112.': 'Spital cu urgențe, {}. În caz de urgență sunați la 112.', 'Hospital with emergency care. In an emergency call 112.': 'Spital cu urgențe. În caz de urgență sunați la 112.', 'Hospital': 'Spital', 'Hospital, {}. In an emergency call 112.': 'Spital, {}. În caz de urgență sunați la 112.', 'Hospital. In an emergency call 112.': 'Spital. În caz de urgență sunați la 112.', 'Police station': 'Secție de poliție', 'Police station, {}. In an emergency call 112.': 'Secție de poliție, {}. În caz de urgență sunați la 112.', 'Police station. In an emergency call 112.': 'Secție de poliție. În caz de urgență sunați la 112.', 'Fire station': 'Pompieri', 'Fire station, {}. In an emergency call 112.': 'Pompieri, {}. În caz de urgență sunați la 112.', 'Fire station. In an emergency call 112.': 'Pompieri. În caz de urgență sunați la 112.', 'Safe places': 'Locuri sigure', 'In an emergency call 112.': 'În caz de urgență sunați la 112.', '{}. In an emergency call 112.': '{}. În caz de urgență sunați la 112.', 'Nearest safe place': 'Cel mai apropiat loc sigur', '{} · {} m from here': '{} · la {} m de aici', 'Nearest safe place: {} ({}), {} m away. In an emergency call 112.': 'Cel mai apropiat loc sigur: {} ({}), la {} m. În caz de urgență sunați la 112.',
  'Sample data for the demo.': 'Date de exemplu pentru demonstrație.', '{} m perimeter': 'perimetru de {} m', 'Could not sign in.': 'Nu te-am putut autentifica.', 'Photo for {}': 'Fotografie pentru {}', 'Show 1 event': 'Arată 1 eveniment', 'Show {} events': 'Arată {} evenimente', '{} ticket, {} badge': '{} bilet, {} insignă', '{} ticket, {} badges': '{} bilet, {} insigne', '{} tickets, {} badge': '{} bilete, {} insignă', '{} tickets, {} badges': '{} bilete, {} insigne', 'A demo of what the host does at the door': 'O demonstrație a ceea ce face organizatorul la intrare', 'Address': 'Adresă', 'Opens the Solana devnet faucet': 'Deschide robinetul Solana devnet', 'Welcome in': 'Bun venit', 'I could not understand the recording.': 'Nu am înțeles înregistrarea.', 'The assistant is not answering right now.': 'Asistentul nu răspunde acum.', 'Voice is not available right now.': 'Vocea nu este disponibilă acum.', 'Could not load the list.': 'Lista nu s-a putut încărca.', '{}, {} of {} free. Show on the map': '{}, {} din {} libere. Arată pe hartă', 'Search': 'Caută', 'City map of {}': 'Harta orașului {}', 'New': 'Nou', 'Drag down to close': 'Trage în jos ca să închizi', 'done': 'terminat', 'in progress': 'în desfășurare', 'upcoming': 'urmează', '1 star': '1 stea', '{} stars': '{} stele', '{} out of 5': '{} din 5', 'Tap a star': 'Atinge o stea', 'Needs work': 'Trebuie îmbunătățit', 'Not great': 'Nu prea bine', 'It is okay': 'E în regulă', 'Good': 'Bine', 'Loving it': 'Îmi place mult', 'City alert': 'Alertă a orașului', 'Event': 'Eveniment', 'Favourite': 'Favorit', 'Lost or found': 'Pierdut sau găsit', 'Meet-up spot': 'Loc de întâlnire', 'Note': 'Notă', 'Safety concern': 'Problemă de siguranță', 'Smell report': 'Sesizare de miros', 'Work or study': 'Serviciu sau studii', 'A dark street or something unsafe. Sharing helps neighbours.': 'O stradă întunecată sau ceva nesigur. Distribuirea ajută vecinii.', 'A lost pet or a found item.': 'Un animal pierdut sau un obiect găsit.', 'A parking lot.': 'O parcare.', 'A place to meet people.': 'Un loc unde te poți întâlni cu oameni.', 'A place you like. Only you see this.': 'Un loc care îți place. Doar tu vezi asta.', 'A reminder for yourself.': 'Un memento pentru tine.', 'A safe place: firefighters are based here.': 'Un loc sigur: aici își au baza pompierii.', 'A safe place: you can ask the police for help here.': 'Un loc sigur: aici poți cere ajutorul poliției.', 'A safe place: you can get medical help here.': 'Un loc sigur: aici poți primi ajutor medical.', 'A smell you noticed here.': 'Un miros pe care l-ai observat aici.', 'A stop or detour.': 'O stație sau o deviere.', 'An event.': 'Un eveniment.', 'From the city.': 'De la oraș.', 'Only you see this.': 'Doar tu vezi asta.', 'Board games on Thursdays': 'Jocuri de societate joia', 'Burnt smell this morning': 'Miros de ars azi-dimineață', 'Grey cat seen near the park': 'Pisică cenușie văzută lângă parc', 'Near Gara de Nord.': 'Lângă Gara de Nord.', 'Piața Unirii.': 'Piața Unirii.', 'Underpass is poorly lit': 'Pasajul este slab iluminat', 'Acoustic night on the canal': 'Seară acustică pe canal', 'Beginner Pottery & Clay Jam': 'Atelier de ceramică pentru începători', 'Casual pottery and clay shaping workshop designed for students and newcomers. All clay and pottery materials included.': 'Atelier relaxat de ceramică și modelaj în lut, pentru studenți și nou-veniți. Toate materialele sunt incluse.', 'Local student musicians playing acoustic indie and jazz standards right on the wooden deck along the Bega canal.': 'Muzicieni studenți din oraș cântă indie acustic și jazz pe puntea de lemn de pe canalul Bega.', 'Outdoor screening of independent short films. Warm spiced cider, cozy fires, and discussion with directors.': 'Proiecție în aer liber de scurtmetraje independente. Cidru cald cu condimente, focuri primitoare și discuții cu regizorii.', 'Sunset Acoustic & Jazz Session': 'Sesiune acustică și jazz la apus', 'Underground Indie Cinema Night': 'Noapte de cinema indie underground', 'Bega Clean & Green Volunteers': 'Voluntari Bega curată și verde', 'Fabric Creative Hub & Yard': 'Hub creativ Fabric', 'UPT & UVT Student Socials': 'Întâlniri studențești UPT și UVT', 'Heating outage in Student Complex — warm study spaces?': 'Avarie la căldură în Complexul Studențesc — spații calde de studiu?', 'Lost Orange Tabby in Fabric (Ștefan cel Mare St.)': 'Pisică portocalie pierdută în Fabric (str. Ștefan cel Mare)', 'Overpriced concert tickets Piața Unirii': 'Bilete la concert prea scumpe în Piața Unirii', 'Volunteer Bega Riverbank Cleanup (Iosefin / D’arc deck)': 'Curățenie voluntară pe malul Begăi (Iosefin / puntea D’arc)',
  'Critical': 'Critic', 'High': 'Ridicat', 'Medium': 'Mediu', 'Low': 'Scăzut', 'Active': 'Activ', 'Resolved': 'Rezolvat', 'Detoured': 'Deviată', 'Moderate': 'Moderată',
  'Sent with your questions, rounded to about 100 m, and never stored.': 'Trimisă odată cu întrebările tale, rotunjită la aproximativ 100 m și niciodată stocată.', 'Location is off for hop. Turn it on in your phone settings to use this.': 'Locația este oprită pentru hop. Pornește-o din setările telefonului ca să folosești asta.', 'Location is blocked. Allow it for this site in your browser.': 'Locația este blocată. Permite-o pentru acest site în browser.', 'Your browser cannot share your location.': 'Browserul tău nu poate partaja locația.',
  'Audio tour': 'Tur audio', 'Audio tour of the city centre': 'Tur audio al centrului orașului', 'Voice is not available right now. You can read the text below.': 'Vocea nu este disponibilă acum. Poți citi textul de mai jos.', 'The microphone is off for hop. Turn it on in your phone settings to speak.': 'Microfonul este oprit pentru hop. Pornește-l din setările telefonului ca să vorbești.', 'I cannot use the microphone. Check the permission.': 'Nu pot folosi microfonul. Verifică permisiunea.', 'Nothing was recorded.': 'Nu s-a înregistrat nimic.', 'Could not play the audio.': 'Sunetul nu a putut fi redat.',
  'Connected to the server': 'Conectat la server', 'Checking the connection': 'Se verifică conexiunea', 'Cannot reach the server': 'Serverul nu poate fi contactat',
  'Search places and addresses': 'Caută locuri și adrese', 'Search the map': 'Caută pe hartă', 'Clear': 'Șterge', 'Places and addresses': 'Locuri și adrese', 'No matches. Try a street, a place or an address.': 'Niciun rezultat. Încearcă o stradă, un loc sau o adresă.', 'Save as my pin': 'Salvează ca pin al meu', 'Place': 'Loc', 'Search result': 'Rezultat al căutării', 'A place from the search.': 'Un loc din căutare.',
  'Reported {} times': 'Raportat de {} ori', '{} neighbours reported this here. Latest {}.': '{} vecini au raportat asta aici. Cel mai recent {}.', '{} neighbours reported this here. In the last 24 hours.': '{} vecini au raportat asta aici. În ultimele 24 de ore.', '{} reports': '{} sesizări', '{}d ago': 'acum {} zile',
  'Directions to': 'Indicații către', 'Walk': 'Pe jos', 'Bike': 'Cu bicicleta', 'Car': 'Cu mașina', 'Finding the way…': 'Caut drumul…', 'Show steps': 'Arată pașii', 'Hide steps': 'Ascunde pașii', 'Turn on location to get directions from where you are.': 'Pornește locația ca să primești indicații de unde te afli.', 'Turn on location': 'Pornește locația', 'Could not get directions.': 'Nu am putut găsi indicații.', 'No way to get there that way.': 'Nu există drum până acolo în acest fel.', 'The routing service is not answering. Try again in a moment.': 'Serviciul de trasee nu răspunde. Încearcă din nou într-un moment.', 'Goes around {}': 'Ocolește {}', 'Passes through {}, about {}': 'Trece prin {}, circa {}', 'Passes by works: {}, about {}': 'Trece pe lângă lucrări: {}, circa {}', 'Your start or destination is inside {}': 'Punctul de plecare sau destinația este în {}', 'There is no way round the danger zone. Take care.': 'Nu există ocol pentru zona de pericol. Ai grijă.', 'Help close to the way': 'Ajutor aproape de traseu', '{} from the route': '{} de traseu', 'Start on {}': 'Pornește pe {}', 'Start': 'Pornește', 'Arrive at your destination': 'Ai ajuns la destinație', 'Take the roundabout onto {}': 'Intră în sensul giratoriu spre {}', 'Take the roundabout': 'Intră în sensul giratoriu', 'Make a U-turn': 'Fă o întoarcere', 'Turn left onto {}': 'Virează la stânga pe {}', 'Turn left': 'Virează la stânga', 'Turn right onto {}': 'Virează la dreapta pe {}', 'Turn right': 'Virează la dreapta', 'Bear left onto {}': 'Ține stânga pe {}', 'Bear left': 'Ține stânga', 'Bear right onto {}': 'Ține dreapta pe {}', 'Bear right': 'Ține dreapta', 'Make a sharp left onto {}': 'Virează brusc la stânga pe {}', 'Make a sharp left': 'Virează brusc la stânga', 'Make a sharp right onto {}': 'Virează brusc la dreapta pe {}', 'Make a sharp right': 'Virează brusc la dreapta', 'Continue on {}': 'Continuă pe {}', 'Continue straight': 'Continuă înainte',
  'Cancel my place': 'Anulează locul meu', 'Keep my place': 'Păstrează locul', 'Cancel your place?': 'Anulezi locul?', 'You will lose your ticket for {}.': 'Îți vei pierde biletul pentru {}.', 'You already used this ticket': 'Ai folosit deja acest bilet', 'A ticket that was scanned at the door cannot be cancelled.': 'Un bilet scanat la intrare nu poate fi anulat.', 'We could not update your spot. Check your connection and try again.': 'Nu am putut actualiza locul tău. Verifică conexiunea și încearcă din nou.', 'Choose an account': 'Alege un cont', 'Continue as Alex': 'Continuă ca Alex', 'alex.popescu@gmail.com (demo account)': 'alex.popescu@gmail.com (cont demo)',
  'We will tell you when it’s back. Undo': 'Te anunțăm când revine. Anulează', 'You will get updates. Undo': 'Vei primi noutăți. Anulează', 'Thanks, we counted you': 'Mulțumim, te-am numărat', 'Could not save that. Check your connection and try again.': 'Nu am putut salva. Verifică conexiunea și încearcă din nou.',
  'Environment': 'Mediu', 'Transport': 'Transport', 'General': 'General',
  'No connection. Check your internet and try again.': 'Fără conexiune. Verifică internetul și încearcă din nou.', 'Please sign in again.': 'Te rugăm să te autentifici din nou.', 'You do not have access to this.': 'Nu ai acces la aceasta.', 'We could not find that.': 'Nu am găsit asta.', 'Too many tries. Wait a moment and try again.': 'Prea multe încercări. Așteaptă puțin și încearcă din nou.', 'Something went wrong on our side. Try again in a moment.': 'A apărut o problemă la noi. Încearcă din nou într-un moment.', 'Something went wrong. Try again.': 'Ceva nu a mers. Încearcă din nou.', 'Something went wrong': 'Ceva nu a mers', 'This screen could not open. Nothing you did was lost. Try again, and if it keeps happening, go back to Home.': 'Acest ecran nu s-a putut deschide. Nu s-a pierdut nimic din ce ai făcut. Încearcă din nou, iar dacă se repetă, mergi la Acasă.', 'Go to Home': 'Mergi la Acasă', 'This page is not here': 'Pagina nu există', 'The link may be old, or the page may have moved.': 'Linkul poate fi vechi sau pagina a fost mutată.',
  'Demo account': 'Cont demo',
  'Resident': 'Locuitor',
  'Reported {}': 'Raportat {}', 'Announced': 'Anunțat',
  'Keep away from the area · {} m around': 'Evită zona · {} m în jur', 'Works in progress · {} m around': 'Lucrări în desfășurare · {} m în jur',
});
