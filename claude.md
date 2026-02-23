# AI Collaboration Guidelines (Claude.md)

This file defines how AI coding tools should be used in this project.

AI is a **coding assistant**, not an architect or decision-maker.

---

## What AI Is Allowed To Do

AI tools may be used to:

- Scaffold boilerplate code
- Generate initial API endpoints
- Write frontend components and layouts
- Suggest file structures
- Implement well-specified functions
- Translate clear mathematical definitions into code
- Write tests for already-defined behavior
- Refactor code for readability or performance (with review)

---

## What AI Must NOT Decide

AI tools should NOT:

- Choose statistical metrics without justification
- Define mathematical assumptions
- Decide defaults for thresholds or significance
- Interpret results or label outcomes
- Design system-level architecture independently
- Introduce heuristics without explanation

If a decision affects **correctness, interpretation, or scientific validity**, it must be human-authored.

---

## Required Context for AI Requests

When asking AI to write code, always provide:

1. Clear input/output expectations
2. Assumptions about data shape and constraints
3. Performance expectations (dataset sizes, latency)
4. Failure modes or edge cases to consider

Example:

> “Implement this metric assuming data is already normalized and missing values are removed. Do not add preprocessing.”

---

## Style Guidelines

- Prefer explicit variable names over short ones
- Avoid hidden global state
- Functions should be pure where possible
- Raise errors loudly rather than silently correcting inputs
- Include docstrings explaining _why_, not just _what_

---

## Mathematical Integrity Rule

If the math is unclear, **do not write code yet**.

Instead:

1. Write a design note in `/docs/`
2. Define assumptions and limitations
3. Then translate into code

Code should never be the place where math decisions are made.

---

## Trust but Verify

All AI-generated code must be:

- Read
- Understood
- Tested

If you cannot explain the code to another human, it does not belong in the project.

---

## Goal of Using AI

The goal is not speed.

The goal is:

- Higher-quality abstractions
- Faster iteration on non-core work
- More time spent on modeling and reasoning
