<template>
    <p class="flash-message my-4 p-2" :class="getFlashClass">
        <div v-for="message in getFlashMessages" v-html="message"></div>
    </p>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useMessageStore } from '@/stores/messageStore';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

// - Store -------------------------------------------------------------
const messageStore = useMessageStore();
const { getFlashClass, getFlashMessages } = storeToRefs(messageStore);

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>