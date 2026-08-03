import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    userRole: (state) => state.user?.nama_role || '',
    userRoleId: (state) => state.user?.id_role || 0,
  },
  actions: {
    async login(username, password) {


      try {
        const response = await api.post('/auth/login', { username, password })
        this.user = response.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
        return response.data
      } catch (error) {
        throw error
      }
    },
    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.error('Logout API failed:', error)
      } finally {
        this.user = null
        localStorage.removeItem('user')
      }
    }
  }
})
