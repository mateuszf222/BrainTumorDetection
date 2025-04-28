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

    <!-- TOP NAVIGATION BAR -->
    <v-app-bar app class="bg-gray-100 shadow-md px-6">
      <v-toolbar-title class="font-bold text-lg">
        <!-- Optional: Logo or App Name -->
        <IconBrainLogo class="w-14 h-14 ml-4" />
      </v-toolbar-title>

      <v-spacer />

      <!-- Navigation Links -->
      <v-list class="flex flex-row space-x-8" nav density="comfortable">
        <v-list-item
          v-for="route in visibleRoutes"
          :key="route.path"
          :to="route.path"
          variant="plain"
          class="group transition-colors duration-200"
          exact
        >
          <template #prepend>
            <component
              :is="route.meta?.icon"
              :class="[
                'mr-2 w-5 h-5 text-gray-600 group-hover:text-blue-600',
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

        <!-- LOGIN / LOGOUT -->
        <v-list-item
          key="Login"
          v-if="!user.username"
          @click="loginDialog = true"
          variant="plain"
          class="group transition-colors duration-200"
        >
          <template #prepend>
            <IconLogin class="mr-2 w-5 h-5 group-hover:text-blue-600" />
          </template>
          <template #title>
            <div class="text-sm font-medium group-hover:text-blue-600">
              Logowanie
            </div>
          </template>
        </v-list-item>

        <v-list-item
          key="Logout"
          v-else
          @click="logoutDialog = true"
          variant="plain"
          class="group transition-colors duration-200"
        >
          <template #prepend>
            <IconLogout class="mr-2 w-5 h-5 group-hover:text-blue-600" />
          </template>
          <template #title>
            <div class="text-sm font-medium group-hover:text-blue-600">
              Wylogowanie
            </div>
          </template>
        </v-list-item>

      </v-list>
    </v-app-bar>

    <!-- MAIN CONTENT -->
    <v-main class="pt-16">
      <router-view :user="user"></router-view>
    </v-main>

    <!-- Dialogs -->
    <v-dialog v-model="loginDialog" width="33%" attach="body">
      <LoginDialog @close="onLogin" />
    </v-dialog>

    <v-dialog v-model="logoutDialog" width="33%" attach="body">
      <LogoutDialog @close="onLogin" />
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="snackbar.timeout">
      <div class="text-center w-full">{{ snackbar.text }}</div>
    </v-snackbar>

  </v-app>
</template>


<style scoped></style>