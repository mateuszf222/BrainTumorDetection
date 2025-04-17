<script setup lang="ts">
import { ref, watch } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const items = ref<any[]>([])
const searchFirstName = ref('')
const searchLastName = ref('')
const searchDateRange = ref<[Date, Date] | null>(null)
const loading = ref(false)
const totalItems = ref(0)

const options = ref({
  page: 1,
  itemsPerPage: 5,
  sortBy: ['uploadDate'],
  sortDesc: [true],
})

const onOptionsUpdate = (o: Partial<typeof options.value>) => {
  // if Vuetify sent no sort, keep the existing one
  const hasSort = o.sortBy && o.sortBy.length

  Object.assign(options.value, {
    page        : o.page         ?? options.value.page,
    itemsPerPage: o.itemsPerPage ?? options.value.itemsPerPage,
    sortBy      : hasSort ? o.sortBy  : options.value.sortBy,
    sortDesc    : hasSort ? o.sortDesc: options.value.sortDesc,
  })
}


const fetchData = async () => {
  loading.value = true

  const params = new URLSearchParams()
  params.append('page', options.value.page.toString())
  params.append('itemsPerPage', options.value.itemsPerPage.toString())

  if (options.value.sortBy.length) {
    // Vuetify gives objects like { key: 'uploadDate', order: 'asc' }
    const first = options.value.sortBy[0] as any        // object or string
    const field = typeof first === 'string' ? first : first.key
    const desc  = typeof first === 'string'
                  ? options.value.sortDesc[0]          // legacy path
                  : first.order === 'desc'

    params.append('sortBy', field)
    params.append('sortDesc', desc ? 'true' : 'false')
  }


  if (searchFirstName.value) params.append('firstName', searchFirstName.value)
  if (searchLastName.value) params.append('lastName', searchLastName.value)
  if (searchDateRange.value && searchDateRange.value[0] && searchDateRange.value[1]) {
    params.append('startDate', searchDateRange.value[0].toISOString().split('T')[0])
    params.append('endDate', searchDateRange.value[1].toISOString().split('T')[0])
  }

  console.log('🔍 Fetching with sortBy:', options.value.sortBy)
  console.log('🔃 sortDesc:', options.value.sortDesc)


  try {
    const res = await fetch(`/api/photo?${params.toString()}`)
    if (!res.ok) throw new Error('Błąd pobierania danych')

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

watch(
  () => JSON.stringify([options.value.sortBy, options.value.sortDesc, options.value.page, options.value.itemsPerPage]),
  fetchData
)





</script>

<template>
  <v-card class="pa-4" max-width="1200" outlined>
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
      />



      <v-data-table-server
        :options="options"
        @update:options="onOptionsUpdate"
        :items="items"
        :loading="loading"
        :items-per-page="5"
        :items-length="totalItems"
        :must-sort="true"
        class="mt-4"
        :headers="[
          { title: 'Imię', key: 'firstName' },
          { title: 'Nazwisko', key: 'lastName' },
          { title: 'Data', key: 'uploadDate' },
          { title: 'Plik', key: 'originalName', sortable: false },
          { title: 'Podgląd', key: 'photoUrl', sortable: false },
          { title: 'Akcje', key: 'actions', sortable: false }
        ]"
      >
        <template v-slot:[`item.uploadDate`]="{ item }">
          {{ new Date(item.uploadDate).toLocaleString() }}
        </template>

        <template v-slot:[`item.photoUrl`]="{ item }">
          <img
            v-if="item.photoUrl"
            :src="item.photoUrl"
            alt="preview"
            style="max-width: 120px; max-height: 120px; border: 1px solid #ccc;"
          />
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            v-if="item.photoUrl"
            :href="item.photoUrl"
            :download="item.originalName || 'analyzed.jpg'"
            color="secondary"
            size="small"
          >
            Pobierz
          </v-btn>
        </template>
      </v-data-table-server>

      <p v-if="!items.length && !loading" class="mt-4">Brak wyników.</p>
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
