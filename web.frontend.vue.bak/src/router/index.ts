import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router'
import MapView from '../views/MapView.vue'
import SvgSpriteView from '../views/helpers/SvgSpriteView.vue'
import AuthView from '@/views/AuthView.vue'
import OrganisationView from '@/views/OrganisationView.vue'
import { useAuthStore } from '@/stores/authStore'
import { useMessageStore } from '@/stores/messageStore'
import { storeToRefs } from 'pinia'
import LogoutView from '@/views/LogoutView.vue'

import DeviceView from '@/views/devices/DeviceView.vue'
import DeviceListView from '@/views/devices/DeviceListView.vue'
import DeviceCreateView from '@/views/devices/DeviceCreateView.vue'
import DeviceUpdateView from '@/views/devices/DeviceUpdateView.vue'

import AssetView from '@/views/assets/AssetView.vue'
import AssetListView from '@/views/assets/AssetListView.vue'
import AssetCreateView from '@/views/assets/AssetCreateView.vue'
import AssetEditView from '@/views/assets/AssetUpdateView.vue'


const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', name: 'mapView', component: MapView },

		{ path: '/login', name: 'login.view', component: AuthView, meta: { requiresAuth: false } },
		{ path: '/logout', name: 'logout.view', component: LogoutView, meta: { requiresAuth: true } },
		{ path: '/forgot-password', name: 'forgot.password.view', component: AuthView, meta: { requiresAuth: false } },
		{ path: '/reset-password', name: 'reset.password.view', component: AuthView, meta: { requiresAuth: false } },

		{ path: '/organisations', name: 'organisationsView', component: OrganisationView, meta: { requiresAuth: true } },

		{
			path: '/devices',
			name: 'devices.view',
			component: DeviceView,
			meta: { requiresAuth: true },
			children: [
				{ path: '', name: 'devices.list', component: DeviceListView},
				{ path: 'new', name: 'devices.create', component: DeviceCreateView },
				// { path: ':id', name: 'devices.detail', component: DeviceDetailView, props: true },
				{ path: ':id/update', name: 'devices.update', component: DeviceUpdateView, props: true },
			],
		},
		{
			path: '/assets',
			name: 'assets.view',
			component: AssetView,
			meta: { requiresAuth: true },
			children: [
				{ path: '', name: 'assets.list', component: AssetListView},
				{ path: 'new', name: 'assets.create', component: AssetCreateView },
				// { path: ':id', name: 'Assets.detail', component: AssetDetailView, props: true },
				{ path: ':id/edit', name: 'assets.edit', component: AssetEditView, props: true },
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
