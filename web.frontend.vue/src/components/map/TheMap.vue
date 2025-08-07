<template>
  <div class="the-map">
    <GoogleMap
      v-if="apiKey"
      :api-key="apiKey"
        :center="center"
  :zoom="15"
      style="width: 100%; height: 100vh"
    />
    <div v-else>Loading map...</div>
  </div>
</template>
<!-- --------------------------------------------------------------- -->
<script setup lang="ts">
import { useSettingsStore } from "@/stores/settingsStore";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref, watch } from "vue";
import { GoogleMap } from "vue3-google-map";

const settingsStore = useSettingsStore();
const { getMapsApiKey } = storeToRefs(settingsStore)

const apiKey = ref<string | undefined>("");
const center = ref({ lat: 40.689247, lng: -74.044502 });

// This will run if getMapsApiKey is a computed ref or a getter that updates reactively
watch(getMapsApiKey, (newKey) => {
  apiKey.value = newKey;
  console.log(apiKey.value)
}, { immediate: true }); // Run right away


</script>
<!-- --------------------------------------------------------------- -->
<style lang="scss" scoped>
.the-map {

    min-height: 100vh;
    width: 100%;

}

</style>