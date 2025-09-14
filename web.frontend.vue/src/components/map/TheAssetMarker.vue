<template>
    <div>
        <CustomMarker :options="markerOptions">
        
<svg
  class="marker"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  :width="markerSize"
  :height="markerSize"
  aria-label="vehicle-stationary"
>
  <defs>
    <filter id="marker-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Shadow/glow circle (slightly bigger, blurred) -->
  <circle
    cx="16"
    cy="16"
    r="8"
    :fill="'black'"
    filter="url(#marker-shadow)"
  />
  <!-- Main outer dot, solid -->
  <circle
    cx="16"
    cy="16"
    r="8"
    :fill="fillColor"
    stroke="#ffffff"
    stroke-width="1.2"
  />
  <!-- Ignition badge -->
  <circle
    cx="16"
    cy="16"
    r="3"
    fill="none"
    stroke="#ffffff"
    stroke-width="0"
  />
</svg>
      
        </CustomMarker>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import type { Asset } from '@/types/asset.type';

import { computed, reactive, ref } from 'vue';
import { AdvancedMarker, CustomMarker } from 'vue3-google-map'

// - Props -------------------------------------------------------------

const props = defineProps<{
    asset: Asset,
    telemetry: any,
    mapZoom: number
}>()


// - State -------------------------------------------------------------
const center = reactive({ lat: props.telemetry.latitude, lng: props.telemetry.longitude })
const markerOptions = ref<Record<string, any>>({ position: center, });

const fillColor = ref('#6E7FD5')
// const fillColor = ref('#15A773')



const markerSize = computed(() => {
    // Tweak these values for your preferred scaling
    const minSize = 18;      // minimum size in px
    const maxSize = 78;      // maximum size in px
    const baseZoom = 12;     // base zoom level (SVG size will be 24px here)
    const sizePerZoom = 4;   // how much to grow per zoom level

    let size = 24 + (props.mapZoom - baseZoom) * sizePerZoom;
    size = Math.max(minSize, Math.min(maxSize, size));
    return size;
});
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly

</style>