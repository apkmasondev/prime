import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Tracks the user's motion preference, and keeps tracking if they change it. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mq = matchMedia(QUERY);
    const onChange = (): void => { setReduced(mq.matches); };
    mq.addEventListener('change', onChange);
    onChange();
    return () => { mq.removeEventListener('change', onChange); };
  }, []);

  return reduced;
}
