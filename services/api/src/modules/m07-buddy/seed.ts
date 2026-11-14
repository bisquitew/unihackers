import type { BuddyRequest, BuddyGroupChat } from './types.ts';

export const seedBuddyRequests: BuddyRequest[] = [
  {
    id: 'bud-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    userId: 'usr-lucas-01',
    userName: 'Lucas Weber',
    bio: 'Erasmus student from Munich studying Computer Science at UPT. Big fan of European cinema and craft beer.',
    university: 'UPT',
    interests: ['cinema', 'photography', 'techno', 'coffee'],
    icebreakerPrompt: 'Favorite A24 or European arthouse movie?',
    status: 'open',
    createdAt: '2026-11-13T14:00:00Z',
  },
  {
    id: 'bud-002',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    userId: 'usr-ioana-02',
    userName: 'Ioana Moldovan',
    bio: 'Architecture student at Faculty of Architecture Timișoara. Love discussions after film screenings!',
    university: 'UPT',
    interests: ['cinema', 'architecture', 'drawing', 'tea'],
    icebreakerPrompt: 'What short film impressed you most lately?',
    status: 'open',
    createdAt: '2026-11-13T14:30:00Z',
  },
  {
    id: 'bud-003',
    eventId: 'evt-002',
    eventTitle: 'Beginner Pottery & Clay Jam',
    userId: 'usr-sarah-03',
    userName: 'Sarah Jenkins',
    bio: 'Newcomer in Timișoara working remotely in tech. Looking to meet creative people and learn pottery.',
    university: 'Alumni / Professional',
    interests: ['pottery', 'crafts', 'hiking', 'languages'],
    icebreakerPrompt: 'Have you ever tried making a ceramic mug?',
    status: 'open',
    createdAt: '2026-11-13T15:00:00Z',
  }
];

export const seedGroupChats: BuddyGroupChat[] = [
  {
    id: 'chat-evt-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    participantIds: ['usr-lucas-01', 'usr-ioana-02'],
    participantNames: ['Lucas Weber', 'Ioana Moldovan'],
    messages: [
      {
        id: 'msg-001',
        chatId: 'chat-evt-001',
        senderId: 'usr-lucas-01',
        senderName: 'Lucas Weber',
        content: 'Hey Ioana! Are you going to Faber early to grab a hot cider before the screening?',
        sentAt: '2026-11-13T15:10:00Z',
      },
      {
        id: 'msg-002',
        chatId: 'chat-evt-001',
        senderId: 'usr-ioana-02',
        senderName: 'Ioana Moldovan',
        content: 'Hey Lucas! Yes, I plan to be there around 19:00. Let’s meet by the outdoor fire pit!',
        sentAt: '2026-11-13T15:15:00Z',
      }
    ],
    createdAt: '2026-11-13T15:05:00Z',
  }
];
