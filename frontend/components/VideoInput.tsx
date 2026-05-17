'use client'

import { useState } from 'react'
import { VideoInfo, api } from '@/lib/api'
import { Search, Loader2 } from 'lucide-react'

interface VideoInputProps {
  onResult: (video: VideoInfo) => void
}

export default function VideoInput({ onResult }: VideoInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await api.parseVideo(url)
      if (res.success && res.data) {
        onResult(res.data)
      } else {
        setError(res.error || '解析失败，请检查URL是否正确')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="粘贴视频链接 (抖音/B站/小红书)"
            className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              解析中...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              解析视频
            </>
          )}
        </button>
        {error && (
          <p className="text-red-500 text-center p-4 bg-red-50 rounded-xl">{error}</p>
        )}
      </form>

      <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
        <p className="text-sm text-blue-700 text-center">
          💡 支持平台：抖音、Bilibili、小红书
        </p>
      </div>
    </div>
  )
}
