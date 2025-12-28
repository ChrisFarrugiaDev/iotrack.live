/// <reference path="./types/vue3-treeselect/index.d.ts" />
import './assets/main.css'

import { createApp, h, Transition, TransitionGroup } from 'vue'  // Vue core imports
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import VCalendar from 'v-calendar';
import 'v-calendar/style.css';

const app = createApp(App)

/* --------------------------------------------------------------------------
 * Vue 2 Compatibility Shims for vue3-treeselect
 *
 * The vue3-treeselect package internally references two Vue 2 concepts:
 *   1. `$createElement` – used in Vue 2 render functions
 *   2. `<transition>` and `<transition-group>` – registered differently in Vue 3
 *
 * In Vue 3, `$createElement` was replaced by the `h()` helper and the
 * built-in Transition components are no longer automatically resolved
 * by name when libraries render them dynamically.
 *
 * To maintain compatibility without modifying the library, we:
 *   - Assign `h` to `$createElement` on the global properties
 *   - Manually register `transition` and `transition-group`
 *
 * This ensures vue3-treeselect can render its animations and UI elements
 * without triggering “Failed to resolve component” warnings.
 * -------------------------------------------------------------------------- */
app.config.globalProperties.$createElement = h as any
app.component('transition', Transition)
app.component('transition-group', TransitionGroup)

// Application setup
app.use(createPinia())
app.use(router)

app.use(VCalendar, {})

// Mount to DOM
app.mount('#app')
