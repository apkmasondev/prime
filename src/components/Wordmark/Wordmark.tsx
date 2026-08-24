import { STACK_ASPECT } from '../../experience/timeline/stage';

const RATIO = 614 / 1981;

/** The same threshold the layout stacks at, expressed for the picture element. */
const STACKED = `(max-aspect-ratio: ${String(Math.round(STACK_ASPECT * 100))}/100)`;

/**
 * The project mark, shipped as a trimmed WebP in two tones. It carries the whole
 * identity of the piece, so it appears only where the piece names itself: the
 * opening, the closing and the notes drawer.
 *
 * `auto` follows the layout - light over the film, ink on the paper field - and
 * does it with a `<picture>` rather than script, so only the tone that will
 * actually be shown is ever downloaded.
 */
export function Wordmark({
  className,
  width = 560,
  tone = 'paper',
}: {
  className?: string;
  width?: number;
  tone?: 'paper' | 'ink' | 'auto';
}): React.JSX.Element {
  const base = import.meta.env.BASE_URL;
  const src = (name: string): string => `${base}brand/${name}.webp`;
  const height = Math.round(width * RATIO);

  const image = (
    <img
      className={className}
      src={src(tone === 'ink' ? 'prime-wordmark-ink' : 'prime-wordmark')}
      alt="PRIME"
      width={width}
      height={height}
      decoding="async"
      fetchPriority={tone === 'ink' ? 'low' : 'high'}
    />
  );

  if (tone !== 'auto') return image;

  return (
    <picture>
      <source media={STACKED} srcSet={src('prime-wordmark-ink')} />
      {image}
    </picture>
  );
}
