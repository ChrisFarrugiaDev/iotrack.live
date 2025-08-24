<template>
    <Vview>

        <div class="vheading--2 ">Devices</div>
        <TheFlashMessage></TheFlashMessage>   


        <VTabs class="mt-16" :vtabsObjectData="tabsObjectData_1" :isDisabled="false" :layoutBreakpoint="500" 
           @setActiveTab="setActiveTab" @click="clearMessage">
        </VTabs>
    
        <RouterView v-slot="{ Component, route }">
            <KeepAlive>
                <component :is="Component" :key="route.fullPath" />
            </KeepAlive>
        </RouterView>

    </Vview>

</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { reactive, watch, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { VTabs, Vview } from '@/ui';
import { useMessageStore } from '@/stores/messageStore';

// - Store -------------------------------------------------------------
const messageStore = useMessageStore();

// - Route -------------------------------------------------------------

const router = useRouter();

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
    messageStore.clearFlashMessageList();
}
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
// 
</style>