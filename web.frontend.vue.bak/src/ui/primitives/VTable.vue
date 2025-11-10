<template>
	<!--  Table Outer Wrapper -------------------------------------- -->
	<div class="vtable__wrapper">

		<!--  Table Container -------------------------------------- -->
		<div class="vtable__container">

			<!--  Table Head --------------------------------------- -->
			<table class="vtable">
				<thead class="vtable__head">
					<tr class="vtable__row vtable__row--head">

						<!-- Selection Checkbox Column -->
						<th v-if="selectable" class="vtable__cell vtable__cell--select">
							<input type="checkbox" :checked="allOnPageChecked"
								@change="toggleAllOnPage(($event.target as HTMLInputElement).checked)"
								:indeterminate="someOnPageChecked" />
						</th>

						<!-- Data Columns -->
						<th v-for="c in cols" :key="c.data" class="vtable__cell vtable__cell--head"
							:class="c.sort && 'vtable__th--sortable'" :style="c.width ? { width: c.width } : undefined"
							@click="toggleSort(c)">
							<span>{{ c.col }}</span>
							<svg v-if="c.sort" class="vtable__sort-arrow" :class="{
								'vtable__sort-arrow--active': state.sortKey === c.data,
								'vtable__sort-arrow--desc': state.sortKey === c.data && state.sortDir === 'desc'
							}">
								<use xlink:href="@/ui/svg/sprite.svg#triangle-1" />
							</svg>
						</th>

						<!-- Actions Column (slot) -->
						<th v-if="$slots.actions" class="vtable__cell vtable__cell--actions"></th>
					</tr>
				</thead>

				<!--  Table Body (Rows) ---------------------------- -->
				<tbody class="vtable__body">
					<tr v-for="row in pagedRows" :key="props.rowKey ? row[props.rowKey] : (row.uuid ?? row.id)"
						class="vtable__row" :class="[typeof props.rowClass === 'function' ? props.rowClass(row) : props.rowClass]">
						<!-- Row Select Checkbox -->
						<td v-if="selectable" class="vtable__cell vtable__cell--select">
							<input type="checkbox" :checked="isChecked(row)"
								@change="setChecked(row, ($event.target as HTMLInputElement).checked)" />
						</td>

						<!-- Row Data Cells -->
						<td v-for="c in cols" :key="c.data" class="vtable__cell"
							:class="[c.className, c.align && `text-${c.align}`]">
							<!-- Anchor/Link Cell -->
							<template v-if="c.anchor?.enabled && row?.[c.anchor.urlKey || '']">
								<a :href="row[c.anchor.urlKey!]" :target="c.anchor.target || '_self'">
									{{ cellContent(c, row) }}
								</a>
							</template>

							  <!-- Client-side navigation via RouterLink -->
							<template v-else-if="c.to">
								<RouterLink :to="resolveTo(c, row)">
								{{ cellContent(c, row) }}
								</RouterLink>
							</template>

							<!-- Custom click handler -->
							<template v-else-if="c.onClick">
								<button type="button" class="vtable__cell-btn" @click.stop="handleCellClick(c, row, $event)">
								{{ cellContent(c, row) }}
								</button>
							</template>

							<!-- Plain Cell -->
							<template v-else>
								{{ cellContent(c, row) }}
							</template>
						</td>

						<!-- Row Actions Slot -->
						<td v-if="$slots.actions" class="vtable__cell vtable__cell--actions">
							<div class="vtable__inline-btns">
								<slot name="actions" :row="row" />
							</div>
						</td>
					</tr>
				</tbody>
			</table>

			<!--  Built-in Pager (if no custom slot and >1 page) --- -->
			<div class="vtable__pager" v-if="!$slots.pagination && pageCount > 1">
				<button @click="setPage(innerPage - 1)" :disabled="innerPage === 1">Prev</button>
				<span class="vtable__pager-num">{{ innerPage }} / {{ pageCount }}</span>
				<button @click="setPage(innerPage + 1)" :disabled="innerPage === pageCount">Next</button>
			</div>
		</div>

		<!--  Custom Pagination Slot ------------------------------- -->
		<slot name="pagination" :page="innerPage" :perPage="perPage" :pageCount="pageCount" :setPage="setPage" />
	</div>
</template>




<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";


// - Types & Interfaces ------------------------------------------------

type Align = "left" | "center" | "right";

interface TableColumn {
	col: string;     // Column label (header)
	data: string;    // Field in row data
	sort?: boolean;  // Is sortable?
	hidden?: boolean;// Hide column
	searchable?: boolean; // Use in search
	width?: string;
	align?: Align;
	format?: (value: any, row?: any) => string | number;
	anchor?: { enabled: boolean; urlKey?: string; target?: "_blank" | "_self" };
	className?: string;	

	to?: string | ((row: any) => string);                 // -> <RouterLink>
	onClick?: (row: any, value: any, ev: MouseEvent) => void; // plain click handler
}


// - Props & Emits -----------------------------------------------------

const props = defineProps<{
	tableCol: TableColumn[];
	tableData: any[];
	search?: string;                 // Search string (from parent)
	rowKey?: string;                 // Primary key for row
	page?: number;                   // External page number
	searchTerm?: string;             // (Unused? Could be removed)
	perPage?: number;                // Page size (default 25)
	selectable?: boolean;            // Row selection enabled
	selectedKeys?: Array<string | number>;
	clearSelected?: number;
	sortKey?: string;
	rowClass?:(row:any) => string | string;
}>();

const emit = defineEmits<{
	(e: "update:page", value: number): void;
	(e: "update:selectedKeys", value: Array<string | number>): void;
}>();



// - Reactive State & Derived Values -----------------------------------

const state = reactive({
	sortKey: props.sortKey ?? "",
	sortDir: "asc" as "asc" | "desc",
});

const cols = computed(() => props.tableCol.filter(c => !c.hidden));


// - Sorting Logic -----------------------------------------------------

function toggleSort(c: TableColumn) {
	if (!c.sort) return;
	const key = c.data;
	state.sortDir = state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc";
	state.sortKey = key;
}


// - Filtering Logic ---------------------------------------------------

const filteredRows = computed(() => {
	const q = (props.search ?? "").trim().toLowerCase();
	if (!q) return props.tableData;

	const searchCols = cols.value.filter(c => c.searchable);
	const targets = searchCols.length ? searchCols : cols.value;

	return props.tableData.filter(row =>
		targets.some(c => String(row?.[c.data] ?? "").toLowerCase().includes(q))
	);
});


// - Sorted Rows -------------------------------------------------------

const sortedRows = computed(() => {
	if (!state.sortKey) return filteredRows.value;

	const dir = state.sortDir === "asc" ? 1 : -1;
	const key = state.sortKey;

	return [...filteredRows.value].sort((a, b) => {
		const av = a?.[key];
		const bv = b?.[key];

		// Handles dates, strings, numbers
		const ax = av instanceof Date ? av.getTime() : (isNaN(+av) ? String(av ?? "") : +av);
		const bx = bv instanceof Date ? bv.getTime() : (isNaN(+bv) ? String(bv ?? "") : +bv);

		return ax > bx ? dir : ax < bx ? -dir : 0;
	});
});


// - Table Cell Content Helper -----------------------------------------

function cellContent(col: TableColumn, row: any) {
	const raw = row?.[col.data];
	return col.format ? col.format(raw, row) : (raw ?? "—");
}


// - Pagination Logic --------------------------------------------------

const innerPage = ref(props.page ?? 1);

watch(() => props.page, (p) => { if (p) innerPage.value = p; });

const perPage = computed(() => props.perPage ?? 25);

const pageCount = computed(() =>
	Math.max(1, Math.ceil(sortedRows.value.length / perPage.value))
);

function setPage(p: number) {
	const clamped = Math.min(Math.max(1, p), pageCount.value);
	innerPage.value = clamped;
	emit("update:page", clamped);
}

// Keep page in bounds after filtering/sorting
watch(sortedRows, () => {
	if (innerPage.value > pageCount.value) setPage(pageCount.value);
});

const pagedRows = computed(() => {
	const start = (innerPage.value - 1) * perPage.value;
	return sortedRows.value.slice(start, start + perPage.value);
});


// - Row Keys ----------------------------------------------------------

function getRowKey(row: any) {
	return props.rowKey ? row[props.rowKey] : (row.uuid ?? row.id);
}


// - Selection Logic ---------------------------------------------------

const selectedSet = ref(new Set<string | number>(props.selectedKeys ?? []));

watch(() => props.selectedKeys, (arr) => {
	if (arr) selectedSet.value = new Set(arr);
});

watch(() => props.clearSelected, () => {
	selectedSet.value = new Set([]);
});

function isChecked(row: any) {
	return selectedSet.value.has(getRowKey(row));
}

function setChecked(row: any, checked: boolean) {
	const key = getRowKey(row);
	checked ? selectedSet.value.add(key) : selectedSet.value.delete(key);
	emit("update:selectedKeys", Array.from(selectedSet.value));
}

const allOnPageChecked = computed(() =>
	pagedRows.value.length > 0 && pagedRows.value.every(isChecked)
);

const someOnPageChecked = computed(() =>
	!allOnPageChecked.value && pagedRows.value.some(isChecked)
);

function toggleAllOnPage(checked: boolean) {
	for (const row of pagedRows.value) {
		const key = getRowKey(row);
		checked ? selectedSet.value.add(key) : selectedSet.value.delete(key);
	}
	emit("update:selectedKeys", Array.from(selectedSet.value));
}

// - Handles "to" logic ------------------------------------------------

function resolveTo(c: TableColumn, row: any) {
	return typeof c.to === "function" ? c.to(row) : c.to!;
}

// - Handles "onCLick" logic -------------------------------------------
function handleCellClick(c: TableColumn, row: any, ev: MouseEvent) {
	if (!c.onClick) return;
	const val = row?.[c.data];
	c.onClick(row, val, ev);
}

</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
@use "../index.scss";

// - Utility classes (global reuse) ------------------------------------

.text-left {
	text-align: left;
}

.text-center {
	text-align: center;
}

.text-right {
	text-align: right;
}

// - vtable component styles -------------------------------------------

.vtable {
	width: 100%;
	border-collapse: collapse;
	text-align: left;
	font-size: 0.9rem;
	font-family: var(--font-primary);
	color: var(--color-text-2);


	&__head {
		th {
			font-family: var(--font-display);
			font-weight: 600;
			color: var(--color-zinc-900);
			user-select: none;
			border-bottom: 1px solid var(--color-zinc-900);
			position: sticky;
			top: 0;

			&.vtable__th--sortable {
				cursor: pointer;

				&:hover {
					color: var(--color-blue-700) !important;
				}
			}
		}
	}

	&__row {
		&:nth-of-type(odd) {
			background-color: var(--color-bg-li);
		}

		&:hover {
			background-color: var(--color-sky-100, #e0f2fe);
		}

		&--head {
			background: var(--color-white);

			&:hover {

				background-color: var(--color-white);
			}
		}
	}

	&__cell {
		overflow: visible !important;
		padding: 0 0.5rem;
		height: 2.5rem;
		border-bottom: 1px solid var(--color-zinc-200);
		white-space: nowrap;
		overflow: visible;

		&--select {
			width: 2.25rem;
		}

		&--actions {
			// text-align: center;
		}

		a {
			text-decoration: none;

			color: var(--color-blue-700) !important;


			&:hover {
				color: var(--color-red-500) !important;
			}
		}
	}

	&__inline-btns {
		overflow: visible !important;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}

	&__sort-arrow {
		color: var(--color-text-1);
		fill: currentColor;
		width: 10px;
		height: 10px;
		opacity: 0.1;
		margin-left: 3px;
		transition: transform 0.15s;

		&--active {
			opacity: 1;

		}

		&--desc {
			transform: rotate(180deg);
		}
	}

	/* Inputs inside table cells */
	input,
	select {
		border: 1px solid var(--color-zinc-300);
		padding: 2px 5px;
		line-height: 1;
		border-radius: var(--radius-sm, 3px);
		background-color: var(--color-white);
		color: var(--color-text-1);
	}
}

// - Wrapper & pager ---------------------------------------------------
.vtable__wrapper {
	display: block;
}

.vtable__container {
	margin-bottom: var(--space-6, 1.5rem);
	overflow: auto;
}

.vtable__pager {
	display: inline-flex;
	align-items: center;
	gap: var(--space-3, 0.75rem);
	margin-top: var(--space-4, 1rem);

	&-num {
		margin-inline: var(--space-3, 0.75rem);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.vtable__cell--actions,
.vtabs-mb__empty,
.vtable__inline-btns,
.viconbtn {
	overflow: visible !important;
}

.vtable {
  &__cell--clickable { cursor: pointer; }
  &__cell-btn {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    text-align: inherit;
  }
}
</style>