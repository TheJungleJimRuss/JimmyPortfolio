/**
 * SAMPLE text only, to show the shape and length of each slot. Loaded on demand from the admin panel into the
 * browser draft (localStorage); it is never written to `src/data/`. Replace everything with your own words.
 */
import type { AdminDraft } from './AdminModel';
import type { ProjectSlots } from '../data/projects';

const project = (p: {
  controlsNotes: string; category: string; title: string; tags: string[]; summary: string;
  specs: [string, string][]; deep: string[]; challenges: string[];
}): ProjectSlots => ({
  controlsNotes: p.controlsNotes,
  category: p.category,
  title: p.title,
  tags: p.tags,
  summary: p.summary,
  links: { source: 'https://github.com/TheJungleJimRuss', live: 'https://example.com' },
  specs: p.specs.map(([key, value]) => ({ key, value })),
  deepDive: {
    heading: 'Deep dive',
    body: [
      { kind: 'paragraph', content: [{ text: p.deep[0] ?? '' }] },
      { kind: 'bullets', items: p.deep.slice(1).map((t) => [{ text: t }]) },
    ],
  },
  challenges: {
    heading: 'What went wrong',
    body: [{ kind: 'paragraph', content: [{ text: p.challenges[0] ?? '' }] }],
  },
});

export const SAMPLE_DRAFT: AdminDraft = {
  version: 1,
  about: {
    heading: 'Sample: About',
    bio:
      'Sample text. I build game systems and interactive sites, from character controllers to small web tools. ' +
      'I like work where the feel of something matters as much as the code under it, so I prototype early, ' +
      'play it myself, and keep what survives. Outside of software I fly FPV drones and make music, ' +
      'and both habits show up in how I think about timing, feedback and polish.',
    secondary:
      'Sample text. My rule is to make the smallest version that answers the question, then grow it. ' +
      'I write tests for the logic, keep the interface honest, and leave notes so the next change is easy. ' +
      'If a choice is unclear I build a quick prototype instead of debating it.',
    stack: [
      { label: 'Languages', tags: ['C#', 'TypeScript', 'HLSL'] },
      { label: 'Engines & tools', tags: ['Unity', 'Three.js', 'Blender', 'Vite'] },
    ],
    copyright: 'Sample © Your Name',
  },
  contact: {
    heading: 'Sample: Contact',
    callToAction: 'Sample text. Have a project, a role or just a question? Send a note and I will reply.',
    email: 'sample@example.com',
    copyLabel: 'Copy email',
    linkedinUrl: 'https://www.linkedin.com/in/sample',
    linkedinLabel: 'LinkedIn',
  },
  projects: {
    'kinematic-character-controller': project({
      controlsNotes: 'Sample: WASD to move, Space to jump, mouse to look.',
      category: 'Game',
      title: 'Kinematic Character Controller',
      tags: ['Unity', 'C#', 'Physics', 'WebGL'],
      summary: 'Sample text. A tight, collision-aware character controller with slopes, steps and moving platforms, playable in the browser.',
      specs: [['Engine', 'Unity 6'], ['Language', 'C#'], ['Build', 'WebGL, under 15 MB'], ['Role', 'Solo']],
      deep: ['Sample text. The controller moves by sweeping a capsule and sliding along what it hits.', 'Ground snapping keeps steps and slopes smooth.', 'Moving platforms pass their velocity to the player.'],
      challenges: ['Sample text. Jitter on slopes came from fighting the physics step; moving the sweep to a fixed update fixed it.'],
    }),
    'drone-desktop': project({
      controlsNotes: 'Sample: not playable yet.',
      category: 'Concept',
      title: 'Drone Desktop',
      tags: ['Three.js', 'TypeScript', 'Audio'],
      summary: 'Sample text. A flight-themed companion site: take off from a transmitter and climb through clouds into open sky.',
      specs: [['Stack', 'Vite + Three.js'], ['Status', 'In progress'], ['Role', 'Solo']],
      deep: ['Sample text. The throttle input drives motor audio and camera altitude together.', 'Scroll maps to altitude.'],
      challenges: ['Sample text. Keeping the 3D scene light enough for phones is the open problem.'],
    }),
    'photography-portfolio': project({
      controlsNotes: 'Sample: scroll and click through the gallery.',
      category: 'Web',
      title: 'Photography Portfolio',
      tags: ['HTML', 'CSS', 'JavaScript'],
      summary: 'Sample text. A fast, image-first portfolio site with a clean grid and full-screen viewing.',
      specs: [['Stack', 'Vanilla web'], ['Hosting', 'GitHub Pages'], ['Role', 'Design and build']],
      deep: ['Sample text. Images are sized and lazy-loaded so the first screen paints quickly.', 'The grid adapts from one to four columns.'],
      challenges: ['Sample text. Balancing image quality against load time took several passes.'],
    }),
    'music-studio-website': project({
      controlsNotes: 'Sample: scroll to explore; links open the booking page.',
      category: 'Web',
      title: 'Music Studio Website',
      tags: ['HTML', 'CSS', 'JavaScript'],
      summary: 'Sample text. A clear, welcoming site for a small recording studio: services, gear and how to book.',
      specs: [['Stack', 'Vanilla web'], ['Hosting', 'GitHub Pages'], ['Role', 'Design and build']],
      deep: ['Sample text. The layout puts booking one tap away on every screen size.', 'Gear is listed in plain, scannable groups.'],
      challenges: ['Sample text. Making a dark, moody look still pass contrast checks.'],
    }),
  },
};
