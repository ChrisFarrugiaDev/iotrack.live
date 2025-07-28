<template>
    <div>

    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

onActivated(async() => {
    try {

    } catch (err: any) {

    } finally {

        // Clear keepalive when logged out
        authStore.updateLogCounter();

        // Always clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Navigate to the login view regardless of the outcome of the above operations
        router.push({ name: 'loginView' });
    }
})

</script>

<style scoped></style>