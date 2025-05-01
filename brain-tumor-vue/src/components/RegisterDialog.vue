<script setup lang="ts">
import { ref } from 'vue'
import { useSnackbarStore } from '../stores/snackbar'

const snackbar = useSnackbarStore()
const emit = defineEmits(['close'])

const registerEndpoint = '/api/auth/register'

const isValid = ref(false)
const input = ref({ username: '', password: '' })

const rules = {
  required: (value: string) => value.length > 0 || 'Pole wymagane',
  minLength: (value: string) => value.length >= 4 || 'Minimum 4 znaki'
}

const send = async () => {
  try {
    const res = await fetch(registerEndpoint, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(input.value)
    })

    const data = await res.json()

    if (!res.ok) {
      snackbar.show(data.error || 'Błąd rejestracji', 'error')
    } else {
      input.value = { username: '', password: '' }
      snackbar.show('Zarejestrowano pomyślnie', 'success')
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
  <v-form v-model="isValid">
    <v-card>
      <v-card-title>Rejestracja</v-card-title>
      <v-card-text>
        <v-text-field
          variant="outlined"
          label="Nazwa użytkownika"
          v-model="input.username"
          :rules="[rules.required, rules.minLength]"
        />
        <v-text-field
          variant="outlined"
          type="password"
          label="Hasło"
          v-model="input.password"
          :rules="[rules.required, rules.minLength]"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="send" :disabled="!isValid">Zarejestruj</v-btn>
        <v-btn variant="elevated" @click="close">Zamknij</v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<style scoped>
</style>
