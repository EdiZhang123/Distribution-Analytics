import React from "react";
import LatexRenderer from "./LatexRenderer";

/**
 * Fixed-position tooltip that renders a Plotly hover point as LaTeX.
 *
 * Positioned near the cursor via `left: x + 14, top: y - 20` using
 * `position: fixed` so it floats above the chart. `pointer-events: none`
 * prevents the tooltip from blocking Plotly's own mouse handling.
 *
 * @param {boolean}     visible - Whether to show the tooltip
 * @param {number}      x       - Cursor clientX (pixels from left of viewport)
 * @param {number}      y       - Cursor clientY (pixels from top of viewport)
 * @param {Object|null} point   - Plotly point object from the hover event
 */
export default function HoverTooltip({ visible, x, y, point }) {
  if (!visible || !point) return null;

  const traceType = point.data?.type;

  function formatValue(v) {
    if (typeof v === "number" && !Number.isNaN(v)) {
      return v.toPrecision(5);
    }
    return `\\text{${String(v)}}`;
  }

  let valueMath;
  if (traceType === "scatter3d") {
    valueMath = `x = ${formatValue(point.x)},\\; y = ${formatValue(point.y)},\\; z = ${formatValue(point.z)}`;
  } else if (traceType === "histogram") {
    valueMath = `x = ${formatValue(point.x)},\\; \\text{count} = ${formatValue(point.y)}`;
  } else {
    valueMath = `x = ${formatValue(point.x)},\\; y = ${formatValue(point.y)}`;
  }

  const explanationMath =
    "\\text{This point lies in the empirical distribution. [Statistical explanation placeholder.]}";

  return (
    <div
      className="hover-tooltip"
      style={{ left: x + 14, top: y - 20 }}
    >
      <div className="hover-tooltip__value">
        <LatexRenderer math={valueMath} block={false} />
      </div>
      <div className="hover-tooltip__explanation">
        <LatexRenderer math={explanationMath} block={false} />
      </div>
    </div>
  );
}
