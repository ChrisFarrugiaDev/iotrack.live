import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboardStore', () => {

	// ---- State ------------------------------------------------------

	const isUserMenuOpen = ref(false);
	const isLoading = ref(false);

	// ---- Getters ----------------------------------------------------

	const getIsUserMenuOpen = computed(()=>{
		return isUserMenuOpen.value;
	});

	const getIsLoading = computed(() => isLoading.value )

	// ---- Actions ----------------------------------------------------

	function toggleUserMenuState() {

		isUserMenuOpen.value = !isUserMenuOpen.value;
	}

	function updateUserMenuState(val: boolean) {
		isUserMenuOpen.value = val;
	}

	function setIsLoading(val: boolean) {
		isLoading.value = val;
	}

	// - Expose --------------------------------------------------------
	return {
		getIsUserMenuOpen,
		toggleUserMenuState,
		updateUserMenuState,
		getIsLoading,
		setIsLoading
	};
})
