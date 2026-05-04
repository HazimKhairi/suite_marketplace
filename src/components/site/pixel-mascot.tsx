'use client';

import { useEffect, useRef, useState } from 'react';

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
  Y: '#f5c542',
  C: '#5b3a1f',
  H: '#2b1810',
  S: '#d9a87a',
  E: '#1a1a1a',
  M: '#5b3a1f',
  W: '#f3efe6',
  R: '#d92929',
  B: '#1a2238',
};

const DIALOGUE = [
  'Hello, saya Hazim!',
  'Auch! Stop it',
  'Eh seriously stop',
  'Beli jacket tu lahh',
  'RM 80 je sayang',
  'Bukan main pakat tekan',
  'Saya dah penat',
  'OK saya merajuk',
  'Click jacket bukan saya',
];

const COLS = ROWS[0].length;
const TOTAL_ROWS = ROWS.length;

export function PixelMascot() {
  const [clicks, setClicks] = useState(0);
  const [bouncing, setBouncing] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Occasional "thinking" puff when the user has been idle.
  useEffect(() => {
    if (clicks > 0) return; // user already engaged — stop the nudge
    const tick = window.setInterval(() => {
      setThinking(true);
      window.setTimeout(() => setThinking(false), 1600);
    }, 9000);
    return () => window.clearInterval(tick);
  }, [clicks]);

  const playToing = () => {
    try {
      const Ctor =
        typeof window !== 'undefined'
          ? window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : null;
      if (!Ctor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctor();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

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
      // ignore
    }
  };

  const handleClick = () => {
    playToing();
    const next = clicks + 1;
    setClicks(next);
    setThinking(false);
    setBouncing(true);
    setBubble(DIALOGUE[(next - 1) % DIALOGUE.length]);

    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setBubble(null);
    }, 3200);

    window.setTimeout(() => setBouncing(false), 600);
  };

  // Bubble that's currently rendered (full message > thinking puff).
  const visibleBubble = bubble ?? (thinking ? '...' : null);
  const bubbleKey = bubble ? `msg-${clicks}` : thinking ? 'think' : 'none';

  return (
    <div className="absolute -top-8 left-3 sm:left-5 z-20 flex items-start gap-2 pointer-events-none">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Hazim pixel mascot — tap untuk borak"
        className="group relative pointer-events-auto select-none focus:outline-none"
      >
        <svg
          viewBox={`0 0 ${COLS} ${TOTAL_ROWS}`}
          shapeRendering="crispEdges"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          className={`w-14 h-14 sm:w-16 sm:h-16 origin-bottom transition-transform ${
            bouncing ? 'animate-mascot-bounce' : 'animate-mascot-idle group-hover:scale-110'
          }`}
        >
          {ROWS.map((row, y) =>
            row.split('').map((ch, x) => {
              const fill = COLORS[ch];
              if (!fill) return null;
              const isEye = ch === 'E';
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="1"
                  height="1"
                  fill={fill}
                  className={isEye ? 'mascot-eye' : undefined}
                />
              );
            }),
          )}
        </svg>
      </button>

      {visibleBubble && (
        <div key={bubbleKey} className="relative mt-2 animate-bubble-pop pointer-events-none select-none">
          <div className="relative bg-canvas border border-ink shadow-[3px_3px_0_0] shadow-ink px-3 py-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] whitespace-nowrap text-ink">
            {visibleBubble}
            <span
              aria-hidden="true"
              className="absolute right-full top-2 w-0 h-0"
              style={{
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '7px solid #1a1a1a',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute right-full top-2 w-0 h-0 translate-x-px"
              style={{
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '7px solid #f3efe6',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
