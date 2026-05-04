'use client';

import { useRef, useState } from 'react';

// 18-column × 18-row pixel art of a graduating Hazim — cap + suit + red tie.
const ROWS = [
  '..................',
  '......YYYYYYY.....',
  '.....YYYYYYYYY....',
  '......CCCCCCC.....',
  '.......HHHHH......',
  '......HSSSSSSH....',
  '......HSESSESH....',
  '......HSSSSSSH....',
  '......HSSMMSSH....',
  '.......SSSSS......',
  '......BWWWWWB.....',
  '.....BBBRRBBB.....',
  '....BBBBRRBBBB....',
  '...BBBBBRRBBBBB...',
  '...BBBBBRRBBBBB...',
  '....BBBBBBBBBB....',
  '.....BBBBBBBB.....',
  '..................',
];

const COLORS: Record<string, string> = {
  Y: '#f5c542', // mortarboard top — yellow
  C: '#5b3a1f', // cap brim band
  H: '#2b1810', // hair
  S: '#d9a87a', // skin
  E: '#1a1a1a', // eyes
  M: '#5b3a1f', // mouth
  W: '#f3efe6', // shirt collar
  R: '#d92929', // red tie
  B: '#1a2238', // navy blazer
};

const COLS = ROWS[0].length;
const TOTAL_ROWS = ROWS.length;

export function PixelMascot() {
  const [bouncing, setBouncing] = useState(false);
  const [showToing, setShowToing] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playToing = () => {
    try {
      const Ctor =
        typeof window !== 'undefined'
          ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : null;
      if (!Ctor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctor();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Two quick chirps — "toing-toing"
      const chirps = [
        { start: 0, fStart: 700, fPeak: 1500, fEnd: 350 },
        { start: 0.18, fStart: 600, fPeak: 1300, fEnd: 300 },
      ];
      for (const c of chirps) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);

        const t0 = now + c.start;
        osc.frequency.setValueAtTime(c.fStart, t0);
        osc.frequency.exponentialRampToValueAtTime(c.fPeak, t0 + 0.04);
        osc.frequency.exponentialRampToValueAtTime(c.fEnd, t0 + 0.16);

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

        osc.start(t0);
        osc.stop(t0 + 0.2);
      }
    } catch {
      // Silently ignore — autoplay or unsupported context.
    }
  };

  const handleClick = () => {
    playToing();
    setBouncing(true);
    setShowToing(true);
    window.setTimeout(() => setBouncing(false), 600);
    window.setTimeout(() => setShowToing(false), 900);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Hi, saya Hazim — tap untuk bunyi toing toing"
      className="group relative inline-flex items-center justify-center select-none focus:outline-none"
    >
      <span className="relative inline-block">
        <svg
          viewBox={`0 0 ${COLS} ${TOTAL_ROWS}`}
          shapeRendering="crispEdges"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          className={`w-12 h-12 sm:w-14 sm:h-14 origin-bottom transition-transform ${
            bouncing ? 'animate-mascot-bounce' : 'group-hover:-translate-y-0.5'
          }`}
        >
          {ROWS.map((row, y) =>
            row.split('').map((ch, x) => {
              const fill = COLORS[ch];
              if (!fill) return null;
              return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
            }),
          )}
        </svg>

        {showToing && (
          <span
            aria-hidden="true"
            className="absolute -top-3 left-full ml-1 font-mono text-[10px] uppercase tracking-[0.18em] text-flame-red animate-toing-pop"
          >
            TOING!
          </span>
        )}
      </span>

      <span className="ml-3 hidden sm:inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-muted group-hover:text-flame-red transition-colors">
        Hi, saya Hazim — tap me
      </span>
    </button>
  );
}
