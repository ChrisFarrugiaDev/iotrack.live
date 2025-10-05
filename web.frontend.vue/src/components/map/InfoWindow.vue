<template>
    <CustomMarker :options="markerOptions" v-if="asset.id == '17'">
        <div class="a">Hello</div>
    </CustomMarker>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDeviceStore } from '@/stores/deviceStore';
import type { Asset } from '@/types/asset.type';
import { computed } from 'vue';

import { CustomMarker} from "vue3-google-map";


// - Props -------------------------------------------------------------
const props = defineProps<{
    asset: Asset
   
    telemetry: any,
}>();


const markerOptions = computed(() => {
    const device = useDeviceStore().getDevices![props.asset.devices[0].id]

        return {position :{
        lat: device.last_telemetry?.latitude ?? props.telemetry.latitude,
        lng: device.last_telemetry?.longitude ?? props.telemetry.longitude,
    }}
})
console.log(props.asset)
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.a{
    background-color: white;
    width: 5rem;
    height: 5rem;
    border: 1px solid crimson;
    transform: translateY(-5rem);
    display: none;
}
</style>