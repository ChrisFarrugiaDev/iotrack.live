import { computed } from 'vue';

export function useVueSelectStyles() {
  return computed(() => ({
    '--vs-min-height': '4rem',
    '--vs-padding': '1.9rem 0.5rem 0.5rem 0.5rem',
    '--vs-background-color': 'var(--color-bg-hi)',
    '--vs-text-color': 'var(--color-text-1)',
    '--vs-border': '1px solid var(--color-zinc-300)',
    '--vs-border-radius': 'var(--radius-md, 0.375rem)',
    '--vs-font-weight': '300',
    '--vs-font-size': '1rem',
    '--vs-font-family': 'var(--font-mono)',
    '--vs-outline-width': '0',
    '--vs-outline-color': 'none',
    '--vs-menu-z-index': '2000',
    '--vs-option-selected-background-color': 'var(--color-blue-400)',
    '--vs-option-disabled-background-color': 'var(--color-zinc-200)',
    '--vs-option-focused-text-color': 'var(--color-text-1)',
    '--vs-option-focused-background-color': 'var(--color-blue-100)',
    '--vs-option-hover-background-color': 'var(--color-blue-100)',
    '--vs-option-background-color': 'var(--color-white)',
    '--vs-option-text-color': 'var(--color-text-1)',
    '--vs-option-selected-text-color': 'var(--color-text-1)',
    '--vs-option-hover-text-color': 'var(--color-text-1)',
    '--vs-indicator-icon-color': 'var(--color-text-1)',
  }));
}
