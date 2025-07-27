import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router'
import MapView from '../views/MapView.vue'
import SvgSpriteView from '../views/helpers/SvgSpriteView.vue'
import AuthView from '@/views/AuthView.vue'
import OrganisationView from '@/views/OrganisationView.vue'
import { useAuthStore } from '@/stores/authStore'
import { useMessageStore } from '@/stores/messageStore'
import { storeToRefs } from 'pinia'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', name: 'mapView', component: MapView, },

		{ path: '/login', name: 'loginView', component: AuthView, },
		{ path: '/forgot-password', name: 'forgotPasswordView', component: AuthView, },
		{ path: '/reset-password', name: 'resetPasswordView', component: AuthView, },

		{ path: '/organisations', name: 'organisationsView', component: OrganisationView, },

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


	// Clear flash message
	messageStore.getPersistFlashMessage ?
		messageStore.decreasePersistFlashMessage() :
		messageStore.clearFlashMessage();

	// Redirect to login if not authenticated
	if (!isAuthenticated.value && !['loginView', 'forgotPasswordView', 'resetPasswordView'].includes(to.name as string)) {
		authStore.setRedirectTo(to);
		return next({ name: 'loginView' });
	}

	// Continue with the navigation
	next();
});


// ---------------------------------------------------------------------
export default router
