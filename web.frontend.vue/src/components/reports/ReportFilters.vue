<template>
    <form class="vform" @submit.prevent="generate">

        <div class="vform__row">

            <!-- Asset -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="report_asset">
                    Asset <span class="vform__required">*</span>
                </label>
                <!-- Teleported out of Vview's scrolling body, which would clip the
                     menu. Target is .dashboard rather than body: it carries .v-ui,
                     so the menu keeps its design tokens and theme. -->
                <VueSelect
                    v-model="assetUuid"
                    id="report_asset"
                    class="vform__group"
                    teleport=".dashboard"
                    :shouldAutofocusOption="false"
                    :isDisabled="loading"
                    :style="selectErrorStyle(!!errors.asset)"
                    :options="assetOptions"
                    placeholder=""
                />
                <p class="vform__error">{{ errors.asset }}</p>
            </div>

            <!-- From -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="report_from">From <span class="vform__required">*</span></label>
                <VDatePicker v-model="from" mode="dateTime" is24hr :max-date="to">
                    <template #default="{ inputValue, togglePopover }">
                        <input
                            id="report_from"
                            class="vform__input"
                            :class="{ 'vform__input--error': !!errors.range }"
                            :value="inputValue"
                            :disabled="loading"
                            readonly
                            @click="togglePopover"
                        />
                    </template>
                </VDatePicker>
            </div>

            <!-- To -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="report_to">To <span class="vform__required">*</span></label>
                <VDatePicker v-model="to" mode="dateTime" is24hr :min-date="from">
                    <template #default="{ inputValue, togglePopover }">
                        <input
                            id="report_to"
                            class="vform__input"
                            :class="{ 'vform__input--error': !!errors.range }"
                            :value="inputValue"
                            :disabled="loading"
                            readonly
                            @click="togglePopover"
                        />
                    </template>
                </VDatePicker>
            </div>

        </div>

        <p v-if="errors.range" class="vform__error vform__error--block">{{ errors.range }}</p>

        <button class="vbtn vbtn--sky" type="submit" :disabled="loading">
            {{ loading ? 'Generating…' : 'Generate Report' }}
        </button>

    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import VueSelect from 'vue3-select-component';

import { selectErrorStyle } from '@/composables/useVueSelectStyles';
import { useAssetStore } from '@/stores/assetStore';
import { useActivityReportStore } from '@/stores/activityReportStore';

// - Store -------------------------------------------------------------

const assetStore = useAssetStore();
const activityReportStore = useActivityReportStore();
const { loading } = storeToRefs(activityReportStore);

// - Data --------------------------------------------------------------


// The pickers work in the browser's local timezone and are converted to UTC on
// submit (§21). The report's display timezone is a separate thing and comes
// back on the response.

// Vehicle tracker limit from design doc §30.
const MAX_RANGE_DAYS = 7;

const assetUuid = ref<string>('');
const from = ref<Date>(startOfToday());
const to = ref<Date>(new Date());

const errors = reactive<{ asset: string; range: string }>({ asset: '', range: '' });

// - Computed ----------------------------------------------------------

const assetOptions = computed(() => {
    const assets = assetStore.getAssets ?? {};

    return Object.values(assets)
        .map(asset => ({ label: asset.name, value: asset.uuid }))
        .sort((a, b) => a.label.localeCompare(b.label));
});

// - Methods -----------------------------------------------------------

function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Frontend validation is convenience only; the backend stays authoritative (§7). */
function validate(): boolean {
    errors.asset = '';
    errors.range = '';

    if (!assetUuid.value) {
        errors.asset = 'Select an asset.';
    }

    if (!from.value || !to.value) {
        errors.range = 'Select a start and end date.';
    } else if (from.value >= to.value) {
        errors.range = 'The start must be before the end.';
    } else {
        const days = (to.value.getTime() - from.value.getTime()) / 86_400_000;
        if (days > MAX_RANGE_DAYS) {
            errors.range = `The range cannot be longer than ${MAX_RANGE_DAYS} days.`;
        }
    }

    return !errors.asset && !errors.range;
}

async function generate() {
    if (!validate()) return;

    try {
        await activityReportStore.fetchActivityReport({
            asset_uuid: assetUuid.value,
            from: from.value.toISOString(),
            to: to.value.toISOString(),
        });
    } catch {
        // The store records the error; the view renders it.
    }
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.vform__error--block {
    margin-bottom: .5rem;
}
</style>
