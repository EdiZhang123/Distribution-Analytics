import React from "react";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

// Use the minimal Plotly build (~3MB) instead of the full build (~16MB).
// The factory pattern lets react-plotly.js accept an external Plotly instance,
// so npm never installs the full plotly.js peer dependency.
const Plot = createPlotlyComponent(Plotly);

/**
 * Generic Plotly chart wrapper.
 *
 * Accepts Plotly `data` and `layout` props directly, so callers control
 * chart type (scatter, histogram, surface, heatmap, etc.) and all styling.
 * No defaults are injected for axes, ranges, or color scales — those must
 * be specified explicitly by the caller.
 *
 * Supports:
 *   - 2D interactive plots (scatter, histogram, line, box, violin, heatmap)
 *   - 3D plots (surface, scatter3d, mesh3d) via Plotly's built-in 3D engine
 *   - Image display via Plotly layout `images` or `imshow`-style heatmaps
 *
 * @param {Object[]}  data          - Plotly trace array
 * @param {Object}    layout        - Plotly layout object
 * @param {Object}    config        - Optional Plotly config overrides
 * @param {string}    style         - Optional inline style for the container div
 * @param {Function}  onHoverData   - Called with { cursorX, cursorY, point } on hover
 * @param {Function}  onUnhoverData - Called with no args when hover ends
 */
export default function PlotlyChart({
  data,
  layout = {},
  config = {},
  style = { width: "100%", height: "500px" },
  onHoverData,
  onUnhoverData,
}) {
  const mergedConfig = {
    responsive: true,
    displayModeBar: true,
    ...config,
  };

  function handleHover(eventData) {
    const point = eventData.points?.[0];
    if (!point) return;
    const event = eventData.event;
    if (!event) return;
    onHoverData({ cursorX: event.clientX, cursorY: event.clientY, point });
  }

  function handleUnhover() {
    onUnhoverData?.();
  }

  return (
    <Plot
      data={data}
      layout={layout}
      config={mergedConfig}
      style={style}
      useResizeHandler
      onHover={onHoverData ? handleHover : undefined}
      onUnhover={onUnhoverData ? handleUnhover : undefined}
    />
  );
}
