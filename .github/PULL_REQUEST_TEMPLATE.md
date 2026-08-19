## What changed

Describe the observed Harness behavior and why this is the narrowest useful
change.

## Validation

- [ ] `npm run check`
- [ ] Matching behavior has a focused positive or negative fixture
- [ ] The installed Web presentation was checked when UI output changed
- [ ] Documentation matches the shipped signature and evidence boundary
- [ ] Fixtures and screenshots contain no credentials or identifying data

## Safety boundary

- [ ] The plugin remains read-only and deterministic
- [ ] Raw tool output and durable session events are not modified
- [ ] No model call, telemetry, auto-approval, command retry, or DOM patch was added
