'use client'

import { useRouter } from '@/i18n/routing'
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util'

import { ConsoleLogger } from '@/lib/logging/Console.logger';
export default function AuthLogoutButtonWidget() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Call the API route to clear cookies server-side using handleApiCall
      await fetchApiUtil<any>({
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