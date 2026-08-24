import type { Station } from '../../experience/timeline/types';

interface Props {
  readonly station: Station;
  readonly active: boolean;
  readonly children: React.ReactNode;
}

const pad = (n: number): string => n.toString().padStart(2, '0');

/**
 * One mounted exhibit board. It is anchored to the edge of the frame the
 * professor gestures towards, and its width is derived from where his hand
 * actually lands - never from a breakpoint.
 */
export function StationPanel({ station, active, children }: Props): React.JSX.Element {
  const titleId = `${station.id}-title`;
  return (
    <section
      className="panel"
      data-side={station.side}
      data-surface={station.surface}
      data-station={station.id}
      data-active={active ? 'true' : 'false'}
      aria-labelledby={titleId}
      aria-hidden={active ? undefined : true}
      inert={!active}
    >
      <div className="panel__surface">
        <p className="panel__eyebrow">
          <span className="panel__number">{pad(station.index)}</span>
          <span className="panel__rule" aria-hidden="true" />
          <span className="panel__label">{station.label}</span>
        </p>

        <h2 className="panel__title" id={titleId}>
          {station.title}
        </h2>

        <p className="panel__statement">{station.statement}</p>

        <figure className="panel__figure">
          {children}
          <figcaption className="visually-hidden">{station.diagramSummary}</figcaption>
        </figure>

        {station.note ? (
          <p className="panel__note" data-kind={station.note.kind}>
            <span className="panel__note-label">
              {station.note.kind === 'open-problem' ? 'Open problem' : 'Note'}
            </span>
            {station.note.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
