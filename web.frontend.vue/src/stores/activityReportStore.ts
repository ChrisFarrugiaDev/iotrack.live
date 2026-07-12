import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
    ActivityReportResponse,
    ActivityReportRequest,
    ActivitySegment,
    TimelineObservation,
} from '@/types/activity-report.type';
import { mockActivityReport, mockTimelineReport } from '@/mock/activity-report.mock';
import { useAssetStore } from './assetStore';

export const useActivityReportStore = defineStore('activityReportStore', () => {

    // ---- State ------------------------------------------------------
    const report = ref<ActivityReportResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Segment the user has selected in the table; drives map highlighting.
    const selectedSegmentId = ref<string | null>(null);


    // ---- Getters ----------------------------------------------------

    const getReport = computed(() => report.value);
    const getSummary = computed(() => report.value?.summary ?? null);
    const getSubject = computed(() => report.value?.subject ?? null);

    /**
     * Sparse trackers report sightings, not journeys (§4.2). The backend picks
     * the mode and says so on the response.
     */
    const isTimeline = computed(() => report.value?.report.mode === 'timeline');

    /** Segments in chronological order. Empty in timeline mode. */
    const getSegments = computed<ActivitySegment[]>(() => {
        if (!report.value || isTimeline.value) return [];

        const segments = report.value.segments as ActivitySegment[];

        return [...segments].sort(
            (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
    });

    /** Observations in chronological order. Empty in journey mode. */
    const getObservations = computed<TimelineObservation[]>(() => {
        if (!report.value || !isTimeline.value) return [];

        const observations = report.value.segments as TimelineObservation[];

        return [...observations].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    });

    const getSelectedSegment = computed(() =>
        getSegments.value.find(s => s.id === selectedSegmentId.value) ?? null
    );

    const hasReport = computed(() => report.value !== null);
    const isEmpty = computed(() => report.value?.summary.pointCount === 0);


    // ---- Actions ----------------------------------------------------

    function clear() {
        report.value = null;
        error.value = null;
        selectedSegmentId.value = null;
    }

    function selectSegment(id: string | null) {
        selectedSegmentId.value = id;
    }

    /**
     * Fetch an activity report.
     *
     * PLACEHOLDER: returns a fixture. This is the only place that knows the
     * data is mocked — no component should.
     *
     * TODO: replace the mock block below with:
     *   const url = `${useAppStore().getAppUrl}/api/reports/activity`;
     *   const res = await axios.post(url, payload);
     *   report.value = res.data.data;
     */
    async function fetchActivityReport(payload: ActivityReportRequest) {
        loading.value = true;
        error.value = null;

        try {
            // --- mock ---
            // The real backend chooses the mode from the tracker (§4.3); here we
            // approximate that from the asset's type so both modes are reachable.
            await new Promise(resolve => setTimeout(resolve, 400));

            const asset = Object.values(useAssetStore().getAssets ?? {})
                .find(a => a.uuid === payload.asset_uuid);

            report.value = asset?.asset_type === 'asset'
                ? mockTimelineReport
                : mockActivityReport;
            // --- end mock ---

            selectedSegmentId.value = null;
            return report.value;

        } catch (err) {
            console.error('! activityReportStore fetchActivityReport !\n', err);
            error.value = 'Failed to generate the report.';
            throw err;

        } finally {
            loading.value = false;
        }
    }


    // ---- Expose -----------------------------------------------------
    return {
        report,
        loading,
        error,
        selectedSegmentId,

        getReport,
        getSummary,
        getSubject,
        getSegments,
        getObservations,
        getSelectedSegment,
        hasReport,
        isEmpty,
        isTimeline,

        clear,
        selectSegment,
        fetchActivityReport,
    };
})
