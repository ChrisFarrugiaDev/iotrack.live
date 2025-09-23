<template>
  <main class="vview__main">
    <section class="vview__section">
        <div class="heading--2 ">Organisations</div>

            <TheFlashMessage></TheFlashMessage>

            <TheTabs
                class="mt-16"
                :tabsObjectData="tabsObjectData_1"
                :isDisabled="false"
                :layoutBreakpoint="500"
                @setActiveTab="tabsObjectData_1.activeTab = $event as TabKey"
                @click="clearMessage"
            ></TheTabs>


            <KeepAlive>
                <component :is="componentMap[tabsObjectData_1.activeTab]" class="mt-6"></component>
            </KeepAlive> 

    </section>

  </main>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import TheTabs from '@/components/commen/TheTabs.vue';
import AddOrganisation from '@/components/organisation/AddOrganisation.vue';
import AllOrganisations from '@/components/organisation/AllOrganisations.vue';
import { markRaw, reactive, type Component } from 'vue';

// - Data --------------------------------------------------------------

// Mapping of tab identifiers to component objects for dynamic loading

type TabKey = 'AllOrganisations' | 'AddOrganisation';

const componentMap: Record<TabKey, Component> = {
    AllOrganisations: markRaw(AllOrganisations),
    AddOrganisation: markRaw(AddOrganisation),
};

// Reactive state to manage tab data and the active tab identifier
const tabsObjectData_1 = reactive({
    activeTab: 'AllOrganisations' as TabKey,
    tabs: {
        AllOrganisations: 'All Organisations',
        AddOrganisation: 'Add Organisation',    
    },
});

function clearMessage() {
    // messageStore.clearFlashMessage();
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>