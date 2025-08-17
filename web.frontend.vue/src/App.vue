<template>
    <main class="dashboard v-ui">

        <VueLoadingOverlay :active="getIsLoading" :is-full-page="true" :lock-scroll="true" :width="256" :height="256"
            transition="fade" :opacity="0.5" />

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
import VueLoadingOverlay from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import TheSidebar from './components/dashboard/TheSidebar.vue';
import { useDashboardStore } from './stores/dashboardStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from './stores/authStore';
import { useAppStore } from './stores/appStore';
import axios from '@/axios';
import { useDeviceStore } from './stores/deviceStore';
import { useAssetStore } from './stores/assetStore';
import { useOrganisationStore } from './stores/organisationStore';
import { useSettingsStore } from './stores/settingsStore';

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore();
const { getIsUserMenuOpen, getIsLoading } = storeToRefs(dashboardStore);

const authStore = useAuthStore();
const { isAuthenticated, getRedirectTo } = storeToRefs(authStore);


const appStore = useAppStore();
const { getShouldFetchAccessProfile } = storeToRefs(appStore);


const deviceStore = useDeviceStore();
const assetStore = useAssetStore();
const organisationStore = useOrganisationStore();
const settingsStore = useSettingsStore();

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

watch(() => authStore.getLogCounter, () => {
    handleLogout();
})

// - Computed ----------------------------------------------------------

const showSideBar = computed(() => {
    return !['login.view', 'forgot.password.view', 'reset.password.view'].includes(route.name as string)
});

// - Wachers -----------------------------------------------------------

watch(isAuthenticated, async (newVal) => {

    // If not authenticated, and already on an auth-related view, do nothing
    if (!newVal && ['login.view', 'forgot.password.view', 'reset.password.view'].includes(route.name as string)) {
        return
    }
    // If authenticated Redirect to the saved "redirectTo" route
    if (newVal && ['login.view', 'forgot.password.view', 'reset.password.view'].includes(route.name as string)) {
        await fetchAccessProfile();
        router.push({ name: getRedirectTo.value });
        return;
    }
    // If not authenticated and not on an auth view, redirect to login
    if (!newVal) {
        router.push({ name: "login.view" });
    }
}, {
    immediate: true,
});



watch(getShouldFetchAccessProfile, async (newVal) => {
    if (newVal && isAuthenticated.value) {
        await fetchAccessProfile();
    }
}, {
    immediate: true,
});


// App.vue <script setup lang="ts">
async function fetchAccessProfile() {

    dashboardStore.setIsLoading(true);

    try {
        // Prefer an axios baseURL; otherwise build it cleanly:
        const url = `${appStore.getAppUrl}:${appStore.getApiPort}/api/access-profile`;

        const response = await axios.get(url); // JWT via interceptor

        if (response.status === 200) {
            const profile = response.data.data.access_profile; // controller returns { success, data: profile }

            deviceStore.setDevices(profile.devices);
            assetStore.setAssets(profile.assets);
            organisationStore.setOrganisation(profile.organisation);
            organisationStore.setOrganisationScope(profile.organisation_scope);
            settingsStore.setMapsApiKey(profile.settings?.maps_api_key);
        }
        appStore.setShouldFetchAccessProfile(false);
    } catch (err) {
        // optional: if 401/403 -> force logout
        // authStore.logout();
        console.error('fetchAccessProfile failed', err);
    } finally {
        setTimeout(() => {
            dashboardStore.setIsLoading(false);
        }, 100);
    }
};

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