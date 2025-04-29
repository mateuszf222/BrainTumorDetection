<script setup lang="ts">
import { ref, watch } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

type SortItem = { key: string; order: 'asc' | 'desc' }

const items = ref<any[]>([])
const searchFirstName = ref('')
const searchLastName = ref('')
const searchDateRange = ref<[Date, Date] | null>(null)
const loading = ref(false)
const totalItems = ref(0)

const dialog = ref(false)
const selectedItem = ref<any | null>(null)

const openEditor = (item: any, event: any) => {
  selectedItem.value = event.item
  dialog.value = true
}

const closeEditor = () => {
  dialog.value = false
  selectedItem.value = null
}

const handleListChanged = () => {
  fetchData()
}

const options = ref({
  page: 1,
  itemsPerPage: 5,
  sortBy: <SortItem[]>[{ key: 'uploadDate', order: 'desc' }] // 👈 ONE array
})

const onOptionsUpdate = (o: Partial<typeof options.value>) => {
  // ⚠️ Vuetify’s first event still has an empty sort array
  const hasSort = o.sortBy && o.sortBy.length            // ← bring the guard back

  Object.assign(options.value, {
    page        : o.page         ?? options.value.page,
    itemsPerPage: o.itemsPerPage ?? options.value.itemsPerPage,
    sortBy      : hasSort ? o.sortBy : options.value.sortBy   // ← keep previous
  })
}



const fetchData = async () => {
  loading.value = true

  const params = new URLSearchParams()
  params.append('page', options.value.page.toString())
  params.append('itemsPerPage', options.value.itemsPerPage.toString())

  /* ⇨ sort block becomes trivial */
  if (options.value.sortBy.length) {
    const { key, order } = options.value.sortBy[0]
    params.append('sortBy',   key)
    params.append('sortDesc', order === 'desc' ? 'true' : 'false')
  }


  if (searchFirstName.value) params.append('firstName', searchFirstName.value)
  if (searchLastName.value) params.append('lastName', searchLastName.value)
  if (searchDateRange.value && searchDateRange.value[0] && searchDateRange.value[1]) {
    params.append('startDate', searchDateRange.value[0].toISOString().split('T')[0])
    params.append('endDate', searchDateRange.value[1].toISOString().split('T')[0])
  }


  try {
    const res = await fetch(`/api/photo?${params.toString()}`)
    if (res.status === 401) {
      console.warn('🔒 Unauthorized access to /api/photo')
      items.value = []        // Empty list
      totalItems.value = 0
      loading.value = false
      return                  // Stop further execution
    }

    if (!res.ok) {
      throw new Error('Błąd pobierania danych')
    }

    const data = await res.json()
    console.log(`✅ Received ${data.items?.length || 0} items`)
    items.value = data.items.map((item: any) => {
      if (item.photoData?.data) {
        const base64 = btoa(
          item.photoData.data.reduce((acc: string, byte: number) => acc + String.fromCharCode(byte), '')
        )
        item.photoUrl = `data:image/jpeg;base64,${base64}`
      }
      return item
    })
    totalItems.value = data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Watch for table options or filters to change and fetch data
watch(
  [searchFirstName, searchLastName, searchDateRange],
  fetchData,
  { immediate: true }
)

watch(options, fetchData, { deep: true })   // deep instead of JSON.stringify






</script>

<template>
  <v-card class="pa-4" max-width="1200" outlined style="position: relative; top: 100px; left: 100px;">
    <v-card-title>Wyniki analizy</v-card-title>
    <v-card-text>
      <v-text-field v-model="searchFirstName" label="Imię pacjenta" />
      <v-text-field v-model="searchLastName" label="Nazwisko pacjenta" />
      

      <datepicker
        v-model="searchDateRange"
        range
        format="yyyy-MM-dd"
        :enable-time-picker="false"
        auto-apply
        placeholder="Zakres dat"
        class="mb-4"
        teleport="body"
      />



      <v-data-table-server
        :options="options"
        @update:options="onOptionsUpdate"
        :items="items"
        :loading="loading"
        :items-per-page="5"
        :items-per-page-options="[
            5, 10, 50, 100,
            { value: -1, title: 'Wszystkie' }
        ]"
        v-bind:items-per-page-text="'Elementów na stronę:'"
        :items-length="totalItems"
        :must-sort="true"
        class="mt-4"
        :headers="[
          { title: 'Imię', key: 'firstName' },
          { title: 'Nazwisko', key: 'lastName' },
          { title: 'Data', key: 'uploadDate' },
          { title: 'Plik', key: 'originalName', sortable: false },
          { title: 'Podgląd', key: 'photoUrl', sortable: false }
        ]"
        @click:row="openEditor"

      >
        <template v-slot:[`item.uploadDate`]="{ item }">
          {{ new Date(item.uploadDate).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }) }}
        </template>


        <template v-slot:[`item.photoUrl`]="{ item }">
          <img
            v-if="item.photoUrl"
            :src="item.photoUrl"
            alt="preview"
            style="max-width: 120px; max-height: 120px; border: 1px solid #ccc;"
          />
        </template>
      </v-data-table-server>

      <p v-if="!items.length && !loading" class="mt-4">Brak wyników.</p>
    </v-card-text>
  </v-card>

  <v-dialog v-model="dialog" max-width="600px">
  <PhotoResultEditor
      :photo="selectedItem"
      @close="closeEditor"
      @listChanged="handleListChanged"
  />
  </v-dialog>

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
