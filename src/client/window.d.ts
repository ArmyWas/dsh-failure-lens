/** Shared window-scoped types for the dsh-failure-lens client entry. */

/**
 * The `window.__ModuleLoader__` surface this plugin's compiled bundle closes
 * over. It is always present when a client plugin bundle executes (the shell
 * constructs the module table before any provider bundle materializes).
 */
export interface DshModuleRequest {
  /** Stable plugin id (the npm package name) stamped into the handoff. */
  readonly id: string
  /** A platform-module require used for react and the ui-slots/runtime chains. */
  readonly factory: (require: (id: string) => unknown) => unknown
}

declare global {
  interface Window {
    __ModuleLoader__?: {
      load(request: DshModuleRequest): void
    }
  }
}
