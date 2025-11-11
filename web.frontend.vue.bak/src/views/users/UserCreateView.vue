<template>
    <form class="vform mt-16" autocomplete="off" @click="clearMessage">

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

            <!-- First Name -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="first_name">First Name <span class="vform__required">*</span></label>
                <input
                    v-model.trim="form.first_name"
                    :class="{ 'vform__input--error': errors.first_name }"
                    class="vform__input"
                    id="first_name"
                    type="text"
                    placeholder="Enter first name"
                    :disabled="confirmOn"
                >
                <p class="vform__error">{{ errors.first_name }}</p>
            </div>

            <!-- Last Name -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="last_name">Last Name <span class="vform__required">*</span></label>
                <input
                    v-model.trim="form.last_name"
                    :class="{ 'vform__input--error': errors.last_name }"
                    class="vform__input"
                    id="last_name"
                    type="text"
                    placeholder="Enter last name"
                    :disabled="confirmOn"
                >
                <p class="vform__error">{{ errors.last_name }}</p>
            </div>

        </div>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

            <!-- Email -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="email">Email <span class="vform__required">*</span></label>
                <input
                    v-model.trim="form.email"
                    :class="{ 'vform__input--error': errors.email }"
                    class="vform__input"
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    autocomplete="email"
                    :disabled="confirmOn"
                >
                <p class="vform__error">{{ errors.email }}</p>
            </div>

            <!-- Password -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="password">Password</label>
                <input
                    v-model="form.password"
                    :class="{ 'vform__input--error': errors.password }"
                    class="vform__input"
                    id="password"
                    type="password"
                    placeholder="Leave empty to auto-generate"
                    autocomplete="new-password"
                    :disabled="confirmOn"
                >
                <p class="vform__error">{{ errors.password }}</p>
            </div>

        </div>

         <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

            <!-- Active Status -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="active">Active <span class="vform__required">*</span></label>
                <VueSelect
                    v-model="form.active"
                    class="vform__group"
                    :shouldAutofocusOption="false"
                    :isDisabled="confirmOn"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.status)]" 
                    :options="[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false }
                    ]"
                    placeholder=""
                />
                <p class="vform__error">{{ errors.active }}</p>
            </div>

            <!-- Role -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="role">Role <span class="vform__required">*</span></label>
                <VueSelect
                    v-model="form.role"
                    class="vform__group"
                    :shouldAutofocusOption="false"
                    :isDisabled="confirmOn"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.role)]"
                    :options="roleOptions"
                    placeholder=""
                />
                <p class="vform__error">{{ errors.role }}</p>
            </div>

        </div>

     <!-- Permissions -->
        <div class="vform__row " :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group mb-7 w-full">
                <label class="vform__label" for="permissions">Permissions</label>

                <Treeselect
                    v-model="form.permissions"
                    :multiple="true"
                    :options="permissionOptions"
                    placeholder=""
                    :disabled="confirmOn"
                    :show-count="true"
                />

                <p class="vform__error">{{ errors.permissions }}</p>
            </div>
        </div>


    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { useMessageStore } from '@/stores/messageStore';
import { reactive, ref } from 'vue';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";

import Treeselect from 'vue3-treeselect';



// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();

// - Data --------------------------------------------------------------

const permissionOptions = [
  {
    id: 'users',
    label: 'Users',
    children: [
      { id: 1, label: 'Create User' },
      { id: 2, label: 'Update User' },
      { id: 3, label: 'Delete User' },
    ],
  },
  {
    id: 'organisation',
    label: 'Organisations',
    children: [
      { id: 4, label: 'Create Organisation' },
      { id: 5, label: 'Update Organisation' },
      { id: 6, label: 'Delete Organisation' },
    ],
  },
  {
    id: 'devices',
    label: 'Devices',
    children: [
      { id: 13, label: 'View Devices' },
      { id: 14, label: 'Create Devices' },
      { id: 15, label: 'Update Devices' },
      { id: 16, label: 'Delete Devices' },
    ],
  },
];


const confirmOn = ref(false);

const roleOptions = [
    { label: 'System Admin', value: 1 },
    { label: 'Admin', value: 2 },
    { label: 'User', value: 3 },
    { label: 'Viewer', value: 4 },
];

const form = reactive({
    first_name: null as null | string,
    last_name: null as null | string,
    email: null as null | string,
    password: null as null | string,
    role: 3,
    active:  true,
    permissions: [] as any[],
});

const errors = ref<Record<string, string>>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: "",
    active: "",
});

// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
/* Make Treeselect visually match your .vform__input look & feel */


:deep(.vue-treeselect) {
  min-height: 5rem;
  overflow: visible !important;
  font-size: 14px;
  width: 100%;
  font-family: var(--font-primary);
  color: var(--color-text-1);
  outline: none !important;
}



:deep(.vue-treeselect__control) {
  min-height: 4rem;
  height: fit-content;
  border: 1px solid var(--color-zinc-300);
  border-radius: 6px;  
  display: flex;
  align-items: center;
  color: var(--color-text-1);
   
  border-radius: 5px !important;
  background: var(--color-zinc-100);
  outline: none !important;
  &:hover {
    border: 1px solid var(--color-zinc-300) !important;
  }
}

:deep(.vue-treeselect--focused:not(.vue-treeselect--open) .vue-treeselect__control) {
    border-color: var(--color-blue-500);
    box-shadow: none;
}
:deep(.vue-treeselect--focused .vue-treeselect__control) {
    border-color: var(--color-blue-500);
    box-shadow: none;
}

:deep(.vue-treeselect__multi-value) {

  height: 100%;
  min-height: 3rem;
  width: 100%;
  
  display: inline-block;
  padding: 1.5rem .5rem .5rem .5rem;
}


// --items
:deep(.vue-treeselect__multi-value-item) {
  border-radius: 12px;
  border: 1px solid var(--color-zinc-300);
  background: var(--color-zinc-50); 
  min-height: 2rem !important;  
}

:deep(.vue-treeselect__value-remove) {
  border-left: 1px solid var(--color-zinc-300);
  color: var(--color-blue-600);
}

:deep(.vue-treeselect__multi-value-label) {
  color: var(--color-blue-600);
  font-family: var(--font-primary);
}

// options

:deep(.vue-treeselect__menu) {
  border-radius: 6px;
  border: 1px solid var(--color-gray-300);
  background-color: var(--color-zinc-100);
  margin-top: .5rem;
  margin-bottom: .5rem;
  
}
:deep(.vue-treeselect__label) {
  color: var(--color-text-1);
  
}
:deep(.vue-treeselect__option--selected) {
  background: rgba(59,130,246,.08);
  
}

:deep(.vue-treeselect__option--highlight) {
  background: rgba(59,130,246,.12);
}


</style>