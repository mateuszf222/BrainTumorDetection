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

// Lifecycle
onMounted(() => {
  whoami()
})
</script>



<template>
  <v-app>

    <v-navigation-drawer expand-on-hover rail permanent>

      <v-list nav>
        <v-list-item
          v-for="route in visibleRoutes"
          :key="route.path"
          :to="route.path"
          :title="route.meta?.title"
          :prepend-icon="route.meta?.icon"
          exact
        />
      </v-list>

      <v-spacer></v-spacer>

      <v-list nav>
        <v-list-item key="Login" @click="loginDialog = true" @close="onLogin" prepend-icon="mdi-login" title="Login" exact v-if="!user.username"/>
        <v-list-item key="Logout" @click="logoutDialog = true" @close="onLogin" prepend-icon="mdi-logout" title="Logout" exact v-if="user.username"/>
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