import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useFilterStore = defineStore('filterStore', () => {

    // ---- State ------------------------------------------------------

    // Organisation filter
    // Empty array = all organisations visible
    const deselectedOrgIDs = ref<(string | number)[]>([])

    // Asset type filter
    // Empty array = all asset types visible
    const deselectedAssetTypes = ref<(string | number)[]>([])

    // ---- Getters ----------------------------------------------------

    const hasOrgFilter = computed(() =>
        deselectedOrgIDs.value.length > 0
    )

    const hasAssetTypeFilter = computed(() =>
        deselectedAssetTypes.value.length > 0
    )

    const hasAnyFilter = computed(() =>
        hasOrgFilter.value || hasAssetTypeFilter.value
    )

    // ---- Actions ----------------------------------------------------

    // Organisation
    function setDeselectedOrgIDs(ids: (string | number)[]) {
        deselectedOrgIDs.value = [...ids]
    }

    function clearOrgFilter() {
        deselectedOrgIDs.value = []
    }

    // Asset type
    function setDeselectedAssetTypes(types: (string | number)[]) {
        deselectedAssetTypes.value = [...types]
    }

    function clearAssetTypeFilter() {
        deselectedAssetTypes.value = []
    }

    // Global
    function clearAllFilters() {
        clearOrgFilter()
        clearAssetTypeFilter()
    }

    // ---- Expose -----------------------------------------------------
    return {
        // state
        deselectedOrgIDs,
        deselectedAssetTypes,

        // getters
        hasOrgFilter,
        hasAssetTypeFilter,
        hasAnyFilter,

        // actions
        setDeselectedOrgIDs,
        clearOrgFilter,
        setDeselectedAssetTypes,
        clearAssetTypeFilter,
        clearAllFilters,
    }
})
