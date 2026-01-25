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
import { inject, ref, watch, computed, shallowRef } from 'vue';
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
const mapStore = useMapStore();
const device = deviceStore.useDevice(props.asset.devices[0].id);

// - Marker basics -----------------------------------------------------

//  NOTE: Keep options in a shallowRef and REPLACE sub-objects (position) to force marker re-render
const markerOptions = shallowRef<Record<string, any>>({
    position: {
        lat: device.value?.last_telemetry?.latitude ?? props.telemetry.latitude,
        lng: device.value?.last_telemetry?.longitude ?? props.telemetry.longitude,
    },
});

// - Computed ----------------------------------------------------------

const markerSize = computed(() => {
    const minSize = 18;
    const maxSize = 78;
    const baseZoom = 12;
    const sizePerZoom = 4;

    let size = 24 + (props.mapZoom - baseZoom) * sizePerZoom;
    size = Math.max(minSize, Math.min(maxSize, size));
    return size;
});

// - Follow state ------------------------------------------------------

const isFollowed = computed(() => mapStore.getFollow === props.asset.id);

// - Change Color Logic ------------------------------------------------
// Goal:
// 1) Default palette (idle/active)
// 2) Follow palette (green)
// 3) "Hot" window: after telemetry arrives, show active color for 300s then back to idle

// --- Color palettes
const DEFAULT_PALETTE = {
    idleFill: "#ffbf00",
    activeFill: "#3754fa",
    idleLine: "#ffffff",
    activeLine: "#ffffff",
};

const FOLLOW_PALETTE = {
    idleFill: "#22c65e",
    activeFill: "#22c65e",
    idleLine: "#ffffff",
    activeLine: "#ffffff",
};

// --- Pick palette based on follow
const palette = computed(() => (isFollowed.value ? FOLLOW_PALETTE : DEFAULT_PALETTE));

// --- "Hot" window (recent telemetry)
const isHot = ref(false);
const hotTimeout = ref<number | null>(null);

// --- Final colors used by SVG
const fillColor = computed(() => (isHot.value ? palette.value.activeFill : palette.value.idleFill));
const lineColor = computed(() => (isHot.value ? palette.value.activeLine : palette.value.idleLine));

// - Watchers ----------------------------------------------------------

// --- Telemetry received -> set active color for 300s
watch(
    () => device.value?.last_telemetry?.timestamp ?? null,
    (ts) => {
        if (ts == null) return;

        // mark active
        isHot.value = true;

        // reset timer
        if (hotTimeout.value) clearTimeout(hotTimeout.value);
        hotTimeout.value = window.setTimeout(() => {
            isHot.value = false;
        }, 300_000);
    }
    // { immediate: true }
);

// --- Lat/Lng change -> update marker position (+ follow pan)
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