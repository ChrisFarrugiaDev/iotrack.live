<template>
	<main class="vview__main">

		<div class="background"></div>

		<div class="ssign"> 
            <div class="ssign__image"></div>
            <component :is="currentFormComponent" />    
        </div>

	</main>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm.vue';
import LoginForm from '@/components/auth/LoginForm.vue';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm.vue';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// -- store ------------------------------------------------------------


// -- router -----------------------------------------------------------
const route = useRoute();
const router = useRouter();

// -- computed ---------------------------------------------------------


// Determine the correct component based on the route name
const currentFormComponent = computed(() => {
    if (route.name === 'login.view') {
        return LoginForm;
        
    } else if (route.name === 'forgot.password.view') {
        return ForgotPasswordForm;
    
    } else if (route.name === 'reset.password.view') {
        return ResetPasswordForm;
    }
    return null; // Or a default component if necessary
});




</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>

.vview__main {
    position: relative; // Ensure .background and .ssign share the same stacking context
    min-height: 100vh;

    @include respondDesktop(425) {
        padding: 01rem !important;
    }

}

.background {
    background-image: url("/annie-spratt-BkbbuOdX06A-unsplash.jpg");
    background-size: cover;
    background-position: center;
    opacity: 0.5;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0; // Below .ssign
   
}

.ssign {
    position: relative;
    z-index: 1000 !important;
    margin: calc((80vh - 468px) / 2) auto;
    height: 468px;
    max-width: 700px;
    border: 1px solid $col-slate-300;
    display: flex;
    border-radius: 5px;
    background-color: $col-white;

    @include respondDesktop(425) {
        margin: calc((90vh - 468px) / 2) auto;
    }

    @include respondDesktop(700) {
        max-width: 430px;
    }


    &__image {
        height: 100%;
        flex: 1;
        background-image: url("/mika-baumeister-nDciGidCdQo-unsplash.jpg");
        background-size: cover;
        background-position: center;

        @include respondDesktop(700) {
            display: none;
        }
    }
}
</style>