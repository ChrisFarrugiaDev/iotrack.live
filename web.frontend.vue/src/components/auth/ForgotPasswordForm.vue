<template>
    <form class="ssign__form" @submit.prevent="submitForm">
        <div>
            <div class="ssign__title mt-4 mb-8">
                Forgot Your <b>Password?</b>
            </div>

            <div class="ssign__subtitle">
                "Enter your registered email address below, and we'll send you instructions to reset your password."
            </div>
            
            <TheFlashMessage></TheFlashMessage>

            <div class="ssign__group mt-8">
                <label for="sign-email" class="ssign__label">Email</label>
                <input id="sign-email" type="text" class="ssign__input" v-model="email">
            </div>

            <div class="ssign__row mt-3">
                <div class="ssign__placeholder"></div>
                <div class="ssign__forgot" @click="goToView('login.view')">Back to Login</div>
            </div>
        </div>

        <button class="bbtn bbtn--sky">Send Reset Link</button>
    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import TheFlashMessage from '../commen/TheFlashMessage.vue';


// -- data -------------------------------------------------------------

const router = useRouter();
const email = ref("");

// -- methods ----------------------------------------------------------

function goToView(view: string) {
    router.push({name: view});
}

async function submitForm() {}

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
        b { font-weight: 500; }
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