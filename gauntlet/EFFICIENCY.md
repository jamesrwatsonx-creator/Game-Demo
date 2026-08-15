# Efficiency & Resource Log

The objective is to learn where intelligence and execution created value, where it arrived too early, and where it consumed resources without consequence.

## Work classification

| ID | Phase | Work/research/tool activity | Classification | Decision/confidence affected | Downstream consequence | Better timing/approach |
|---|---|---|---|---|---|---|

Classifications:
- **Decision-changing**
- **Confidence-changing**
- **Premature**
- **Waste**

## Observable telemetry

| Phase | Model | Calls | Input tokens | Output tokens | Tool calls | Elapsed time | Retries | Cost | Outcome |
|---|---|---:|---:|---:|---:|---|---:|---:|---|

Use `not observable` where the harness does not expose exact telemetry. Never invent token counts, elapsed time, or cost.

## Resource conclusions

At major milestones, note only evidence-supported conclusions about:
- work that prevented expensive rebuilds;
- analysis that should have been delayed until a prototype existed;
- repeated work caused by missing context/capability;
- opportunities to reduce expected total search/build cost.