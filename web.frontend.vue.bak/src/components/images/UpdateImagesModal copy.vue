<template>

    
<VModal v-model="isUpdateImageModalOpen" size="xl">
  <div class="image-editor">
    <!-- Left: cropper stage + toolbar -->
    <div class="image-editor__stage">
      <div class="image-editor__toolbar">
        <button class="btn" :disabled="!selectedImage" @click="saveEdits">
          💾 Save
        </button>
        <button class="btn" :disabled="!selectedImage" @click="setPrimary">
          ⭐ Set primary
        </button>
        <button class="btn btn--danger" :disabled="!selectedImage" @click="deleteCurrent">
          🗑️ Delete
        </button>

        <label class="btn btn--ghost" for="image-upload-input">⬆️ Upload</label>
        <input id="image-upload-input" type="file" accept="image/*" multiple
               class="visually-hidden" @change="uploadNew" />
      </div>

      <Cropper
  v-if="selectedImage"
  :key="selectedImage.imageId"           
  ref="cropperRef"
  :src="`${getAppUrl}/${selectedImage.url}`"
  class="image-editor__cropper"
  image-restriction="stencil"
  @ready="fitToView"
      />
      
      <div v-else class="image-editor__empty">Select an image to edit</div>
    </div>

    <!-- Right: sidebar with thumbs -->
    <aside class="image-editor__sidebar">
      <div class="image-editor__sidebar-head">
        <span class="image-editor__title">Images</span>
        <span class="image-editor__count">{{ images.length }}</span>
      </div>

      <div class="image-grid">
        <div
          v-for="image in images"
          :key="image.imageId"
          @click="selectImage(image)"
          class="image-grid__item"
          :class="{
            'image-grid__item--active': selectedImage?.imageId === image.imageId,
            'image-grid__item--primary': image.imageId === primaryImageId
          }"
          tabindex="0"
          role="button"
          :aria-pressed="selectedImage?.imageId === image.imageId"
        >
          <img :src="`${getAppUrl}/${image.url}`" alt="Preview" class="image-grid__img" />

          <button class="image-grid__remove" title="Remove" @click.stop="deleteImage(image)">
            ×
          </button>

          <div v-if="image.imageId === primaryImageId" class="image-grid__badge">Primary</div>
        </div>
      </div>
    </aside>
  </div>
</VModal>




</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useAppStore } from '@/stores/appStore';
import { useImageStore } from '@/stores/imageStore';
import VModal from '@/ui/primitives/VModal.vue';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const imageStore = useImageStore();
const appStore = useAppStore();
const { getAppUrl } = storeToRefs(appStore);

const props = withDefaults(defineProps<{ selectedAssetID: string | null }>(), {
  selectedAssetID: null,
});

const isUpdateImageModalOpen = ref(false);
const images = ref<{ filename: string; imageId: string; url: string }[]>([]);
const selectedImage = ref<{ filename: string; imageId: string; url: string } | null>(null);

// Track which image is primary for UI
const primaryImageId = ref<string | null>(null);

// Fetch images when asset changes
watch(
  () => props.selectedAssetID,
  async () => {
    images.value = [];
    selectedImage.value = null;
    primaryImageId.value = null;

    const r = await imageStore.fetchImages('asset', Number(props.selectedAssetID));
    const i = r?.data?.data?.images ?? [];
    images.value = i;

    // if backend returns a primary flag, set it here. Example:
    // primaryImageId.value = i.find(x => x.is_primary)?.imageId ?? null;

    if (i.length) selectedImage.value = i[0];
  },
  { immediate: true }
);

// UI actions ----------------------------------------------------------

async function setPrimary() {
  if (!selectedImage.value) return;
  primaryImageId.value = selectedImage.value.imageId;

  // TODO: call API to set primary
  // await imageStore.setPrimary('asset', Number(props.selectedAssetID), selectedImage.value.imageId)
}

async function deleteCurrent() {
  if (!selectedImage.value) return;
  await deleteImage(selectedImage.value);
}

async function deleteImage(img: { imageId: string }) {
  // TODO: call API to delete
  // await imageStore.delete('image', img.imageId)
  images.value = images.value.filter((x) => x.imageId !== img.imageId);
  if (primaryImageId.value === img.imageId) primaryImageId.value = null;
  if (selectedImage.value?.imageId === img.imageId) {
    selectedImage.value = images.value[0] ?? null;
  }
}

async function saveEdits() {
  if (!selectedImage.value) return;
  // Example: get cropper result through a ref if you need transformed blob/base64
  // const result = cropperRef.value?.getResult();  // if using a ref on <Cropper>
  // await imageStore.saveEdits(selectedImage.value.imageId, result)
}

async function uploadNew(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files || !files.length) return;

  // TODO: call API to upload; update images list with response
  // const uploaded = await imageStore.upload('asset', Number(props.selectedAssetID), files)
  // images.value.unshift(...uploaded)

  // Reset input so same file can be selected again if needed
  (e.target as HTMLInputElement).value = '';
}


import { nextTick} from 'vue';

watch(() => selectedImage.value?.imageId, async () => {
  await nextTick();
  try { cropperRef.value?.reset?.(); } catch {}
  fitToView();
});
const cropperRef = ref<any>(null);

watch(() => selectedImage.value?.imageId, async () => {
  // wait for new image to mount, then reset
  await nextTick();
  resetCropper();
  fitToView();
});

function resetCropper() {
  // most builds of vue-advanced-cropper expose reset()
  try { cropperRef.value?.reset?.(); } catch {}
}

// Try to fit the whole image inside the stage after (re)mount.
// If your build doesn’t have zoomToFit(), the reset() above is usually enough.
function fitToView() {
  const api = cropperRef.value;
  if (!api?.getInfo) return;

  // Info has stage (container) + image sizes
  const info = api.getInfo();
  const stage = info?.stage;
  const imageSize = info?.imageSize;

  if (!stage || !imageSize) return;

  // 1) Show the WHOLE image as the crop (coordinates = full image)
  //    This guarantees the image is fully visible and not partially zoomed.
  try {
    api.setCoordinates({
      left: 0,
      top: 0,
      width: imageSize.width,
      height: imageSize.height,
    });
  } catch {}

  // 2) If the API supports visibleArea, center it in the stage
  //    (prevents the image starting half-offscreen on tall/wide images)
  try {
    const scale = Math.min(
      stage.width / imageSize.width,
      stage.height / imageSize.height
    );

    const visibleWidth = imageSize.width * scale;
    const visibleHeight = imageSize.height * scale;

    api.setVisibleArea?.({
      left: (imageSize.width - imageSize.width) / 2,  // 0
      top: (imageSize.height - imageSize.height) / 2, // 0
      width: imageSize.width,
      height: imageSize.height,
      // Some builds ignore extra fields; it's safe to pass only the rect
    });

    // Fallback center by panning if your build supports it:
    api.setTransform?.({
      translateX: (stage.width - visibleWidth) / 2,
      translateY: (stage.height - visibleHeight) / 2,
      scale,
      rotate: 0,
      flip: { horizontal: false, vertical: false },
    });
  } catch {}
}


function selectImage(img: any) {
  if (!img || img.imageId === selectedImage.value?.imageId) return;
  selectedImage.value = img;  // watch above will reset/fit
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
    position: relative;
    background: res; /* black letterbox */
    border: 1px solid var(--color-zinc-300, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    overflow: hidden;
    min-height: 380px;
  }

  &__toolbar {
    position: absolute;
    top: .5rem;
    left: .5rem;
    z-index: 5;
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
  }

  &__cropper {
    width: 100%;
    height: 100%;
  }

  &__empty {
    color: var(--color-zinc-400, #9ca3af);
    display: grid;
    place-items: center;
    height: 100%;
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

  &__title { font-weight: 600; }
  &__count { font-size: .85rem; color: var(--color-zinc-500, #6b7280); background: var(--color-zinc-100, #f4f4f5); padding: 0 .4rem; border-radius: .375rem; }
}

/* Make the cropper image fully visible (contain) -------------------- */
/* vue-advanced-cropper internal classes */
.image-editor__cropper :deep(.vue-advanced-cropper__image) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;   /* <- key to show full image inside stage */
  background: #000;      /* same as stage */
}

.image-editor__cropper :deep(.vue-advanced-cropper__background) {
  background: #000; /* no grey checkerboard */
}

/* Buttons ----------------------------------------------------------- */
.btn {
  appearance: none;
  border: 1px solid var(--color-zinc-300, #e5e7eb);
  background: #fff;
  color: #111;
  padding: .35rem .6rem;
  line-height: 1;
  border-radius: .45rem;
  font-size: .9rem;
  cursor: pointer;
  transition: box-shadow .12s ease, transform .08s ease;
  &:hover { box-shadow: 0 2px 10px rgba(0,0,0,.12); }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: .5; cursor: not-allowed; }
}

.btn--danger {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}

.btn--ghost {
  background: transparent;
}

/* Grid of thumbs ---------------------------------------------------- */
.image-grid {
  padding: .8rem;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, 158px);
  gap: .75rem;
  justify-content: start;

  &__item {
    position: relative;
    width: 158px;
    height: 137px;
    border: 1px solid var(--color-zinc-300, #e5e7eb);
    border-radius: var(--radius-md, .5rem);
    overflow: hidden;
    background: #111;
    box-shadow: 0 1px 2px rgba(0,0,0,.06);
    cursor: pointer;
    outline: none;
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;

    &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
    &:focus-visible { box-shadow: 0 0 0 2px rgba(59,130,246,.45); }
  }

  &__item--active { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.35); }
  &__item--primary::after {
    content: "★";
    position: absolute; top: 6px; right: 6px;
    font-size: 14px; color: #f59e0b; text-shadow: 0 1px 2px rgba(0,0,0,.5);
  }

  &__img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover; /* fills thumb nicely */
    background: #111;
  }

  &__remove {
    position: absolute;
    top: 6px; left: 6px;
    width: 22px; height: 22px;
    border: none; border-radius: 999px;
    color: #fff; background: rgba(17,17,17,.65);
    line-height: 20px; font-size: 14px;
    cursor: pointer; display: grid; place-items: center;
    opacity: 0; transform: scale(.9);
    transition: opacity .12s ease, transform .12s ease;

    .image-grid__item:hover &,
    .image-grid__item.image-grid__item--active & { opacity: 1; transform: scale(1); }
  }

  &__badge {
    position: absolute;
    bottom: 6px; left: 6px;
    font-size: .7rem; color: #111;
    background: #fde68a; padding: .15rem .35rem;
    border-radius: .35rem;
  }
}

/* Accessibility helpers -------------------------------------------- */
.visually-hidden {
  position: absolute !important;
  inset: 0 auto auto 0;
  width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* Responsive: stack on small screens ------------------------------- */
@media (max-width: 920px) {
  .image-editor {
    grid-template-columns: 1fr;
    max-height: none;

    &__sidebar { max-height: 40vh; }
  }
}

/* Keep the entire image visible inside the stage */
.image-editor__cropper :deep(.vue-advanced-cropper__image) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;   /* key for full visibility */
  background: #000;
}
.image-editor__cropper :deep(.vue-advanced-cropper__background) { background:#000; }
.image-editor__stage {
  position: relative;
  background: #000;  /* was 'res' */
  border: 1px solid var(--color-zinc-300, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  overflow: hidden;
  min-height: 380px;
}
.image-editor__cropper :deep(.vue-advanced-cropper__image) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  background: #000;
}
.image-editor__cropper :deep(.vue-advanced-cropper__background) { background:#000; }

</style>

<style lang="css">
    .fullscreen-cropper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
    }

    .cropper-content {
        background: white;
        padding: 20px;
        border-radius: 5px;
        max-width: 70%;
        max-height: 99vh;
        z-index: 100001;
        position: relative;
    }

    .cropper {
        background: white;
        max-width: 100%;
        max-height: 90vh;
        z-index: 100001;
    }

    .button-wrapper {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
    }

    .cropped-image {
        margin-top: 20px;
    }

    .cropped-image img {
        width: 100%;
        height: auto;
        max-height: 50%;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #000;
        padding: 5px;
        outline: none;
    }

</style>