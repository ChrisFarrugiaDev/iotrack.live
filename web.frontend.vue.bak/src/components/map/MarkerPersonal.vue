<template>
    <div>
        <CustomMarker :options="markerOptions" >
            <svg @click="setActiveInfoWindow!(asset.id)"  
                class="cursor-pointer" :style="{ opacity: 0.85 }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" 
                :width="markerSize * 1" :height="markerSize * 1" aria-label="personal-marker">
                <defs>
                    <!-- Shadow filter -->
                    <filter id="marker-shadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <rect x="6" y="6" width="20" height="20" rx="6" fill="black" stroke="black" filter="url(#marker-shadow)"></rect>
                <rect x="6" y="6" width="20" height="20" rx="6" :fill="fillColor" :stroke="lineColor" stroke-width="1.2"></rect>
                <!-- Person pictogram -->
                <circle cx="16" cy="13" r="3" :fill="lineColor"></circle>
                <path d="M11,21 C12.5,18.5 19.5,18.5 21,21" fill="none" :stroke="lineColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
        </CustomMarker>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDeviceStore } from '@/stores/deviceStore';
import { useMapStore } from '@/stores/mapStore';
import type { Asset } from '@/types/asset.type';
import { inject, ref, watch } from 'vue';
import { computed, shallowRef } from 'vue';
import { CustomMarker, AdvancedMarker } from 'vue3-google-map';

// - Props -------------------------------------------------------------
const props = defineProps<{
    asset: Asset,
    telemetry: any,
    mapZoom: number
}>();

// - provide & inject --------------------------------------------------

const setActiveInfoWindow = inject<(id: string) => void>('setActiveInfoWindow');

const updateMapCenter = inject<(lat:number, lng:number) => void>('updateMapCenter');

// - Store -------------------------------------------------------------

const deviceStore = useDeviceStore();
const device = deviceStore.useDevice(props.asset.devices[0].id);

const mapStore = useMapStore();

// - Data --------------------------------------------------------------

//  NOTE:  Keep options in a shallowRef to replace sub-objects
const markerOptions = shallowRef<Record<string, any>>({
    position: {
        lat: device.value?.last_telemetry?.latitude ?? props.telemetry.latitude,
        lng: device.value?.last_telemetry?.longitude ?? props.telemetry.longitude,
    },
});



// - Computed ----------------------------------------------------------

const markerSize = computed(() => {
    // Tweak these values for your preferred scaling
    const minSize = 18;      // minimum size in px
    const maxSize = 78;      // maximum size in px
    const baseZoom = 12;     // base zoom level (SVG size will be 24px here)
    const sizePerZoom = 4;   // how much to grow per zoom level

    let size = 24 + (props.mapZoom - baseZoom) * sizePerZoom;
    size = Math.max(minSize, Math.min(maxSize, size));
    return size;
})

// - Change Color Loggic -----------------------------------------------

const idleColor = ref("#ffbf00");
const activeColor = ref("#3754fa");

const idleColorLine = ref("#ffffff");
const activeColorLine = ref("#ffffff");

const fillColor = ref(idleColor.value);
const lineColor = ref(idleColorLine.value);

const idleColorTimeout = ref<number | null>(null);

watch(
    () => ({
        timestamp: device.value?.last_telemetry?.timestamp ?? null, 
    }),
    (pos, prev) => {
        if (pos.timestamp == null) return;


        // 3) Your active/idle color timer
        if (idleColorTimeout.value) clearTimeout(idleColorTimeout.value);
        fillColor.value = activeColor.value;
        lineColor.value = activeColorLine.value;

        idleColorTimeout.value = setTimeout(() => {
            fillColor.value = idleColor.value;
            lineColor.value = idleColorLine.value;
        }, 300_000);
    }
    // { immediate: true }
);

// - Direction Loggic --------------------------------------------------

//  NOTE:   Watch ONLY what matters and REPLACE the position object
watch(
    () => ({
        lat: device.value?.last_telemetry?.latitude ?? null,
        lng: device.value?.last_telemetry?.longitude ?? null,
    }),
    (pos, prev) => {
        if (pos.lat == null || pos.lng == null) return;

        // 1) Update map center
        if (mapStore.getFollow == props.asset.id) {            
            updateMapCenter!(pos.lat, pos.lng)       
        }

        // 2) Move the marker (new object -> re-render)
        markerOptions.value = {
            ...markerOptions.value,
            position: { lat: pos.lat, lng: pos.lng },
        };
    }
    // { immediate: true }
);

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// .cursor-pointer {
//     cursor: pointer !important;
// }
</style>