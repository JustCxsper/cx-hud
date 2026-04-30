import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: false,
    warningFilter: (warning) => !warning.code?.startsWith('a11y_'),
  },
}
