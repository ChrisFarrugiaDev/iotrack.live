<template>
	<main class="dashboard">

		<section class="modal" v-if="getIsUserMenuOpen && showSideBar">
			<TheUserMenu></TheUserMenu>
		</section>

		<section class="sidebar" v-if="showSideBar">
			<TheSidebar></TheSidebar>
		</section>

		<section class="page">
            <router-view></router-view>
		</section>

	</main>

</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import TheUserMenu from './components/dashboard/TheUserMenu.vue';
import TheSidebar from './components/dashboard/TheSidebar.vue';
import { useDashboardStore } from './stores/dashboardStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore();
const { getIsUserMenuOpen } = storeToRefs(dashboardStore);

// - Routes ------------------------------------------------------------

const route = useRoute();


// - Page scrolling ----------------------------------------------------

// const htmlEL = document.querySelector('html');
// const isLocked = useScrollLock(htmlEL);
// isLocked.value = getPageScrollDisabled.value;
// watch(getPageScrollDisabled, (val) => {
//     isLocked.value = val
// });

// - Clear keepalive when logged out -----------------------------------

const useKeepAlive = ref(true);  // Initially use KeepAlive

// function handleLogout() {
//   useKeepAlive.value = false;  // Turn off KeepAlive on logout
//   setTimeout(() => { useKeepAlive.value = true; }, 100); // Reactivate KeepAlive after a brief pause
// }

// watch(()=>authStore.getLogCounter, ()=>{
//     handleLogout();
// })

// - Computed ----------------------------------------------------------

const showSideBar = computed(() => {
    return !['loginView', 'forgotPasswordView', 'resetPasswordView'].includes(route.name as string)
});

// - Methods -----------------------------------------------------------

// Close the user menu when clicks outside the user menu and top bar image
function closeUserMenuOnClickOutside() {
	document.querySelector('body')?.addEventListener('click', (e: MouseEvent)=>{
		const  target = e.target as HTMLElement;
		const userMenuOrBtn =target.closest('#the-user-menu') ||target.closest('#menu-btn');
		if (!userMenuOrBtn) {
            dashboardStore.updateUserMenuState(false);
        }
	})
}

// - Hooks -------------------------------------------------------------

onMounted(() => {
	closeUserMenuOnClickOutside();
});

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>

.page {
	grid-column: 1/3;
}

.sidebar {
    position: fixed;
    top: 0rem;
    bottom: 0;
    left: 0;
	z-index: 20;
}
.dashboard {
	background-color: $col-slate-50;
	display: grid;
	grid-template-columns: 4rem 1fr;
	min-height: 100vh;
	width: 100vw;
}

	.modal {
		position: fixed;
		left: 4.25rem;
		top: .25rem;
		z-index: 500;
	}

</style>