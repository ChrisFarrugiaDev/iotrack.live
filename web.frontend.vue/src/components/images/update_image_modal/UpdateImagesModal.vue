<template>
    <VModal v-model="isUpdateImageModalOpen" size="xl">
        <div class="image-editor">
            
            <UpdateImageEditor 
                :selectedImage="selectedImage"
                :selectedAssetID="selectedAssetID"
            ></UpdateImageEditor>

            <UpdateImageGallery 
                :images="images" 
                :selectedAssetID="selectedAssetID"
                @update:selectedImage="selectedImage=$event">
            </UpdateImageGallery>

        </div>

        <UpdateImagesUploader class="mt-4" @files-change="onFilesChange"
            :selectedAssetID="selectedAssetID"
            :imageCount="images.length">
        </UpdateImagesUploader>

    </VModal>

</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import { computed, ref, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import VModal from '@/ui/primitives/VModal.vue';


import { useAppStore } from '@/stores/appStore';
import { useImageStore } from '@/stores/imageStore';

import UpdateImageGallery from './UpdateImageGallery.vue';
import UpdateImageEditor from './UpdateImageEditor.vue';
import UpdateImagesUploader from './UpdateImagesUploader.vue';
import { useAssetStore } from '@/stores/assetStore';

// - Types -------------------------------------------------------------
interface Img {
    filename: string;
    imageId: string;
    url: string;
}

// - Props -------------------------------------------------------------
const props = withDefaults(
    defineProps<{ selectedAssetID: string | null }>(),
    { selectedAssetID: null }
);

// - Store -------------------------------------------------------------
const imageStore = useImageStore();
const assetStore = useAssetStore();


// - Data --------------------------------------------------------------

const isUpdateImageModalOpen = ref(false);
const images = ref<Img[]>([]);
const selectedImage = ref<Img | null>(null);

// - Computed ----------------------------------------------------------

const getPrimaryImage = computed(() => {
    if (!props.selectedAssetID || !assetStore.getAssets) return null;

    const asset = assetStore.getAssets[props.selectedAssetID];

    return asset.attributes?.primary_image
});

// - Watcher -----------------------------------------------------------
/** Load images whenever the selected asset changes */
watch(
    () => props.selectedAssetID,
    async (assetId) => {
        images.value = [];
        selectedImage.value = null;
        if (!assetId) return;

        try {
            const list = await imageStore.fetchImages('asset', String(assetId));

            images.value = list;   

            if (list.length) selectedImage.value = getPrimaryImage.value ?? list[0];         

        } catch (err) {
            console.error('Failed to fetch images:', err);
            images.value = [];
        }
    },
    { immediate: true }
);

// - Methods -----------------------------------------------------------
function onFilesChange(items: any[]) {
	// images.value = items;
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>

.image-editor {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1rem;
    min-height: 60vh;
    max-height: 78vh;   
}

@media (max-width: 920px) {
    .image-editor {
        grid-template-columns: 1fr;
        max-height: none;
    }
}

</style>