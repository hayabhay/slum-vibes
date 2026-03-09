import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

const apps = [
  {
    slug: 'cuisine',
    name: "thulla deepak's cuisine explorer",
    description: 'An interactive world map exploring cuisines from 158 countries.',
    emoji: '🗺️',
  },
];

const PHOTOS = [
  'ed5d358019e0.jpg',
  '55386926885a.jpg',
  '3ff22e302c4a.jpg',
  'a9b0602f408a.jpg',
  '50cb1626ace0.jpg',
  'cec5a7003f07.jpg',
  '82b21d2321f3.jpg',
  'f0629e7cb42a.jpg',
  'bdeaf00a137a.jpg',
  'bff4a4959d25.jpg',
  '7497e4e68db1.jpg',
  '9b7ab458cd17.jpg',
  '57df4a542f3d.jpg',
  '51751db5fc68.jpg',
  '31375e8fa2f4.jpg',
];

const BG_OPACITY = 0.18;
const FADE_MS = 3000;
const HOLD_MS = 6000;

export default function IndexPage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % PHOTOS.length);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-8 p-8 overflow-hidden">

      {/* All images stacked; only the active one is visible */}
      {PHOTOS.map((photo, i) => (
        <img
          key={photo}
          src={`/vibes/${photo}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: i === active ? BG_OPACITY : 0,
            transition: `opacity ${FADE_MS}ms ease`,
          }}
          draggable={false}
        />
      ))}

      {/* Color blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#7c3aed] opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-[#f97316] opacity-15 blur-[120px]" />
        <div className="absolute top-[40%] left-[55%] w-[30vw] h-[30vw] rounded-full bg-[#0ea5e9] opacity-10 blur-[100px]" />
      </div>

      {/* Grain */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.35] mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Title — pinned top center */}
      <h1 className="absolute top-6 left-0 right-0 text-center z-10 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
        slum vibes
      </h1>

      {/* GitHub link — top right */}
      <a
        href="https://github.com/hayabhay/slum-vibes"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-6 right-6 z-10 text-white/40 hover:text-white/80 transition-colors"
        aria-label="GitHub"
      >
        <Github className="w-5 h-5" />
      </a>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {apps.map((app) => (
          <Link
            key={app.slug}
            to={`/${app.slug}`}
            className="group border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:border-white/25 hover:bg-white/10 transition-all duration-200 flex flex-col gap-3"
          >
            <span className="text-3xl">{app.emoji}</span>
            <div>
              <h2 className="font-mono font-semibold text-lg text-white group-hover:underline">{app.name}</h2>
              <p className="text-white/50 text-sm mt-1">{app.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
