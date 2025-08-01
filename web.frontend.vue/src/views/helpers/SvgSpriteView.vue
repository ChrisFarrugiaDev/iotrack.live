<template>
	<div style="padding: 0 0 0 4rem;">
		<div v-for="symbol in symbols" :key="symbol.id" class="svg-icon" @click="copyId(symbol.id)"
			:class="{ 'copied': copiedId === symbol.id }">
			<svg>
				<use :xlink:href="symbol.href"></use>
			</svg>
			<p>{{ symbol.id }}</p>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import sprite from '@/assets/svg/sprite.svg'

// Types
interface SymbolInfo {
	id: string
	href: string
}

const symbols = ref<SymbolInfo[]>([])
const copiedId = ref<string | null>(null)

const loadSvgSymbols = async () => {
	try {
		const response = await fetch(sprite)
		const svgText = await response.text()
		const parser = new DOMParser()
		const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
		const symbolElements = svgDoc.querySelectorAll('symbol')
		symbols.value = Array.from(symbolElements).map(symbol => ({
			id: symbol.id,
			href: `${sprite}#${symbol.id}`
		}))
	} catch (error) {
		console.error('Error loading SVG sprite:', error)
	}
}

const copyId = async (id: string) => {
	try {
		await navigator.clipboard.writeText(id)
		copiedId.value = id
		setTimeout(() => {
			copiedId.value = null
		}, 1000)
	} catch (error) {
		console.error('Failed to copy text: ', error)
	}
}

onMounted(loadSvgSymbols)
</script>

<style>
.svg-icon {
	display: inline-block;
	margin: 10px;
	text-align: center;
	cursor: pointer;
	transition: background-color 0.3s;
	padding: .1rem;
}

.svg-icon svg {
	width: 40px;
	height: 40px;
	padding: .1rem;
}

.svg-icon p {
	font-size: 12px;
	margin-top: 5px;
}

.svg-icon.copied {
	border: 1px solid currentColor;
	border-radius: 10px;
}
</style>
