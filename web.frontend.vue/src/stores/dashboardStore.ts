import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core';

export const useDashboardStore = defineStore('dashboardStore', () => {


	// ---- State ------------------------------------------------------

	const isUserMenuOpen = ref(false);
	const isLoading = ref(false);

	type Theme = 'light' | 'normal' | 'dark' ;
	const themeLocal = useLocalStorage<string>('iotrack.theme', 'normal');

	const theme = computed({
		get: () => themeLocal.value,
		set: (theme: Theme) => themeLocal.value = theme,
	})


	// ---- Getters ----------------------------------------------------

	const getIsUserMenuOpen = computed(()=>{
		return isUserMenuOpen.value;
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
		setIsLoading,
		getTheme,
		toggleTheme,
	};
})
