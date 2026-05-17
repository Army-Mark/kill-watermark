'use client'

import { VideoInfo } from '@/lib/api'
import { Download, User, Clock } from 'lucide-react'

interface VideoPreviewProps {
  video: VideoInfo
}

export default function VideoPreview({ video }: VideoPreviewProps) {
  const handleDownload = () => {
    if (video.videoUrl) {
      window.open(video.videoUrl, '_blank')
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

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Video Preview */}
      <div className="aspect-video bg-gray-900 relative">
        {video.videoUrl && (
          <video
            src={video.videoUrl}
            poster={video.coverUrl}
            controls
            className="w-full h-full object-contain"
          />
        )}
        {video.coverUrl && !video.videoUrl && (
          <img
            src={video.coverUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlatformColor(video.platform)}`}>
            {getPlatformName(video.platform)}
          </span>
          {video.duration && (
            <span className="flex items-center gap-1 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              {video.duration}s
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
          {video.title}
        </h2>

        {video.author && (
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <User className="w-4 h-4" />
            <span>{video.author}</span>
          </div>
        )}

        <button
          onClick={handleDownload}
          className="w-full bg-green-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          下载视频
        </button>
      </div>
    </div>
  )
}
