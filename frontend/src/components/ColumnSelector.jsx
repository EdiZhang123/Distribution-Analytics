import React from "react";

const AXIS_LABELS = ["X", "Y", "Z"];

/**
 * Checkbox-based column selector with ordered axis badges.
 *
 * Selection order is preserved: the first column selected becomes X,
 * second becomes Y, third becomes Z. When a column is deselected the
 * remaining columns shift down to fill the gap.
 *
 * @param {string[]}   columns          - Available column names
 * @param {string[]}   selectedColumns  - Currently selected columns (ordered)
 * @param {Function}   onChange         - Called with the new ordered array
 * @param {number}     maxColumns       - Maximum selectable columns (1-3)
 */
export default function ColumnSelector({
  columns,
  selectedColumns,
  onChange,
  maxColumns = 3,
}) {
  const atMax = selectedColumns.length >= maxColumns;

  function handleToggle(col) {
    const idx = selectedColumns.indexOf(col);
    if (idx !== -1) {
      // Deselect — remove and let remaining columns shift down
      const next = selectedColumns.filter((c) => c !== col);
      onChange(next);
    } else if (!atMax) {
      onChange([...selectedColumns, col]);
    }
  }

  const hintText =
    maxColumns === 1
      ? "Select 1 column for histogram"
      : `Select any 1\u20133 columns: 1 = histogram, 2 = 2D scatter, 3 = 3D scatter`;

  return (
    <div className="column-selector">
      <p className="column-selector__hint">{hintText}</p>
      <ul className="column-selector__list">
        {columns.map((col) => {
          const selectionIndex = selectedColumns.indexOf(col);
          const isSelected = selectionIndex !== -1;
          const isDisabled = !isSelected && atMax;

          let className = "column-selector__item";
          if (isSelected) className += " column-selector__item--selected";
          if (isDisabled) className += " column-selector__item--disabled";

          return (
            <li
              key={col}
              className={className}
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={0}
              onClick={() => !isDisabled && handleToggle(col)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                  e.preventDefault();
                  handleToggle(col);
                }
              }}
            >
              {isSelected && (
                <span className="column-selector__axis-badge">
                  {AXIS_LABELS[selectionIndex]}
                </span>
              )}
              {col}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
