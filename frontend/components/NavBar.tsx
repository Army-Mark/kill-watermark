'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          VideoDownloader
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className={`${isActive('/') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            首页
          </Link>
          <Link 
            href="/batch" 
            className={`${isActive('/batch') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            批量下载
          </Link>
          <Link 
            href="/history" 
            className={`${isActive('/history') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            历史记录
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Hi, {user.username}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                退出
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                登录
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
