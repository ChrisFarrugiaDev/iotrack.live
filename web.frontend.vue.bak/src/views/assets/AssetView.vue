<template>
    <Vview>
        <div class="vheading--2 ">Assets</div>
        <TheFlashMessage></TheFlashMessage>


        <VTabs class="mt-16" 
            :activeTab="route.name as string"
            :tabs="tabsObjectData_1.tabs"
            :isDisabled="false" 
            :layoutBreakpoint="500" 
           @setActiveTab="setActiveTab" @click="clearMessage">
        </VTabs>

        <RouterView v-slot="{ Component, route }">
            <KeepAlive :exclude="['assets.list', 'assets.create']">
                <component :is="Component" :key="route.name" />
            </KeepAlive>
        </RouterView>
    </Vview>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { useMessageStore } from '@/stores/messageStore';
import { VTabs, Vview } from '@/ui';
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// - Store -------------------------------------------------------------
const messageStore = useMessageStore();

// - Route -------------------------------------------------------------

const router = useRouter();
const route = useRoute();


// - Data --------------------------------------------------------------

type TabKey = 'devices.list' | 'devices.create';

// Reactive state to manage tab data and the active tab identifier
const tabsObjectData_1 = reactive({
    activeTab: 'assets.list' as TabKey,
    tabs: {
        'assets.list': 'Assets List',
        'assets.create': 'Register new Asset',

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

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>