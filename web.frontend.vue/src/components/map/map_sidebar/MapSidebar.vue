<template>
	<div class="mapsidebar v-ui" :data-theme="getSidebarTheme">
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
			<AssetPanel  :class="{'active-panel': activePanel == 'assetPanel'}"  ></AssetPanel>
			<FilterPanel :class="{'active-panel': activePanel == 'filterPanel'}"></FilterPanel>	
		</div>

	</div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboardStore';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import AssetPanel from './AssetPanel.vue';
import FilterPanel from './FilterPanel.vue';

// - store -------------------------------------------------------------
const { getTheme } = storeToRefs(useDashboardStore());

// - data --------------------------------------------------------------

const activePanel = ref("assetPanel");


// - computed ----------------------------------------------------------

// theme
const getSidebarTheme = computed(() => (getTheme.value === 'light' ? 'light' : 'dark'))

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly

.active-panel {
	z-index: 10 !important;
}

.mapsidebar {
	position: absolute;
	right: 0;
	top: 1rem;
	bottom: 1rem;

	width: 20rem;
	background-color: var(--color-bg-li);

	border: 1px solid var(--color-zinc-300);

	border-right: none;

	border-top-left-radius: var(--radius-md);
	border-bottom-left-radius: var(--radius-md);

	display: flex;
	flex-direction: column;


	&__panel {
		 display: grid;
		 grid-template-columns: 1fr;
		 grid-template-rows: 1fr;
	}
}

.mapsidebar__btns {
	display: flex;
	gap: 6px;
	flex-shrink: 0;

	padding: 6px 8px;
	border-bottom: 1px solid var(--color-zinc-300);
}

.mapsidebar__btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;

	padding: 4px 10px;

	background: transparent;
	border: none;
	border-radius: var(--radius-sm);

	color: var(--color-zinc-800);
	font-family: var(--font-primary);
	font-size: 0.85rem;

	cursor: pointer;

	svg {
		width: 1.2rem;
		height: 1.2rem;
		fill: currentColor;
	}

	&:hover {
		background-color: var(--color-zinc-700);
		;
		color: var(--color-zinc-200);
	}


}
</style>