import { DECKLE_PATHS } from './deckle';

/**
 * The clip paths the exhibit cards are cut with. Rendered once, referenced by
 * every card; in object-bounding-box units, so one path fits any card size.
 */
export function PaperEdges(): React.JSX.Element {
  return (
    <svg className="paper-edges" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <clipPath id="deckle-torn-left" clipPathUnits="objectBoundingBox">
          <path d={DECKLE_PATHS.tornLeft} />
        </clipPath>
        <clipPath id="deckle-torn-right" clipPathUnits="objectBoundingBox">
          <path d={DECKLE_PATHS.tornRight} />
        </clipPath>
        <clipPath id="deckle-torn-top" clipPathUnits="objectBoundingBox">
          <path d={DECKLE_PATHS.tornTop} />
        </clipPath>
      </defs>
    </svg>
  );
}
