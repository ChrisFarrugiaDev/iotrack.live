import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {  useSessionStorage } from '@vueuse/core';


export type MapCenterType = {
    lat: number;
    lng: number;
}

export const useMapStore = defineStore('mapStore', () => {

    // ---- State ------------------------------------------------------
    const activeInfoWindow = ref<string | null>(null);
    const follow = ref<string | null>(null);
    const mapZoomLevel = useSessionStorage<number | null>("map-zoom-level", null);
    const mapLat = useSessionStorage<number | null>("map-lat", null);
    const mapLng = useSessionStorage<number | null>("map-lng", null);

    // ---- Getters ----------------------------------------------------
    const getActiveInfoWindow = computed(() => {
        return activeInfoWindow.value;
    });

    const getMapZoomLevel = computed(() => {
        if (!mapZoomLevel.value) null;
        return Number(mapZoomLevel.value);
        
    });

    const getMapCenter = computed(() => { 
        if (!mapLat.value || !mapLng.value) null;
        return {lat: Number(mapLat.value), lng: Number(mapLng.value)};
    });

    const getFollow = computed(() => follow.value );


    // ---- Actions ----------------------------------------------------
    function setActiveInfoWindow (id: string | null)  {
        if (activeInfoWindow.value == id) {
            activeInfoWindow.value = null;
            follow.value = null;
        } else {
            activeInfoWindow.value = id;
            follow.value = id;
        }
    }

    function setMapZoomLevel(z: number) {
        mapZoomLevel.value = z;
    }

    function setMapCenter(lat: number, lng: number) {
        mapLat.value = lat;
        mapLng.value = lng;     
    }

    function clear() {
         mapZoomLevel.value = null;
         mapLat.value = null;
         mapLng.value = null;
    }

    function setFollow(id: string | null) {
        follow.value = id;
    }

    // - Expose --------------------------------------------------------
    return {
         clear,
        getActiveInfoWindow,
        setActiveInfoWindow,
        getMapZoomLevel,
        getMapCenter,
        setMapZoomLevel,
        setMapCenter,
        getFollow,
        setFollow,
    };
});
