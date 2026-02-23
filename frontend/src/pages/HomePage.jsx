import React from "react";
import PlotlyChart from "../charts/PlotlyChart";
import LatexRenderer from "../components/LatexRenderer";

/**
 * Home page — scaffold placeholder.
 * Replace with real content once API endpoints and metrics are defined.
 */
export default function HomePage() {
  // Example 2D histogram overlay — replace with real data from the API
  const example2DData = [
    {
      x: Array.from({ length: 200 }, () => Math.random() * 4 - 2),
      type: "histogram",
      name: "Dataset A",
      opacity: 0.6,
    },
    {
      x: Array.from({ length: 200 }, () => Math.random() * 4),
      type: "histogram",
      name: "Dataset B",
      opacity: 0.6,
    },
  ];

  // Example 3D surface — replace with real data from the API
  const z = Array.from({ length: 20 }, (_, i) =>
    Array.from({ length: 20 }, (_, j) => Math.sin(i / 3) * Math.cos(j / 3))
  );
  const example3DData = [{ type: "surface", z }];

  return (
    <div>
      <h1>Distribution Analytics Engine</h1>
      <p>Distribution-first analytics platform. API and metrics coming soon.</p>

      <h2>Example: Distribution Overlay (2D)</h2>
      <PlotlyChart
        data={example2DData}
        layout={{ barmode: "overlay", title: "Sample Distribution Overlay" }}
      />

      <h2>Example: 3D Surface</h2>
      <PlotlyChart
        data={example3DData}
        layout={{ title: "Sample 3D Surface" }}
      />

      <h2>Example: LaTeX Rendering</h2>
      <p>
        Wasserstein-1 distance:{" "}
        <LatexRenderer math="W_1(P, Q) = \inf_{\gamma \in \Pi(P,Q)} \mathbb{E}_{(x,y) \sim \gamma}[\|x - y\|]" />
      </p>
      <p>
        KL divergence:{" "}
        <LatexRenderer math="D_{KL}(P \| Q) = \sum_x P(x) \log \frac{P(x)}{Q(x)}" />
      </p>
    </div>
  );
}
