<template>
    <div>

    </div>
</template>

<script setup lang="ts">
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useMapStore } from '@/stores/mapStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const mapStore = useMapStore();

onActivated(async() => {
    try {

    } catch (err: any) {

    } finally {
        
        useOrganisationStore().clear();
        useDeviceStore().clear();
        useAssetStore().clear();
        useSettingsStore().clear();
        

        // Clear keepalive when logged out
        authStore.updateLogCounter();
        authStore.clearJwt();
        mapStore.clear();

        // Always clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();
        

        // Navigate to the login view regardless of the outcome of the above operations
        router.push({ name: 'login.view' });
    }
})

</script>

<style scoped lang="scss">
</style>