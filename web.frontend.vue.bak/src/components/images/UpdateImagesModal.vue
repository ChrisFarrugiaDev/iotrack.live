<template>
    <VModal v-model="isUpdateImageModalOpen" size="xl">
        <div class="image-editor">
            <div class="image-editor__stage">
                <Cropper v-if="selectedImage" :src="`${getAppUrl}/${selectedImage.url}`" class="image-editor__cropper"
                    :areaClass="'mycropper__area'" :backgroundClass="'mycropper__bg'" />
                <div v-else class="image-editor__empty">Select an image to edit</div>
            </div>

            <aside class="image-editor__sidebar">
                <div class="image-editor__sidebar-head">
                    <span class="image-editor__title">Images</span>
                    <span class="image-editor__count">{{ images.length }}</span>
                </div>

                <div class="image-grid">
                    <div v-for="image in images" :key="image.imageId" @click="selectImage(image)"
                        class="image-grid__item"
                        :class="{ 'image-grid__item--active': selectedImage?.imageId === image.imageId }" tabindex="0"
                        role="button" :aria-pressed="selectedImage?.imageId === image.imageId">
                        <img :src="`${getAppUrl}/${image.url}`" alt="Preview" class="image-grid__img" />

                 
                    </div>
                </div>
            </aside>
        </div>
    </VModal>

</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import VModal from '@/ui/primitives/VModal.vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

import { useAppStore } from '@/stores/appStore';
import { useImageStore } from '@/stores/imageStore';

/* ----------------------------- Types -------------------------------- */
interface Img {
    filename: string;
    imageId: string;
    url: string;
}

/* ---------------------------- Props --------------------------------- */
const props = withDefaults(
    defineProps<{ selectedAssetID: string | null }>(),
    { selectedAssetID: null }
);

/* --------------------------- Stores --------------------------------- */
const imageStore = useImageStore();
const { getAppUrl } = storeToRefs(useAppStore());

/* --------------------------- State ---------------------------------- */
const isUpdateImageModalOpen = ref(false);
const images = ref<Img[]>([]);
const selectedImage = ref<Img | null>(null);

/* --------------------------- Watchers ------------------------------- */
/** Load images whenever the selected asset changes */
watch(
    () => props.selectedAssetID,
    async (assetId) => {
        images.value = [];
        selectedImage.value = null;
        if (!assetId) return;

        try {
            const resp = await imageStore.fetchImages('asset', Number(assetId));
            const list: Img[] = resp?.data?.data?.images ?? [];
            images.value = list;
            if (list.length) selectedImage.value = list[0];
        } catch (err) {
            console.error('Failed to fetch images:', err);
            images.value = [];
        }
    },
    { immediate: true }
);

/* --------------------------- Methods -------------------------------- */
function selectImage(img: Img) {
    if (!img || img.imageId === selectedImage.value?.imageId) return;
    selectedImage.value = img;
}
</script>



<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>


/* Layout ------------------------------------------------------------- */
.image-editor {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1rem;
    min-height: 60vh;
    max-height: 78vh;
    
    

    &__stage {
        background: var(--color-zinc-100, #f6f6f7);
        border: 1px solid var(--color-zinc-300, #e5e7eb);
        border-radius: var(--radius-lg, 0.5rem);
        overflow: hidden;
        display: grid;
        place-items: center;
        min-height: 360px;
        
    }

    &__cropper {
        width: 100%;
        height: 100%;

    }

    &__empty {
        color: var(--color-zinc-500, #6b7280);
        font-size: 0.95rem;
        padding: 2rem;
    }

    &__sidebar {
        display: flex;
        flex-direction: column;
        min-width: 320px;
        max-height: 78vh;
        border: 1px solid var(--color-zinc-300, #e5e7eb);
        border-radius: var(--radius-lg, 0.5rem);
        background: #fff;
        overflow: hidden;
    }

    &__sidebar-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: .6rem .8rem;
        border-bottom: 1px solid var(--color-zinc-200, #eee);
        background: var(--color-zinc-50, #fafafa);
    }

    &__title {
        font-weight: 600;
    }

    &__count {
        font-size: .85rem;
        color: var(--color-zinc-500, #6b7280);
        background: var(--color-zinc-100, #f4f4f5);
        padding: 0 .4rem;
        border-radius: .375rem;
    }
}

/* Grid of thumbs ----------------------------------------------------- */
.image-grid {
    padding: .8rem;
    overflow: auto;
    /* keeps 158 × 137 boxes packed; wraps automatically */
    display: grid;
    grid-template-columns: repeat(auto-fill, 158px);
    gap: .75rem;
    justify-content: start;

    &__item {
        position: relative;
        width: 158px;
        height: 137px;
        border: 1px solid var(--color-zinc-300);
        border-radius: var(--radius-md, .5rem);
        overflow: hidden;
        background: #111;
        box-shadow: 0 1px 2px rgba(0, 0, 0, .06);
        cursor: pointer;
        outline: none;
        transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, .12);
        }

        &:focus-visible {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, .45);
        }
    }

    &__item--active {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, .35);
    }

    &__img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        /* fills box nicely */
        background: #111;
        /* letterbox color if needed */
    }


}

/* Small screens: cropper on top, thumbs below ----------------------- */
@media (max-width: 920px) {
    .image-editor {
        grid-template-columns: 1fr;
        max-height: none;

        &__sidebar {
            max-height: 40vh;
        }
    }
}


</style>

<style lang="css">
.vue-advanced-cropper__background {
    background: rgb(48, 48, 51);
}
.vue-advanced-cropper {

  
        min-height: 60vh;
    max-height: 77vh;
}
</style>