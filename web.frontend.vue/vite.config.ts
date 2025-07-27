import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'node:path'




// https://vite.dev/config/
export default defineConfig(({ mode }) => {

	// Load env file based on `mode` in the current working directory.
	// The third argument '' means load all keys (but still only expose VITE_* by default)
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			vue(),
			vueDevTools(),
		],
		build: {
			outDir: './go-server/dist', // Path relative to the current directory
			emptyOutDir: true, // Ensures the output directory is cleared before build
		},
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: `
            @use "~sass/main" as *;
            @use "~sass/abstracts/_index" as *;
          `,
					//   api: 'modern',
				},
			},
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'~sass': path.resolve(__dirname, 'src/assets/sass'),
			},
		},
	}
}
)
