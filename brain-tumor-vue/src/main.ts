import './assets/main.css';
import '@mdi/font/css/materialdesignicons.css';

import { createApp } from 'vue';

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

type CustomRoute = RouteRecordRaw & {
    title?: string;
    icon?: string;
    roles?: number[];
};

const routes: CustomRoute[] = [
    { path: '/', component: Dashboard, title: 'Pulpit', icon: 'mdi-home' }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

createApp(App).use(vuetify).use(router).mount('#app');