import { factorTree, primePowers, type FactorNode } from '../math/factorization';
import './factor-tree.css';

const SUBJECT = 84;

interface Placed {
  readonly node: FactorNode;
  readonly x: number;
  readonly y: number;
}

interface Edge {
  readonly from: Placed;
  readonly to: Placed;
  readonly depth: number;
}

/** Leaves are spaced evenly; every parent sits above the midpoint of its children. */
function layout(root: FactorNode): { nodes: Placed[]; edges: Edge[]; width: number; depth: number } {
  const nodes: Placed[] = [];
  const edges: Edge[] = [];
  let nextLeaf = 0;
  let maxDepth = 0;

  const place = (node: FactorNode): Placed => {
    maxDepth = Math.max(maxDepth, node.depth);
    if (node.children.length === 0) {
      const placed = { node, x: nextLeaf++, y: node.depth };
      nodes.push(placed);
      return placed;
    }
    const children = node.children.map(place);
    const first = children[0];
    const last = children[children.length - 1];
    const x = first && last ? (first.x + last.x) / 2 : 0;
    const placed = { node, x, y: node.depth };
    nodes.push(placed);
    for (const child of children) edges.push({ from: placed, to: child, depth: node.depth });
    return placed;
  };

  place(root);
  return { nodes, edges, width: Math.max(1, nextLeaf - 1), depth: maxDepth };
}

const TREE = layout(factorTree(SUBJECT));
const POWERS = primePowers(SUBJECT);

const COL = 100;
const ROW = 74;
const PAD_X = 42;
const PAD_Y = 34;
const VIEW_W = TREE.width * COL + PAD_X * 2;
const VIEW_H = TREE.depth * ROW + PAD_Y * 2;

const px = (x: number): number => PAD_X + x * COL;
const py = (y: number): number => PAD_Y + y * ROW;

export function FactorTree({ active }: { active: boolean }): React.JSX.Element {
  return (
    <div className="tree" data-active={active ? 'true' : 'false'}>
      <svg
        className="tree__svg"
        viewBox={`0 0 ${String(VIEW_W)} ${String(VIEW_H)}`}
        role="presentation"
        focusable="false"
      >
        <g className="tree__edges">
          {TREE.edges.map((edge) => (
            <line
              key={`${String(edge.from.node.order)}-${String(edge.to.node.order)}`}
              x1={px(edge.from.x)}
              y1={py(edge.from.y) + 16}
              x2={px(edge.to.x)}
              y2={py(edge.to.y) - 16}
              style={{ '--d': edge.depth } as React.CSSProperties}
            />
          ))}
        </g>
        <g className="tree__nodes">
          {TREE.nodes.map((placed) => (
            <g
              key={placed.node.order}
              className="tree__node"
              data-prime={placed.node.children.length === 0 ? 'true' : 'false'}
              style={{ '--d': placed.node.depth } as React.CSSProperties}
              transform={`translate(${String(px(placed.x))} ${String(py(placed.y))})`}
            >
              {placed.node.children.length === 0 ? (
                <circle className="tree__disc" r="21" />
              ) : (
                <circle className="tree__ring" r="21" />
              )}
              <text className="tree__value" textAnchor="middle" dominantBaseline="central">
                {placed.node.value}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <p className="tree__result">
        <span className="tree__subject">{SUBJECT}</span>
        <span className="tree__eq">=</span>
        {POWERS.map((power, i) => (
          <span key={power.prime} className="tree__power">
            {i > 0 ? <span className="tree__dot" aria-hidden="true" /> : null}
            {power.prime}
            {power.exponent > 1 ? <sup>{power.exponent}</sup> : null}
          </span>
        ))}
      </p>
      <p className="tree__note">Split it any other way and the same primes come back.</p>
    </div>
  );
}
