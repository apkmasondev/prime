import { VIDEO } from '../../experience/timeline/stations';
import './film.css';

/**
 * The film. It is never played - the timeline drives `currentTime` - so there
 * is no autoplay policy to negotiate and no audio track to mute: the delivery
 * master ships without one.
 */
export function Film({
  ref,
  rootRef,
}: {
  ref: React.Ref<HTMLVideoElement>;
  rootRef: React.Ref<HTMLDivElement>;
}): React.JSX.Element {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="film" ref={rootRef} aria-hidden="true">
      <video
        ref={ref}
        className="film__video"
        src={base + VIDEO.src}
        poster={base + VIDEO.posterWebp}
        width={VIDEO.width}
        height={VIDEO.height}
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
      />
    </div>
  );
}
