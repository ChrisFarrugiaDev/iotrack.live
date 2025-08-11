import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Asset } from '@/types/asset.type'

export const useAssetStore = defineStore('assetStore', () => {

    // ---- State ------------------------------------------------------
    const assets = ref<Record<string, Asset> | null>(null);

    // ---- Getters ----------------------------------------------------
    const getAssets = computed(() => assets.value);

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
        clear,
    }
})
