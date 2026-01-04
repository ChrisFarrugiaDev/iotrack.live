import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core';

export type ActivityMode = 'none' | 'active' | 'inactive'

export const useFilterStore = defineStore('filterStore', () => {

    // ---- State ------------------------------------------------------

    // Organisation filter
    // Empty array = all organisations visible
    const deselectedOrgIDs = useLocalStorage<(string | number)[]>(
        'iotrack.filter.deselected-org-ids',
        []
    );

    // Asset type filter
    // Empty array = all asset types visible
    const deselectedAssetTypes = useLocalStorage<(string | number)[]>(
        'iotrack.filter.deselected-asset-types',
        []
    );

    // Activity filter
    const activityMode = useLocalStorage<ActivityMode>(
        'iotrack.filter.activity-mode',
        'none'
    );

    // Store date as ISO string (localStorage-safe)
    const activityDateISO = useLocalStorage<string | null>(
        'iotrack.filter.activity-date',
        null
    );

    // Derived Date (keeps your existing logic intact)
    const activityDate = computed<Date | null>(() => {
        return activityDateISO.value
            ? new Date(activityDateISO.value)
            : null;
    });


    // Search filter
    const searchFilter = ref<string>("");

    // ---- Getters ----------------------------------------------------

    const hasOrgFilter = computed(() =>
        deselectedOrgIDs.value.length > 0
    )

    const hasAssetTypeFilter = computed(() =>
        deselectedAssetTypes.value.length > 0
    )

    const hasActivityFilter = computed(() =>
        activityMode.value !== 'none' && activityDate.value !== null
    )

    const hasSearchFilter = computed(() =>
        searchFilter.value.trim().length > 0
    )

    const hasAnyFilter = computed(() =>
        hasOrgFilter.value ||
        hasAssetTypeFilter.value ||
        hasActivityFilter.value ||
        hasSearchFilter.value
    );

    // ---- Actions ----------------------------------------------------

    // Organisation
    function setDeselectedOrgIDs(ids: (string | number)[]) {
        deselectedOrgIDs.value = [...ids]
    }

    // Asset type
    function setDeselectedAssetTypes(types: (string | number)[]) {
        deselectedAssetTypes.value = [...types]
    }

    // Activity
    function setActivityMode(mode: ActivityMode) {
        activityMode.value = mode;

        // semantic rule: no date if mode is none
        if (mode === 'none') {
            activityDateISO.value = null;
        }
    }

    function setActivityDate(date: Date) {
        activityDateISO.value = date.toISOString();
    }

    function clearOrgFilter() {
        deselectedOrgIDs.value = []
    }

    function clearAssetTypeFilter() {
        deselectedAssetTypes.value = []
    }

    function clearActivityFilter() {
        activityMode.value = 'none';
        activityDateISO.value = null;
    }

    // Global
    function clearAllFilters() {
        clearOrgFilter()
        clearAssetTypeFilter()
        clearActivityFilter()
    }

    // ---- Expose -----------------------------------------------------
    return {
        // state
        deselectedOrgIDs,
        deselectedAssetTypes,
        activityMode,
        activityDate,
        activityDateISO,
        searchFilter,

        // getters
        hasOrgFilter,
        hasAssetTypeFilter,
        hasActivityFilter,
        hasSearchFilter,
        hasAnyFilter,

        // actions
        setDeselectedOrgIDs,
        clearOrgFilter,
        setDeselectedAssetTypes,
        clearAssetTypeFilter,
        setActivityMode,
        setActivityDate,
        clearActivityFilter,
        clearAllFilters,
    }
})
