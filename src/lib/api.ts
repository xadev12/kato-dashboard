// VITE_API_URL should be the base URL without /api suffix
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') 
      ? import.meta.env.VITE_API_URL 
      : `${import.meta.env.VITE_API_URL}/api`)
  : 'http://localhost:3001/api'

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
    if (!res.ok) {
      throw new Error(`API error ${res.status}`)
    }
    return res.json()
  }
}
