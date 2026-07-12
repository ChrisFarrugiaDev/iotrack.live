import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core';

export const useDashboardStore = defineStore('dashboardStore', () => {


	// ---- State ------------------------------------------------------

	const isUserMenuOpen = ref(false);
	const isReportsMenuOpen = ref(false);
	const isLoading = ref(false);

	type Theme = 'light' | 'normal' | 'dark' ;
	const themeLocal = useLocalStorage<string>('iotrack.theme', 'normal');

	const theme = computed({
		get: () => themeLocal.value,
		set: (theme: Theme) => themeLocal.value = theme,
	});


	// ---- Getters ----------------------------------------------------

	const getIsUserMenuOpen = computed(()=>{
		return isUserMenuOpen.value;
	});

	const getIsReportsMenuOpen = computed(()=>{
		return isReportsMenuOpen.value;
	});

	const getIsLoading = computed(() => isLoading.value )

	const getTheme = computed(() => theme.value);

	// ---- Actions ----------------------------------------------------

	function toggleTheme() {
		switch (theme.value) {
			case 'normal':
				theme.value = 'dark';
				break;
			case 'dark':
				theme.value = 'light';
				break;		
			default:
				theme.value = 'normal';
				break;
		}

	}

	// Only one sidebar flyout is open at a time.
	function toggleUserMenuState() {

		isUserMenuOpen.value = !isUserMenuOpen.value;
		if (isUserMenuOpen.value) isReportsMenuOpen.value = false;
	}

	function updateUserMenuState(val: boolean) {
		isUserMenuOpen.value = val;
	}

	function toggleReportsMenuState() {

		isReportsMenuOpen.value = !isReportsMenuOpen.value;
		if (isReportsMenuOpen.value) isUserMenuOpen.value = false;
	}

	function updateReportsMenuState(val: boolean) {
		isReportsMenuOpen.value = val;
	}

	function setIsLoading(val: boolean) {
		isLoading.value = val;
	}

	// - Expose --------------------------------------------------------
	return {
		getIsUserMenuOpen,
		toggleUserMenuState,
		updateUserMenuState,
		getIsReportsMenuOpen,
		toggleReportsMenuState,
		updateReportsMenuState,
		getIsLoading,
		setIsLoading,
		getTheme,
		toggleTheme,
	};
})
