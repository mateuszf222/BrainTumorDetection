<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSnackbarStore } from '../stores/snackbar'

const emit = defineEmits(['close', 'listChanged'])
const props = defineProps<{ photo?: any }>()

const snackbar = useSnackbarStore()
const isValid = ref(false)
const input = ref<any>({})

const generateImageUrl = (binaryData: number[]) => {
  const base64 = btoa(binaryData.reduce((acc, byte) => acc + String.fromCharCode(byte), ''))
  return `data:image/jpeg;base64,${base64}`
}

const formattedUploadDateInput = computed({
  get() {
    if (!input.value.uploadDate) return ''

    const date = new Date(input.value.uploadDate)

    const pad = (n: number) => n.toString().padStart(2, '0')

    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())

    // This produces correct string for <input type="datetime-local"> in local time
    return `${year}-${month}-${day}T${hours}:${minutes}`
  },
  set(newVal: string) {
    // newVal is local time from datetime-local input, convert to Date and save as ISO
    const localDate = new Date(newVal)
    input.value.uploadDate = localDate.toISOString()
  }
})



// Validation rules
const rules = {
  required: (value: string) => !!value || 'Pole wymagane',
  startsWithLetter: (value: string) => /^\p{L}/u.test(value) || 'Wymagane zaczynanie się od litery',
  validDate: (value: string) => new Date(value) <= new Date() || 'Wymagana data z przeszłości'
}

// Endpoints
const photoEndpoint = '/api/photo'

const send = async () => {
  try {
    const res = await fetch(photoEndpoint, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(input.value)
    })
    const data = await res.json()

    if (!res.ok) {
      snackbar.show(data.error, 'error')
      emit('close')
    } else {
      input.value = {}
      emit('close')
      emit('listChanged')
      snackbar.show(`${data.firstName} ${data.lastName} - dodano`)
    }
  } catch (err) {
    snackbar.show('Dane odrzucone', 'error')
    emit('close')
  }
}

const update = async () => {
  try {
    const res = await fetch(photoEndpoint, {
      method: 'PUT',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(input.value)
    })
    const data = await res.json()
    if (!res.ok) {
      snackbar.show(data.error, 'error')
      emit('close')
    } else {
      input.value = {}
      snackbar.show(`${data.firstName} ${data.lastName} - zaktualizowano`)
      emit('close')
      emit('listChanged')
    }
  } catch (err) {
    snackbar.show('Dane odrzucone', 'error')
    emit('close')
  }
}

const remove = async () => {
  try {
    const res = await fetch(`${photoEndpoint}?` + new URLSearchParams({ _id: input.value._id }), {
      method: 'DELETE'
    })
    const data = await res.json()
    if (!res.ok) {
      snackbar.show(data.error, 'error')
      emit('close')
    } else {
      input.value = {}
      snackbar.show(`${data.firstName} ${data.lastName} - usunięto`)
      emit('close')
      emit('listChanged')
    }
  } catch (err) {
    snackbar.show('Dane odrzucone', 'error')
    emit('close')
  }
}

const clear = () => {
  input.value = { _id: input.value._id,
    originalName: input.value.originalName, // Keep the original name
    photoData: input.value.photoData // Keep the upload date
   }
  isValid.value = false
}

const close = () => {
  emit('close')
}

onMounted(() => {
  Object.assign(input.value, props.photo || {})
  console.log('Mounted with props:', props.photo)
})

</script>

<template>
  <v-form v-model="isValid">
    <v-card>
      <v-card-title>
        {{ input._id ? 'Edytuj wynik zdjęcia' : 'Wprowadź dane nowego zdjęcia' }}
      </v-card-title>
      <v-card-subtitle>
        Dane muszą spełniać odpowiednie reguły, zarówno w tym formularzu, jak i w backendzie.
      </v-card-subtitle>
      <v-card-text>
        <v-text-field
          variant="outlined"
          label="Imię"
          v-model="input.firstName"
          :rules="[rules.required, rules.startsWithLetter]"
        />
        <v-text-field
          variant="outlined"
          label="Nazwisko"
          v-model="input.lastName"
          :rules="[rules.required, rules.startsWithLetter]"
        />
        <v-text-field
          type="datetime-local"
          variant="outlined"
          label="Data dodania"
          v-model=formattedUploadDateInput
          :rules="[rules.required, rules.validDate]"
        />
        <v-text-field
          variant="outlined"
          label="Nazwa pliku"
          v-model="input.originalName"
          :readonly="true"
        />
        <div v-if="input.photoData && input.photoData.data" class="mt-4">
          <p>Podgląd zdjęcia:</p>
          <img
            :src="generateImageUrl(input.photoData.data)"
            alt="Podgląd"
            style="max-width: 100%; max-height: 300px; border: 1px solid #ccc;"
          />
          <v-btn
            class="mb-5 ml-6"
            :href="generateImageUrl(input.photoData.data)"
            :download="input.originalName || 'analyzed.jpg'"
            color="secondary"
            variant="elevated"
            size="small"
            
          >
            Pobierz
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="elevated" @click="clear">Zeruj</v-btn>
        <v-btn color="primary" variant="elevated" @click="send" :disabled="!isValid" v-if="!input._id">
          Wyślij
        </v-btn>
        <v-btn color="secondary" variant="elevated" @click="update" :disabled="!isValid" v-if="input._id">
          Aktualizuj
        </v-btn>
        <v-btn color="error" variant="elevated" @click="remove" v-if="input._id">Usuń</v-btn>
        <v-btn variant="elevated" @click="close">Zamknij</v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<style scoped>
</style>
