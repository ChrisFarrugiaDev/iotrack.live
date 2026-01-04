<template>
	<div class="asset-panel" >
		<div class="asset-panel__search">
			<label for="asset-panel-input" class="asset-panel__label">Search Asset</label>
			<input id="asset-panel-input" type="text" class="asset-panel__input"
				placeholder="Search by name, ID or registration" v-model="filterStore.searchFilter">
		</div>

		<div class="asset-panel__list">
			<AssetItem v-for="asset in getAssetsWithDevice" :asset="asset"></AssetItem>
		</div>
	</div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useAssetStore } from '@/stores/assetStore';
import { storeToRefs } from 'pinia';

import AssetItem from './AssetItem.vue';
import { useFilterStore } from '@/stores/filterStore';




// - Store -------------------------------------------------------------

const assetStore = useAssetStore();
const { getAssetsWithDevice } = storeToRefs(assetStore);

const filterStore = useFilterStore();

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>


.asset-panel {
	height: 100%;
	display: flex;
	flex-direction: column;
	color: var(--color-text-2);
	background-color: var(--color-bg-li);

	z-index: 1;

	grid-column: 1 / 2;
	grid-row: 1 / 2;
	flex-shrink: 0;


	&__search {		

		border: 1px solid var(--color-zinc-300);
		margin: .5rem;
		padding: .5rem .75rem;

		background-color: var(--color-bg-li);
		border: 1px solid var(--color-zinc-300);
		border-radius: var(--radius-sm);

		flex-shrink: 0;

		&:focus-within {
			border-color: var(--color-sky-500);
		}

	}

	&__input {
		grid-column: 1 / 2;
		grid-row: 1 / 2;
		background-color: transparent;
		border: none;
		color: var(--color-text-2);
		font-size: 1rem;
		width: 100%;

		background-color: transparent;
		border: none;
		outline: none;

		color: var(--color-text-1);
		font-size: .9rem;
		

	}

	&__label {
		grid-column: 1 / 2;
		grid-row: 1 / 2;
		z-index: 10;		
		font-family: var(--font-display);
		font-weight: 400;
		color: var(--color-text-3);
		margin-bottom: .25rem;	
	}

	&__list {
		flex: 1;
		min-height: 0;

		padding: .5rem;
		// padding-bottom: 4rem; 

		display: flex;
		flex-direction: column;
		gap: 1rem;

		overflow-y: auto;
		overflow-x: hidden;	
		
	}
}


</style>