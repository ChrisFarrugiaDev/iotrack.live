/**
 * Per-instance select overrides.
 *
 * The base `--vs-*` tokens are CSS, on `.v-ui` (see `ui/components/_form.scss`).
 * Only state that varies per select belongs here — an inline style would not
 * reach a teleported menu.
 */
export const selectErrorStyle = (hasError: boolean) =>
  hasError
    ? {
        '--vs-border': '1px solid var(--color-orange-500)',
        '--vs-outline-color': 'var(--color-orange-500)',
      }
    : {};
