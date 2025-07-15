<template>
    <form class="ssign__form" @submit.prevent="submitForm">
        <div>
            <div class="ssign__title mt-4 mb-6" v-html="loginPageTitle" ></div>

            <div class="ssign__flash-message mb-4 h-5 text-red-600">
                {{ flashMessage }}
            </div>

            <div class="ssign__group" @click="resetFlashMassage()">
                <label for="sign-email" class="ssign__label">Email</label>
                <input id="sign-email" type="text" class="ssign__input" v-model.trim="email">
            </div>

            <div class="ssign__group mt-6" @click="resetFlashMassage()">
                <label for="sign-password" class="ssign__label">Password</label>
                <input id="sign-password" type="password" class="ssign__input" v-model.trim="password">
            </div>

            <div class="ssign__row mt-3" @click="resetFlashMassage()">
                <div class="ssign__remember" @click="toggleRememberMe()">
                    <svg class="ssign__icon" v-if="getRemeberMe">
                        <use xlink:href="@/assets/svg/sprite.svg#icon-checkbox-3"></use>
                    </svg>
                    <svg class="ssign__icon ssign__icon--empty" v-else></svg>
                    Remeber me
                </div>
                <div class="ssign__forgot" @click="goToView('forgotPasswordView')">Forgot your password?</div>
            </div>
        </div>

        <button class="bbtn bbtn--sky">Sign In</button>
    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// - Store -------------------------------------------------------------

// const { getRemeberMe } = storeToRefs(authStore);
const getRemeberMe = ref(false);

// - Data --------------------------------------------------------------
const router = useRouter();

const email = ref("user@dev.com");
const password = ref("DevPass");

// const loginPageTitle = ref(GO_LOGIN_PAGE_TITLE);
const loginPageTitle = ref("Welcome to <b style='font-weight:600'>IoTrack</b> Live");

const flashMessage = ref<string | null>("")

// -- methods ----------------------------------------------------------

function goToView(view: string) {
    router.push({name: view});
}

function resetFlashMassage() {
    flashMessage.value = null;
}

async function submitForm() {}

function toggleRememberMe() {}


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.ssign {

    &__form {
        width: 430px;
        height: 100%;
        padding: 2rem;
        font-family: $font-display;
        font-size: .85rem;
        font-weight: 400;
        color: $col-slate-700;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    &__title {
        font-size: 1.8rem;
        font-weight: 200;

        b {
            font-weight: 650;
        }
    }

    &__group {
        display: flex;
        flex-direction: column;
    }

    &__label {
        margin-bottom: .3rem;
    }

    &__input {
        width: 100%;
        height: 2rem;
        padding: .2rem .5rem;
        border: 1px solid $col-slate-300;
        border-radius: 3px;
        font-size: 1rem;
        color: $col-slate-600;
    }

    &__row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__remember {
        cursor: pointer;
    }

    &__icon {
        width: 1rem;
        height: 1rem;
        fill: $col-blue-600;
        transform: translateY(3px);
        border-radius: 2px;
        border: 1px solid $col-blue-600;

        &--empty {
            border: 1px solid $col-slate-500;
        }
    }

    &__forgot {
        cursor: pointer;
        color: $col-blue-600;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>