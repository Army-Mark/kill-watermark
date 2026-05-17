const API_BASE = '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface VideoInfo {
  id: string
  platform: string
  title: string
  coverUrl: string
  videoUrl: string
  duration?: number
  author?: string
}

export interface User {
  id: number
  username: string
  createdAt: string
}

export interface HistoryItem {
  id: number
  platform: string
  originalUrl: string
  videoTitle: string
  videoUrl: string
  coverUrl: string
  createdAt: string
}

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  async parseVideo(url: string): Promise<ApiResponse<VideoInfo>> {
    const res = await fetch(`${API_BASE}/parse`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ url }),
    })
    return res.json()
  }

  async register(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    return res.json()
  }

  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    return res.json()
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async getHistory(): Promise<ApiResponse<HistoryItem[]>> {
    const res = await fetch(`${API_BASE}/history`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async deleteHistory(id: number): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    return res.json()
  }
}

export const api = new ApiClient()
