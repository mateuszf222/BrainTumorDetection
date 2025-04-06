<script setup lang="ts">
import { ref, onMounted } from 'vue'

const results = ref<any[]>([])
const searchFirstName = ref('')
const searchLastName = ref('')
const searchDate = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const search = async () => {
  loading.value = true
  error.value = null

  const params = new URLSearchParams()
  if (searchFirstName.value) params.append('firstName', searchFirstName.value)
  if (searchLastName.value) params.append('lastName', searchLastName.value)
  if (searchDate.value) params.append('date', searchDate.value)

  try {
    const res = await fetch(`/api/photo?${params.toString()}`)
    if (!res.ok) throw new Error('Błąd pobierania danych')
    const data = await res.json()

    // Convert binary data to base64 image
    results.value = data.map((item: any) => {
      if (item.photoData?.data) {
        const base64 = btoa(
          item.photoData.data.reduce((acc: string, byte: number) => acc + String.fromCharCode(byte), '')
        )
        item.photoUrl = `data:image/jpeg;base64,${base64}`
      }
      return item
    })
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  search()
})
</script>

<template>
  <v-card class="pa-4" max-width="1200" outlined>
    <v-card-title>Wyniki analizy</v-card-title>
    <v-card-text>
      <v-text-field v-model="searchFirstName" label="Imię pacjenta" />
      <v-text-field v-model="searchLastName" label="Nazwisko pacjenta" />
      <v-text-field v-model="searchDate" label="Data (YYYY-MM-DD)" />
      <v-btn color="primary" @click="search" :loading="loading">Szukaj</v-btn>

      <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>

      <v-table v-if="results.length" class="mt-4" density="comfortable">
        <thead>
          <tr>
            <th>Imię</th>
            <th>Nazwisko</th>
            <th>Data</th>
            <th>Plik</th>
            <th>Podgląd</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in results" :key="item._id">
            <td>{{ item.firstName }}</td>
            <td>{{ item.lastName }}</td>
            <td>{{ new Date(item.uploadDate).toLocaleString() }}</td>
            <td>{{ item.originalName }}</td>
            <td>
              <img
                v-if="item.photoUrl"
                :src="item.photoUrl"
                alt="preview"
                style="max-width: 120px; max-height: 120px; border: 1px solid #ccc;"
              />
            </td>
          </tr>
        </tbody>
      </v-table>

      <p v-if="!results.length && !loading" class="mt-4">Brak wyników.</p>
    </v-card-text>
  </v-card>
</template>


<style scoped>
.v-table {
  width: 100%;
  border-collapse: collapse;
}
.v-table th,
.v-table td {
  border: 1px solid #ddd;
  padding: 8px;
}
</style>
