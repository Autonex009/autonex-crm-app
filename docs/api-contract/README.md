# API contract snapshot

`API.md` here is a **copy** of `docs/API.md` from `autonex-crm-api`, pinned at the
version this frontend was last verified against.

It exists because the two repositories have no compiler between them. The
`api-contract` job in CI fetches the live file and fails when it differs, so a
backend change surfaces as a red build rather than as a runtime error in
production.

When the check fails:

1. Read the diff in the job output.
2. Update `packages/types` and any affected resource module.
3. Copy the new file over this one to acknowledge the change.

The backend's copy is authoritative. Never edit this one to make CI pass without
doing step 2.
