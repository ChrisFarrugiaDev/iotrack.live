import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../views/MapView.vue'
import SvgSpriteView from '../views/helpers/SvgSpriteView.vue'
import AuthView from '@/views/AuthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'mapView', component: MapView, },
		{ path: '/login', name: 'loginView', component: AuthView, },
		{ path: '/forgot-password', name: 'forgotPasswordView', component: AuthView, },
		{ path: '/reset-password', name: 'resetPasswordView', component: AuthView, },
    { path: '/helpers/svg', name: 'viewHelpersSvg', component: SvgSpriteView },	
  ],
})

export default router
