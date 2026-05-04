import { Sparkles } from 'lucide-react';

export function BuiltByBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://hazimdev.com?utm_source=suite-marketplace&utm_medium=badge"
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 border border-line bg-canvas px-3 py-2 hover:border-ink transition-colors ${className}`}
    >
      <Sparkles
        className="w-3.5 h-3.5 text-flame-red group-hover:text-flame-purple transition-colors"
        strokeWidth={1.5}
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted group-hover:text-ink transition-colors">
        Built by{' '}
        <span className="text-ink group-hover:text-flame-red transition-colors font-semibold">
          hazimdev
        </span>
      </span>
    </a>
  );
}
