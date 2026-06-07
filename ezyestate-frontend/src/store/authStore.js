import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '@/api/authApi'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        localStorage.setItem('token', token)
        set({ token })
      },

      login: async (data) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login(data)
          const { token, data: { user } } = res.data
          localStorage.setItem('token', token)
          set({ user, token, isLoading: false })
          toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`)
          return user
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const res = await authApi.register(data)
          const { token, data: { user } } = res.data
          localStorage.setItem('token', token)
          set({ user, token, isLoading: false })
          toast.success('Account created successfully!')
          return user
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch {}
        localStorage.clear()
        set({ user: null, token: null })
        toast.success('Logged out successfully.')
      },

      fetchMe: async () => {
        try {
          const res = await authApi.getMe()
          set({ user: res.data.data.user })
        } catch {
          localStorage.clear()
          set({ user: null, token: null })
        }
      },

      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin: () => ['admin', 'superadmin'].includes(get().user?.role),
      isOwner: () => get().user?.role === 'owner',
      isBuilder: () => get().user?.role === 'builder',
      isBuyer: () => get().user?.role === 'buyer',
    }),
    {
      name: 'SocialEstate-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

export default useAuthStore
