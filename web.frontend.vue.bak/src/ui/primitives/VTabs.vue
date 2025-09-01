<template>
    <div class="vtabs" role="tablist">
        <!-- Render each tab as a button. 'is-active' class marks the selected tab. -->
        <button
            v-for="(label, key) in tabs"
            :key="key"
            type="button"
            class="vtabs__item"
			:class="{'is-active': key== activeTab}"
            :aria-selected="activeTab === key"
            :tabindex="activeTab === key ? 0 : -1"
            role="tab"
            @click="onClick(key)"
        >
            {{ label }}
        </button>

        <!-- Flexible underline spacer (desktop only, see SCSS) -->
        <span class="vtabs__spacer" aria-hidden="true"></span>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

// - Emits -------------------------------------------------------------
const emit = defineEmits<{ (e: 'setActiveTab', tab: string): void }>();

// - Props -------------------------------------------------------------
const props = withDefaults(defineProps<{
    // vtabsObjectData: { tabs: Record<string, string>; activeTab: string };
	tabs:Record<string, string>,
	activeTab: string
    isDisabled?: boolean;
}>(), {
    isDisabled: false
});


// - Methods -----------------------------------------------------------
/** Handles click on tab. Emits setActiveTab unless disabled */
function onClick(tab: string) {
    if (!props.isDisabled) emit('setActiveTab', tab);
}
</script>


<!-- --------------------------------------------------------------- -->
<style scoped lang="scss">$vtabs-breakpoint: 600px;

.vtabs {
  display: flex;
  flex-direction: column;

  // Desktop layout
  @media (min-width: $vtabs-breakpoint) {
    flex-direction: row;
    align-items: stretch;
  }

  // Tab item styles
  &__item {
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 400;
    color: var(--color-zinc-400);
    text-align: left;
    text-wrap: nowrap;
    appearance: none;
    background: var(--color-bg-li);
    padding: 5px 1rem;
    border: 1px solid var(--color-zinc-400);
    transition: background-color .15s, color .15s, border-color .15s;

    // Remove border between vertically stacked tabs
    &:not(:last-of-type) {
      border-bottom: none;
    }

    // --- ACTIVE TAB STATE ---
    &.is-active,
    &.is-active:hover,
    &.is-active:focus,
    &.is-active:active {
      color: var(--color-zinc-50);
      background-color: var(--color-zinc-400);
      border-color: var(--color-zinc-400);
      transition: none; // prevent flick on class change
    }

    // Only non-active tabs get hover effect
    &:not(.is-active):hover {
      color: var(--color-zinc-800);
      background-color: var(--color-blue-200);
      border-color: var(--color-zinc-800);

      // Add seam with next tab on hover
      & + .vtabs__item {
        border-top: 1px solid var(--color-zinc-800);
      }
    }

    // Prevent click/focus ring flicker for already-selected tab
    &[aria-selected="true"] {
      pointer-events: none;
    }

    // Accessible focus ring
    &:focus-visible {
      outline: 2px solid var(--color-blue-400);
      outline-offset: 2px;
    }

    // --- DESKTOP OVERRIDES ---
    @media (min-width: $vtabs-breakpoint) {
      min-width: 11rem;
      display: flex;
      justify-content: center;
      font-size: .9rem;
      padding: 5px 0.5rem;

      &:not(:last-of-type) {
        border-right: none;
        border-bottom: 1px solid var(--color-zinc-400);
      }

      &:not(.is-active):hover {
        border-bottom: 1px solid var(--color-zinc-800) !important;
        & + .vtabs__item {
          border-left: 1px solid var(--color-zinc-800);
          border-top: 1px solid var(--color-zinc-400);
        }
      }
    }
  }

  // --- FLEX SPACER FOR DESKTOP ---
  &__spacer {
    display: none;
    @media (min-width: $vtabs-breakpoint) {
      display: block;
      flex: 1;
      border-bottom: 1px solid var(--color-zinc-400) !important;
    }
  }
}

</style>
