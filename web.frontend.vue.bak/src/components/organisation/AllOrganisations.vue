<template>
    <input class="ttable__search mt-8" v-model="searchTerm" type="text" placeholder="Search...">
    <div class="ttable__container" >
        <table class="ttable  mt-8" >
            <thead>
                <tr>
                    <th class="cursor-pointer">
                        <span @click="sortTable('id')">{{prettifyString('id')}}</span>
                        &nbsp;
                        <svg class="t-sort-arrow" :class="sortArrow('id')">
                            <use xlink:href="@/assets/svg/sprite.svg#triangle-1"></use>
                        </svg>
                    </th>
                    <th class="cursor-pointer">
                        <span @click="sortTable('name')">{{prettifyString('name')}}</span>
                        &nbsp;
                        <svg class="t-sort-arrow" :class="sortArrow('name')">
                            <use xlink:href="@/assets/svg/sprite.svg#triangle-1"></use>
                        </svg>
                    </th>
                    <th class="cursor-pointer">
                        <span @click="sortTable('created_at')">{{prettifyString('created_at')}}</span>
                        &nbsp;
                        <svg class="t-sort-arrow" :class="sortArrow('created_at')">
                            <use xlink:href="@/assets/svg/sprite.svg#triangle-1"></use>
                        </svg>
                    </th>
                    <th></th>               
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>0</td>
                    <td>Root Org</td>
                    <td>January 31, 2025 5:18 AM</td>
                    <td>
                        <div class="t-btns ml-auto">
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Edit'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-pencil"></use>
                                </svg>
                            </a>
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Delete'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-trash-can-solid"></use>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>1</td>
                    <td>Archive Org</td>
                    <td>January 31, 2025 5:18 AM</td>
                    <td>
                        <div class="t-btns ml-auto">
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Edit'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-pencil"></use>
                                </svg>
                            </a>
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Delete'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-trash-can-solid"></use>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>2</td>
                    <td>IoT Solutions Ltd</td>
                    <td>February 10, 2025 10:36 AM</td>
                    <td>
                        <div class="t-btns ml-auto">
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Edit'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-pencil"></use>
                                </svg>
                            </a>
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Delete'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-trash-can-solid"></use>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>3</td>
                    <td>MZ Fuels Ltd</td>
                    <td>February 10, 2025 10:36 AM</td>
                    <td>
                        <div class="t-btns ml-auto">
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Edit'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-pencil"></use>
                                </svg>
                            </a>
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Delete'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-trash-can-solid"></use>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>4</td>
                    <td>Agenzija Sapport</td>
                    <td>February 10, 2025 10:36 AM</td>
                    <td>
                        <div class="t-btns ml-auto"  v-if="false">
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Edit'}">
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-pencil"></use>
                                </svg>
                            </a>
                            <a  class="t-btns__btn" v-tooltip="{ content: 'Delete'}" >
                                <svg class="t-btns__icon">
                                    <use xlink:href="@/assets/svg/sprite.svg#icon-trash-can-solid"></use>
                                </svg>
                            </a>
                        </div>
                        <div class="t-btns ml-auto" v-else>
                            <a class="t-btns__btn t-btns__btn--yes" 
                                v-tooltip="{ content: true ? 'Edit' : 'Delete' }">
                                Yes
                            </a>
                            <a class="t-btns__btn t-btns__btn--no" 
                                v-tooltip="{ content: false ? 'Cancel Edit' : 'Cancel Delete' }">
                                No
                            </a>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>


    </div>

</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { ref } from 'vue';
import { Dropdown, Tooltip, Menu, vTooltip } from 'floating-vue'
import 'floating-vue/style.css';

// -- Data -------------------------------------------------------------

const sortBy = ref('id');
const sortDesc = ref(true);
const searchTerm = ref("");

// - Methods -----------------------------------------------------------

function sortTable(col: string) {
    if (sortBy.value == col) {
        sortDesc.value = !sortDesc.value
    }
    sortBy.value = col;
}

function sortArrow(col: string) {
    if (col === sortBy.value) {
        return { 't-sort-arrow--active': true, 't-sort-arrow--desc': sortDesc.value }
    }
}

function prettifyString(str:string) {
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.t-btns {
    justify-content: end !important;
}


</style>