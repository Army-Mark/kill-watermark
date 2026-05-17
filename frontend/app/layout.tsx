import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '视频去水印下载工具',
  description: '支持抖音、Bilibili、小红书等平台的无水印视频解析与下载',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <NavBar />
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
            <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
              <p className="mb-2">⚠️ 仅供个人学习和欣赏使用，禁止商业用途</p>
              <p>Copyright © 2024 VideoDownloader</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
