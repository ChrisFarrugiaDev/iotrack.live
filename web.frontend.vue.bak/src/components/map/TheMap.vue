<template>
	<div class="the-map">
		<GoogleMap v-if="apiKey" :api-key="apiKey" :center="initMapCenter" :zoom="initMapZoom"
			style="width: 100%; height: 100vh" :mapId="'9e8ca8994cbac798'" ref="mapRef"
			@zoom_changed="handleZoomChanged" @center_changed="handleCenterChanged">
			<div v-for="asset in getAssetsWithDevice">

				<MarkerVehicle v-if="asset.asset_type == 'vehicle'" :asset="asset" :map-zoom="getMapZoomLevel ?? 15"
					:telemetry="asset.devices[0].last_telemetry">
				</MarkerVehicle>

				<MarkerPersonal v-else-if="asset.asset_type == 'personal'" :asset="asset"
					:map-zoom="getMapZoomLevel ?? 15" :telemetry="asset.devices[0].last_telemetry">
				</MarkerPersonal>

				<MarkerAsset v-else :asset="asset" :map-zoom="getMapZoomLevel ?? 15"
					:telemetry="asset.devices[0].last_telemetry">
				</MarkerAsset>

				<InfoWindow v-if="getActiveInfoWindow == asset.id" :asset="asset"
					:telemetry="asset.devices[0].last_telemetry"></InfoWindow>

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
import { useMapStore, type MapCenterType } from "@/stores/mapStore";

// -- store ------------------------------------------------------------
const settingsStore = useSettingsStore();
const { getMapsApiKey } = storeToRefs(settingsStore);

const assetStore = useAssetStore();
const { getAssetsWithDevice } = storeToRefs(assetStore)

const mapStore = useMapStore();
const { getActiveInfoWindow, getMapZoomLevel, getMapCenter } = storeToRefs(mapStore);


// -- data -------------------------------------------------------------
const apiKey = ref<string | undefined>("");
const mapRef = ref<any>(null);

const initMapZoom = ref<number>(15);
const initMapCenter = ref<MapCenterType>({ lat: 35.900, lng: 14.517 });


// -- watchers ---------------------------------------------------------
// This will run if getMapsApiKey is a computed ref or a getter that updates reactively
watch(getMapsApiKey, (newKey) => {
	apiKey.value = newKey;

}, { immediate: true }); // Run right away



watch(() => mapRef.value?.ready, (ready) => {
	if (!ready) return

	if (getMapZoomLevel.value == null || getMapCenter.value == null) {
		extendsMapToMarkers();
		return
	}
	if (getMapZoomLevel.value == 0 && getMapCenter.value?.lat == 0 && getMapCenter.value?.lng == 0) {
		extendsMapToMarkers();
		return
	}

	initMapZoom.value = getMapZoomLevel.value;
	initMapCenter.value = getMapCenter.value;

});

// -- methods ----------------------------------------------------------

function handleZoomChanged() {
	if (mapRef.value?.map) {
		const mapZoomLevel: number = mapRef.value.map.getZoom();
		mapStore.setMapZoomLevel(mapZoomLevel);
	}
}

function handleCenterChanged() {
	if (mapRef.value?.map) {

		mapStore.setMapCenter(Number(mapRef.value.map.center.lat()), Number(mapRef.value.map.center.lng()));
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

function updateMapCenter(lat: number, lng: number) {
	const center: MapCenterType = { lat, lng };

	if (mapRef.value?.map) {

		smoothPanTo(center);

		mapStore.setMapCenter(lat, lng);
	}
}


function smoothPanTo(target: { lat: number; lng: number }, duration = 1000) {
	if (!mapRef.value?.map) return;

	const map = mapRef.value.map;
	const start = map.getCenter();
	const startLat = start.lat();
	const startLng = start.lng();

	const deltaLat = target.lat - startLat;
	const deltaLng = target.lng - startLng;

	const startTime = performance.now();

	function animate(currentTime: number) {
		const elapsed = currentTime - startTime;
		const t = Math.min(elapsed / duration, 1);

		// Smooth easing (easeInOutQuad)
		const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

		const newLat = startLat + deltaLat * ease;
		const newLng = startLng + deltaLng * ease;

		map.setCenter({ lat: newLat, lng: newLng });

		if (t < 1) requestAnimationFrame(animate);
	}

	requestAnimationFrame(animate);
}

// - provide & inject --------------------------------------------------

provide('setActiveInfoWindow', setActiveInfoWindow);
provide('updateMapCenter', updateMapCenter);

</script>
<!-- --------------------------------------------------------------- -->
<style lang="scss" scoped>
.the-map {

	min-height: 100vh;
	width: 100%;
	background-color: #90DAEE;

}
</style>