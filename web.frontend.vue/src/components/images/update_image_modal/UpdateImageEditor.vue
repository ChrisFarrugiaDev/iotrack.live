<template>
    <div class="image-editor__stage">
        <!-- Toolbar -->
        <div v-if="selectedImage">

            <div  class="image-editor__toolbar" >
                <button class="image-editor__btn"  :disabled="!selectedImage" @click="updatePrimaryImage">
                    <svg class="image-editor__svg">
                        <use xlink:href="@/ui/svg/sprite.svg#icon-crop"></use>
                    </svg>
                    <span>Set Primary IMG</span>
                </button>
            </div>
    
            <Cropper  ref="cropperRef" :src="`${getAppUrl}/${selectedImage.url}`"
                class="image-editor__cropper" 
                :key="selectedImage.imageId"
                :stencil-props="{
                    // handlers: {},
                    // movable: false,
                    // resizable: false,
                    aspectRatio: 1,
                }" 
                :areaClass="'mycropper__area'" 
                :backgroundClass="'mycropper__bg'" 
                image-restriction="stencil" 
                v-bind="primaryProps"  
                priority="visible-area" 
                :transitions="false"
            />

        </div>

        <div v-else class="image-editor__empty">Select an image to edit</div>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { useAppStore } from '@/stores/appStore';
import { storeToRefs } from 'pinia';
import { useAssetStore } from '@/stores/assetStore';

const initialCoordinates = {
  left: 0,
  top: 0,
  width: 20,
  height: 20,
}

// - Types -------------------------------------------------------------

interface Img {
    filename: string;
    imageId: string;
    url: string;
}

// - Store -------------------------------------------------------------

const assetStore = useAssetStore();

// - Props & Emits -----------------------------------------------------

const props = defineProps<{
    selectedImage: Img | null, 
    selectedAssetID: string | null,
}>();

const emit = defineEmits<{

    (e: 'update-primary-image'): void
   
}>();

// - Store -------------------------------------------------------------
const { getAppUrl } = storeToRefs(useAppStore());

// - Data --------------------------------------------------------------

const cropperRef = ref<any>(null);

// - Computed ----------------------------------------------------------

const getPrimaryImg = computed(() => {
  if (!props.selectedAssetID) return null
  const currentAsset = assetStore.getAssets?.[props.selectedAssetID]
  return currentAsset?.attributes?.primary_image || null
})

const getCoordinates = computed(() => {
  if (!props.selectedAssetID) return null
  const currentAsset = assetStore.getAssets?.[props.selectedAssetID]
  return currentAsset?.attributes?.primary_image?.coordinates || null
})

const isPrimary = computed(() =>
  getPrimaryImg.value &&
  props.selectedImage &&
  props.selectedImage.imageId === getPrimaryImg.value.imageId
)

const primaryProps = computed(() => {
  const coords = getCoordinates.value

  if (isPrimary.value && coords) {
    return {
      defaultSize: { width: coords.width, height: coords.height },
      defaultPosition: { left: coords.left, top: coords.top },
    }
  }

  return {}
})


// - Methods -----------------------------------------------------------
async function updatePrimaryImage() {

    const result = cropperRef.value?.getResult?.();

    if (!result?.canvas) return;

    const primary_image = {
        ...props.selectedImage,
        coordinates: result.coordinates,
        transforms: result.imageTransforms
    }

    const asset = assetStore.getAssets![props.selectedAssetID!];

    const attributes = {
        ...asset.attributes,
        primary_image
    }

    const payload = { attributes }

    await assetStore.updatedAsset(asset.id, payload);

    asset.attributes = {
        ...asset.attributes,
        primary_image
    }
}

</script>

<style scoped lang="scss">
.image-editor {
    position: relative;
    &__stage {
        position: relative;
        background: black;
        border: 1px solid var(--color-zinc-300);
        border-radius: .5rem;
        overflow: hidden;
        min-height: 360px;
        display: grid;
        place-items: center;
    }

    &__toolbar {
        position: absolute;
        top: .5rem;
        left: .5rem;
        z-index: 5;
        display: flex;
        gap: .5rem;
        flex-wrap: wrap;
        align-items: center;
    }

    &__cropper {
        width: 100%;
        height: 100%;
    }

    &__empty {
        color: var(--color-zinc-500);
        font-size: .95rem;
        padding: 2rem;
    }

    &__btn {

        background: rgba(0, 0, 0, 0.6);
        border: none;
        color: #fff;
        font-size: 14px;
        /* width: 20px; */
        /* height: 20px; */
        border-radius: 3px;
        cursor: pointer;
        line-height: 18px;
        text-align: center;
        padding: 3px 4px;
        border: 1px solid currentColor;
        font-family: var(--font-display);
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: .5rem;
        opacity: .75;
        &:hover { opacity: 1; };
        &:active  {
            color: var(--color-lime-500);
        }
    }

    &__svg {
        fill: currentColor;
        width: 1.2rem;
        height: 1.2rem;
    }
}

.btn-group {
    display: inline-flex;
    gap: .25rem;
}


.btn--danger {
    background: #fee2e2;
    border-color: #fecaca;
    color: #991b1b;
}

.btn--ghost {
    background: transparent;
}

.sr-only {
    position: absolute !important;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
}
</style>

<style lang="css">
.vue-advanced-cropper__background {
    background: black;
}

.vue-advanced-cropper {
    min-height: 60vh;
    max-height: 77vh;
}


</style>
