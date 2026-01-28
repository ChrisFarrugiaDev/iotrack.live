<template>
    <div >
        <CustomMarker :options="markerOptions" >
    
            <svg v-if="showStationary" @click="setActiveInfoWindow!(asset.id)" 
                class="cursor-pointer " :style="{ 'opacity': .85, }"   xmlns="http://www.w3.org/2000/svg"
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
                <circle cx="16" cy="16" r="8" :fill="fillColor" :stroke="lineColor" stroke-width="1.2" />
                <!-- Ignition badge -->
                <circle cx="16" cy="16" r="3" fill="none" :stroke="lineColor" stroke-width="0" />
            </svg>
            <svg v-else @click="setActiveInfoWindow!(asset.id)"
                 class="cursor-pointer"  :style="{ 'opacity': .85, }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"
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
                    <path d="M 20 5 L 33 34 L 20 29 L 7 34 Z" :fill="fillColor" :stroke="lineColor" stroke-width="1.2"
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

import { CustomMarker} from 'vue3-google-map'
import { computed, inject, ref, shallowRef, watch } from "vue";
import { useDeviceStore } from "@/stores/deviceStore";
import type { Asset } from "@/types/asset.type";
import { useMapStore } from '@/stores/mapStore';


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

// Marker size scales with zoom (keep SVG readable across zoom levels)
const markerSize = computed(() => {
    const minSize = 18;
    const maxSize = 78;
    const baseZoom = 12;
    const sizePerZoom = 4;

    let size = 24 + (props.mapZoom - baseZoom) * sizePerZoom;
    size = Math.max(minSize, Math.min(maxSize, size));
    return size;
});


// - Follow state (map "follow" mode) ----------------------------------

const isFollowed = computed(() => mapStore.getFollow === props.asset.id);


// - Movement state (stopped / moving + direction) ---------------------

// Direction used to rotate the moving arrow marker (degrees from North)
const direction = ref<number | null>(null);

// Moving state derived from telemetry speed (with a small debounce/streak)
const SPEED_THRESHOLD = 0.5;    // treat <= 0.5 as "stopped"
const ZERO_STREAK_TO_STOP = 3;  // need N consecutive zeros to mark stopped
const isMoving = ref(false);
const zeroStreak = ref(0);

// Stationary marker is shown if we are stopped OR we have no direction yet
const showStationary = computed(() => !isMoving.value || direction.value == null);


// - Color behaviour ---------------------------------------------------
// Goal:
// 1) Default palette (idle/active)
// 2) Follow palette when user is following this asset
// 3) "Hot" window: when telemetry arrives, show active color for 120s, then return to idle

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

// --- Palette selection (depends on follow state)
const palette = computed(() => {
    return isFollowed.value ? FOLLOW_PALETTE : DEFAULT_PALETTE;
});

// --- "Hot" window (recent telemetry)
const isHot = ref(false);
const hotTimeout = ref<number | null>(null);

// --- Final colors used by SVG
const fillColor = computed(() => (isHot.value ? palette.value.activeFill : palette.value.idleFill));
const lineColor = computed(() => (isHot.value ? palette.value.activeLine : palette.value.idleLine));


// - Helpers (bearing calc) --------------------------------------------

function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

// Initial bearing from (lat1,lng1) -> (lat2,lng2) in degrees from North
function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δλ = toRad(lng2 - lng1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}


// - Watchers ----------------------------------------------------------

// --- Speed -> isMoving (with streak to avoid jitter)
watch(
    () => device.value?.last_telemetry?.speed,
    (raw) => {
        const speed = Number.isFinite(Number(raw)) ? Number(raw) : 0;

        if (speed > SPEED_THRESHOLD) {
            isMoving.value = true;
            zeroStreak.value = 0;
        } else {
            zeroStreak.value += 1;
            if (zeroStreak.value >= ZERO_STREAK_TO_STOP) {
                isMoving.value = false;
            }
        }
    },
    { immediate: true }
);

// --- Telemetry received -> active color for 120s
watch(
    () => device.value?.last_telemetry?.timestamp ?? null,
    (ts) => {
        if (ts == null) return;

        // mark as "hot" (active color)
        isHot.value = true;

        // restart the cooldown timer
        if (hotTimeout.value) clearTimeout(hotTimeout.value);
        hotTimeout.value = window.setTimeout(() => {
            isHot.value = false;

            // keep your existing "go idle" behaviour
            direction.value = null;
            isMoving.value = false;
        }, 120_000);
    }
);

// --- Lat/Lng changes:
// 1) update map center if followed
// 2) update marker position (replace object to force re-render)
// 3) compute direction (bearing) using previous point
watch(
    () => ({
        lat: device.value?.last_telemetry?.latitude ?? null,
        lng: device.value?.last_telemetry?.longitude ?? null,
    }),
    (pos, prev) => {
        if (pos.lat == null || pos.lng == null) return;

        // 1) Follow mode: keep map centered on this asset
        if (mapStore.getFollow == props.asset.id) {
            updateMapCenter!(pos.lat, pos.lng);
        }

        // 2) Move marker (new object -> re-render)
        markerOptions.value = {
            ...markerOptions.value,
            position: { lat: pos.lat, lng: pos.lng },
        };

        // 3) Update direction if we actually moved
        if (
            prev?.lat != null &&
            prev?.lng != null &&
            (prev.lat !== pos.lat || prev.lng !== pos.lng)
        ) {
            direction.value = bearing(prev.lat, prev.lng, pos.lat, pos.lng);
        }
    }
);

// // - (Existing) Map Center Panning Loggic ------------------------------
// // Kept as-is (even though lat/lng watcher already pans). Can remove later if redundant.
// watch(
//     () => ({
//         lat: device.value?.last_telemetry?.latitude ?? null,
//         lng: device.value?.last_telemetry?.longitude ?? null,
//     }),
//     (pos, prev) => {
//         if (pos.lat == null || pos.lng == null) return;

//         if (mapStore.getFollow == props.asset.id) {
//             updateMapCenter!(pos.lat, pos.lng);
//         }
//     }
// );


// fillColor.value = "#22c65e";
// fillColor.value = "#cc8899";
// fillColor.value = "#3754fa";
// fillColor.value = "#15A773";
</script>


<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>

.pulse {
    display: inline-block;
    background-color: inherit; // Choose a color that stands out
    //   padding: 10px;
    border-radius: 50%;
    animation: pulse-animation 2s infinite;

    @keyframes pulse-animation {
        0% {
            box-shadow: 0 0 0 0 currentColor;
        }

        70% {
            box-shadow: 0 0 0 10px rgba(52, 152, 219, 0);
        }

        100% {
            box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
        }
    }
}
</style>