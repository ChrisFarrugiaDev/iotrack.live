<template>
    <VModal v-model="isUpdateImageModalOpen" size="xl" body-fit>
        <template #header>
            <div class="vheading--3">Asset Images</div>
        </template>

        <section class="image-manager">
            <div class="image-manager__workspace">
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

            <UpdateImagesUploader class="image-manager__uploader" @files-change="onFilesChange"
                :selectedAssetID="selectedAssetID"
                :imageCount="images.length">
            </UpdateImagesUploader>
        </section>

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
.image-manager {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 1rem;
    height: min(68vh, 42rem);
    min-height: 30rem;

    &__workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 28rem;
        gap: 1rem;
        min-height: 0;
    }

    &__uploader {
        min-height: 7rem;
    }
}

@media (max-width: 920px) {
    .image-manager {
        height: auto;
        min-height: 0;

        &__workspace {
            grid-template-columns: 1fr;
        }
    }
}

</style>
