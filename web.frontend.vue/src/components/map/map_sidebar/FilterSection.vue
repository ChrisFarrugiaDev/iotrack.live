<template>
	<div class="filter-section__section " :class="{ 'filter-section__section--open': isOpen }">
		<div class="filter-section__title" @click="isOpen = !isOpen">
			<span>{{ props.title }}</span>
			<svg class="filter-section__chevron">
				<use href="@/ui/svg/sprite.svg#triangle-1" />
			</svg>
		</div>

		<ul class="filter-section__list">
			<div class="filter-section__list-inner">

				<li class="filter-section__option"></li>

				<li class="filter-section__option" @click="selectAll">
					<svg class="filter-section__radio">
						<use href="@/ui/svg/sprite.svg#icon-radio-passive" v-if="isAllSelected"/>
						<use href="@/ui/svg/sprite.svg#icon-radio-active" v-else />
					</svg>
					<span class="filter-section__text">All</span>
				</li>

				<li class="filter-section__option" v-for="option in props.options" @click="toggleOption(option.id)">
					<svg class="filter-section__radio">
						<use href="@/ui/svg/sprite.svg#icon-radio-passive" v-if="isDeselected(option.id)"/>
						<use href="@/ui/svg/sprite.svg#icon-radio-active" v-else />
					</svg>
					<span class="filter-section__text">{{ option.name }}</span>
				</li>

			</div>
		</ul>
	</div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { options } from 'floating-vue';
import { compile, computed, ref, watch } from 'vue';




// - Props & Emits -----------------------------------------------------
const props = defineProps<{
	title: string
	options: {id: string | number, name: string}[];
	deselectedOptions : (string | number)[];
}>();

const emit = defineEmits<{
	(e: 'deselected-options-changed', value: (string | number)[]): void
}> ()

// - Data --------------------------------------------------------------
const isOpen = ref(false);

const isAllSelected = computed(() => {
	return props.deselectedOptions.length !== 0;
})

// - Methods -----------------------------------------------------------
function isDeselected(id: string | number) {
	return props.deselectedOptions.includes(id);
}

function selectAll() {
	if (props.deselectedOptions.length) {
		emit('deselected-options-changed', []);
	} else {
		const payload = props.options.map(option => option.id);
		emit('deselected-options-changed', payload)
	}
	
}



function toggleOption(id: string | number) {
	const next = [...props.deselectedOptions];
	const index = next.findIndex(oo => oo == id);

	if (index == -1 ) {
		next.push(id);
	} else {
		next.splice(index, 1);
	}

	emit('deselected-options-changed', next);
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.filter-section {
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

	&__chevron {
		width: .55rem;
		height: .55rem;
		fill: currentColor;

		transform: rotate(-90deg);
		transition: transform .15s ease;
	}

	&__section--open &__chevron {
		transform: rotate(0deg);
	}


	&__list {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.2s ease;
		overflow: hidden;
	}

	&__section--open &__list {
		grid-template-rows: 1fr;
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