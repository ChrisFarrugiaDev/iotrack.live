<template>
    <aside class="image-gallery__sidebar">
        <div class="image-grid">

            <div v-for="image in images" 
                :key="image.imageId" 
                @click="selectImage($event, image)" 
                class="image-grid__item"
                :class="{ 'image-grid__item--active': selectedImage?.imageId === image.imageId }" 
                :aria-pressed="selectedImage?.imageId === image.imageId">
                
                    <img :src="`${getAppUrl}/${image.url}`"  alt="Preview"  class="image-grid__img" />
                    
                    <button v-if="getPrimaryImg?.imageId !== image?.imageId" class="image-grid__remove" :data-id="image.imageId" @click="deleteImage">×</button>
            </div>
        </div>
        
    </aside>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useAppStore } from '@/stores/appStore';
import { useAssetStore } from '@/stores/assetStore';
import { useImageStore } from '@/stores/imageStore';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';


// - Types -------------------------------------------------------------

type Img = {
    filename: string;
    imageId: string;
    url: string;
}

// - Store -------------------------------------------------------------
const imageStore = useImageStore();

const assetStore = useAssetStore();

const appStore = useAppStore();
const { getAppUrl } = storeToRefs(appStore);

// - Props & Emits -----------------------------------------------------

const props = defineProps<{
    images: Img[],
    selectedAssetID: string | null,
}>();


const emit = defineEmits<{
    (e: 'update:selectedImage', val: Img): void
}>();



// - Data --------------------------------------------------------------

const selectedImage = ref<Img | null>(null);

const getPrimaryImg = computed(()=>{
    if(!props.selectedAssetID) return null;
    const currentAsset = assetStore.getAssets![props.selectedAssetID];
    return currentAsset?.attributes?.primary_image;
});


// - Methods -----------------------------------------------------------

function selectImage(e: Event, img: Img) {

    const target = e.target as HTMLElement;

    if (target.closest('.image-grid__remove')) return;

    if (!img || img.imageId === selectedImage.value?.imageId) return;

    selectedImage.value = img;
    emit("update:selectedImage", img);
}

async function deleteImage(e: Event) {    
    
    try {
        const btn = e.target as HTMLElement;

        const id = btn.dataset.id;

        if (!id) return;

        const r = await imageStore.deleteImage(id);

        if (r.data.success) {

            const assetsImages = imageStore.appImages["asset"][props.selectedAssetID!];

            const index = assetsImages.findIndex((img => img.imageId == id));

            if (index >= 0) assetsImages.splice(index, 1);
        }
    } catch (err) {
        console.error("! UpdateImageGallery.vue !\n", err);
    }

}


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.image-gallery {

    &__sidebar {
        display: flex;
        flex-direction: column;
        min-width: 320px;
        max-height: 78vh;
        border: 1px solid var(--color-zinc-300);
       
        border-radius: var(--radius-lg, 0.5rem);
        background: var(--color-bg-hi);
        overflow: hidden;
    }
}

@media (max-width: 920px) {
    .image-gallery {

        &__sidebar {
            max-height: 40vh;
        }
    }
}


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
        width: 150px;
        height: 150px;
        border: 1px solid var(--color-zinc-300);
        border-radius: var(--radius-lg, .5rem);
        overflow: hidden;
        background: var(--color-bg-hi);
        box-shadow: 0 1px 2px rgba(0, 0, 0, .06);
        cursor: pointer;
        outline: none;
        transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;

        &:focus-visible {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, .45);
        }
    }

    &__item--active {
        border: var(--color-lime-500) 3px solid;

    }

    &__img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        /* fills box nicely */
        background: var(--color-bg-hi);
        /* letterbox color if needed */
    }

    &__remove {
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(0, 0, 0, 0.6);
        border: none;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        width: 27px;
        height: 27px;
        border-radius: 50%;
        cursor: pointer;
        line-height: 18px;
        text-align: center;
        transition: .15s all ease;
        &:hover {
            outline: currentColor 2.2px solid;
        }
    }
}


</style>