<template>
    <Vview>
        <template #header>
            <div class="vheading--2">White Label</div>
            <TheFlashMessage></TheFlashMessage>
        </template>

        <form class="vform mb-4" autocomplete="off" @click="clearMessage">

            <!-- Row 1: App Title & Domain -->
            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

                <div class="vform__group mt-7">
                    <label class="vform__label" for="app_title">App Title</label>
                    <input v-model.trim="form.app_title" :class="{ 'vform__input--error': errors.app_title }"
                        class="vform__input" id="app_title" type="text"
                        placeholder="e.g. Welcome to FleetView Pro" :disabled="confirmOn">
                    <p class="vform__error">{{ errors.app_title }}</p>
                </div>

                <div class="vform__group mt-7">
                    <label class="vform__label" for="domain">Domain</label>
                    <input v-model.trim="form.domain" :class="{ 'vform__input--error': errors.domain }"
                        class="vform__input" id="domain" type="text"
                        placeholder="e.g. fleet.example.com (optional)" :disabled="confirmOn">
                    <p class="vform__error">{{ errors.domain }}</p>
                </div>

            </div>

            <!-- Row 2: Background & Foreground images -->
            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

                <div class="vform__group mt-7">
                    <label class="vform__label" for="login_bg">Login Background Image</label>
                    <input class="vform__input" id="login_bg" type="file" accept="image/jpeg,image/png,image/webp"
                        :disabled="confirmOn" @change="uploadImage($event, 'login_bg_url')">
                    <p class="vform__error">{{ errors.login_bg_url }}</p>
                    <img v-if="form.login_bg_url" class="wlabel__preview mt-3" :src="form.login_bg_url" alt="Background preview">
                </div>

                <div class="vform__group mt-7">
                    <label class="vform__label" for="login_fg">Login Foreground Image</label>
                    <input class="vform__input" id="login_fg" type="file" accept="image/jpeg,image/png,image/webp"
                        :disabled="confirmOn" @change="uploadImage($event, 'login_fg_url')">
                    <p class="vform__error">{{ errors.login_fg_url }}</p>
                    <img v-if="form.login_fg_url" class="wlabel__preview mt-3" :src="form.login_fg_url" alt="Foreground preview">
                </div>

            </div>

            <!-- Row 3: Buttons -->
            <div class="vform__row mt-9">
                <button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initSave" type="button">Save White Label</button>
                <button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false" type="button">Cancel</button>
                <button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="save" type="button">Confirm</button>
            </div>

        </form>
    </Vview>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import axios from '@/axios';
import { onMounted, reactive, ref } from 'vue';
import { Vview } from '@/ui';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { useAppStore } from '@/stores/appStore';
import { useMessageStore } from '@/stores/messageStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useFormErrorHandler } from '@/composables/useFormErrorHandler';

// - Store -------------------------------------------------------------

const appStore = useAppStore();
const messageStore = useMessageStore();
const settingsStore = useSettingsStore();
const dashboardStore = useDashboardStore();

// - Data --------------------------------------------------------------

const confirmOn = ref(false);

const form = reactive({
    app_title: null as null | string,
    domain: null as null | string,
    login_bg_url: null as null | string,
    login_fg_url: null as null | string,
});

const errors = ref<Record<string, string>>({
    app_title: '',
    domain: '',
    login_bg_url: '',
    login_fg_url: '',
});

const { handleFormError } = useFormErrorHandler(errors);

// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

function initSave() {
    confirmOn.value = true;

    errors.value = {
        app_title: '',
        domain: '',
        login_bg_url: '',
        login_fg_url: '',
    };
}

async function uploadImage(event: Event, field: 'login_bg_url' | 'login_fg_url') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const orgId = settingsStore.getAuthenticatedUser?.organisation.id;
    if (!orgId) {
        errors.value[field] = 'Could not determine your organisation.';
        return;
    }

    dashboardStore.setIsLoading(true);

    try {
        const formData = new FormData();
        formData.append('entity_type', 'white_label');
        formData.append('entity_id', String(orgId));
        formData.append('images', file, file.name);

        const url = `${appStore.getAppUrl}/img/upload`;
        const response = await axios.post(url, formData);

        const uploaded = response.data?.data?.uploaded?.[0];
        if (uploaded?.URL || uploaded?.url) {
            form[field] = uploaded.URL ?? uploaded.url;
            errors.value[field] = '';
        } else {
            const failure = response.data?.data?.errors?.[0];
            errors.value[field] = failure?.error ?? 'Upload failed.';
        }

    } catch (err) {
        errors.value[field] = 'Upload failed. Please try again.';
        console.error('! WhiteLabelView uploadImage !', err);

    } finally {
        input.value = '';
        dashboardStore.setIsLoading(false);
    }
}

async function fetchWhiteLabel() {
    try {
        const url = `${appStore.getAppUrl}/api/white-label`;
        const response = await axios.get(url);
        const wl = response.data?.data?.white_label;

        if (wl) {
            form.app_title = wl.app_title ?? null;
            form.domain = wl.domain ?? null;
            form.login_bg_url = wl.login_bg_url ?? null;
            form.login_fg_url = wl.login_fg_url ?? null;
        }

    } catch (err) {
        console.error('! WhiteLabelView fetchWhiteLabel !', err);
    }
}

async function save() {

    dashboardStore.setIsLoading(true);

    try {
        const url = `${appStore.getAppUrl}/api/white-label`;
        const r = await axios.put(url, { ...form });

        // Refresh the store so the rest of the app picks up the new branding
        settingsStore.setWhiteLabel(r.data?.data?.white_label ?? null);

        messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

    } catch (err: any) {
        handleFormError(err);
        console.error('! WhiteLabelView save !', err);

    } finally {
        confirmOn.value = false;
        dashboardStore.setIsLoading(false);
    }
}

// - Hooks -------------------------------------------------------------

onMounted(() => {
    fetchWhiteLabel();
});

</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
.wlabel__preview {
    max-width: 16rem;
    max-height: 9rem;
    object-fit: cover;
    border: 1px solid $col-slate-300;
    border-radius: 3px;
}
</style>
