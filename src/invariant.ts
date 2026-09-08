/**
 * Package-owned invariant companion for the dsh-failure-lens plugin.
 *
 * There is no runtime invariant to install for the V0.3 browser plugin: it
 * contributes one Conversation Definition, one keyed renderer, and two locale
 * dictionaries, all effect-owned and proven by tests. The classifier is a pure
 * function with no shared runtime state. This companion exists so the Host's
 * package-invariant gate can reserve package ownership like every other client
 * plugin.
 */

/** Full npm package name this companion owns. */
const PACKAGE_NAME = 'dsh-failure-lens'

/** Cordis companion plugin name. */
export const name = 'dsh-failure-lens-invariant'

/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/** No-op installer: the V0.3 surface raises no runtime invariant. */
const install = (): void => {}

/** Register this package's invariant companion. */
export function apply(ctx: {
  readonly invariants: { register(pkg: string, installer: () => void): () => void }
}): void {
  ctx.invariants.register(PACKAGE_NAME, install)
}
