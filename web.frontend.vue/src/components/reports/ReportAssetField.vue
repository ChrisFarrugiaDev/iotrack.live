<template>
    <div class="asset-field" ref="rootRef">
        <input
            :id="id"
            class="vform__input"
            :class="{ 'vform__input--error': error }"
            :value="selectedLabel"
            :disabled="disabled"
            readonly
            @click="toggle"
        />
        <svg
            v-if="!disabled && modelValue"
            class="asset-field__clear"
            @mousedown.prevent.stop="onSelect('')"
        >
            <use xlink:href="@/ui/svg/sprite.svg#icon-select-x"></use>
        </svg>

        <Teleport to=".dashboard">
            <div
                v-if="isOpen"
                ref="panelRef"
                class="asset-field__panel v-ui"
                :style="panelStyle"
            >
                <input
                    ref="searchRef"
                    v-model="searchQuery"
                    class="asset-field__search"
                    type="text"
                    placeholder="Search assets…"
                    @click.stop
                />
                <div class="asset-field__list">
                <template v-for="node in filteredOptions" :key="node.id">
                    <!-- Branch: org header, pure expand/collapse, never selectable. -->
                    <div
                        v-if="node.children"
                        class="asset-field__row asset-field__row--branch"
                        @click="toggleExpanded(node.id)"
                    >
                        <span>{{ node.label }}</span>
                        <svg
                            class="asset-field__chevron"
                            :class="{ 'asset-field__chevron--open': isExpanded(node.id) }"
                        >
                            <use xlink:href="@/ui/svg/sprite.svg#icon-select-chevron"></use>
                        </svg>
                    </div>
                    <template v-if="node.children && isExpanded(node.id)">
                        <div
                            v-for="leaf in node.children"
                            :key="leaf.id"
                            class="asset-field__row asset-field__row--leaf asset-field__row--indent"
                            :class="{ 'asset-field__row--selected': leaf.id === modelValue }"
                            @click="onSelect(leaf.id)"
                        >
                            {{ leaf.label }}
                        </div>
                    </template>

                    <!-- Leaf at the top level (single-org case, flat list). -->
                    <div
                        v-if="!node.children"
                        class="asset-field__row asset-field__row--leaf"
                        :class="{ 'asset-field__row--selected': node.id === modelValue }"
                        @click="onSelect(node.id)"
                    >
                        {{ node.label }}
                    </div>
                </template>
                <div v-if="!filteredOptions.length" class="asset-field__empty">No matching assets</div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<!--
    This panel is teleported and manually positioned (see below) to float
    above Vview's `overflow: hidden` / `overflow-y: auto` ancestors — the
    same technique ReportDateField.vue uses for its calendar. It used to
    render vue3-treeselect (in `always-open` mode) as the panel's content,
    to sidestep that library's own `appendToBody` option (broken in this
    package version — throws real runtime TypeErrors). That combination
    turned out to be broken too: the teleported Treeselect menu would
    insert into the DOM and then remove itself again on its own a few
    milliseconds later, independent of this component's own open/close
    state (confirmed via instrumented logging — neither this component's
    close() nor its onSelect() fired when it happened). vue3-treeselect
    also warns `Failed to resolve component: transition` on every render,
    the most likely source of that internal misbehavior once mounted
    outside its usual host tree.

    Given the actual UI need here is simple (an org branch header with
    expand/collapse, and a flat list of selectable `id - name` leaves),
    this panel now renders that directly with plain markup instead of
    depending on vue3-treeselect at all.
-->

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { onClickOutside } from '@vueuse/core';

type TreeNode = { id: string; label: string; children?: TreeNode[] };

const props = defineProps<{
    id: string;
    modelValue: string;
    options: TreeNode[];
    disabled?: boolean;
    error?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const rootRef = ref<HTMLElement>();
const panelRef = ref<HTMLElement>();
const searchRef = ref<HTMLInputElement>();
const isOpen = ref(false);
const panelStyle = ref<Record<string, string>>({});
const expandedOrgIds = ref(new Set<string>());
const searchQuery = ref('');

// Branches are shown expanded while searching, regardless of their
// collapsed/expanded state — the whole point of a search is not having to
// expand things by hand to find a match.
function isExpanded(orgId: string): boolean {
    return searchQuery.value.trim() !== '' || expandedOrgIds.value.has(orgId);
}

const filteredOptions = computed<TreeNode[]>(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return props.options;

    const result: TreeNode[] = [];
    for (const node of props.options) {
        if (node.children) {
            const matches = node.children.filter(leaf => leaf.label.toLowerCase().includes(q));
            if (matches.length) result.push({ ...node, children: matches });
        } else if (node.label.toLowerCase().includes(q)) {
            result.push(node);
        }
    }
    return result;
});

/** Depth-first lookup — options may be a flat leaf list (single org) or
 *  org branches with leaf children (multi-org). */
function findLabel(nodes: TreeNode[], id: string): string | null {
    for (const node of nodes) {
        if (node.id === id) return node.label;
        if (node.children) {
            const found = findLabel(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

const selectedLabel = computed(() =>
    props.modelValue ? (findLabel(props.options, props.modelValue) ?? '') : ''
);

function toggleExpanded(orgId: string) {
    if (expandedOrgIds.value.has(orgId)) {
        expandedOrgIds.value.delete(orgId);
    } else {
        expandedOrgIds.value.add(orgId);
    }
    // Replace the Set so the template's reactive read picks up the change.
    expandedOrgIds.value = new Set(expandedOrgIds.value);
}

// Computed and set inline (highest CSS specificity) rather than relying on
// a fixed CSS max-height, so the panel always fits the actual viewport —
// with a large asset list it must scroll internally, never grow past the
// screen's edge with no way to reach the rest of it.
function updatePosition() {
    const rect = rootRef.value?.getBoundingClientRect();
    if (!rect) return;

    const top = rect.bottom + 4;
    const available = window.innerHeight - top - 32;

    panelStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${Math.max(available, 120)}px`,
    };
}

// The listener is capture-phase so it catches scrolling on the page/any
// ancestor (see open()) — which also means it fires for the panel's OWN
// internal scrolling (a scroll event doesn't bubble, but capture-phase
// listeners on window still see it). Ignore those so scrolling the asset
// list doesn't instantly close it.
function closeOnScroll(event: Event) {
    if (panelRef.value && event.target instanceof Node && panelRef.value.contains(event.target)) {
        return;
    }
    isOpen.value = false;
}

function toggle() {
    if (props.disabled) return;
    isOpen.value ? close() : open();
}

async function open() {
    isOpen.value = true;
    await nextTick();
    updatePosition();
    searchRef.value?.focus();

    // Deferred for the same reason as ReportDateField.vue: focusing the
    // (readonly) input can itself trigger a native "scroll into view",
    // which would otherwise fire close-on-scroll the instant it's
    // attached and close the panel it just opened.
    setTimeout(() => {
        if (!isOpen.value) return;
        window.addEventListener('scroll', closeOnScroll, true);
        window.addEventListener('resize', closeOnScroll);
    }, 0);
}

function close() {
    isOpen.value = false;
    searchQuery.value = '';
    window.removeEventListener('scroll', closeOnScroll, true);
    window.removeEventListener('resize', closeOnScroll);
}

/** A branch header never reaches this — only real leaf rows and the
 *  clear icon's explicit '' call onSelect — so it's also the right
 *  moment to close: a single-pick field has nothing left to adjust. */
function onSelect(value: string) {
    emit('update:modelValue', value);
    close();
}

onClickOutside(rootRef, close, { ignore: [panelRef] });

onBeforeUnmount(() => {
    window.removeEventListener('scroll', closeOnScroll, true);
    window.removeEventListener('resize', closeOnScroll);
});
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
.asset-field {
    position: relative;
    height: 100%;
}

.asset-field__clear {
    position: absolute;
    top: 0;
    bottom: 0;
    right: .5rem;
    width: 20px;
    height: 20px;
    margin: auto 0;
    fill: currentColor;
    color: var(--color-text-1);
    cursor: pointer;
}

.asset-field__panel {
    z-index: 2000;
    // Fallback cap — the real, viewport-aware value is set inline via
    // panelStyle (see updatePosition()) and always wins over this.
    max-height: 20rem;
    overflow-y: auto !important;
    background: var(--color-bg-hi);
    border: 1px solid var(--color-zinc-300);
    border-radius: var(--radius-md, 0.375rem);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .12);
}

// Sticky within the panel's own scroll, so it stays put while the list
// beneath it scrolls — same background as the panel so scrolled rows
// don't show through underneath it.
.asset-field__search {
    position: sticky;
    top: 0;
    z-index: 1;
    display: block;
    width: 100%;
    padding: .6rem 1rem;
    border: none;
    border-bottom: 1px solid var(--color-zinc-300);
    background: var(--color-bg-hi);
    color: var(--color-text-1);
    font-family: var(--font-primary);
    font-size: .95rem;
    outline: none;

    &:focus {
        border-bottom-color: var(--color-blue-500);
    }
}

.asset-field__list {
    padding: .25rem 0;
}

.asset-field__empty {
    padding: .6rem 1rem;
    color: var(--color-text-1);
    opacity: .6;
    font-family: var(--font-primary);
    font-size: .95rem;
}

.asset-field__row {
    padding: .6rem 1rem;
    color: var(--color-text-1);
    font-family: var(--font-primary);
    font-size: .95rem;
    cursor: pointer;

    &:hover {
        background: rgba(59, 130, 246, .12);
    }
}

.asset-field__row--branch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
}

.asset-field__row--indent {
    padding-left: 2rem;
}

.asset-field__row--selected {
    background: rgba(59, 130, 246, .08);
}

.asset-field__chevron {
    width: 16px;
    height: 16px;
    fill: currentColor;
    transition: transform .15s ease;
}

.asset-field__chevron--open {
    transform: rotate(180deg);
}
</style>
