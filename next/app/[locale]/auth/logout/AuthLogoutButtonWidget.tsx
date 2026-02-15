'use client'

import { useRouter } from '@/i18n/routing'
import { apiCall } from '@/lib/utils/http/SpaApiClient'

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
export default function AuthLogoutButtonWidget() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Call the API route to clear cookies server-side using handleApiCall
      await apiCall<any>({
        method: 'POST',
        url: '/api/auth/logout'
      })

      // Redirect to login page (localized router handles locale automatically)
      router.push('/auth/login')
      router.refresh() // Refresh to ensure all server components update
    } catch (error) {
      ConsoleLogger.error('Logout failed:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
    >
      Logout
    </button>
  )
}