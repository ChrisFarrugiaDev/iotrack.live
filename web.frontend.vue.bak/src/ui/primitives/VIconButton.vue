<template>
	<!-- Dynamically choose RouterLink, <a>, or <button> based on props -->
	<component :is="tag" :to="props.to" :href="props.href" class="viconbtn" :class="btnClass"
		:aria-label="ariaLabel || tooltip" @click="$emit('click', $event)" tabindex="0">
		<!-- SVG Icon -->
		<svg class="viconbtn__icon">
			<use :xlink:href="`${spriteUrl}#${props.icon}`" />
		</svg>
		<!-- Tooltip on hover/focus, only if tooltip prop is present -->
		<span v-if="tooltip" class="viconbtn__tooltip">{{ tooltip }}</span>
	</component>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

// ---- Props (typed and defaulted) ------------------------------------
const props = withDefaults(defineProps<{
	icon: string;         // SVG sprite symbol, e.g. "icon-view-more"
	tooltip?: string;     // Tooltip text (shows above button)
	ariaLabel?: string;   // For accessibility, falls back to tooltip
	type?: 'default' | 'green' | 'red'; // For status coloring
	to?: string;          // For RouterLink (internal routing)
	href?: string;        // For <a> (external links)
}>(), {
	type: 'default'
});

// ---- Get sprite URL at build time (Vite) ----------------------------
const spriteUrl = new URL('@/ui/svg/sprite.svg', import.meta.url).href;
// console.log(import.meta.url)
// console.log(new URL('@/ui/svg/sprite.svg', import.meta.url))
// console.log(new URL('@/ui/svg/sprite.svg', import.meta.url).href)

// ---- Pick element type: RouterLink > <a> > <button> -----------------
const tag = computed(() => {
	if (props.to) return RouterLink; // Use <router-link> for internal
	if (props.href) return 'a';      // Use <a> for external
	return 'button';                 // Otherwise fallback to button
});

// ---- Conditional class for color schemes ----------------------------
const btnClass = computed(() => ({
	'viconbtn--green': props.type === 'green',
	'viconbtn--red': props.type === 'red',
}));
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
.viconbtn {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.3rem;
	width: 2rem;
	height: 2rem;
	border-radius: var(--radius-sm, 3px);
	font-weight: 400;
	border: 1px solid var(--color-zinc-700);
	color: var(--color-zinc-700);
	background: none;
	cursor: pointer;
	transition: background 0.12s, color 0.12s;
	overflow: visible !important;
	/* Needed for tooltip */

	// Hover/focus (main/default)
	&:hover,
	&:focus-visible {
		background: var(--color-zinc-700);
		color: var(--color-white);
		outline: none;
	}

	// "green" (confirm/success) state
	&--green {
		border-color: var(--color-green-600);
		color: var(--color-green-600);

		&:hover,
		&:focus-visible {
			background: var(--color-green-600);
			color: var(--color-white);
		}
	}

	// "Red" (danger/warning) state
	&--red {
		border-color: var(--color-red-600);
		color: var(--color-red-600);

		&:hover,
		&:focus-visible {
			background: var(--color-red-600);
			color: var(--color-white);
		}
	}

	// SVG icon styling
	&__icon {
		fill: currentColor;
		width: 1rem;
		height: 1rem;
		pointer-events: none;
	}

	// Tooltip styling (appears above on hover/focus)
	&__tooltip {
		display: block;
		position: absolute;
		left: 50%;
		top: -100%; // Above button
		transform: translateX(-50%);
		background: var(--color-zinc-900, #222);
		color: var(--color-white, #fff);
		padding: 0.25rem 0.7rem;
		font-size: 0.75rem;
		border-radius: 0.35rem;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.13s;
		z-index: 99;
		box-shadow: 0 4px 12px 0 rgba(0, 0, 0, .09);
		font-family: var(--font-action, inherit);
		font-weight: 500;

		// Arrow (down)
		&::after {
			content: '';
			display: block;
			position: absolute;
			top: 100%;
			left: 50%;
			transform: translateX(-50%);
			border-width: 6px 6px 0 6px;
			border-style: solid;
			border-color: var(--color-zinc-900, #222) transparent transparent transparent;
			width: 0;
			height: 0;
		}
	}

	// Show tooltip on hover/focus
	&:hover .viconbtn__tooltip,
	&:focus-visible .viconbtn__tooltip {
		opacity: 1;
		pointer-events: none;
	}
}
</style>
