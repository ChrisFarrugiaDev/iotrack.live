<template>
	<div class="the-map">
		<GoogleMap v-if="apiKey" :api-key="apiKey" :center="center" :zoom="15" style="width: 100%; height: 100vh"
			:mapId="'9e8ca8994cbac798'"  ref="mapRef" @zoom_changed="handleZoomChanged">
			<div v-for="asset in getAssetsWithDevice">

				<MarkerVehicle v-if="asset.asset_type == 'vehicle'" 
					:asset="asset" 
					:map-zoom="mapZoom" 
					:telemetry="asset.devices[0].last_telemetry"
					
					>					
				</MarkerVehicle>

				<MarkerPersonal v-else-if="asset.asset_type == 'personal'"
					:asset="asset" 
					:map-zoom="mapZoom" 
					:telemetry="asset.devices[0].last_telemetry"
					 >
				</MarkerPersonal>

				<MarkerAsset v-else
					:asset="asset" 
					:map-zoom="mapZoom" 
					:telemetry="asset.devices[0].last_telemetry"
					 >
				</MarkerAsset>

				<InfoWindow v-if="getActiveInfoWindow == asset.id" :asset="asset" :telemetry="asset.devices[0].last_telemetry" ></InfoWindow>

			</div>
		</GoogleMap>
		<div v-else>Loading map...</div>
	</div>
</template>
<!-- v-if="asset.asset_type == 'vehicle'" -->
<!-- --------------------------------------------------------------- -->
<script setup lang="ts">

import { useAssetStore } from "@/stores/assetStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { storeToRefs } from "pinia";
import { onBeforeMount, onMounted, provide, ref, watch } from "vue";
import { GoogleMap } from "vue3-google-map";
import MarkerVehicle from "./MarkerVehicle.vue";
import MarkerPersonal from "./MarkerPersonal.vue";
import MarkerAsset from "./MarkerAsset.vue";
import InfoWindow from "./InfoWindow.vue";
import { useMapStore } from "@/stores/mapStore";

// -- store ------------------------------------------------------------
const settingsStore = useSettingsStore();
const { getMapsApiKey } = storeToRefs(settingsStore);

const assetStore = useAssetStore();
const { getAssetsWithDevice } = storeToRefs(assetStore)

const mapStore = useMapStore();
const { getActiveInfoWindow } = storeToRefs(mapStore);


// -- data -------------------------------------------------------------
const apiKey = ref<string | undefined>("");
const center = ref({ lat: 35.900, lng: 14.517 });
const mapRef = ref<any>(null);
const mapZoom = ref<number>(15)


// -- watchers ---------------------------------------------------------
// This will run if getMapsApiKey is a computed ref or a getter that updates reactively
watch(getMapsApiKey, (newKey) => {
	apiKey.value = newKey;

}, { immediate: true }); // Run right away



watch(() => mapRef.value?.ready, (ready) => {
	if (!ready) return
	extendsMapToMarkers();
})

// -- methods ----------------------------------------------------------

function handleZoomChanged() {
    if (mapRef.value?.map) {
        mapZoom.value = mapRef.value.map.getZoom()
    }
}

function extendsMapToMarkers() {
	// Get all assets that have a device
	const assets = getAssetsWithDevice.value;

	// Exit if there are no assets, or the map/api is not ready
	if (!assets.length || !mapRef.value?.map || !mapRef.value?.api) return;

	// Create a new bounds object to fit all markers
	const bounds = new mapRef.value.api.LatLngBounds();

	// Loop through each asset
	for (const a of assets) {
		// Get the latest telemetry from the first device
		const t = a.devices[0]?.last_telemetry;
		if (!t) continue; // Skip if telemetry is missing

		// Parse lat/lng as numbers
		const pt = { lat: Number(t.latitude), lng: Number(t.longitude) };

		// Only extend bounds if lat/lng are valid numbers
		if (Number.isFinite(pt.lat) && Number.isFinite(pt.lng)) bounds.extend(pt);
	}

	// Fit the map to the bounds if any valid points were found
	if (!bounds.isEmpty()) mapRef.value.map.fitBounds(bounds);
}

function setActiveInfoWindow(id: string | null) {

	mapStore.setActiveInfoWindow(id);
}

// - provide & inject --------------------------------------------------

provide('setActiveInfoWindow', setActiveInfoWindow);

</script>
<!-- --------------------------------------------------------------- -->
<style lang="scss" scoped>
.the-map {

	min-height: 100vh;
	width: 100%;
	background-color: #90DAEE;

}
</style>