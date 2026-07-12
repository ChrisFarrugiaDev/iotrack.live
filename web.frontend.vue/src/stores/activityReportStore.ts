import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
    ActivityReportResponse,
    ActivityReportRequest,
    ActivitySegment,
    ReportPoint,
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
