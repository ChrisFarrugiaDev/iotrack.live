<template>
    <section v-if="authorizationStore.getUserPermissions.size" id="the-sidebar" class="sidebar v-ui" :data-theme="getSidebarTheme" :class="{ 'sidebar__open': getIsUserMenuOpen }">

        <div class="sidebar__space sidebar__space--top"></div>

        <div class="sidebar__group">
            <div id="menu-btn" class="sidebar__item sidebar__item--first" @click="toggleUserMenu">
                <svg class="sidebar__svg ">
                    <use xlink:href="@/ui/svg/sprite.svg#icon-menu-1"></use>
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

        <div class="sidebar__item" @click="goToView('map.view')">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-map"></use>
            </svg>
            <div class="sidebar__text">
                <span>Map</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div v-if="authorizationStore.can('org.view')"  class="sidebar__item" @click="goToView('organisations.list')">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-company"></use>
            </svg>
            <div class="sidebar__text">
                <span>Orgs</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div v-if="authorizationStore.can('user.view')" class="sidebar__item" @click="goToView('users.list')">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-users"></use>
            </svg>
            <div class="sidebar__text">
                <span>Users</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-groups"></use>
            </svg>
            <div class="sidebar__text">
                <span>Groups</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item" @click="goToView('devices.list')">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-device"></use>
            </svg>
            <div class="sidebar__text">
                <span>Devices</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item" @click="goToView('assets.list')">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-asset"></use>
            </svg>
            <div class="sidebar__text">
                <span>Assets</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-audit"></use>
            </svg>
            <div class="sidebar__text">
                <span>Audit</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-reports"></use>
            </svg>
            <div class="sidebar__text">
                <span>Reports</span>
            </div>
        </div>

        <div class="sidebar__line"></div>

        <div class="sidebar__item">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-alarm"></use>
            </svg>
            <div class="sidebar__text">
                <span>Alarms</span>
            </div>
        </div>
        <div class="sidebar__line"></div>

        <div class="sidebar__item sidebar__item--last">
            <svg class="sidebar__svg ">
                <use xlink:href="@/ui/svg/sprite.svg#icon-about"></use>
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
import { computed, onMounted } from 'vue';
import { useAuthorizationStore } from '@/stores/authorizationStore';


// - Router ------------------------------------------------------------

const router = useRouter();

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore()
const { getIsUserMenuOpen, getTheme } = storeToRefs(dashboardStore);


const getSidebarTheme = computed(() => {
    return getTheme.value == 'light' ? 'light' : 'dark';
});

const authorizationStore = useAuthorizationStore();

// - Methods -----------------------------------------------------------


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

    @include respondMinHeight(649) {
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
    
    @include respondMinHeight(688) {
        background-color: transparent;
    }

    // Expanded state (when user menu open)
    &__open {
        width: 18.5rem;
        
    }

    // ===== Sidebar Spacers =====
    &__space {
        flex: 1;
        max-height: 4.4rem;

        &--top {
            min-height: 4.4rem !important;
        }
        @include respondHeight(688) {
            max-height: 1.5rem;
            &--top { min-height: 1.5rem !important; }
        }

        @include respondHeight(649) {
            max-height: 0rem;
            &--top { min-height: 0rem !important; }
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
        // border-top: 1px solid  var(--color-zinc-300);

    }

    // ===== Sidebar Item (Buttons) =====
    &__item {
        border: 1px solid var(--color-zinc-300);
        border-bottom: none;
        border-left: none;

        cursor: pointer;
        background-color: var(--color-bg-li);
        color: var(--color-zinc-800);
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

        &--last  {
            border-bottom: 1px solid var(--color-zinc-300);
            &:hover {
                border-bottom: none;
            }
        }
        

        // Rounded corners for first/last items (only on tall screens)

        @include respondMinHeight(649) {
        &--first {
                border-top-right-radius: var(--radius-sm);         
            }
            &--last {
                border-bottom-right-radius: var(--radius-sm);
                border-bottom: 1px solid var(--color-zinc-300);

            }
        } 

        // Hover styles
        &:hover {
            color: var(--color-bg-li);
            background-color: var(--color-zinc-700);
            border-right: transparent;
        }

        // Hidden/Compact state for items
        &--hidden {
            background-color: var(--color-zinc-300);
            height: 3rem;

            &:not(&:first-child) {
                border-top: 1px solid var(--color-zinc-50);
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

            @include respondMobile(688) {
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
