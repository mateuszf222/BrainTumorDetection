<script>
import common from './mixins/common'
import LoginDialog from './components/LoginDialog.vue'
import LogoutDialog from './components/LogoutDialog.vue'
import { useWebSocketStore } from './stores/websocket' // <-- Pinia store

const authEndpoint = '/api/auth'

export default {
  mixins: [ common ],
  components: { LoginDialog, LogoutDialog },
  data() {
    return {
      snackbar: { on: false },
      generalError: false,
      user: {},
      loginDialog: false,
      logoutDialog: false
    }
  },
  methods: {
    onPopup(text, color = 'success') {
      this.snackbar.text = text
      this.snackbar.color = color
      this.snackbar.on = true
    },
    onLogin(text, color = 'success') {
      this.loginDialog = false
      this.logoutDialog = false
      if (color === 'success') {
        this.whoami()
      }
      if (text) {
        this.onPopup(text, color)
      }
    },
    whoami() {
      const wsStore = useWebSocketStore()

      fetch(authEndpoint)
        .then(res => {
          if (!res.ok) {
            this.generalError = true
            return
          }
          res.json().then(data => {
            if (data.sessionid) {
              this.user = data
              wsStore.connect(data.sessionid) // ✅ connect WebSocket via Pinia store
            } else {
              this.generalError = true
            }
          })
        })
        .catch(() => {
          this.generalError = true
        })
    }
  },
  computed: {
    visibleRoutes() {
      return this.$router.options.routes.filter(route =>
        !route.roles || this.checkIfInRole(this.user, route.roles)
      )
    }
  },
  mounted() {
    this.whoami()
  }
}
</script>



<template>
  <v-app v-if="!generalError">

    <v-navigation-drawer expand-on-hover rail permanent>

      <v-list nav>
        <v-list-item
          v-for="route in visibleRoutes"
          :key="route.path"
          :to="route.path"
          :title="route.title"
          :prepend-icon="route.icon"
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
      <router-view @popup="onPopup" :user="user"></router-view>
    </v-main>

    <v-dialog v-model="loginDialog" width="33%" attach="body">
      <LoginDialog @close="onLogin" />
    </v-dialog>

    <v-dialog v-model="logoutDialog" width="33%" attach="body">
      <LogoutDialog @close="onLogin" />
    </v-dialog>

    <v-snackbar v-model="snackbar.on" :color="snackbar.color" :timeout="3000">
      <div style="width: 100%; text-align: center;">{{ snackbar.text }}</div>
    </v-snackbar>

  <v-snackbar v-model="generalError" color="error" location="center" timeout="-1">
    <div style="width: 100%; text-align: center;">Brak połączenia z backendem</div>
  </v-snackbar>
  
  </v-app>
</template>

<style scoped></style>