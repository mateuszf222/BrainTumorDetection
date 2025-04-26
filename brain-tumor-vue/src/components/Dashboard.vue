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
  style="position: fixed; top: 50px; left: 100px;"
  >
    
  <IconBrainLogo class="w-3 h-3 mr-2" />
  <h1 class="text-2xl font-semibold">Pulpit</h1>
  
    <p v-if="isLoggedIn">{{ props.user.username }}</p>
    <i v-else>niezalogowany</i>
  </v-card>
</template>



<style scoped>
</style>