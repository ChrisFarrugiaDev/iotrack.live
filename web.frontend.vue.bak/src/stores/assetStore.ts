import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Asset } from '@/types/asset.type'

export const useAssetStore = defineStore('assetStore', () => {

    // ---- State ------------------------------------------------------
    const assets = ref<Record<string, Asset> | null>(null);

    // ---- Getters ----------------------------------------------------
    const getAssets = computed(() => assets.value);

    const uuidToIdMap = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};

        for (const id in assets.value) {
            const uuid = assets.value[id].uuid;
            map[uuid] = id;
        }

        return map;
    });

    // ---- Actions ----------------------------------------------------
    function setAssets(payload: Record<string, Asset>) {
        assets.value = payload;
    }

    function clear() {
        assets.value = null;
    }

    // ---- Expose -----------------------------------------------------
    return {
        getAssets,
        setAssets,
        uuidToIdMap,
        clear,
    }
})
