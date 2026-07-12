import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
    ActivityReportResponse,
    ActivityReportRequest,
    ActivitySegment,
} from '@/types/activity-report.type';
import { mockActivityReport } from '@/mock/activity-report.mock';

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

    /** Segments in chronological order. */
    const getSegments = computed<ActivitySegment[]>(() => {
        const segments = (report.value?.segments ?? []) as ActivitySegment[];

        return [...segments].sort(
            (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
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
            await new Promise(resolve => setTimeout(resolve, 400));
            report.value = mockActivityReport;
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
        getSelectedSegment,
        hasReport,
        isEmpty,

        clear,
        selectSegment,
        fetchActivityReport,
    };
})
