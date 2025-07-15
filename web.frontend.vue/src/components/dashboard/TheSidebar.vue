<template>
    <section id="the-sidebar" class="sidebar">

        <div class="sidebar__space"></div>

        <div id="menu-btn" class="sidebar__item sidebar__item--first" @click="toggleUserMenu">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-menu-1"></use>
            </svg>
            <div class="sidebar__text">
                <span>Menu</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item" @click="goToView('mapView')">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-map"></use>
            </svg>
            <div class="sidebar__text">
                <span>Map</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item" @click="goToView('organisationsView')">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-company"></use>
            </svg>
            <div class="sidebar__text">
                <span>Orgs</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-users"></use>
            </svg>
            <div class="sidebar__text">
                <span>Users</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-groups"></use>
            </svg>
            <div class="sidebar__text">
                <span>Groups</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-device"></use>
            </svg>
            <div class="sidebar__text">
                <span>Devices</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-asset"></use>
            </svg>
            <div class="sidebar__text">
                <span>Assets</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-audit"></use>
            </svg>
            <div class="sidebar__text">
                <span>Audit</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-reports"></use>
            </svg>
            <div class="sidebar__text">
                <span>Reports</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-alarm"></use>
            </svg>
            <div class="sidebar__text">
                <span>Alarms</span>
            </div>
        </div>
        <div class="sidebar__line"></div>

        <div class="sidebar__item sidebar__item--last">
            <svg class="sidebar__svg ">
                <use xlink:href="@/assets/svg/sprite.svg#icon-about"></use>
            </svg>
            <div class="sidebar__text">
                <span>About</span>
            </div>
        </div>





    </section>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboardStore';
import { useRouter } from 'vue-router';

// - Router ------------------------------------------------------------

const router = useRouter();

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore()

// -- methods ----------------------------------------------------------


function toggleUserMenu() {
    console.log(1)
    dashboardStore.toggleUserMenuState();
}

function goToView(view: string) {
    router.push({name: view})
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.sidebar {


    width: 4rem;

    height: 100vh; // Full viewport height
    max-height: 100vh;

    display: flex; // Use real flexbox!
    flex-direction: column; // Stack items vertically
    // align-items: ;     // Center items horizontally
    // justify-content: center; // Center items vertically
    background-color: $col-zinc-800;

    @include respondMinHeight(700) {
        background-color: transparent;
    }




    &__line {
        width: 100%;
        border-top: 1px solid $col-zinc-600;
        // margin: 2px 0;
    }

    &__svg {
        width: 1.2rem;
        height: 1.2rem;
        fill: currentColor;

        &--expand {
            transform: translateX(-7px);

            @include respondMobile($bp-medium) {
                transform: translateX(0px);
            }
        }
    }

    &__item {
        cursor: pointer;
        background-color: $col-zinc-800;
        display: flex;
        position: relative;
        gap: .3rem;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: $col-zinc-100;
        min-height: 4.2rem;
        padding-top: 5px;
        // border: 1px solid crimson;
        transition: all .1s ease;


        @include respondMinHeight(700) {

            &--first {
                border-top-right-radius: $border-radius;
            }

            &--last {
                border-bottom-right-radius: $border-radius;
            }
        }



        &:hover {
            color: $col-zinc-800;
            background-color: $col-zinc-300;
        }

        &--hidden {
            background-color: $col-zinc-300;
            height: 3rem;

            &:not(&:first-child) {
                border-top: 1px solid $col-zinc-50;
            }
        }
    }

    &__space {
        flex: 1;
        max-height: 0.0rem;

        @include respondMinHeight(700) {
            max-height: 0.5rem;
        }
    }

    &__text {
        font-family: $font-action;
        font-size: .8rem;
        font-weight: 400;

        // @include respondMobile($bp-medium) {
        //     font-size: 1rem;
        //     font-family: $font-action;
        //     flex: 1;
        // }

        &--mobile {
            display: block;

            // @include respondMobile($bp-medium) {
            //     display: none;
            // }
        }

        &--desktop {
            display: none;

            // @include respondMobile($bp-medium) {
            //     display: block;
            // }
        }
    }
}
</style>