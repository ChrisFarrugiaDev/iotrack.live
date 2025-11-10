<template>
	<nav class="vpager" aria-label="Pagination navigation">
		<!-- Prev -->
		<button class="vpager__btn vpager__btn--nav" :disabled="page === 1" @click="go(page - 1)"
			aria-label="Previous page">
			Prev
		</button>

		<!-- Pages -->
		<template v-for="(p, i) in pagesToShow(page, pageCount)" :key="`p-${p}`">
			<span v-if="i > 0 && isGap(pagesToShow(page, pageCount)[i - 1], p)" class="vpager__ellipsis"
				aria-hidden="true">…</span>

			<button class="vpager__btn vpager__btn--page" :class="{ 'vpager__btn--active': p === page }" @click="go(p)"
				:aria-current="p === page ? 'page' : undefined" :aria-label="`Page ${p}`">
				{{ p }}
			</button>
		</template>

		<!-- Next -->
		<button class="vpager__btn vpager__btn--nav" :disabled="page === pageCount" @click="go(page + 1)"
			aria-label="Next page">
			Next
		</button>
	</nav>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
// Props
const props = defineProps<{
	page: number;              // 1-based
	pageCount: number;         // total pages
	setPage: (p: number) => void;
}>();

// Actions
function go(p: number) {
	if (p < 1 || p > props.pageCount || p === props.page) return;
	props.setPage(p);
}

// Pagination model
function pagesToShow(page: number, total: number) {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const pages = new Set<number>([1, total, page, page - 1, page + 1, page - 2, page + 2]);
	return Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
}
const isGap = (prev: number, curr: number) => curr - prev > 1;
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
/* Root */
.vpager {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	font-family: var(--font-action);
}

/* Buttons */
.vpager__btn {
	padding: var(--space-2) var(--space-3);
	min-width: 2.2rem;
	border-radius: var(--radius-sm);
	border: 1px solid var(--color-zinc-300);
	background: var(--color-white);
	color: var(--color-text-1);
	cursor: pointer;
	transition: background-color .15s, border-color .15s;

	&:hover:not([disabled]) {
		background: var(--color-zinc-100);
	}

	&[disabled] {
		opacity: .5;
		cursor: not-allowed;
	}

	/* Page button modifier */
	&--page {
		/* reserved for page-specific tweaks if needed */
	}

	/* Active page */
	&--active {
		background: var(--color-zinc-200);
		font-weight: 600;
		border-color: var(--color-zinc-900);
	}

	/* Prev/Next modifier */
	&--nav {
		/* reserved for nav-specific tweaks if needed */
	}
}

/* Ellipsis */
.vpager__ellipsis {
	padding: 0 var(--space-1);
	color: var(--color-text-2);
}
</style>
