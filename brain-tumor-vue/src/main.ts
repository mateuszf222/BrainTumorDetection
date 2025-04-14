import './assets/main.css';
import '@mdi/font/css/materialdesignicons.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia' // ✅ Add this line


// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';


import App from './App.vue';

const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi'
    }
});

// Router
import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory} from 'vue-router';
import Dashboard from './components/Dashboard.vue';
import PhotoAnalyzer from './components/PhotoAnalyzer.vue';
import PhotoResultViewer from './components/PhotoResultViewer.vue';

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    roles?: number[]
  }
}

const pinia = createPinia() // ✅ Create Pinia instance

const routes: RouteRecordRaw[] = [
    {
      path: '/',
      component: Dashboard,
      meta: { title: 'Pulpit', icon: 'mdi-home' }
    },
    {
      path: '/analyzePhoto',
      component: PhotoAnalyzer,
      meta: { title: 'Analiza zdjęć', icon: 'mdi-image', roles: [0, 1] }
    },
    {
      path: '/viewPhotoResult',
      component: PhotoResultViewer,
      meta: { title: 'Podgląd wyników zdjęć', icon: 'mdi-image-search', roles: [0, 1] }
    }
  ];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

createApp(App).use(vuetify).use(pinia).use(router).mount('#app');