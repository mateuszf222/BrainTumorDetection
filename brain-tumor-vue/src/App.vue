<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from './stores/snackbar'
import { useWebSocketStore } from './stores/websocket'
import common from './mixins/common'

// Setup
const snackbar = useSnackbarStore()
const wsStore = useWebSocketStore()
const router = useRouter()

// Data
const user = ref<any>({})
const loginDialog = ref(false)
const logoutDialog = ref(false)

const authEndpoint = '/api/auth'

// Methods
const onLogin = (color: string = 'success') => {
  loginDialog.value = false
  logoutDialog.value = false
  if (color === 'success') {
    whoami()
  }
}

const whoami = async () => {
  try {
    const res = await fetch(authEndpoint)
    if (!res.ok) return

    const data = await res.json()
    if (data.sessionid) {
      user.value = data
      wsStore.connect(data.sessionid)
    }
  } catch (err) {
    console.error('Failed to fetch user:', err)
  }
}

// Computed
const visibleRoutes = computed(() => {
  return router.options.routes.filter(route =>
    !route.meta?.roles || common.methods.checkIfInRole(user.value, route.meta.roles as number[])
  )
})

const isActiveRoute = (path: string) => {
  return router.currentRoute.value.path === path
}


// Lifecycle
onMounted(() => {
  whoami()
})
</script>



<template>
  <v-app>

    <v-navigation-drawer
      expand-on-hover
      rail
      permanent
      class="pa-4 rounded-xl bg-gray-100 shadow-md"
    >


    <v-list nav density="comfortable">
      <v-list-item
        v-for="route in visibleRoutes"
        :key="route.path"
        :to="route.path"
        variant="plain"
        class="rounded-lg mb-2 group transition-colors duration-200"
        exact
      >
        <template #prepend>
          <component
            :is="route.meta?.icon"
            :class="[
              'mr-4 w-5 h-5 text-gray-600 group-hover:text-blue-600',
              { 'text-blue-600': isActiveRoute(route.path) }
            ]"
          />
        </template>

        <template #title>
          <div
            :class="[
              'text-sm font-medium',
              isActiveRoute(route.path) ? 'text-blue-600' : 'text-gray-500',
              'group-hover:text-blue-600'
            ]"
          >
            {{ route.meta?.title }}
          </div>
        </template>
      </v-list-item>
    </v-list>


    <v-spacer></v-spacer>

    <v-list nav density="comfortable">
      <v-list-item
        key="Login"
        @click="loginDialog = true"
        @close="onLogin"
        variant="plain"
        class="rounded-lg mb-2 group transition-colors duration-200"
        v-if="!user.username"
      >
        <template #prepend>
          <IconLogin class="mr-3" />
        </template>

        <template #title>
          <div
            :class="[
              'text-sm font-medium',
              'group-hover:text-blue-600'
            ]"
          >
            Logowanie
          </div>
        </template>
      </v-list-item>

      <v-list-item
        key="Logout"
        @click="logoutDialog = true"
        @close="onLogin"
        variant="plain"
        class="rounded-lg mb-2 group transition-colors duration-200"
        v-if="user.username"
      >
        <template #prepend>
          <IconLogout class="mr-3" />
        </template>

        <template #title>
          <div
            :class="[
              'text-sm font-medium',
              'group-hover:text-blue-600'
            ]"
          >
            Wylogowanie
          </div>
        </template>
      </v-list-item>
    </v-list>


    </v-navigation-drawer>

    <v-main>
      <router-view :user="user"></router-view> 
    </v-main>

    <v-dialog v-model="loginDialog" width="33%" attach="body">
      <LoginDialog @close="onLogin"/>
    </v-dialog>

    <v-dialog v-model="logoutDialog" width="33%" attach="body">
      <LogoutDialog @close="onLogin" />
    </v-dialog>

    <v-snackbar
      v-model="snackbar.visible"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      <div style="width: 100%; text-align: center;">{{ snackbar.text }}</div>
    </v-snackbar>
  
  </v-app>
</template>

<style scoped></style>