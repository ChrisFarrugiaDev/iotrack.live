<template>
	<div class="uploader">
		<FilePond ref="pond" name="images"
		v-if="imageCount < 8"
		:allowImagePreview="true" 
		class-name="my-pond"
		:max-files="1" 
		:instantUpload="false"
		:server="serverOptions" 
		:allow-multiple="true"
		:allow-reorder="true" 
		:credits="''"
		:accepted-file-types="['image/jpeg',
		'image/png', 'image/webp']"
		:image-preview-height="140" 
		label-idle="Drop files here or <span class='filepond--label-action'>Browse</span>"
		:files="files" @init="onInit"
		@processfile="onProcessFile" />
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
import { useAuthStore } from '@/stores/authStore';
import { useImageStore } from '@/stores/imageStore';
import { useAppStore } from '@/stores/appStore';



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

// - Store -------------------------------------------------------------

const authStore = useAuthStore();
const appStore = useAppStore();

// - Props -------------------------------------------------------------

const props = withDefaults(
	defineProps<{
		selectedAssetID: string | null,
		imageCount: number,
	}>(), {
	selectedAssetID: "",
	imageCount: 0
});


// - Data --------------------------------------------------------------

const pond = ref<any>(null);
const files = ref<any[]>([]);

const serverOptions = {
	process: {
		url: `${appStore.getAppUrl}/img/upload`,
		method: 'POST',
		headers: {
			Authorization: `Bearer ${authStore.getJwt}`,
		},
		// append any extra fields your API expects
		ondata: (formData: FormData) => {
			formData.append('entity_type', 'asset')
			formData.append('entity_id', props.selectedAssetID ?? "0")
			return formData
		},
		onload: (res: any) => {
			// FilePond saves this to file.serverId
			return res;
		}
	},
}

// - Methodes ----------------------------------------------------------

function onInit() {
	// console.log(pond.value);
}

function onProcessFile(error: any, file: any) {
	if (!error) {
		// remove from pond after successful upload
		// pond.value.removeFile(file.id)
		files.value = []
		if (file.serverId) {
			const res = JSON.parse(file.serverId);
			const uploaded = res.data?.uploaded[0];

			if (uploaded) {
				console.log(uploaded)
				// useImageStore().addImages('asset', "1", uploaded)
				useImageStore().appImages['asset'][props.selectedAssetID ?? "0"].push(uploaded)
			}
		}
	}
}


</script>

<!-- --------------------------------------------------------------- -->

<style scoped>
/* scope anchor: either your wrapper or the class-name on FilePond */
.uploader :deep(.filepond--root),
.uploader :deep(.filepond--drop-label) {
	min-height: 8rem !important;
	/* FilePond can override height, so force it */
}

/* Drop label (the visible “Drop files here” area) */
.uploader :deep(.filepond--drop-label) {
	font-family: var(--font-mono) !important;
	color: var(--color-text-1) !important;
	background-color: var(--color-bg-hi) !important;
	font-size: .95rem !important;
	font-weight: 400 !important;
	border: 1px solid var(--color-zinc-300) !important;
	border-radius: var(--radius-md, 0.375rem) !important;
}

/* List & items */
.uploader :deep(.filepond--list) {
	display: flex !important;
	flex-direction: column !important;
}

.uploader :deep(.filepond--item) {
	max-width: 10rem !important;
	top: -.9rem !important;
	left: -1rem !important;
	right: -1rem !important;
	border: 1px solid var(--color-zinc-300) !important;
	border-radius: var(--radius-lg, 0.375rem) !important;
	overflow: hidden !important;
}

/* Panels / backgrounds */
.uploader :deep(.filepond--drip),
.uploader :deep(.filepond--panel-root) {
	background-color: transparent !important;
}

/* Mobile tweaks */
@media (max-width: 640px) {
	.uploader :deep(.filepond--item) {
		max-width: 100% !important;
		top: 2rem !important;
		left: auto !important;
		right: auto !important;
		border: 1px solid var(--color-zinc-300) !important;
		border-radius: var(--radius-lg, 0.375rem) !important;
		overflow: hidden !important;
	}
}
</style>