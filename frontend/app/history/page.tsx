'use client'

import { useEffect, useState } from 'react'
import { HistoryItem, api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Download, Trash2, Clock } from 'lucide-react'

export default function HistoryPage() {
  const [histories, setHistories] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    try {
      const res = await api.getHistory()
      if (res.success && res.data) {
        setHistories(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return
    try {
      await api.deleteHistory(id)
      setHistories(histories.filter(h => h.id !== id))
    } catch (err) {
      alert('删除失败')
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-600 text-lg">请先登录查看历史记录</p>
          <Link href="/login" className="text-blue-600 hover:underline font-medium text-lg">
            去登录
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">历史记录</h1>
          <p className="text-gray-500 mt-2">你解析过的视频都在这里</p>
        </div>

        {histories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <p className="text-gray-500 text-lg">暂无历史记录</p>
            <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
              去解析视频
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {histories.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
                {item.coverUrl && (
                  <div className="w-40 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.coverUrl}
                      alt={item.videoTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                        {item.videoTitle || '无标题'}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPlatformColor(item.platform)}`}>
                          {getPlatformName(item.platform)}
                        </span>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="下载"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
