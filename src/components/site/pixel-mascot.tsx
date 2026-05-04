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

type Mood = 'neutral' | 'annoyed' | 'angry' | 'furious' | 'sulk';

const PALETTES: Record<Mood, Record<string, string>> = {
  neutral: {
    Y: '#f5c542', C: '#5b3a1f', H: '#2b1810', S: '#d9a87a', E: '#1a1a1a',
    M: '#5b3a1f', W: '#f3efe6', R: '#d92929', B: '#1a2238',
  },
  annoyed: {
    Y: '#f5c542', C: '#5b3a1f', H: '#2b1810', S: '#e89090', E: '#1a1a1a',
    M: '#7a1f1f', W: '#f3efe6', R: '#d92929', B: '#1a2238',
  },
  angry: {
    Y: '#f5c542', C: '#5b3a1f', H: '#2b1810', S: '#d33b3b', E: '#1a1a1a',
    M: '#3a0808', W: '#f3efe6', R: '#7a1010', B: '#1a2238',
  },
  furious: {
    Y: '#f5c542', C: '#5b3a1f', H: '#2b1810', S: '#9b1010', E: '#fff14a',
    M: '#000000', W: '#f3efe6', R: '#3a0808', B: '#1a2238',
  },
  sulk: {
    Y: '#a89870', C: '#3d2814', H: '#1c1109', S: '#8da0a8', E: '#3a4955',
    M: '#3a4955', W: '#cfd6d9', R: '#5a4a55', B: '#2a3540',
  },
};

const DIALOGUE: { text: string; mood: Mood }[] = [
  { text: 'Hello, saya Hazim!', mood: 'neutral' },
  { text: 'Auch! Stop it', mood: 'annoyed' },
  { text: 'Eh seriously stop', mood: 'angry' },
  { text: 'Beli jacket tu lahh', mood: 'annoyed' },
  { text: 'RM 28 je lahh', mood: 'annoyed' },
  { text: 'Bukan main pakat tekan', mood: 'furious' },
  { text: 'Saya dah penat', mood: 'sulk' },
  { text: 'OK saya merajuk', mood: 'sulk' },
  { text: 'Click jacket bukan saya', mood: 'sulk' },
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

  useEffect(() => {
    if (clicks > 0) return;
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
    setBubble(DIALOGUE[(next - 1) % DIALOGUE.length].text);

    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setBubble(null);
    }, 3200);

    window.setTimeout(() => setBouncing(false), 600);
  };

  const visibleBubble = bubble ?? (thinking ? '...' : null);
  const bubbleKey = bubble ? `msg-${clicks}` : thinking ? 'think' : 'none';

  // Mood follows the dialogue index — cycles with the click count.
  const mood: Mood = clicks === 0 ? 'neutral' : DIALOGUE[(clicks - 1) % DIALOGUE.length].mood;
  const palette = PALETTES[mood];
  const showFume = mood === 'angry' || mood === 'furious';
  const showTear = mood === 'sulk';

  return (
    <div className="absolute -top-8 left-3 sm:left-5 z-20 flex items-start gap-2 pointer-events-none">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Hazim pixel mascot — mood ${mood}`}
        className="group relative pointer-events-auto select-none focus:outline-none"
      >
        <svg
          viewBox={`0 0 ${COLS} ${TOTAL_ROWS}`}
          shapeRendering="crispEdges"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          className={`w-14 h-14 sm:w-16 sm:h-16 origin-bottom transition-transform ${
            bouncing
              ? 'animate-mascot-bounce'
              : mood === 'furious'
                ? 'animate-mascot-shake'
                : mood === 'sulk'
                  ? 'animate-mascot-droop'
                  : 'animate-mascot-idle group-hover:scale-110'
          }`}
        >
          {/* Fume puffs above head — only when angry / furious */}
          {showFume && (
            <>
              <rect x="3" y="2" width="2" height="2" fill="#9aa0a3" opacity="0.85" />
              <rect x="14" y="1" width="2" height="2" fill="#9aa0a3" opacity="0.85" />
              <rect x="2" y="0" width="1" height="1" fill="#c9ced0" opacity="0.7" />
              <rect x="16" y="3" width="1" height="1" fill="#c9ced0" opacity="0.7" />
            </>
          )}

          {ROWS.map((row, y) =>
            row.split('').map((ch, x) => {
              const fill = palette[ch];
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

          {/* Tear drops below eyes — only when sulking */}
          {showTear && (
            <>
              <rect x="8" y="7" width="1" height="2" fill="#5fb3d1" />
              <rect x="11" y="7" width="1" height="2" fill="#5fb3d1" />
            </>
          )}
        </svg>
      </button>

      {visibleBubble && (
        <div key={bubbleKey} className="relative mt-2 animate-bubble-pop pointer-events-none select-none">
          <div
            className={`relative border shadow-[3px_3px_0_0] px-3 py-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] whitespace-nowrap transition-colors ${
              mood === 'sulk'
                ? 'bg-paper border-muted shadow-muted text-muted'
                : mood === 'furious'
                  ? 'bg-flame-red border-ink shadow-ink text-canvas'
                  : mood === 'angry'
                    ? 'bg-canvas border-flame-red shadow-flame-red text-flame-red'
                    : 'bg-canvas border-ink shadow-ink text-ink'
            }`}
          >
            {visibleBubble}
            <span
              aria-hidden="true"
              className="absolute right-full top-2 w-0 h-0"
              style={{
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: `7px solid ${
                  mood === 'sulk' ? '#6f6c66' : mood === 'angry' ? '#ef3b3b' : '#1a1a1a'
                }`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
