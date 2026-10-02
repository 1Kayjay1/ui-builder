# Application-state integrity

No UI theater. “Saving…” must correspond to a real mutation. Upload progress should be measured when technically available or honestly indeterminate. Optimistic changes need a failure rollback path. Disabled states need a real reason. Loading placeholders must not imply fake data. Audit async races, reachable errors, and accessible announcements. Design quality includes truthfulness about system state.
