<template>
    <section id="the-sidebar" class="sidebar" :class="{ 'sidebar__open': getIsUserMenuOpen }">

        <div class="sidebar__space"></div>

        <div class="sidebar__group">
            <div id="menu-btn" class="sidebar__item sidebar__item--first" @click="toggleUserMenu">
                <svg class="sidebar__svg ">
                    <use xlink:href="@/assets/svg/sprite.svg#icon-menu-1"></use>
                </svg>
                <div class="sidebar__text">
                    <span>Menu</span>
                </div>
            </div>

            <section class="modal" v-if="getIsUserMenuOpen">
                <TheUserMenu></TheUserMenu>
            </section>

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


        <div class="sidebar__space"></div>


    </section>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboardStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import TheUserMenu from './TheUserMenu.vue';
import { onMounted } from 'vue';


// - Router ------------------------------------------------------------

const router = useRouter();

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore()
const { getIsUserMenuOpen } = storeToRefs(dashboardStore);

// -- methods ----------------------------------------------------------


function toggleUserMenu() {
    dashboardStore.toggleUserMenuState();
}

function goToView(view: string) {
    router.push({ name: view })
}

// Close the user menu when clicks outside the user menu and top bar image
function closeUserMenuOnClickOutside() {
    document.querySelector('body')?.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const userMenuOrBtn = target.closest('#the-user-menu') || target.closest('#menu-btn');
        if (!userMenuOrBtn) {
            dashboardStore.updateUserMenuState(false);
        }
    })
}

// - Hooks -------------------------------------------------------------

onMounted(() => {
    closeUserMenuOnClickOutside();
});

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// ===== Sidebar Modal (User Menu) =====
.modal {
    position: absolute;
    right: 0;
    top: 0;

    @include respondMinHeight(760) {
        top: -4px;
    }
}

// ===== Sidebar Container =====
.sidebar {
    width: 4rem;
    height: 100vh;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: transparent;

    // Expanded state (when user menu open)
    &__open {
        width: 18.5rem;
    }

    // ===== Sidebar Spacers =====
    &__space {
        flex: 1;
        max-height: 0;

        @include respondMinHeight(760) {
            max-height: 3.7rem;
        }

        &--2 {
            flex: 2;
        }
    }

    // ===== Sidebar Group (menu + dropdown) =====
    &__group {
        display: grid;
        grid-template-columns: 4rem 1fr;
        position: relative;
        overflow: visible;
    }

    // ===== Sidebar Divider Lines =====
    &__line {
        width: 4rem;
        border-top: 1px solid $col-zinc-600;
    }

    // ===== Sidebar Item (Buttons) =====
    &__item {
        cursor: pointer;
        background-color: $col-zinc-800;
        color: $col-zinc-100;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: .3rem;
        min-height: 4.2rem;
        width: 4rem;
        height: 4rem;
        padding-top: 5px;
        transition: all .1s ease;
        position: relative;

        // Rounded corners for first/last items (only on tall screens)
        @include respondMinHeight(760) {
            &--first {
                border-top-right-radius: $border-radius;
            }

            &--last {
                border-bottom-right-radius: $border-radius;
            }
        }

        // Hover styles
        &:hover {
            color: $col-zinc-800;
            background-color: $col-zinc-300;
        }

        // Hidden/Compact state for items
        &--hidden {
            background-color: $col-zinc-300;
            height: 3rem;

            &:not(&:first-child) {
                border-top: 1px solid $col-zinc-50;
            }
        }
    }

    // ===== Sidebar SVG Icons =====
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

    // ===== Sidebar Item Text =====
    &__text {
        font-family: $font-display;
        font-size: .8rem;
        font-weight: 400;

        &--mobile {
            display: block;
        }

        &--desktop {
            display: none;
        }
    }
}
</style>
