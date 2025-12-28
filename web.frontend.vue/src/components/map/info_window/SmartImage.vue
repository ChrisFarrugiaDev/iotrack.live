<template>
  <div ref="boxRef" class="smart-image">
    <img
      :src="fullUrl"
      alt=""
      :style="imgStyle"
      :draggable="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, type CSSProperties } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { storeToRefs } from 'pinia'

interface Coordinates { top: number; left: number; width: number; height: number }
interface Flip { horizontal?: boolean; vertical?: boolean }
interface Transforms { rotate?: number; flip?: Flip }
interface ImageData { url: string; coordinates?: Coordinates; transforms?: Transforms }

const props = defineProps<{ image: ImageData }>()
const appStore = useAppStore()
const { getAppUrl } = storeToRefs(appStore)

const fullUrl = computed(() => `${getAppUrl.value}/${props.image.url}`)

const boxRef = ref<HTMLElement | null>(null)
const boxW = ref(0)
const boxH = ref(0)

let ro: ResizeObserver | null = null
onMounted(() => {
  if (!boxRef.value) return
  const update = () => {
    if (!boxRef.value) return
    const r = boxRef.value.getBoundingClientRect()
    boxW.value = r.width
    boxH.value = r.height
  }
  ro = new ResizeObserver(update)
  ro.observe(boxRef.value)
  update()
})
onBeforeUnmount(() => ro?.disconnect())



/**
 * Build style:
 * - If no coordinates: normal cover.
 * - If coordinates: translate(-left, -top) then scale so the crop rect fills the box.
 *   We also apply optional flip + rotate. Transform origin is top-left for predictable math.
 */
const imgStyle = computed<CSSProperties>(() => {
  const coords = props.image.coordinates
  const tr = props.image.transforms

  const flipX = tr?.flip?.horizontal ? -1 : 1
  const flipY = tr?.flip?.vertical ? -1 : 1
  const rotation = tr?.rotate ?? 0

  // Default: simple cover
  if (!coords || !boxW.value || !boxH.value) {
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as CSSProperties['objectFit'],
      transform: `scale(${flipX}, ${flipY}) rotate(${rotation}deg)`,
      transformOrigin: 'center center'
    }
  }

  // Scale so the crop rect "covers" the box
  const scaleX = boxW.value / coords.width
  const scaleY = boxH.value / coords.height
  const scale = Math.max(scaleX, scaleY)

  // Translate the *scaled* image so that (left,top) is at the box's top-left
  // Order matters: rightmost runs first. We want: scale, then flip, then rotate, but we must
  // translate in the **final** coordinate space. Using transform-origin top-left keeps math simple.
  const translateX = -coords.left * scale
  const translateY = -coords.top * scale

  return {
    position: 'absolute',
    top: '0',
    left: '0',
    // No intrinsic sizing needed; we scale via transform
    transformOrigin: 'top left',
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale * flipX}, ${scale * flipY}) rotate(${rotation}deg)`,
    // Make sure the raster has enough resolution: start from its intrinsic size
    // (no width/height set) so the browser uses the natural pixels.
    userSelect: 'none',
  }
})
</script>

<style scoped lang="scss">
.smart-image {
  position: relative;
  overflow: hidden;
  width: 14rem;   /* set whatever container size you want */
  height: 14rem;  /* can be % or responsive; the observer will adapt */
  border-radius: .25rem;
  /* background: #f8f8f8; */
  border: 1px solid rgba(#fff, .8);
}

.smart-image img {
  display: block;
  will-change: transform;
  // transition: transform .15s ease;
  
}
</style>
