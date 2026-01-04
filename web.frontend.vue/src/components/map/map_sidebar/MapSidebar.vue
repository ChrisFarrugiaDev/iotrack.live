<template>
	<div class="mapsidebar v-ui" :data-theme="getSidebarTheme" :class="{ 'mapsidebar__is-closed': !isOpen }">
		<div class="mapsidebar__btns">

			<button class="mapsidebar__btn is-active" @click="activePanel = 'assetPanel'">
				<svg>
					<use xlink:href="@/ui/svg/sprite.svg#icon-user-2" />
				</svg>
				<span>Assets</span>
			</button>

			<button class="mapsidebar__btn" @click="activePanel = 'filterPanel'">
				<svg>
					<use xlink:href="@/ui/svg/sprite.svg#icon-filter" />
				</svg>
				<span>Filters</span>
			</button>
		</div>

		<div class="mapsidebar__panel">
			<AssetPanel :class="{ 'active-panel': activePanel == 'assetPanel' }"></AssetPanel>
			<FilterPanel :class="{ 'active-panel': activePanel == 'filterPanel' }"></FilterPanel>
		</div>

		<div class="mapsidebar__toggle" @click="isOpen = !isOpen">
				<svg>
					<use xlink:href="@/ui/svg/sprite.svg#icon-chevron-left" />
				</svg>
		</div>

	</div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboardStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import AssetPanel from './AssetPanel.vue';
import FilterPanel from './FilterPanel.vue';

// - store -------------------------------------------------------------
const { getTheme } = storeToRefs(useDashboardStore());

// - data --------------------------------------------------------------

const activePanel = ref("assetPanel");
const isOpen = ref(true);


// - computed ----------------------------------------------------------

// theme
const getSidebarTheme = computed(() => (getTheme.value === 'light' ? 'light' : 'dark'));


// - methods -----------------------------------------------------------
// responsive default
onMounted(() => {
	const isSmallScreen = window.innerWidth <= 1024;
	isOpen.value = !isSmallScreen;
});

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly

.active-panel {
	z-index: 10 !important;
}

.mapsidebar {
	position: absolute;
	top: 1rem;
	right: 0;
	bottom: 1rem;

	display: flex;
	flex-direction: column;
	overflow: visible;

	width: 20rem;
	background-color: var(--color-bg-li);

	border: 1px solid var(--color-zinc-300);
	border-right: none;
	border-top-left-radius: var(--radius-md);
	border-bottom-left-radius: var(--radius-md);

	transition: transform 0.2s ease;

	/* -------------------------------
	   Closed state
	-------------------------------- */
	&__is-closed {
		transform: translateX(19.5rem);
	}

	/* -------------------------------
	   Open / Close handle
	-------------------------------- */
	&__toggle {
		position: absolute;
		top: 3.9rem;
		left: -1.75rem;

		display: flex;
		align-items: center;
		justify-content: center;

		width: 1.75rem;
		height: 2.75rem;
		padding: 4px 2px 4px 6px;

		cursor: pointer;
		color: var(--color-zinc-400);
		background-color: var(--color-bg-li);

		border: 1px solid var(--color-zinc-300);
		border-right: none;
		border-top-left-radius: var(--radius-md);
		border-bottom-left-radius: var(--radius-md);

		transition: color 0.1s ease;

		&:hover {
			color: var(--color-zinc-700);
		}

		svg {
			width: 1.6rem;
			height: 1.6rem;

			fill: currentColor;
			transform: scaleX(-1);
			transition: transform 0.2s ease;
		}
	}

	/* -------------------------------
	   Closed state adjustments
	-------------------------------- */
	&__is-closed.mapsidebar__is-closed {
		.mapsidebar__toggle {
			padding: 4px;

			svg {
				transform: scaleX(1) !important;
			}
		}
	}

	/* -------------------------------
	   Panels
	-------------------------------- */
	&__panel {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	/* -------------------------------
	   Top buttons
	-------------------------------- */
	&__btns {
		display: flex;
		gap: 6px;
		flex-shrink: 0;

		margin: 0 8px;
		padding: 6px 0;

		border-bottom: 1px solid var(--color-zinc-300);
	}

	&__btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;

		padding: 4px 10px;

		background: transparent;
		border: none;
		border-radius: var(--radius-sm);

		cursor: pointer;
		color: var(--color-zinc-800);

		font-family: var(--font-primary);
		font-size: 0.85rem;

		svg {
			width: 1.2rem;
			height: 1.2rem;
			fill: currentColor;
		}

		&:hover {
			color: var(--color-zinc-200);
			background-color: var(--color-zinc-700);
		}
	}
}

</style>