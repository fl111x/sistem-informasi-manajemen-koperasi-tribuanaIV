<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from './components/AdminLayout.vue'

const route = useRoute()
const isLogin = computed(() => route.path === '/login')
</script>

<template>
  <template v-if="isLogin">
    <router-view />
  </template>
  <AdminLayout v-else>
    <router-view />
  </AdminLayout>
</template>