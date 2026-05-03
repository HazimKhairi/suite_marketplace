import Image from 'next/image';
import Link from 'next/link';

export function Logo({
  size = 'md',
  showWordmark = false,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}) {
  const px = { sm: 28, md: 36, lg: 56, xl: 96 }[size];
  return (
    <Link href="/" className={`inline-flex items-center gap-3 group ${className}`}>
      <Image
        src="/branding/logo_suite.png"
        alt="Suite Games 2026"
        width={px}
        height={px}
        priority
        className="object-contain"
      />
      {showWordmark && (
        <span className="font-display font-extrabold tracking-tight text-2xl leading-none">
          Suite
        </span>
      )}
    </Link>
  );
}
