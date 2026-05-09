import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'vue-url-state',
  description: 'Type-safe URL query state management for Vue and Nuxt',
  base: '/vue-url-state/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'GitHub', link: 'https://github.com/goranton/vue-url-state' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@goranton/vue-url-state' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Schema and Params', link: '/guide/schema' },
          { text: 'useQueryState', link: '/guide/use-query-state' },
          { text: 'useQueryField', link: '/guide/use-query-field' },
          { text: 'useDebouncedQueryField', link: '/guide/use-debounced-query-field' },
          { text: 'useQueryBuffer', link: '/guide/use-query-buffer' },
          { text: 'Pure Helpers', link: '/guide/pure-helpers' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/goranton/vue-url-state' }],
  },
});
