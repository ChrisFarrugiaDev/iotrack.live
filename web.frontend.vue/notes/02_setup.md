### Step 1. Create a Vue Project with vite
```bash
$ npm init vite@latest

> web.frontend.vue@0.0.0 npx
> create-vite

│
◇  Project name:
│  web.frontend.vue
│
◇  Select a framework:
│  Vue
│
◇  Select a variant:
│  Official Vue Starter ↗

> web.frontend.vue@0.0.0 npx
> create-vue web.frontend.vue

┌  Vue.js - The Progressive JavaScript Framework
│
◆  Select features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
│  ◼ TypeScript
│  ◻ JSX Support
│  ◼ Router (SPA development)
│  ◼ Pinia (state management)
│  ◻ Vitest (unit testing)
│  ◻ End-to-End Testing
│  ◻ ESLint (error prevention)
│  ◻ Prettier (code formatting)
└

◇  Select experimental features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
│  none

Scaffolding project in /home/foxcodenine/foxfiles/git/chrisfarrugia.dev/iotrack.live/web.frontend.vue/web.frontend.vue...
│
└  Done. Now run:

   cd web.frontend.vue
   npm install
   npm run dev
```

### Step 2. Install sass:

```bash
npm install sass@latest sass-loader@latest
```

### Step 3. create main sass file:

```bash
code src/assets/sass/main.scss
code src/assets/sass/abstracts/_index.scss
```

### Step 4. Update vite.config.js: 