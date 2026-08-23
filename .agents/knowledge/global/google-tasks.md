# Google Tasks Commands

Google Tasks creation is confirmation-gated. `create_task` creates one item; `create_tasks` creates a list of 1–20 independent items after one confirmation.

Batch creation is sequential because the Google Tasks API has no multi-item transaction. The result retains per-item successes and failures, so a partial failure never hides already-created tasks.

Telegram routes `/tasks` and `/task` list pending Tasks. Task-list language is routed to `create_tasks` when two or more independent items are named.
