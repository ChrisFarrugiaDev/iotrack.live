import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router'
import MapView from '../views/MapView.vue'
import SvgSpriteView from '../views/helpers/SvgSpriteView.vue'
import AuthView from '@/views/AuthView.vue'

import { useAuthStore } from '@/stores/authStore'
import { useMessageStore } from '@/stores/messageStore'
import { storeToRefs } from 'pinia'
import LogoutView from '@/views/LogoutView.vue'

// Devices
import DeviceView from '@/views/devices/DeviceView.vue'
import DeviceListView from '@/views/devices/DeviceListView.vue'
import DeviceCreateView from '@/views/devices/DeviceCreateView.vue'
import DeviceUpdateView from '@/views/devices/DeviceUpdateView.vue'

// Assets
import AssetView from '@/views/assets/AssetView.vue'
import AssetListView from '@/views/assets/AssetListView.vue'
import AssetCreateView from '@/views/assets/AssetCreateView.vue'
import AssetEditView from '@/views/assets/AssetUpdateView.vue'

// Organisations
import OrgView from '@/views/organisations/OrgView.vue'
import OrgListView from '@/views/organisations/OrgListView.vue'
import OrgCreateView from '@/views/organisations/OrgCreateView.vue'
import OrgUpdateView from '@/views/organisations/OrgUpdateView.vue'

// Users
import UserView from '@/views/users/UserView.vue'
import UserListView from '@/views/users/UserListView.vue'
import UserCreateView from '@/views/users/UserCreateView.vue'
import UserUpdateView from '@/views/users/UserUpdateView.vue'
import { useAuthorizationStore } from '@/stores/authorizationStore'




const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', name: 'map.view', component: MapView },

		{ path: '/login', name: 'login.view', component: AuthView, meta: { requiresAuth: false } },
		{ path: '/logout', name: 'logout.view', component: LogoutView, meta: { requiresAuth: true } },
		{ path: '/forgot-password', name: 'forgot.password.view', component: AuthView, meta: { requiresAuth: false } },
		{ path: '/reset-password', name: 'reset.password.view', component: AuthView, meta: { requiresAuth: false } },

		// Devices
		{
			path: '/devices',
			name: 'devices.view',
			component: DeviceView,
			meta: { requiresAuth: true },
			children: [
				{ path: '', name: 'devices.list', component: DeviceListView },
				{ path: 'new', name: 'devices.create', component: DeviceCreateView },
				// { path: ':id', name: 'devices.detail', component: DeviceDetailView, props: true },
				{ path: ':id/update', name: 'devices.update', component: DeviceUpdateView, props: true },
			],
		},

		// Assets
		{
			path: '/assets',
			name: 'assets.view',
			component: AssetView,
			meta: { requiresAuth: true },
			children: [
				{ path: '', name: 'assets.list', component: AssetListView },
				{ path: 'new', name: 'assets.create', component: AssetCreateView },
				// { path: ':id', name: 'Assets.detail', component: AssetDetailView, props: true },
				// { path: ':id/edit', name: 'assets.edit', component: AssetEditView, props: true },
			],
		},

		// Organisations
		{
			path: '/organisations',
			name: 'organisations.view',
			component: OrgView,
			meta: { requiresAuth: true },
			children: [
				{ path: '', name: 'organisations.list', component: OrgListView },
				{ path: 'new', name: 'organisations.create', component: OrgCreateView },
				{ path: ':id/edit', name: 'organisations.edit', component: OrgUpdateView, props: true },
			],
		},

		// Users
		{
			path: '/users',
			name: 'users.view',
			component: UserView,
			meta: { requiresAuth: true },
			children: [
				{ path: '', name: 'users.list', component: UserListView },
				{ path: 'new', name: 'users.create', component: UserCreateView },
				{ path: ':id/edit', name: 'users.edit', component: UserUpdateView, props: true },
			],
		},

		{ path: '/helpers/svg', name: 'viewHelpersSvg', component: SvgSpriteView },
	],
});
// ---------------------------------------------------------------------

router.beforeEach(async (
	to: RouteLocationNormalized,
	from: RouteLocationNormalized,
	next: NavigationGuardNext
) => {
	// Note: We are access the Pinia store within the navigation guard by:
	// useAuthStore() & useMessageStore() to ensure Pinia is properly initialized 

	const authorizationStore = useAuthorizationStore();

	if ( to.name == 'organisations.list' &&  !authorizationStore.can('org.view') ) {
		return next({ name: 'map.view' });
	}

	if ( to.name == 'users.list' &&  !authorizationStore.can('user.view') ) {
		return next({ name: 'map.view' });
	}

	if ( to.name == 'assets.list' &&  !authorizationStore.can('asset.view') ) {
		return next({ name: 'map.view' });
	}

	if ( to.name == 'devices.list' &&  !authorizationStore.can('device.view') ) {
		return next({ name: 'map.view' });
	}

	const authStore = useAuthStore();
	// const appStore = useAppStore();
	const messageStore = useMessageStore();

	const { isAuthenticated } = storeToRefs(authStore);
	// const { checkJwtExpiration } = useJwtComposable();


	// flash message handling
	messageStore.getFlashMessageDuration ?
		messageStore.decreaseFlashMessageDuration() :
		messageStore.clearFlashMessageList();


	// auth gate (default to protected if meta not specified)
	const requiresAuth = to.meta.requiresAuth !== false;

	if (requiresAuth && !isAuthenticated.value) {
		authStore.setRedirectTo(to);
		return next({ name: 'login.view' });
	}

	// continue with the navigation
	next();
});


// ---------------------------------------------------------------------
export default router
