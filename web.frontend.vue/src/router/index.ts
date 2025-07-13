import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../views/MapView.vue'
import SvgSpriteView from '../views/helpers/SvgSpriteView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'mapView', component: MapView, },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    { path: '/helpers/svg', name: 'viewHelpersSvg', component: SvgSpriteView },	
  ],
})

export default router
