<template></template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useDeviceStore } from "@/stores/deviceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { storeToRefs } from "pinia";
import { io } from "socket.io-client";
import { onDeactivated, onUnmounted, watch } from "vue";

const devicesStore = useDeviceStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const { isAuthenticated } = storeToRefs(authStore);
const { accessibleDevices } = storeToRefs(settingsStore);

// let url = `${import.meta.env.VITE_APP_URL}:${import.meta.env.VITE_SOCKET_SIO_PORT}`;
let url = `${import.meta.env.VITE_APP_URL}`;
if (window.GO_DOCKERIZED === true) {
    url = `${import.meta.env.GO_APP_URL}`;
}
console.log(url)



// --- SOCKET.IO SETUP ---
const socket = io(url, {
    path: "/socket.io/",
    auth: { token: authStore.getJwt },
     transports: ["polling", "websocket"], // allow upgrade
     reconnection: true,
});

// Register listeners ONCE
socket.on("connect", () => {
    // Optional: log
    console.log("Socket connected", socket.id);

    // If we have devices/auth, join immediately
    if (isAuthenticated.value && accessibleDevices.value) {
        console.log( accessibleDevices.value)
        socket.emit("join-devices", accessibleDevices.value);
    }
});

socket.on("live-update", (msg) => {
    console.log("Live update:", msg);
    // TODO: commit to store / update UI
});



// --- WATCHER ---
// Only used to emit "join-devices" if user or accessibleDevices change
watch([isAuthenticated, accessibleDevices], ([authed, devices]) => {
    if (socket.connected && authed && devices) {
        socket.emit("join-devices", devices);
    }
}, { immediate: true });


onUnmounted(() => {

    socket.disconnect();
});

onDeactivated(() => {

    socket.disconnect();
})
</script>
