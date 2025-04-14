<script setup lang="ts">
import { ref } from 'vue'
import { useSnackbarStore } from '../stores/snackbar'

const snackbar = useSnackbarStore()
const emit = defineEmits(['close'])

const authEndpoint = '/api/auth'

const isValid = ref(false)
const input = ref({ username: '', password: '' })

const rules = {
  required: (value: string) => value.length > 0 || 'Pole wymagane'
}

const send = async () => {
  try {
    const res = await fetch(authEndpoint, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(input.value)
    })

    const data = await res.json()

    if (!res.ok) {
      snackbar.show(data.error || 'Błąd logowania', 'error')
    } else {
      input.value = { username: '', password: '' }
      snackbar.show('Zalogowano', 'success')
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
            <v-card-title>Login</v-card-title>
            <v-card-text>
                <v-text-field variant="outlined" label="Nazwa użytkownika" v-model="input.username" :rules="[ rules.required ]">
                </v-text-field>
                <v-text-field variant="outlined" type="password" label="Hasło" v-model="input.password" :rules="[]">
                </v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="elevated" @click="send" :disabled="!isValid">Logowanie</v-btn>
                <v-btn variant="elevated" @click="close">Zamknij</v-btn>
            </v-card-actions>
        </v-card>
    </v-form>

</template>

<style scoped>
</style>

