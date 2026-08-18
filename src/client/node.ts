/**
 * Node-half plugin body for the dsh-failure-lens browser plugin.
 *
 * The feature is entirely browser-side: the node half is the minimal cordis
 * entry required for loading, exactly like the official ui-workflow-run node
 * half (an empty `apply`). The durable event (tool/result seq 24071) already
 * exists in the session log; this plugin only observes it from the client.
 */

/** Host plugin body; the feature is entirely browser-side. */
export function apply(): void {}
