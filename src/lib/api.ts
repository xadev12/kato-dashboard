const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`)
    if (!res.ok) {
      throw new Error(`API error ${res.status}`)
    }
    return res.json()
  }
}
