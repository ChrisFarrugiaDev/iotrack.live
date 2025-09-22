<template>
    <div>

        <CustomMarker :options="markerOptions">

            <svg :style="{ 'opacity': .85, }" v-if="direction == null" class="marker" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32" :width="markerSize" :height="markerSize" aria-label="vehicle-stationary">
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
                <circle cx="16" cy="16" r="8" :fill="'black'" filter="url(#marker-shadow)" />
                <!-- Main outer dot, solid -->
                <circle cx="16" cy="16" r="8" :fill="fillColor" stroke="#202020" stroke-width="1.2" />
                <!-- Ignition badge -->
                <circle cx="16" cy="16" r="3" fill="none" stroke="#202020" stroke-width="0" />



            </svg>



            <svg :style="{ 'opacity': .85, }" v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"
                :width="markerSize * 1.2" :height="markerSize * 1.2" aria-label="vehicle-moving">
                <defs>
                    <filter id="marker-shadow" x="-30%" y="-30%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <!-- rotate the arrow group by `direction` degrees around (16,16) -->
                <g :transform="`rotate(${direction ?? 0} 20 20)`">
                    <!-- shadow -->
                    <path d="M 20 5 L 33 34 L 20 29 L 7 34 Z" fill="black" filter="url(#marker-shadow)" />
                    <!-- triangle arrow pointing up (north) -->
                    <path d="M 20 5 L 33 34 L 20 29 L 7 34 Z" :fill="fillColor" stroke="#202020" stroke-width="1.2"
                        stroke-linejoin="round" />
                    <!-- ignition badge -->
                    <circle cx="20" cy="22.5" r="3.8" fill="none" stroke="none" />
                </g>
            </svg>


        </CustomMarker>

        <!-- <AdvancedMarker :options="markerOptions"></AdvancedMarker> -->
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import { CustomMarker, AdvancedMarker } from 'vue3-google-map'
import { computed, ref, shallowRef, watch } from "vue";
import { useDeviceStore } from "@/stores/deviceStore";
import type { Asset } from "@/types/asset.type";


// - Props -------------------------------------------------------------
const props = defineProps<{
    asset: Asset,
    telemetry: any,
    mapZoom: number
}>();

// - Store -------------------------------------------------------------

const deviceStore = useDeviceStore();
const device = deviceStore.useDevice(props.asset.devices[0].id);

//  NOTE:  Keep options in a shallowRef to replace sub-objects
const markerOptions = shallowRef<Record<string, any>>({
    position: {
        lat: device.value?.last_telemetry?.latitude ?? props.telemetry.latitude,
        lng: device.value?.last_telemetry?.longitude ?? props.telemetry.longitude,
    },
});




const fillColor = ref('#ffbf00');


const activeTimeout = ref<number | null>(null);

const direction = ref<number | null>(null); // degrees from North

// - Computed ----------------------------------------------------------

// (Optional) force-update fallback if needed
// const markerKey = computed(() => device.value?.last_telemetry?.timestamp ?? 0);

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

// --- helpers ----------------------------------------------------------
function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

/** Initial bearing from (lat1,lng1) -> (lat2,lng2) in degrees from North */
function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δλ = toRad(lng2 - lng1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// - Watchers ----------------------------------------------------------

//  NOTE:   Watch ONLY what matters and REPLACE the position object
watch(
    () => ({
        lat: device.value?.last_telemetry?.latitude ?? null,
        lng: device.value?.last_telemetry?.longitude ?? null,
    }),
    (pos, prev) => {
        if (pos.lat == null || pos.lng == null) return;

        // 1) Move the marker (new object -> re-render)
        markerOptions.value = {
            ...markerOptions.value,
            position: { lat: pos.lat, lng: pos.lng },
        };

        // 2) Compute bearing if we have a previous point
        if (
            prev?.lat != null &&
            prev?.lng != null &&
            (prev.lat !== pos.lat || prev.lng !== pos.lng)
        ) {
            const brng = bearing(prev.lat, prev.lng, pos.lat, pos.lng);
            direction.value = brng; // 0..360, 0 = North, 90 = East
        }

        // 3) Your active/idle color timer
        if (activeTimeout.value) clearTimeout(activeTimeout.value);
        fillColor.value = "#aecce4";
        activeTimeout.value = setTimeout(() => {
            fillColor.value = "#ffbf00";
            direction.value = null;
        }, 120_000);
    }
    // { immediate: true }
);

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>