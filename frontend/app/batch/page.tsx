'use client'

import { useState } from 'react'
import { VideoInfo, api } from '@/lib/api'
import { Download, Loader2 } from 'lucide-react'

export default function BatchPage() {
  const [urls, setUrls] = useState('')
  const [results, setResults] = useState<VideoInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u)
    
    if (urlList.length === 0) return

    setLoading(true)
    setResults([])
    setErrors([])

    const newResults: VideoInfo[] = []
    const newErrors: string[] = []

    for (const url of urlList) {
      try {
        const res = await api.parseVideo(url)
        if (res.success && res.data) {
          newResults.push(res.data)
        } else {
          newErrors.push(`${url}: ${res.error || '解析失败'}`)
        }
      } catch {
        newErrors.push(`${url}: 网络错误`)
      }
    }

    setResults(newResults)
    setErrors(newErrors)
    setLoading(false)
  }

  const handleDownloadAll = () => {
    results.forEach((video, index) => {
      if (video.videoUrl) {
        setTimeout(() => {
          window.open(video.videoUrl, '_blank')
        }, index * 500)
      }
    })
  }

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'bilibili':
        return '哔哩哔哩'
      case 'douyin':
        return '抖音'
      case 'xiaohongshu':
        return '小红书'
      default:
        return platform
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'bilibili':
        return 'bg-pink-100 text-pink-700'
      case 'douyin':
        return 'bg-black text-white'
      case 'xiaohongshu':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">批量下载</h1>
          <p className="text-gray-500 mt-2">一次解析多个视频链接</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                视频链接（每行一个）
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://www.douyin.com/...&#10;https://www.bilibili.com/...&#10;https://www.xiaohongshu.com/..."
                className="w-full h-48 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !urls.trim()}
              className="bg-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  解析中... ({results.length} 完成)
                </>
              ) : (
                '批量解析'
              )}
            </button>
          </form>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-red-800 mb-3">解析失败（{errors.length}个）</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="break-all">{err}</li>
              ))}
            </ul>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                解析结果（{results.length}个）
              </h2>
              <button
                onClick={handleDownloadAll}
                className="bg-green-600 text-white py-2 px-6 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                全部下载
              </button>
            </div>
            <div className="grid gap-4">
              {results.map((video, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
                  {video.coverUrl && (
                    <div className="w-40 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={video.coverUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPlatformColor(video.platform)}`}>
                        {getPlatformName(video.platform)}
                      </span>
                      {video.videoUrl && (
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          下载
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
