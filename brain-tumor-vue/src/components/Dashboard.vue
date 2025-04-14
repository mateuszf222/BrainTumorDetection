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
  <section>
    <h1>Pulpit</h1>

    <p v-if="isLoggedIn">{{ props.user.username }}</p>
    <i v-else>niezalogowany</i>
  </section>
</template>

<style scoped>
</style>