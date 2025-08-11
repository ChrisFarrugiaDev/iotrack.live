<template>
    <main class="vview__main">
        <section class="vview__section">
            <div class="heading--2 ">Devices</div>
            <TheFlashMessage></TheFlashMessage>

            <TheTabs
                class="mt-16"
                :tabsObjectData="tabsObjectData_1"
                :isDisabled="false"
                :layoutBreakpoint="500"
                @setActiveTab="setActiveTab"
                @click="clearMessage"
            ></TheTabs>

<RouterView v-slot="{ Component, route }">
  <KeepAlive>
    <component :is="Component" :key="route.fullPath" />
  </KeepAlive>
</RouterView>

        </section>
    </main>
</template>

<!-- --------------------------------------------------------------- -->
 
<script setup lang="ts">
import { reactive, watch, type Component } from 'vue';
import TheTabs from '@/components/commen/TheTabs.vue';
import { useRoute, useRouter } from 'vue-router';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';

// - Route -------------------------------------------------------------

const router = useRouter();
const route = useRoute();

// - Data --------------------------------------------------------------

type TabKey = 'devices.list' | 'devices.create';

// Reactive state to manage tab data and the active tab identifier
const tabsObjectData_1 = reactive({
    activeTab: 'devices.list' as TabKey,
    tabs: {
        'devices.list': 'Devices List',
        'devices.create': 'Register new Device',    
    },
});



// - Methods -----------------------------------------------------------

function setActiveTab(e: any) {
    tabsObjectData_1.activeTab = e as TabKey;
    router.push({ name: e });
}

function clearMessage() {
    // messageStore.clearFlashMessage();
}
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
// kjhkh
</style>