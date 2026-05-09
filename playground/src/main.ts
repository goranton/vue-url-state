import { createApp, h } from 'vue';
import { createRouter, createWebHistory, RouterView } from 'vue-router';

import App from './App.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/users' },
    { path: '/users', component: App },
  ],
});

createApp({
  render: () => h(RouterView),
})
  .use(router)
  .mount('#app');
