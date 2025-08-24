<template>
    <div id="the-user-menu" class="menu m-1 v-ui" :data-theme="getSidebarTheme" >
        <div class="menu__link menu__link--first">
            <div class="menu__text">Profile Settings</div>
            <svg class="menu__icon">
                <use xlink:href="@/ui/svg/sprite.svg#icon-user-settings"></use>
            </svg>
        </div>

        <div class="menu__link" @click="dashboardStore.toggleTheme">
            <div class="menu__text">Switch Color Theme</div>
            <svg class="menu__icon">
                <use v-if="dashboardStore.getTheme == 'dark'" xlink:href="@/ui/svg/sprite.svg#icon-moon"></use>
                <use v-if="dashboardStore.getTheme == 'light'" xlink:href="@/ui/svg/sprite.svg#icon-sun"></use>
                <use v-if="dashboardStore.getTheme == 'normal'" xlink:href="@/ui/svg/sprite.svg#icon-contrast"></use>
            </svg>
        </div>

        <div class="menu__link">
            <div class="menu__text">Application Settings</div>
            <svg class="menu__icon">
                <use xlink:href="@/ui/svg/sprite.svg#icon-settings"></use>
            </svg>
        </div>

        <div class="menu__link">
            <div class="menu__text">White Lableling</div>
            <svg class="menu__icon">
                <use xlink:href="@/ui/svg/sprite.svg#icon-white-lableling"></use>
            </svg>
        </div>

        <div class="menu__link menu__link--last" @click="logout">
            <div class="menu__text">Logout</div>
            <svg class="menu__icon">
                <use xlink:href="@/ui/svg/sprite.svg#icon-logout"></use>
            </svg>
        </div>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore} from '@/stores/dashboardStore';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';


const router = useRouter();
const dashboardStore = useDashboardStore();



const getSidebarTheme = computed(() => {
    return dashboardStore.getTheme == 'light' ? 'light' : 'dark';
});

function logout() {
    router.push({ name: "logout.view" });
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.menu {
     
    box-shadow: $box-shadow-4;
    width: 14rem;
    background-color: transparent;

    // border: 1px solid var(--color-zinc-300);



    &__link {
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        background-color: var(--color-bg-li);  
        font-family: $font-display;
        gap: 1rem;
        width: 100%;
        padding: .5rem .8rem;
        color: var(--color-text-1);
        font-size: .9rem;
        transition: all .1s ease;
        border: 1px solid var(--color-zinc-300);

        &:not(&:last-child) {
            border-bottom: transparent;
        }

        &:hover {
            background-color: var(--color-zinc-700);
            color: var(--color-bg-li);
            border: 1px solid var(--color-zinc-700);
        }

        &--first {
            border-top-left-radius: $border-radius;
            border-top-right-radius: $border-radius;
        }
        &--last {
            border-bottom-left-radius: $border-radius;
            border-bottom-right-radius: $border-radius;
        }
    }

    &__icon {
        width: 1.2rem;
        height: 1.2rem;
        fill: currentColor;
        stroke: currentColor;
    }
}
</style>