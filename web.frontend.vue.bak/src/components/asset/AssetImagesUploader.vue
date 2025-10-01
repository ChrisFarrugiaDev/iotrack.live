<template>
	<div class="uploader">
		<FilePond ref="pond"
		name="assetImages"
		:allowImagePreview="true"
		class-name="my-pond"
		max-files="8"
		:allow-multiple="true"
		:allow-reorder="true"
		:credits="''"
		:accepted-file-types="['image/jpeg',
		'image/png', 'image/webp']"
		:image-preview-height="140"
		label-idle="Drop files here or
		<span
		class='filepond--label-action'>Browse</span>"
		:files="files" @init="onInit"
		@reorderfiles="onAnyChange"
		@updatefiles="onAnyChange" />
	</div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
// Import FilePond
import vueFilePond from 'vue-filepond';

// Import plugins
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

// Import styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
import { ref, watch } from 'vue';

// Create FilePond component
const FilePond = vueFilePond(FilePondPluginFileValidateType, FilePondPluginImagePreview);

// - Types -------------------------------------------------------------

export type UploaderItem = {
	id: string;
	file: File;          // native File (ready for FormData)
	name: string;
	type: string;
	size: number;
	sortOrder: number;   // current order in the pond
};

// - Emit --------------------------------------------------------------

const emit = defineEmits<{
	(e: 'files-change', items: UploaderItem[]): void;
}>();

// - Data --------------------------------------------------------------


const pond = ref<any>(null);
const files = ref<any[]>([]);

// - Methodes ----------------------------------------------------------

function onInit() {
	// console.log(pond.value);
}

function onAnyChange() {
	const items = (pond.value?.getFiles?.() ?? []).map((item: any, idx: number) => ({
		id: item?.id,
		file: item?.file,            // File object
		name: item?.file?.name ?? '',
		type: item?.file?.type ?? '',
		size: item?.file?.size ?? 0,
		sortOrder: idx
	})) as UploaderItem[];

	console.log(items)
	emit('files-change', items);
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="css">
.filepond--root,
.filepond--drop-label {
	min-height: 8rem !important;
}

.filepond--drop-label {

	font-family: "Montserrat", sans-serif;
	color: var(--color-blue-500);
	background-color: var(--color-bg-hi);
	color: var(--color-text-1);
	font-family: var(--font-mono);
	font-size: .95rem;
	font-weight: 400;
	border: 1px solid var(--color-zinc-300);
	border-radius: var(--radius-md, 0.375rem);

}

.filepond--list {
	display: flex !important;
	flex-direction: column;

}

.filepond--item {
	max-width: 10rem;

	top: 2rem;
	left: -1rem;
	right: -1rem;

	border: 1px solid var(--color-zinc-300);
	border-radius: var(--radius-lg, 0.375rem);
	overflow: hidden;
}

.filepond--drip {
	background-color: transparent;
}

.filepond--panel-root {
	background-color: transparent;
}

@media (max-width: 640px) {
	.filepond--item {
		max-width: 100%;

		top: 2rem;
		left: auto;
		right: auto;

		border: 1px solid var(--color-zinc-300);
		border-radius: var(--radius-lg, 0.375rem);
		overflow: hidden;
	}
}
</style>