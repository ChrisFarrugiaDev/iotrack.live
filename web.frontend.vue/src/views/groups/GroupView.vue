<template>
    <Vview>
        <div class="vheading--2 ">Groups</div>
        <TheFlashMessage></TheFlashMessage>   
        
        
        <VTabs class="mt-16" 
            :activeTab="route.name as string"
            :tabs="tabsObjectData_1.tabs"
            :isDisabled="false" 
            :layoutBreakpoint="500" 
            @setActiveTab="setActiveTab" @click="clearMessage">
        </VTabs>
    
        <RouterView v-slot="{ Component, route }">
            <KeepAlive :exclude="['groups.list', 'groups.create']">
                <component :is="Component" :key="route.name" />
            </KeepAlive>
        </RouterView>
    </Vview>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { VTabs, Vview } from '@/ui';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { useRoute, useRouter } from 'vue-router';
import { reactive } from 'vue';
import { useMessageStore } from '@/stores/messageStore';
import { useAuthorizationStore } from '@/stores/authorizationStore';


// - Store -------------------------------------------------------------
const messageStore = useMessageStore();
const authorizationStore = useAuthorizationStore();

// - Route -------------------------------------------------------------

const router = useRouter();
const route = useRoute();

// - Data --------------------------------------------------------------

type TabKey = 'groups.list' | 'groups.create';


// Reactive state to manage tab data and the active tab identifier
const tabsObjectData_1 = reactive({
    activeTab: 'groups.list' as TabKey,
    tabs: {
        'groups.list': 'Groups List',
        'groups.create': 'Create new Group',

    } as Record<TabKey, string>,
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