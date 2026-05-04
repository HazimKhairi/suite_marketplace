// Pixel-art avatar of Hazim, hand-painted as 16x18 grid.
// Pure SVG, no JS — animations handled by parent's group-hover.
const ROWS = [
  '................',
  '....HHHHHH......',
  '...HHHHHHHH.....',
  '..HHHHHHHHHH....',
  '..HSSSSSSSSH....',
  '..HSEsSSsESH....',
  '..HSSSSSSSSH....',
  '..HSSSMMSSSH....',
  '...SSSSSSSS.....',
  '.....SSSSS......',
  '..RRRRRRRRRR....',
  '.RRRRRRRRRRRRWW.',
  '.RRRRRRRRRRRRWW.',
  '.RRRRRRRRRRRR...',
  '..RRRRRRRRRR....',
  '..PPPP..PPPP....',
  '..PPPP..PPPP....',
  '..BBBB..BBBB....',
];

const COLORS: Record<string, string> = {
  H: '#1a1a1a', // hair
  S: '#e2b48a', // skin
  s: '#c79569', // skin shadow
  E: '#1a1a1a', // eye
  M: '#7a3a2c', // mouth
  R: '#ef3b3b', // shirt — flame-red
  P: '#1a1a1a', // pants
  B: '#3a3a3a', // shoes
  W: '#e2b48a', // waving hand (skin)
};

export function PixelAvatar({ className = '' }: { className?: string }) {
  const cols = ROWS[0].length;
  const rows = ROWS.length;
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Pixel art of Hazim"
      preserveAspectRatio="xMidYMid meet"
    >
      {ROWS.map((row, y) =>
        row.split('').map((ch, x) => {
          const fill = COLORS[ch];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
        }),
      )}
    </svg>
  );
}
