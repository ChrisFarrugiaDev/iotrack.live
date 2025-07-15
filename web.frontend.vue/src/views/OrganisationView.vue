<template>
  <main class="vview__main">
    <section class="vview__section">
        <div class="heading--2 ">Organisations</div>

            <TheTabs
                class="mt-16"
                :tabsObjectData="tabsObjectData_1"
                :isDisabled="false"
                :layoutBreakpoint="500"
                @setActiveTab="tabsObjectData_1.activeTab = $event"
                @click="clearMessage"
            ></TheTabs>

    </section>

  </main>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import TheTabs from '@/components/commen/TheTabs.vue';
import { reactive } from 'vue';

// - Data --------------------------------------------------------------

// Reactive state to manage tab data and the active tab identifier
const tabsObjectData_1 = reactive({
    activeTab: 'OrganisationsList',
    tabs: {
        OrganisationsList: 'Orgs List',
        CreateNewOrganisations: 'Create New Org',    
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