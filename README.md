# Distribution-Aware Analytics Engine

A data analysis platform focused on **comparing, monitoring, and explaining differences between data distributions**, rather than relying solely on point estimates or summary statistics.

This project is designed for high-dimensional, real-world data where understanding how and why distributions differ is more important than simple averages or regressions.

---

## Motivation

Most analytics tools only answer simple questions like:

- What is the mean?
- What is the trend?
- What is the correlation?

We want to dig deeper to understand

- How have two datasets _structurally_ changed?
- Which features actually drive distributional differences?
- Is a dataset drifting over time in a meaningful way?

The goal is to provide **distribution-first analytics** that are interpretable, extensible, and mathematically grounded.

---

## Core Capabilities

### 1. Distribution Comparison

- Compare two datasets using multiple statistical distance metrics
- Support for both low- and high-dimensional data
- Clear interpretation guidance for each metric

### 2. Feature-Level Attribution

- Identify which dimensions contribute most to distributional differences
- Projection-based and sensitivity-based explanations

### 3. Temporal Drift Detection

- Monitor evolving datasets
- Detect statistically significant changes over time
- Optional alerting and reporting

### 4. Visualization

- Distribution overlays
- Learned 1D projections
- Distance and drift summaries

---

## Intended Use Cases

- Data quality monitoring for ML pipelines
- Quantitative research and exploratory analysis
- Scientific and healthcare datasets
- Strategy robustness analysis in finance

This tool prioritizes **correctness and interpretability**.

---

## Project Structure

.
├── backend/
│ ├── api/ # API routes and request handling
│ ├── core/ # Core analytics logic (metrics, comparisons)
│ ├── models/ # Data abstractions and schemas
│ ├── services/ # Orchestration, caching, background jobs
│ └── utils/ # Shared helpers
│
├── frontend/
│ ├── components/ # UI components
│ ├── pages/ # Application pages
│ ├── charts/ # Visualization logic
│ └── hooks/ # Data-fetching and state hooks
│
├── experiments/ # Prototypes, notebooks, metric exploration
├── tests/ # Unit and integration tests
├── docs/ # Design notes and technical documentation
├── claude.md # AI usage and collaboration guidelines
└── README.md

---

## Design Principles

- **Distribution-first**: No feature exists without a clear distributional interpretation
- **Explicit over implicit**: Avoid silent assumptions or hidden defaults
- **Composable metrics**: Metrics should be modular and comparable
- **Human-readable outputs**: Every result should be explainable in plain language

---

## Non-Goals (For Now)

- End-to-end AutoML
- Black-box predictions
- One-click “magic” insights without explanation

---

## Status

Early-stage design and prototyping. APIs, metrics, and interfaces are expected to evolve rapidly.

---

## License

TBD
