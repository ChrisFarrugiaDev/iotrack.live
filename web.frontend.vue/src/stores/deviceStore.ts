import { ref, computed, toRaw } from 'vue'
import { defineStore } from 'pinia'
import type { Device } from '@/types/device.type';
import axios from '@/axios';
import { useAppStore } from './appStore';
import * as util from "@/util";

export const useDeviceStore = defineStore('deviceStore', () => {

    const appStore = useAppStore();

    // ---- State ------------------------------------------------------

    const devices = ref<Record<string, Device> | null>(null);


    // ---- Getters ----------------------------------------------------

    const getDevices = computed(() => devices.value);

    // Getter for a single device by id
    function useDevice(id: string) {
        return computed(() => devices.value?.[id] ?? null);
    }



    const uuidToIdMap = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};

        for (const id in devices.value) {
            const uuid = devices.value[id].uuid;
            map[uuid] = id;
        }

        return map;
    });

    // ---- Actions ----------------------------------------------------

    function clear() {
        devices.value = null
    }

    function setDevices(payload: Record<string, Device>) {
        devices.value = payload
    }

    function addDeviceToStore(d: Device) {
        if (!devices.value) devices.value = {};
        devices.value[d.id] = d
    }

    function removeDeviceFromStore(deviceId: string | number) {
        if (!devices.value) return;
        if (devices.value[deviceId]) {
            delete devices.value[deviceId];
        }
    }

    function addAssetToDeviceInStore(deviceId: string | number, assetId: string | number) {
        if (!devices.value) return;
        const device = devices.value[deviceId];
        if (device) {
            device.asset_id = String(assetId);
        }
    }

    function removeAssetToDeviceInStore(deviceId: string | number) {
        if (!devices.value) return;
        const device = devices.value[deviceId];
        if (device) {
            device.asset_id = null;
        }
    }

    function changeDeviceAssetID(deviceID: string, assetID: string | null) {
        const device = devices.value?.[deviceID];
        if (!device) return;
        device.asset_id = assetID ?? null;
    }

    function changeDeviceOrganisationID(deviceID: string, organisationID: string) {
        const device = devices.value?.[deviceID];

        if (!device) return;
        device.organisation_id = organisationID;
    }

    async function createDevice(payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}/api/device`;
            const result = await axios.post(url, payload);
            return result;

        } catch (err) {
            console.error('! deviceStore createDevice !\n', err);
            throw err;
        }
    }


    async function deleteDevices(payload: { device_ids: string[] }) {
        try {
            const url = `${appStore.getAppUrl}/api/device`;
            return await axios.request({
                method: 'DELETE',
                url,
                data: payload, // ok to include a body on DELETE
                // headers not needed here; interceptor sets Authorization + Content-Type when data exists
            });
        } catch (err) {
            console.error('! deviceStore deleteDevices !\n', err);
            throw err;
        }
    }

    async function updatedDevice(deviceId: string | number, payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}/api/device/${deviceId}`;
            return await axios.request({
                method: 'patch',
                url,
                data: payload,

            });
        } catch (err) {
            console.error('! deviceStore updatedDevice !\n', err);
            throw err;
        }
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Animation toggle
    const enableAnimation = true; // set false to disable smooth animation

    function updateWithLiveData(data: any) {
        if (!devices.value) return;

        const dev = devices.value[data.device_id];
        if (!dev || !dev.last_telemetry) return;

        const curLat = dev.last_telemetry.latitude;
        const curLng = dev.last_telemetry.longitude;

        const newLat = data.telemetry.latitude;
        const newLng = data.telemetry.longitude;

        // Optional: skip if no movement
        if (curLat === newLat && curLng === newLng) return;

        // Update non-position fields immediately
        dev.last_telemetry_ts = data.happened_at;
        const fields = ["altitude", "angle", "priority", "satellites", "speed", "timestamp"];
        for (const f of fields) dev.last_telemetry[f] = data.telemetry[f];
        dev.last_telemetry.elements = {
            ...dev.last_telemetry.elements,
            ...data.telemetry.elements,
        };

        if (enableAnimation && ( newLat + newLng )) {
            // Smooth movement
            const path = util.divideLine([curLat, curLng], [newLat, newLng], 40);
            queueMovement(data.device_id, dev, path, 25);
        } else if ( newLat + newLng ) {
            // Snap instantly to new position
            dev.last_telemetry.latitude = newLat;
            dev.last_telemetry.longitude = newLng;
        }
    }


    // -----------------------------------------------------------------------------------------------------------------
    // Global animator 
    interface AnimationState {
        dev: any;             // reference to the device object in your store
        path: number[][];     // points to traverse
        index: number;        // current index in path
        stepMs: number;       // how often to advance to the next point
        accMs: number;        // time accumulator
    }

    const activeAnimations = new Map<string | number, AnimationState>();

    let animatorRunning = false;
    let lastTs = 0;

    function startGlobalAnimator() {
        if (animatorRunning) return;
        animatorRunning = true;

        function loop(ts: number) {
            if (!lastTs) lastTs = ts;
            const delta = ts - lastTs;
            lastTs = ts;

            // Step all animations
            activeAnimations.forEach((anim, deviceId) => {
                anim.accMs += delta;

                // advance by as many steps as needed (handles frame drops)
                let steps = 0;
                while (anim.accMs >= anim.stepMs) {
                    anim.accMs -= anim.stepMs;
                    steps++;
                }

                if (steps === 0) return;

                anim.index = Math.min(anim.index + steps, anim.path.length - 1);
                const [lat, lng] = anim.path[anim.index];

                if (!anim.dev?.last_telemetry) anim.dev.last_telemetry = {};
                anim.dev.last_telemetry.latitude = lat;
                anim.dev.last_telemetry.longitude = lng;

                // done? remove from map
                if (anim.index >= anim.path.length - 1) {
                    activeAnimations.delete(deviceId);
                }
            });

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    // Call once on store/init (or first usage)
    startGlobalAnimator();

    // Enqueue/replace an animation for a device.
    function queueMovement(
        deviceId: string | number,
        dev: any,
        path: number[][],
        stepMs = 100
    ) {
        if (!path?.length) return;
        activeAnimations.set(deviceId, {
            dev,
            path,
            index: 0,
            stepMs,
            accMs: 0,
        });
    }

    // -----------------------------------------------------------------------------------------------------------------

    // - Expose --------------------------------------------------------
    return {
        getDevices,
        setDevices,
        clear,
        uuidToIdMap,
        createDevice,
        deleteDevices,
        addDeviceToStore,
        removeDeviceFromStore,
        updatedDevice,
        changeDeviceAssetID,
        changeDeviceOrganisationID,
        updateWithLiveData,
        useDevice,
        addAssetToDeviceInStore,
        removeAssetToDeviceInStore,
    };
});