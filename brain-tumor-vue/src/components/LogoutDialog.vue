<script setup lang="ts">
import { useSnackbarStore } from '../stores/snackbar'

const snackbar = useSnackbarStore()
const emit = defineEmits(['close'])

const authEndpoint = '/api/auth'

const logout = async () => {
  try {
    const res = await fetch(authEndpoint, {
      method: 'DELETE'
    })
    const data = await res.json()

    if (!res.ok) {
      snackbar.show(data.error || 'Błąd wylogowania', 'error')
    } else {
      snackbar.show('Wylogowano', 'success')
      emit('close')
    }
  } catch (err) {
    snackbar.show('Brak połączenia z backendem', 'error')
  }
}

const close = () => {
  emit('close')
}
</script>

<template>
    <v-card>
        <v-card-title>Wylogowanie</v-card-title>
        <v-card-text>
            Jesteś pewien?
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="elevated" @click="logout">Wylogowanie</v-btn>
            <v-btn variant="elevated" @click="close">Zamknij</v-btn>
        </v-card-actions>
    </v-card>
</template>

<style scoped>
</style>