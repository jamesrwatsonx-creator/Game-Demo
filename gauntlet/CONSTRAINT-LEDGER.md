# Constraint Ledger

The current dependency-aware constraint state for the game.

| ID | Claim | Type | Evidence | Confidence | Dependencies | Falsifier | Status | Affected branches |
|---|---|---|---|---:|---|---|---|---|

## Status vocabulary

`proposed` · `active` · `supported` · `weakened` · `falsified` · `superseded` · `unresolved`

When a claim breaks, invalidate only downstream branches that actually depend on it. Record the invalidation rather than restarting unrelated work.