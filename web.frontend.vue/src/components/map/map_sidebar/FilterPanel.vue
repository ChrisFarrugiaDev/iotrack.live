<template>
	<div class="filter-panel">

		<!-- Organisation -->
		<FilterSection :title="'Organisation'" :options="getOrgFilterOptions"
			:deselected-options="filterStore.deselectedOrgIDs"
			@deselected-options-changed="filterStore.setDeselectedOrgIDs($event)"></FilterSection>

		<FilterSection :title="'Asset type'" :options="getAssetTypeFilterOptions"
			:deselected-options="filterStore.deselectedAssetTypes"
			@deselected-options-changed="filterStore.setDeselectedAssetTypes($event)"></FilterSection>



		<!-- Last Updated -->
		<section class="filter-panel__section">

			<div class="filter-panel__title">
				<span>Activity</span>
			</div>

			<ul class="filter-panel__list">
				<li class="filter-panel__option" @click="filterStore.setActivityMode('none')">
					<svg class="filter-panel__radio">
						<use href="@/ui/svg/sprite.svg#icon-radio-active" v-if="filterStore.activityMode === 'none'" />
						<use href="@/ui/svg/sprite.svg#icon-radio-passive" v-else />
					</svg>
					<span class="filter-panel__text">No activity filter</span>
				</li>
				<li class="filter-panel__option" @click="filterStore.setActivityMode('inactive')">
					<svg class="filter-panel__radio">
						<use href="@/ui/svg/sprite.svg#icon-radio-active" v-if="filterStore.activityMode === 'inactive'" />
						<use href="@/ui/svg/sprite.svg#icon-radio-passive" v-else />
					</svg>
					<span class="filter-panel__text">Inactive since</span>
				</li>
				<li class="filter-panel__option" @click="filterStore.setActivityMode('active')">
					<svg class="filter-panel__radio">
						<use href="@/ui/svg/sprite.svg#icon-radio-active" v-if="filterStore.activityMode === 'active'" />
						<use href="@/ui/svg/sprite.svg#icon-radio-passive" v-else />
					</svg>
					<span class="filter-panel__text">Active since</span>
				</li>

			</ul>

			<div class="fdate">
				<VDatePicker v-model="filterStore.activityDateISO" expanded borderless transparent :timezone="timezone" ></VDatePicker>
			</div>
		</section>
	</div>
</template>



<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useOrganisationStore } from '@/stores/organisationStore';
import FilterSection from './FilterSection.vue';
import { computed, ref, watch } from 'vue';
import { useFilterStore } from '@/stores/filterStore';

// - Store -------------------------------------------------------------

const orgStore = useOrganisationStore();
const filterStore = useFilterStore();


// - Data --------------------------------------------------------------

const timezone = ref('Europe/Malta');


// - Computed ----------------------------------------------------------

const getOrgFilterOptions = computed(() => {
	const organisations = orgStore.getOrganisationScope
	if (!organisations) return []

	return Object.values(organisations).map(el => ({
		id: el.id,
		name: el.name,
	}))
});

const getAssetTypeFilterOptions = computed(() => {

	return [
		{ id: 'vehicle', name: 'Vehicle' },
		{ id: 'asset', name: 'Asset' },
		{ id: 'personal', name: 'Personal' },
	]
});


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.filter-panel {

	height: 100%;
	width: 100%;
	background-color: var(--color-bg-li);

	color: var(--color-text-2);
	font-family: var(--font-action);

	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: .75rem;

	grid-column: 1 / 2;
	grid-row: 1 / 2;

	&__section {
		display: flex;
		flex-direction: column;
		
		padding: .5rem;

		border: 1px solid var(--color-zinc-300);
		border-radius: var(--radius-sm);
		
	}

	&__title {
		display: flex;
		align-items: center;
		justify-content: space-between;

		font-family: var(--font-display);
		font-size: .8rem;
		font-weight: 500;
		color: var(--color-text-2);


		cursor: pointer;
		user-select: none;
	}

	&__list {
		display: flex;
		flex-direction: column;
		gap: .25rem;
	}

	&__option {
		display: flex;
		align-items: center;
		gap: .5rem;

		padding: .35rem .5rem;
		border-radius: var(--radius-sm);

		cursor: pointer;
		user-select: none;

		&:hover {
			background-color: var(--color-bg-hover);
		}
	}

	&__option--active {
		color: var(--color-text-1);
		font-weight: 500;

		.filter-panel__radio {
			fill: var(--color-primary);
		}
	}

	&__radio {
		width: .7rem;
		height: .7rem;
		fill: var(--color-zinc-600);
		flex-shrink: 0;
	}

	&__text {
		font-size: .85rem;
	}
}
</style>

<style>
.fdate {

	.vc-title,
	.vc-arrow,
	.vc-nav-item,
	.vc-nav-title,
	.vc-nav-arrow {
		background-color: transparent !important;
	}



	.vc-popover-content.direction-bottom {
		background-color: var(--color-zinc-100);
		border-color: var(--color-zinc-300);
	}

	.vc-weekday {
		color: var(--color-sky-500);
	}

	.vc-title {
		span {
			color: var(--color-zinc-800);
		}
	}

	.vc-light.vc-attr,
	.vc-light .vc-attr {
		--vc-content-color: var(--color-sky-500);
		--vc-highlight-outline-bg: var(--color-white);
		--vc-highlight-outline-border: var(--color-sky-500);
		--vc-highlight-outline-content-color: var(--color-blue-700);
		--vc-highlight-light-bg: var(--color-blue-200);
		--vc-highlight-light-content-color: var(--color-blue-900);
		--vc-highlight-solid-bg: var(--color-sky-500);
		--vc-highlight-solid-content-color: var(--color-white);
		--vc-dot-bg: var(--color-sky-500);
		--vc-bar-bg: var(--color-sky-500);
	}

	.vc-day-content,
	.vc-nav-item,
	.vc-nav-item.is-active {
		color: var(--color-zinc-600);
	}

	.vc-nav-item.is-current,
	.vc-highlight-content-solid {
		color: var(--color-zinc-900);
	}

	.vc-focus:focus-within,
	.vc-nav-item.vc-focus.is-active {
		border: var(--color-sky-500) 2px solid !important;
		box-shadow: none;
	}

	/* .vc-time-weekday { color: var(--color-zinc-400); }
	.vc-time-year { color: var(--color-zinc-600); }
	.vc-time-month, .vc-time-day { color: var(--color-sky-500); }
	.vc-time-select-group {
		background-color: var(--color-zinc-100);
		border-color: var(--color-zinc-300);

		svg {
			color: var(--color-sky-500);
		}
	}
	.vc-base-select select:hover {
		background-color: var(--color-zinc-200);
	}
	.vc-base-select select {
		color: var(--color-zinc-800);
		border-color: var(--color-zinc-300);

		option {
					color:var(--color-zinc-800);
					background-color: var(--color-zinc-100);
					
	
		}
	} */
}
</style>