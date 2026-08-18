import { createElement } from 'react'

/** Minimal semantic stand-in; StateDot itself belongs to Harness and is not under test. */
export function StateDot({ state }: { state: string }) {
  return createElement('span', { 'data-state-dot': state, 'aria-hidden': true })
}
