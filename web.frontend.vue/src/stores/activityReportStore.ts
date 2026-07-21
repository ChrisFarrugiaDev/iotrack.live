import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
    ActivityReportResponse,
    ActivityReportRequest,
    ActivitySegment,
    ReportPoint,
    TimelineObservation,
} from '@/types/activity-report.type';
import { mockTimelineReport } from '@/mock/activity-report.mock';
import { useAssetStore } from './assetStore';
import { useAppStore } from './appStore';
import axios from '@/axios';

export const useActivityReportStore = defineStore('activityReportStore', () => {

    // ---- State ------------------------------------------------------
    const report = ref<ActivityReportResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Segment the user has selected in the table; drives map highlighting.
    const selectedSegmentId = ref<string | null>(null);

    // A single telemetry point picked from an expanded segment; pinned on the map.
    const selectedPoint = ref<ReportPoint | null>(null);


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

    /**
     * Every telemetry point in the report, in order — the track the slider
     * scrubs along. Data gaps contribute nothing, so scrubbing jumps across
     * them rather than inventing points inside them.
     */
    const getAllPoints = computed<ReportPoint[]>(() =>
        getSegments.value.flatMap(s => ('points' in s ? s.points : []))
    );

    const getSelectedPointIndex = computed(() => {
        if (!selectedPoint.value) return -1;

        return getAllPoints.value.findIndex(p => p.id === selectedPoint.value!.id);
    });

    const hasReport = computed(() => report.value !== null);
    const isEmpty = computed(() => report.value?.summary.pointCount === 0);


    // ---- Actions ----------------------------------------------------

    function clear() {
        report.value = null;
        error.value = null;
        selectedSegmentId.value = null;
        selectedPoint.value = null;
    }

    function selectSegment(id: string | null) {
        selectedSegmentId.value = id;

        // The pinned point belongs to whatever segment was open; moving on drops it.
        selectedPoint.value = null;
    }

    /** Click the same point again to unpin it. */
    function selectPoint(point: ReportPoint | null) {
        selectedPoint.value =
            point && point.id === selectedPoint.value?.id ? null : point;
    }

    /**
     * Move to a point on the track, selecting the segment it belongs to.
     * Unlike selectSegment this keeps the point pinned — it is the same
     * gesture, not a new one.
     */
    function scrubTo(index: number) {
        const point = getAllPoints.value[index];
        if (!point) return;

        const segment = getSegments.value.find(
            s => 'points' in s && s.points.some(p => p.id === point.id)
        );

        selectedSegmentId.value = segment?.id ?? null;
        selectedPoint.value = point;
    }

    /**
     * Fetch an activity report.
     *
     * Timeline mode has no backend yet (Phase 5, real sparse-tracker data
     * incoming) — the mock stays reachable in dev builds only, keyed off the
     * asset's type the same way the fixture always was. Journey requests go
     * to the real service. This dev branch has a scheduled death: it goes
     * away in Phase 5 once the backend serves timeline mode for real.
     */
    async function fetchActivityReport(payload: ActivityReportRequest) {
        loading.value = true;
        error.value = null;

        try {
            const asset = Object.values(useAssetStore().getAssets ?? {})
                .find(a => a.uuid === payload.asset_uuid);

            if (import.meta.env.DEV && asset?.asset_type === 'asset') {
                await new Promise(resolve => setTimeout(resolve, 400));
                report.value = mockTimelineReport;
            } else {
                const url = `${useAppStore().getAppUrl}/compute/reports/activity`;
                const res = await axios.post(url, payload);
                report.value = res.data.data;
            }

            // Both selections must reset: a pinned point kept from the
            // previous report renders on the NEW report's map — observed as
            // a phantom "coordinate jump" when the previous asset was on a
            // different island.
            selectedSegmentId.value = null;
            selectedPoint.value = null;
            return report.value;

        } catch (err: any) {
            console.error('! activityReportStore fetchActivityReport !\n', err);
            error.value = err?.response?.data?.message ?? 'Failed to generate the report.';
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
        selectedPoint,

        getReport,
        getSummary,
        getSubject,
        getSegments,
        getObservations,
        getSelectedSegment,
        getAllPoints,
        getSelectedPointIndex,
        hasReport,
        isEmpty,
        isTimeline,

        clear,
        selectSegment,
        selectPoint,
        scrubTo,
        fetchActivityReport,
    };
})
