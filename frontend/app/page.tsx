'use client'

import { useState } from 'react'
import VideoInput from '@/components/VideoInput'
import VideoPreview from '@/components/VideoPreview'
import { VideoInfo } from '@/lib/api'

export default function Home() {
  const [video, setVideo] = useState<VideoInfo | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            视频去水印下载
          </h1>
          <p className="text-xl text-gray-600">
            支持抖音、Bilibili、小红书等平台的无水印视频解析与下载
          </p>
        </div>

        <VideoInput onResult={setVideo} />

        {video && <VideoPreview video={video} />}

        {/* Supported Platforms */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-6">支持的平台</p>
          <div className="flex justify-center gap-8 text-gray-700 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              Bilibili
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-black"></span>
              抖音
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              小红书
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
