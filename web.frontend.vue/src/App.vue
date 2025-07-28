<template>
	<main class="dashboard">

		<section class="sidebar" v-if="showSideBar">
			<TheSidebar></TheSidebar>
		</section>

		<section class="page">
            <router-view v-slot="{ Component }">
                <template v-if="useKeepAlive">
                    <KeepAlive>
                        <component :is="Component" />
                    </KeepAlive>
                </template>
                <template v-else>
                    <component :is="Component" />
                </template>
            </router-view>
		</section>

	</main>

</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import TheUserMenu from './components/dashboard/TheUserMenu.vue';
import TheSidebar from './components/dashboard/TheSidebar.vue';
import { useDashboardStore } from './stores/dashboardStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from './stores/authStore';

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore();
const { getIsUserMenuOpen } = storeToRefs(dashboardStore);

const authStore = useAuthStore();
const { isAuthenticated, getRedirectTo } = storeToRefs(authStore);

// - Routes ------------------------------------------------------------

const route = useRoute();
const router = useRouter();


// - Page scrolling ----------------------------------------------------

// const htmlEL = document.querySelector('html');
// const isLocked = useScrollLock(htmlEL);
// isLocked.value = getPageScrollDisabled.value;
// watch(getPageScrollDisabled, (val) => {
//     isLocked.value = val
// });

// - Clear keepalive when logged out -----------------------------------

const useKeepAlive = ref(true);  // Initially use KeepAlive

function handleLogout() {
  useKeepAlive.value = false;  // Turn off KeepAlive on logout
  setTimeout(() => { useKeepAlive.value = true; }, 100); // Reactivate KeepAlive after a brief pause
}

watch(()=>authStore.getLogCounter, ()=>{
    handleLogout();
})

// - Computed ----------------------------------------------------------

const showSideBar = computed(() => {
    return !['loginView', 'forgotPasswordView', 'resetPasswordView'].includes(route.name as string)
});

// - Wachers -----------------------------------------------------------

watch(isAuthenticated, (newVal) => {

    // If not authenticated, and already on an auth-related view, do nothing
    if (!newVal && ['loginView', 'forgotPasswordView', 'resetPasswordView'].includes(route.name as string)) {
        return
    }
	// If authenticated Redirect to the saved "redirectTo" route
    if (newVal) {
        router.push({ name: getRedirectTo.value });
		return;
    } 
    // If not authenticated and not on an auth view, redirect to login
	router.push({ name: "loginView" });
}, {
    immediate: true,
});

// - Methods -----------------------------------------------------------

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