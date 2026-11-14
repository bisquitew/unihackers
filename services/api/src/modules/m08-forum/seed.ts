import type { ForumPost } from './types.ts';

export const seedForumPosts: ForumPost[] = [
  {
    id: 'post-001',
    category: 'lost_pets',
    title: 'Pisică portocalie pierdută în Zona Fabric / Str. Ștefan cel Mare',
    content: 'Motan roșcat, 2 ani, răspunde la numele Milo. Are o zgardă albastră cu clopoțel. S-a speriat de un câine și a fugit spre malul Begăi. Dacă îl vede cineva, vă rugăm să ne scrieți!',
    authorId: 'usr-ana-01',
    authorName: 'Ana Radu',
    neighbourhood: 'Fabric',
    photos: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80'
    ],
    upvotes: 18,
    commentsCount: 2,
    comments: [
      {
        id: 'cmt-101',
        postId: 'post-001',
        authorId: 'usr-ion-02',
        authorName: 'Ion Ionescu',
        content: 'Cred că l-am văzut acum 1 oră în spatele bisericii Millennium!',
        createdAt: '2026-11-13T12:30:00Z',
      },
      {
        id: 'cmt-102',
        postId: 'post-001',
        authorId: 'usr-ana-01',
        authorName: 'Ana Radu',
        content: 'Mergem acum să căutăm acolo, mulțumim mult!',
        createdAt: '2026-11-13T12:45:00Z',
      }
    ],
    isReported: false,
    reportCount: 0,
    createdAt: '2026-11-13T11:00:00Z',
  },
  {
    id: 'post-002',
    category: 'neighbourhood',
    title: 'Ecologizare voluntară malul Begăi (zona D’arc pe Mal)',
    content: 'Sâmbătă la ora 10:00 ne strângem un grup de vecini să adunăm deșeurile de pe faleza Begăi din Iosefin. Asigurăm mănuși și saci de gunoi. Cafeaua este oferită de cafeneaua locală!',
    authorId: 'usr-mihai-03',
    authorName: 'Mihai Voinea',
    neighbourhood: 'Iosefin',
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80'
    ],
    upvotes: 34,
    commentsCount: 1,
    comments: [
      {
        id: 'cmt-103',
        postId: 'post-002',
        authorId: 'usr-elena-04',
        authorName: 'Elena Dumitrescu',
        content: 'Vin și eu cu doi colegi de la facultate!',
        createdAt: '2026-11-13T13:10:00Z',
      }
    ],
    isReported: false,
    reportCount: 0,
    createdAt: '2026-11-13T10:15:00Z',
  },
  {
    id: 'post-003',
    category: 'help',
    title: 'Căldura oprită în Căminul 15 Complexul Studențesc — soluții temporare?',
    content: 'Colterm are avarie pe rețeaua magistrală și caloriferele sunt complet reci de azi-dimineață. Știe cineva unde putem merge să învățăm într-un spațiu cald?',
    authorId: 'usr-alex-05',
    authorName: 'Alex Popa',
    neighbourhood: 'Complexul Studențesc',
    photos: [],
    upvotes: 27,
    commentsCount: 2,
    comments: [
      {
        id: 'cmt-104',
        postId: 'post-003',
        authorId: 'usr-maria-06',
        authorName: 'Maria Costache',
        content: 'La Faber și la Biblioteca Centrală Universitară (BCUT) este cald și au spații de coworking excelente.',
        createdAt: '2026-11-13T14:20:00Z',
      }
    ],
    isReported: false,
    reportCount: 0,
    createdAt: '2026-11-13T13:50:00Z',
  }
];
