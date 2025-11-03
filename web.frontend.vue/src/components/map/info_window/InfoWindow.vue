<template>
    <CustomMarker :options="markerOptions">
        <!-- zero-sized anchor that Google positions at lat/lng -->
        <div id="marker-anchor" ref="markerAnchor" class="marker-anchor">

            <!-- absolutely positioned card relative to the zero-sized anchor -->
            <div class="info-window marker-card sidebar v-ui" :data-theme="getSidebarTheme">

                <svg class="info-window__close" @click="setActiveInfoWindow!(null)">
                    <use xlink:href="@/ui/svg/sprite.svg#icon-close" />
                </svg>

                <div class="info-window__body">
                    <div class="info-window__title">{{ asset.name }}</div>

                    <img v-if="false" class="info-window__img"
                        :src="`${getAppUrl}/${getPrimaryImg.url}`"
                        alt="Primary image" />

                    <SmartImage v-if="getPrimaryImg" :image="getPrimaryImg"></SmartImage>

                    <div class="info-window__data" >

                        <div class="info-window__data-row" v-if="getRegNum">
                            <span class="info-window__key">Reg Num</span>
                            <span class="info-window__value">
                                <span>{{ getRegNum }}</span>
                            </span>
                        </div>

                        <div class="info-window__data-row" v-if="getDevice">
                            <span class="info-window__key">Device ID</span>
                            <span class="info-window__value">
                                <div>id: &nbsp; {{getDevice.id}}</div>
                                <div>{{getDevice.external_id_type}}:  &nbsp;  {{getDevice.external_id}}</div> 
                            </span>
                        </div>

                        <div class="info-window__data-row" v-if="getLastEventTimeElapsed">
                            <span class="info-window__key">Last Event</span>
                            <span class="info-window__value" v-if="getDevice?.last_telemetry_ts">
                                <div>{{ getLastEventTimeElapsed }}</div>
                                <div>{{ formatDateTime(getDevice?.last_telemetry_ts, tz ) }}</div>
                            </span>
                        </div>

                        <div class="info-window__data-row" v-if="getSpeed != null">
                            <span class="info-window__key">Speed</span>
                            <span class="info-window__value">
                                <span>{{ getSpeed }} km/hr</span>
                            </span>
                        </div>
                    </div>

                    <ActionButtons :asset="props.asset"></ActionButtons>
                </div>
            </div>

        </div>
    </CustomMarker>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { CustomMarker } from 'vue3-google-map'
import { useDeviceStore } from '@/stores/deviceStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { mapState, mapStores, storeToRefs } from 'pinia'
import type { Asset } from '@/types/asset.type'
import { useAppStore } from '@/stores/appStore'
import type { Device } from '@/types/device.type'
import { formatDateTime, timeElapsed } from '@/utils/dateTimeUtils'

import { useNowTick } from '@/composables/useNowTick'

import ActionButtons from './ActionButtons.vue'
import SmartImage from './SmartImage.vue'
import { useMapStore } from '@/stores/mapStore'


// - store -------------------------------------------------------------
const { getTheme } = storeToRefs(useDashboardStore());

const appStore = useAppStore();
const { getAppUrl } = storeToRefs(appStore);

const deviceStore = useDeviceStore();

const mapStore = useMapStore();


// - props -------------------------------------------------------------
const props = defineProps<{
    asset: Asset
    telemetry: any
}>();

// - provide & inject --------------------------------------------------

const setActiveInfoWindow = inject<(id: string | null) => void>('setActiveInfoWindow');

const smoothPanTo = inject<(target:{lat:number, lng:number}, duration:number) => void>('smoothPanTo');


// - Data --------------------------------------------------------------
const markerAnchor = ref<any>(null);
const now = useNowTick(1000);
const tz = ref<string>("Europe/Malta");

// - computed ----------------------------------------------------------

// theme
const getSidebarTheme = computed(() => (getTheme.value === 'light' ? 'light' : 'dark'))

// position
const markerOptions = computed(() => {
    const device = useDeviceStore().getDevices?.[props.asset.devices[0].id]
    const lat = device?.last_telemetry?.latitude ?? props.telemetry.latitude
    const lng = device?.last_telemetry?.longitude ?? props.telemetry.longitude

    return {
        position: { lat, lng },
        zIndex: 1000,
        // Some builds expose this on AdvancedMarkerElement; ignore TS if needed.
        // @ts-ignore
        collisionBehavior: 'REQUIRED',
    }
});

const getPrimaryImg = computed(() => { return props.asset?.attributes?.primary_image; });

const getDevice = computed(() => {
    const dd = props.asset?.devices;
    if (!dd || dd.length == 0) return null;
    const deviceID = dd[0].id;

    const devices = deviceStore.getDevices;
    if (!devices) return null;

    return devices[deviceID] as Device;
});

const getLastEventTimeElapsed = computed(() => {
    const ts = getDevice.value?.last_telemetry_ts
    if (!ts) return null
    void now.value
    return timeElapsed(ts, now.value)
})


const getSpeed = computed(() => {
    return getDevice.value?.last_telemetry?.speed
})


const getRegNum = computed(() => {
    return props.asset?.attributes?.vehicle?.registration_number;
});

// ---------------------------------------------------------------------

onMounted(()=> {
    
    setTimeout(()=>{
        markerAnchor.value.classList.add('marker-anchor__show');

        const {lat, lng} = markerOptions.value.position;
        // updateMapCenter!(lat, lng);
        smoothPanTo!({lat, lng}, 1000);

        // console.log(getDevice.value)
    }, 200);
});

onUnmounted(() => {
    // if asset is followed, set asset to center of map when info wind closes.
    if (mapStore.getFollow == null) return;
    const { lat, lng } = markerOptions.value.position;
    smoothPanTo!({ lat, lng }, 1000);
});

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>

/* Google positions THIS element. Keep it 0x0 so it won't block the map. */
.marker-anchor {
    position: relative;
    width: 0;
    height: 0;
    pointer-events: none;    
    overflow: visible;
    opacity: 0;
    transition: all .2s ease;
    // debug: add a dot if you want to see the anchor outline: 1px dashed crimson; width: 6px; height: 6px; border-radius: 50%;
}

.marker-anchor__show {
    opacity: 1 !important;
}

/* The actual card — absolutely positioned from the anchor */
/* card remains interactive */
.marker-card {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, calc(-100% - 32px));
    pointer-events: auto;    
}

.info-window {
    overflow: visible;
    padding: 1rem;
    border: 1px solid var(--color-zinc-800);
    background-color: var(--color-bg-li);
    color: var(--color-zinc-800);
    font-family: var(--font-display);
    font-size: .8rem;
    font-weight: 400;
    border-radius: var(--radius-md);
    
    &__close {
        width: .8rem;
        height: .8rem;
        position: absolute;
        top: .5rem;
        right: .5rem;
        opacity: .8;
        cursor: pointer;

        &:hover {
            opacity: 1;
        }
    }

    &__title {
        margin-bottom: 1rem;
        font-size: 1rem;
        text-align: center;
        font-weight: 600;
    }

    &__img {
        width: 14rem;
        height: 14rem;
        object-fit: cover;
        border-radius: var(--radius-sm);
        display: block;
    }

    &__data {
        margin-top: .5rem;
    }

    &__data-row {
        margin-bottom: .3rem;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: .5rem;
        margin-bottom: 6px;
    }

    &__key {
        opacity: .9;
    }

    &__value {
        font-family: var(--font-action);
        font-weight: 300;
        display: flex;
        flex-direction: column;
        gap: 3px;
        
    }
}

/* triangle border (outer) */
.info-window::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -18px;               // how far below the card it sits
  transform: translateX(-50%);
  border-style: solid;
  border-width: 18px 16px 0 16px; // height then half-widths
  border-color: var(--color-zinc-800) transparent transparent transparent;
  pointer-events: none;

}

/* triangle fill (inner) */
.info-window::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -16px;               // nudge up 1px to 2px to show the border “outline”
  transform: translateX(-50%);
  border-style: solid;
  border-width: 17px 16px 0 16px;
  border-color: var(--color-bg-li) transparent transparent transparent;
  pointer-events: none;
}

</style>
