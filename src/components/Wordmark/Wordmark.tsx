const RATIO = 614 / 1981;

/**
 * The project mark, shipped as a trimmed AVIF with a WebP fallback.
 * It carries the whole identity of the piece, so it appears only where the
 * piece names itself: the opening, the closing and the notes drawer.
 */
export function Wordmark({
  className,
  width = 560,
  tone = 'paper',
}: {
  className?: string;
  width?: number;
  tone?: 'paper' | 'ink';
}): React.JSX.Element {
  const base = import.meta.env.BASE_URL;
  const name = tone === 'ink' ? 'prime-wordmark-ink' : 'prime-wordmark';
  return (
    <img
      className={className}
      src={`${base}brand/${name}.webp`}
      alt="PRIME"
      width={width}
      height={Math.round(width * RATIO)}
      decoding="async"
      fetchPriority={tone === 'paper' ? 'high' : 'low'}
    />
  );
}
