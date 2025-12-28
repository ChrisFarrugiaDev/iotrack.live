<template>
    <div class="asset-item" :style="{ order: getFlexOrder }" @click="setActiveInfoWindow!(asset.id)">
        <KeepAlive>

            <SmartImage class="asset-item__thumb" v-if="asset?.attributes?.primary_image"
                :image="asset?.attributes?.primary_image">
            </SmartImage>
        </KeepAlive>

        <div class="asset-item__content content">
            <div class="content__title">
                <span class="content__name">{{ asset.name }}</span>
                <span class="content__id">#{{ asset.id }}</span>
            </div>
            <div v-if="getRegistrationNumber" class="content__registration No">{{ getRegistrationNumber }}</div>
            <div class="content__speed">Speed {{ getSpeed }}</div>
            <div class="content__last_event">{{ formatDateTime(getDevice?.last_telemetry_ts!, tz ) }}</div>
            <div class="content__last_event">{{ getLastEventTimeElapsed }}</div>


     
            <!-- <div class="content__driver">Christoper Farrugis</div> -->
            <!-- <div class="content__fuel">Fuel 35%</div> -->
         
        </div>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import type { Asset } from '@/types/asset.type';
import SmartImage from '../info_window/SmartImage.vue';
import { computed, inject, onMounted, ref } from 'vue';
import { useNowTick } from '@/composables/useNowTick';
import { formatDateTime, timeElapsed } from '@/utils/dateTimeUtils';
import { useDeviceStore } from '@/stores/deviceStore';


// - provide & inject --------------------------------------------------

const setActiveInfoWindow = inject<(id: string) => void>('setActiveInfoWindow');


// - Composable --------------------------------------------------------
const now = useNowTick(1000);

// - Props -------------------------------------------------------------
const props = defineProps<{
    asset: Asset
}>()

// - Store -------------------------------------------------------------

const deviceStore = useDeviceStore();

// - Data --------------------------------------------------------------

const tz = ref<string>("Europe/Malta");

// - Computed ----------------------------------------------------------
const getRegistrationNumber = computed(() => {
    return props.asset?.attributes?.vehicle?.registration_number;
});

const getDevice = computed(() => {
    const id = props.asset?.devices?.[0]?.id;
    if (!id) return null;
    return deviceStore.getDevices?.[id] ?? null;
});

const getSpeed = computed(() => {
    const SPEED_CONVERSIONS: Record<string, { factor: number; label: string }> = {
        kmh: { factor: 1, label: 'km/h' },
        mph: { factor: 0.621371, label: 'mph' },
        knots: { factor: 0.539957, label: 'kn' },
        ms: { factor: 0.277778, label: 'm/s' },
    };

    const round1 = (value: number) => Math.round(value * 10) / 10;

    if (!getDevice.value?.last_telemetry) return null;

    const baseSpeed = getDevice.value?.last_telemetry?.speed; // km/h   
    
    

    const speedUnit = props.asset?.attributes?.vehicle?.speed_unit ?? 'kmh';
    const conversion = SPEED_CONVERSIONS[speedUnit] ?? SPEED_CONVERSIONS.kmh;

    const convertedSpeed = round1(baseSpeed * conversion.factor);

    return `${convertedSpeed} ${conversion.label}`;
});



const getLastEventTimeElapsed = computed(() => {
    const ts = getDevice.value?.last_telemetry_ts;
    if (!ts) return null;
    void now.value; // force tick dependency
    return timeElapsed(ts, now.value).label;
});
const getMinutesAgo = computed(() => {
    const ts = getDevice.value?.last_telemetry_ts;
    if (!ts) return null;
    void now.value; // force tick dependency
    return timeElapsed(ts, now.value).minutesAgo;
});

const getFlexOrder = computed(() => {
  const mins = getMinutesAgo.value;
  // push assets with no telemetry to the bottom
  return mins == null ? 999999 : mins;
});



</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.asset-item {
    cursor: pointer;
    display: flex;
    gap: .5rem;
    font-family: var(--font-action);
    font-size: .85rem;
    min-height: fit-content;

    border-bottom: 1px var(--color-zinc-300) solid;
    padding-bottom: 1rem;

    &:last-of-type {
        border-bottom: none;
        padding-bottom: 0;
    }

    &__thumb {
        width: 8rem;
        height: 8rem;
        border: 1px solid var(--color-zinc-600);
        border-radius: var(--radius-md);
        overflow: hidden;

        img {
            object-fit: cover;
            width: 100%;
            height: 100%;
        }
    }

    &__content {
        // asset main info container
    }
}

.content {



    &__title {

        display: flex;
        gap: 3px;
    }

    &__name {
        font-weight: 700;
    }

    // &__meta {}
    // &__status {}

    // Optional future modifiers
    // &__item--active {}
    // &__item--selected {}
    // &__item--offline {}
}
</style>