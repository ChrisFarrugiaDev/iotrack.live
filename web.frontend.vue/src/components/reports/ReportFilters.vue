<template>
    <form class="vform" @submit.prevent="generate">

        <div class="vform__row">

            <!-- Asset -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="report_asset">
                    Asset <span class="vform__required">*</span>
                </label>
                <!-- Collapsible, grouped by org (only when more than one org is in
                     scope) — org branches are pure expand/collapse, never a
                     selectable value. Options come from getReportableAssets (has
                     live telemetry — "shown on the map"), not the raw access list. -->
                <ReportAssetField
                    id="report_asset"
                    v-model="assetUuid"
                    :options="assetTreeOptions"
                    :disabled="loading"
                    :error="!!errors.asset"
                />
                <p class="vform__error">{{ errors.asset }}</p>
            </div>

            <!-- From -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="report_from">From <span class="vform__required">*</span></label>
                <ReportDateField
                    id="report_from"
                    v-model="from"
                    :max-date="to"
                    :disabled="loading"
                    :error="!!errors.range"
                />
            </div>

            <!-- To -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="report_to">To <span class="vform__required">*</span></label>
                <ReportDateField
                    id="report_to"
                    v-model="to"
                    :min-date="from"
                    :disabled="loading"
                    :error="!!errors.range"
                />
            </div>

            <!-- Stationary confirmation window (§14.3/§14.4, Phase 5) -->
            <div class="vform__group vform__group--narrow mb-7">
                <label class="vform__label" for="report_stationary_window">Confirm after</label>
                <VueSelect
                    v-model="stationaryWindowSeconds"
                    id="report_stationary_window"
                    class="vform__group"
                    teleport=".dashboard"
                    :isClearable="false"
                    :isSearchable="false"
                    :shouldAutofocusOption="false"
                    :isDisabled="loading"
                    :options="stationaryWindowOptions"
                />
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

import ReportDateField from './ReportDateField.vue';
import ReportAssetField from './ReportAssetField.vue';
import { useAssetStore } from '@/stores/assetStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import { useActivityReportStore } from '@/stores/activityReportStore';

// - Store -------------------------------------------------------------

const assetStore = useAssetStore();
const organisationStore = useOrganisationStore();
const activityReportStore = useActivityReportStore();
const { loading } = storeToRefs(activityReportStore);

// - Data --------------------------------------------------------------


// The pickers work in the browser's local timezone and are converted to UTC on
// submit (§21). The report's display timezone is a separate thing and comes
// back on the response.

// Vehicle tracker limit from design doc §30.
const MAX_RANGE_DAYS = 7;

// §14.3/§14.4 confirmation window (Phase 5): 180-900s, default 180 (3 min).
const STATIONARY_WINDOW_DEFAULT_SECONDS = 180;

const assetUuid = ref<string>('');
const from = ref<Date>(startOfToday());
const to = ref<Date>(new Date());
const stationaryWindowSeconds = ref<number>(STATIONARY_WINDOW_DEFAULT_SECONDS);

const errors = reactive<{ asset: string; range: string }>({ asset: '', range: '' });

// - Computed ----------------------------------------------------------

// Access is already fully resolved server-side (org scope + org/asset
// overrides — see AccessProfileController.getAccessibleAssetsForUser in
// web.backend.node.ts) by the time an asset reaches assetStore, so no
// client-side access filtering belongs here. What this computed adds is
// scoping to assets actually shown on the map (getReportableAssets — has
// live telemetry) and grouping them into a collapsible tree: a branch per
// org (using organisationStore only to look up org NAMES for labels, not
// to filter), skipped entirely when everything's in one org.
const assetTreeOptions = computed(() => {
    const reportable = assetStore.getReportableAssets ?? [];
    const orgScope = organisationStore.getOrganisationScope ?? {};

    const byOrg = new Map<string, typeof reportable>();
    for (const asset of reportable) {
        const group = byOrg.get(asset.organisation_id) ?? [];
        group.push(asset);
        byOrg.set(asset.organisation_id, group);
    }

    const orgIds = [...byOrg.keys()].sort((a, b) =>
        (orgScope[a]?.name ?? '').localeCompare(orgScope[b]?.name ?? '')
    );

    const leavesFor = (orgId: string) =>
        [...(byOrg.get(orgId) ?? [])]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(asset => ({ id: asset.uuid, label: `${asset.id} - ${asset.name}` }));

    if (orgIds.length <= 1) {
        return orgIds.flatMap(orgId => leavesFor(orgId));
    }

    return orgIds.map(orgId => ({
        id: `org-${orgId}`,
        label: orgScope[orgId]?.name ?? `Org ${orgId}`,
        children: leavesFor(orgId),
    }));
});

// Discrete stops across the backend's 180-900s range (Phase 5 Step 0).
const stationaryWindowOptions = [
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
];

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
            stationary_window_seconds: stationaryWindowSeconds.value,
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

// Roughly half the width of the other fields (Phase 5 Step 0) — this
// field's option set is short and doesn't need equal billing with Asset/
// From/To.
.vform__group--narrow {
    flex: 0.5;
}
</style>
