<script setup lang="ts">
import { computed } from 'vue'


// Define props
interface User {
  username?: string
}
const props = defineProps<{ user: User }>()

// Optional: computed property if needed
const isLoggedIn = computed(() => !!props.user?.username)
</script>

<template>
  <v-card
  class="pa-4"
  outlined
  max-width="150"
  style="position: relative; top: 100px; left: 100px;"
  >
  <h1 class="text-2xl font-semibold">Pulpit</h1>
  
    <p v-if="isLoggedIn">{{ props.user.username }}</p>
    <i v-else>niezalogowany</i>
  </v-card>
</template>



<style scoped>
</style>