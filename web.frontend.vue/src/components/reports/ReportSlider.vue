<template>
    <div class="rslider">

        <div class="rslider__head">
            <button
                type="button"
                class="rslider__step"
                :disabled="index <= 0"
                @click="step(-1)"
                title="Previous point"
            >‹</button>

            <div class="rslider__readout">
                <span class="rslider__time">{{ current ? formatTime(current.timestamp, timezone) : '—' }}</span>
                <span class="rslider__meta">
                    {{ current ? formatSpeed(current.speedKph) : '' }}
                    <span v-if="current" class="rslider__count">· {{ index + 1 }} / {{ points.length }}</span>
                </span>
            </div>

            <button
                type="button"
                class="rslider__step"
                :disabled="index >= points.length - 1"
                @click="step(1)"
                title="Next point"
            >›</button>
        </div>

        <!-- Track and input are overlaid so the grabber rides on the band.
             Coloured by segment, so the shape of the day is visible before you
             touch it: blue moving, amber working, grey parked, red gap. -->
        <div class="rslider__scrub">
            <div class="rslider__track">
                <span
                    v-for="band in bands"
                    :key="band.id"
                    class="rslider__band"
                    :class="`rslider__band--${band.type}`"
                    :style="{ left: `${band.start}%`, width: `${band.width}%` }"
                    :title="band.label"
                ></span>
            </div>

            <!-- The input runs on the same time axis as the bands, not on point
                 index — points are dense in journeys and absent in gaps, so an
                 index-driven thumb drifts off the band it belongs to. Dragging
                 picks the nearest point in time. -->
            <input
                class="rslider__input"
                type="range"
                min="0"
                :max="spanMs"
                step="1000"
                :value="valueMs"
                @input="scrubToTime(($event.target as HTMLInputElement).valueAsNumber)"
                @keydown.left.prevent="step(-1)"
                @keydown.right.prevent="step(1)"
                @keydown.down.prevent="step(-1)"
                @keydown.up.prevent="step(1)"
            />
        </div>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed } from 'vue';
import type { ActivitySegment, ReportPoint } from '@/types/activity-report.type';
import { formatSpeed, formatTime } from '@/utils/report.utils';

// - Props & Emits -----------------------------------------------------

const props = defineProps<{
    points: ReportPoint[];
    segments: ActivitySegment[];
    timezone: string;
    index: number;
}>();

const emit = defineEmits<{
    (e: 'scrub', index: number): void
}>();

// - Computed ----------------------------------------------------------

const current = computed<ReportPoint | null>(() => props.points[props.index] ?? null);

const ms = (iso: string) => new Date(iso).getTime();

/** The report's window. Bands and the thumb share this one axis. */
const startMs = computed(() => (props.segments.length ? ms(props.segments[0].startAt) : 0));
const spanMs = computed(() => {
    if (!props.segments.length) return 0;

    return Math.max(0, ms(props.segments[props.segments.length - 1].endAt) - startMs.value);
});

/** Where the selected point sits on the time axis. */
const valueMs = computed(() =>
    current.value ? ms(current.value.timestamp) - startMs.value : 0
);

/**
 * The report's whole span, laid out proportionally in time. Data gaps take up
 * real width here even though they contain no points — the day did not pause.
 */
const bands = computed(() => {
    if (!spanMs.value) return [];

    return props.segments.map(segment => {
        const from = ms(segment.startAt);
        const to = ms(segment.endAt);

        return {
            id: segment.id,
            type: segment.type,
            label: segment.type.replace('_', ' '),
            start: ((from - startMs.value) / spanMs.value) * 100,
            width: ((to - from) / spanMs.value) * 100,
        };
    });
});

// - Methods -----------------------------------------------------------

/**
 * Snap a point on the time axis to the nearest telemetry point. A gap holds no
 * points, so dragging across one lands on the fix either side of it rather than
 * inventing a position inside it.
 */
function scrubToTime(offsetMs: number) {
    if (!props.points.length) return;

    const target = startMs.value + offsetMs;

    let nearest = 0;
    let best = Infinity;

    props.points.forEach((point, i) => {
        const distance = Math.abs(ms(point.timestamp) - target);
        if (distance < best) {
            best = distance;
            nearest = i;
        }
    });

    if (nearest !== props.index) emit('scrub', nearest);
}

function step(delta: number) {
    const next = (props.index < 0 ? 0 : props.index) + delta;

    if (next >= 0 && next < props.points.length) emit('scrub', next);
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.rslider {
    padding: .75rem 1rem 1rem;
    background: var(--color-bg-hi);
    border: 1px solid var(--color-zinc-200);
    border-radius: var(--radius-md);

    &__head {
        display: flex;
        align-items: center;
        gap: .75rem;
        margin-bottom: .6rem;
    }

    &__step {
        width: 1.8rem;
        height: 1.8rem;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-size: 1.1rem;
        line-height: 1;
        color: var(--color-text-1);
        background: var(--color-bg-li);
        border: 1px solid var(--color-zinc-300);
        border-radius: var(--radius-sm);
        cursor: pointer;

        &:hover:not(:disabled) {
            background: var(--color-zinc-200);
        }

        &:disabled {
            opacity: .4;
            cursor: default;
        }
    }

    &__readout {
        flex: 1;
        display: flex;
        align-items: baseline;
        gap: .6rem;
    }

    &__time {
        font-family: var(--font-mono);
        font-size: 1rem;
        color: var(--color-text-1);
    }

    &__meta {
        font-family: var(--font-mono);
        font-size: .8rem;
        color: var(--color-text-2);
    }

    &__count {
        color: var(--color-zinc-400);
    }

    // The input is laid over the track so the grabber sits on the band, not
    // under it. Height is the grabber's, not the band's.
    &__scrub {
        position: relative;
        height: 20px;
        margin: 0 .35rem;
    }

    &__track {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        height: 7px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--color-zinc-200);
    }

    &__band {
        position: absolute;
        top: 0;
        bottom: 0;

        // Same segment colours as the table, summary and map — one colour
        // language across the report.
        &--journey       { background: var(--color-blue-500); }
        &--active_static { background: var(--color-amber-500); }
        &--stationary    { background: var(--color-zinc-500); }
        &--data_gap      { background: var(--color-red-500); }
    }

    &__input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: none;
        appearance: none;
        cursor: pointer;

        // Full-height transparent track: with the thumb the same height, the
        // browser centres it on the band beneath.
        &::-webkit-slider-runnable-track {
            height: 100%;
            background: none;
        }

        &::-moz-range-track {
            height: 100%;
            background: none;
        }

        &::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            margin-top: 0;
            border-radius: 50%;
            background: #dc2626; // same red as the pinned arrow
            border: 3px solid var(--color-bg-hi);
            box-shadow: 0 1px 4px rgba(0, 0, 0, .4);
        }

        &::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border: 3px solid var(--color-bg-hi);
            border-radius: 50%;
            background: #dc2626;
            box-shadow: 0 1px 4px rgba(0, 0, 0, .4);
        }

        &:focus-visible::-webkit-slider-thumb {
            outline: 2px solid var(--color-blue-500);
            outline-offset: 2px;
        }
    }
}
</style>
