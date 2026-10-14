import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,

				// Don't really care about accessibility since I made this project only for me. So don't come at me 🔫
				warningFilter: warning => !warning.code.includes("a11y")
			},
			adapter: adapter()
		})
	],
});
