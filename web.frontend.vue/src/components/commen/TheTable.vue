<template>
  <div class="the-table">
    <!-- Optional built-in search bar -->
    <div v-if="searchable" class="ttable__search-wrapper mb-4">
      <input
        class="ttable__search"
        v-model="searchTerm"
        type="text"
        placeholder="Search..."
      />
    </div>

    <table class="ttable">
      <thead>
        <tr>
          <th
            v-for="c in cols"
            :key="c.data"
            :style="c.width ? { width: c.width } : undefined"
            class="cursor-pointer"
            @click="toggleSort(c)"
          >
            <span>{{ c.col }}</span>
            <svg
              v-if="c.sort"
              class="t-sort-arrow"
              :class="{
                't-sort-arrow--active': state.sortKey === c.data,
                't-sort-arrow--desc':
                  state.sortKey === c.data && state.sortDir === 'desc'
              }"
            >
              <use xlink:href="@/assets/svg/sprite.svg#triangle-1" />
            </svg>
          </th>
          <!-- Optional actions column via slot -->
          <th v-if="$slots.actions"></th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in sortedRows" :key="rowKey ?? row.uuid ?? row.id">
          <td
            v-for="c in cols"
            :key="c.data"
            :class="[c.className, c.align && `text-${c.align}`]"
          >
            <template v-if="c.anchor?.enabled && row?.[c.anchor.urlKey || '']">
              <a
                :href="row[c.anchor.urlKey!]"
                :target="c.anchor.target || '_self'"
              >
                {{ cellContent(c, row) }}
              </a>
            </template>
            <template v-else>
              {{ cellContent(c, row) }}
            </template>
          </td>
          <td v-if="$slots.actions">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

type Align = "left" | "center" | "right";
interface TableColumn {
  col: string;
  data: string;
  sort?: boolean;
  hidden?: boolean;
  searchable?: boolean;
  width?: string;
  align?: Align;
  format?: (value: any, row?: any) => string | number;
  anchor?: {
    enabled: boolean;
    urlKey?: string;
    target?: "_blank" | "_self";
  };
  className?: string;
}

const props = defineProps<{
  tableCol: TableColumn[];
  tableData: any[];
  searchable?: boolean; // show search bar inside table
  rowKey?: string; // defaults to 'uuid' then 'id'
}>();

const searchTerm = ref("");
const state = reactive({ sortKey: "", sortDir: "asc" as "asc" | "desc" });

const cols = computed(() => props.tableCol.filter((c) => !c.hidden));

function toggleSort(c: TableColumn) {
  if (!c.sort) return;
  const k = c.data;
  state.sortDir =
    state.sortKey === k && state.sortDir === "asc" ? "desc" : "asc";
  state.sortKey = k;
}

const filteredRows = computed(() => {
  const q = searchTerm.value.trim().toLowerCase();
  if (!q) return props.tableData;
  const searchCols = cols.value.filter((c) => c.searchable) as TableColumn[];
  const targets = searchCols.length ? searchCols : cols.value;
  return props.tableData.filter((row) =>
    targets.some((c) =>
      String(row?.[c.data] ?? "").toLowerCase().includes(q)
    )
  );
});

const sortedRows = computed(() => {
  if (!state.sortKey) return filteredRows.value;
  const dir = state.sortDir === "asc" ? 1 : -1;
  const k = state.sortKey;
  return [...filteredRows.value].sort((a, b) => {
    const av = a?.[k];
    const bv = b?.[k];
    const ax =
      av instanceof Date
        ? av.getTime()
        : isNaN(+av)
        ? String(av ?? "")
        : +av;
    const bx =
      bv instanceof Date
        ? bv.getTime()
        : isNaN(+bv)
        ? String(bv ?? "")
        : +bv;
    return ax > bx ? dir : ax < bx ? -dir : 0;
  });
});

function cellContent(col: TableColumn, row: any) {
  const raw = row?.[col.data];
  return col.format ? col.format(raw, row) : raw ?? "—";
}
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
.text-left {
    text-align: left;
}

.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}


</style>
