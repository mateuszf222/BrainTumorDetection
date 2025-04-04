<script setup lang="ts">
import { ref } from 'vue'

const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const resultImageUrl = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const downloadFilename = ref<string | null>(null)


const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    file.value = target.files[0]
    previewUrl.value = URL.createObjectURL(file.value)
    resultImageUrl.value = null
    error.value = null

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
  error.value = null

  const formData = new FormData()
  formData.append('photo', file.value)

  try {
    const res = await fetch('/api/analyzer', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('Nie udało się przetworzyć obrazu')

    const blob = await res.blob()
    resultImageUrl.value = URL.createObjectURL(blob)
  

  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <v-card class="pa-4" max-width="800" outlined>
  <v-card-title>Analiza zdjęcia</v-card-title>

  <v-card-text>
    <v-file-input
      accept="image/*"
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

    <div v-if="resultImageUrl"   class="mt-6">
      <p><strong>Wynik analizy:</strong></p>
      <img :src="resultImageUrl" alt="Wynik analizy" style="max-width: 100%; max-height: 400px;" />
      <v-btn class="mt-2" color="secondary" :href="resultImageUrl" :download=downloadFilename>
        Pobierz wynik
      </v-btn>
    </div>

    <v-alert
      v-if="error"
      class="mt-4"
      type="error"
      border="start"
      prominent
    >
      {{ error }}
    </v-alert>
  </v-card-text>
  </v-card>
</template>

<style scoped>
</style>