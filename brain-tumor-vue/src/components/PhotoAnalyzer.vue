<script setup lang="ts">
import { ref } from 'vue'
import { useSnackbarStore } from '../stores/snackbar'
const snackbar = useSnackbarStore()

const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const resultImageUrl = ref<string | null>(null)
const loading = ref(false)
const downloadFilename = ref<string | null>(null)

const firstName = ref('')
const lastName = ref('')
const resultBlob = ref<Blob | null>(null)

const fileInputRef = ref<HTMLInputElement | null>(null)



const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    file.value = target.files[0]
    previewUrl.value = URL.createObjectURL(file.value)
    resultImageUrl.value = null

    // 👇 Set the download filename
    const originalName = file.value.name.replace(/\.[^/.]+$/, '') // remove extension
    const extension = file.value.name.split('.').pop()
    downloadFilename.value = `${originalName}_analyzed.${extension}`
  }
}

const analyzePhoto = async () => {
  if (!file.value) return

  loading.value = true
  resultImageUrl.value = null

  const formData = new FormData()
  formData.append('photo', file.value)
  formData.append('firstName', firstName.value)
  formData.append('lastName', lastName.value)


  try {
    const res = await fetch('/api/photo', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('Nie udało się przetworzyć obrazu')

    const blob = await res.blob()
    resultBlob.value = blob
    resultImageUrl.value = URL.createObjectURL(blob)

    snackbar.show('Zdjęcie przeanalizowane!', 'success')

  } catch (err: any) {
    snackbar.show(err.message || 'Błąd podczas analizy', 'error')
  } finally {
    loading.value = false
  }
}

const saveToDatabase = async () => {
  if (!resultBlob.value || !firstName.value || !lastName.value || !downloadFilename.value) {
    snackbar.show('Uzupełnij wszystkie pola', 'error')
    return  
  }

  const formData = new FormData()
  formData.append('photo', resultBlob.value, downloadFilename.value)
  formData.append('firstName', firstName.value)
  formData.append('lastName', lastName.value)

  console.log('Sending blob:', resultBlob.value)


  try {
    const res = await fetch('/api/photo/save', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('Błąd zapisu do bazy')

    snackbar.show('Dane zapisane w bazie!', 'success')

    // ✅ Wait a second then reset UI
    setTimeout(() => {
      resetForm()
    }, 3000)

  } catch (err: any) {
    snackbar.show(err.message || 'Błąd zapisu', 'error')
  }
}

const resetForm = () => {
  file.value = null
  previewUrl.value = null
  resultImageUrl.value = null
  resultBlob.value = null
  firstName.value = ''
  lastName.value = ''

  if (fileInputRef.value) {
  // Clear Vuetify internal file value
  (fileInputRef.value as any).reset()
  }
}


</script>

<template>
  <v-card class="pa-4" max-width="800" outlined style="position: relative; top: 100px; left: 100px">
  <v-card-title>Analiza zdjęcia</v-card-title>

  <v-card-text>
    <v-file-input
      accept="image/*"
      ref="fileInputRef"
      v-model="file"
      label="Wybierz zdjęcie"
      @change="handleFileChange"
      outlined
      dense
      hide-details
    />

    <div v-if="previewUrl" class="mt-4">
      <p><strong>Oryginalne zdjęcie:</strong></p>
      <img :src="previewUrl" alt="Podgląd oryginalnego" style="max-width: 100%; max-height: 300px;" />
    </div>

    <v-btn
      class="mt-4"
      :disabled="!file || loading"
      @click="analyzePhoto"
      color="primary"
    >
      <v-progress-circular
        v-if="loading"
        indeterminate
        size="20"
        color="white"
        class="mr-2"
      />
      Analizuj zdjęcie
    </v-btn>

    <div v-if="resultImageUrl" class="mt-6">
    <p><strong>Wynik analizy:</strong></p>
    <img :src="resultImageUrl" alt="Wynik analizy" style="max-width: 100%; max-height: 400px;" />

    <v-text-field v-model="firstName" label="Imię pacjenta" class="mt-4" />
    <v-text-field v-model="lastName" label="Nazwisko pacjenta" />
    <v-btn color="success" class="mt-2" @click="saveToDatabase">
      Zapisz do bazy
    </v-btn>

    <v-btn
      class="mt-2 ml-2"
      color="secondary"
      :href="resultImageUrl"
      :download="downloadFilename"
    >
      Pobierz wynik
    </v-btn>
  </div>
  </v-card-text>
  </v-card>
</template>

<style scoped>
</style>