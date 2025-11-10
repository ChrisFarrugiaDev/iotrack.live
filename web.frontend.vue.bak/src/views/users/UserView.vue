<template>
    <Vview>
        <div class="vheading--2 ">Users</div>
        <TheFlashMessage></TheFlashMessage>   


        <VTabs class="mt-16" 
            :activeTab="route.name as string"
            :tabs="tabsObjectData_1.tabs"
            :isDisabled="false" 
            :layoutBreakpoint="500" 
           @setActiveTab="setActiveTab" @click="clearMessage">
        </VTabs>
    
        <RouterView v-slot="{ Component, route }">
            <KeepAlive :exclude="['users.list', 'users.create']">
                <component :is="Component" :key="route.name" />
            </KeepAlive>
        </RouterView>


    </Vview>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { VTabs, Vview } from '@/ui';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { useMessageStore } from '@/stores/messageStore';
import { useRoute, useRouter } from 'vue-router';
import { reactive } from 'vue';

// - Store -------------------------------------------------------------
const messageStore = useMessageStore();

// - Route -------------------------------------------------------------

const router = useRouter();
const route = useRoute();


// - Data --------------------------------------------------------------

type TabKey = 'users.list' | 'users.create';

// Reactive state to manage tab data and the active tab identifier
const tabsObjectData_1 = reactive({
    activeTab: 'users.list' as TabKey,
    tabs: {
        'users.list': 'Users List',
        'users.create': 'Register new User',

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