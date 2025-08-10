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
import DeviceDetailView from '@/views/devices/DeviceDetailView.vue'
import DeviceEditView from '@/views/devices/DeviceEditView.vue'


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
				{ path: ':id', name: 'devices.detail', component: DeviceDetailView, props: true },
				{ path: ':id/edit', name: 'devices.edit', component: DeviceEditView, props: true },
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
	messageStore.getPersistFlashMessage ?
		messageStore.decreasePersistFlashMessage() :
		messageStore.clearFlashMessage();

	// // auth gate (default to protected if meta not specified)
	// const requiresAuth = to.meta.requiresAuth !== false;

	// if (requiresAuth && !isAuthenticated.value) {
	// 	authStore.setRedirectTo(to);
	// 	return next({ name: 'login.view' });
	// }

	// continue with the navigation
	next();
});


// ---------------------------------------------------------------------
export default router
