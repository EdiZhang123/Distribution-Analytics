import React, { useEffect, useRef } from "react";
import katex from "katex";

/**
 * Renders a LaTeX math string inline using KaTeX.
 *
 * Renders in display mode when `block` is true (centered, full-width),
 * otherwise renders inline. Raises a visible error string if KaTeX fails
 * to parse, rather than silently swallowing the error.
 *
 * @param {string}  math    - LaTeX math string (without delimiters)
 * @param {boolean} block   - If true, render as a display block
 */
export default function LatexRenderer({ math, block = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      katex.render(math, containerRef.current, {
        displayMode: block,
        throwOnError: true,
        strict: false,
      });
    } catch (error) {
      containerRef.current.textContent = `[LaTeX error: ${error.message}]`;
      containerRef.current.style.color = "red";
    }
  }, [math, block]);

  return (
    <span
      ref={containerRef}
      style={block ? { display: "block", margin: "1rem 0" } : { display: "inline" }}
    />
  );
}
