import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Auth } from './components/Auth.jsx'
import { Sidebar, MobileBottomNav } from './components/Header.jsx'
import { Containers } from './components/Containers.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cn } from './utils/cn.js'

import { imageAPI, versionAPI, authAPI } from './api/client.js'

// 懒加载非首屏组件，减小首屏 JS 体积
const Images = lazy(() => import('./components/Images.jsx').then(m => ({ default: m.Images })))
const Compose = lazy(() => import('./components/Compose.jsx').then(m => ({ default: m.Compose })))
const Backups = lazy(() => import('./components/Backups.jsx').then(m => ({ default: m.Backups })))
const Icons = lazy(() => import('./components/Icons.jsx').then(m => ({ default: m.Icons })))
const About = lazy(() => import('./components/About.jsx').then(m => ({ default: m.About })))
const NotifySettings = lazy(() => import('./components/NotifySettings.jsx').then(m => ({ default: m.NotifySettings })))

// 创建一个全局的QueryClient实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [authRetryCount, setAuthRetryCount] = useState(0)
  const [activeTab, setActiveTab] = useState('#containers')
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [userPreferredCollapsed, setUserPreferredCollapsed] = useState(false)

  // 智能计算侧边栏是否应该收缩
  const getSmartCollapsedState = (width, userPreference) => {
    if (width < 768) {
      // 手机模式：不在乎收缩状态，菜单模式处理
      return false
    } else if (width < 1024) {
      // 平板模式：强制收缩，忽略用户偏好
      return true
    } else {
      // 桌面模式：使用用户偏好
      return userPreference
    }
  }

  const isSidebarCollapsed = getSmartCollapsedState(windowWidth, userPreferredCollapsed)

  useEffect(() => {
    // token 由 HttpOnly Cookie 承载，前端无法读取，
    // 通过探测受保护的 /api/version 接口判断当前是否已认证
    let active = true
    const checkAuth = async () => {
      try {
        await versionAPI.getVersion()
        if (active) {
          setIsAuthenticated(true)
          syncIcons()
        }
      } catch (error) {
        if (error.response?.status === 401) {
          // 明确返回 401：未认证，进入登录页
          if (active) setIsAuthenticated(false)
        } else {
          // 网络错误或后端 5xx：显示错误态而不是登录页
          if (active) setAuthError(true)
        }
      } finally {
        if (active) setIsCheckingAuth(false)
      }
    }

    // 同步图标配置（仅在已认证后执行，避免未认证时的噪音请求）
    const syncIcons = async () => {
      try {
        const response = await imageAPI.getIcons()
        if (response.data.code === 200 || response.data.code === 0) {
          const icons = response.data.data
          // 简单的全量更新，以后如果支持前端删除，可能需要合并逻辑
          localStorage.setItem('docker_copilot_image_logos', JSON.stringify(icons))
        }
      } catch (error) {
        console.error('Failed to sync icons:', error)
      }
    }

    // 监听自定义事件，用于在本标签页中处理认证状态变化
    const handleAuthChange = (e) => {
      if (e.detail.authenticated) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    }

    window.addEventListener('authChange', handleAuthChange)

    checkAuth()

    // 监听窗口大小变化
    const handleResize = () => {
      const width = window.innerWidth
      setWindowWidth(width)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      active = false
      window.removeEventListener('authChange', handleAuthChange)
      window.removeEventListener('resize', handleResize)
    }
  }, [authRetryCount])

  const handleLogin = () => {
    setIsAuthenticated(true)
    // 触发自定义事件通知其他组件认证状态已更新
    window.dispatchEvent(new CustomEvent('authChange', { detail: { authenticated: true } }))
  }

  const handleLogout = async () => {
    try {
      // 通知后端清除 HttpOnly Cookie
      await authAPI.logout()
      setIsAuthenticated(false)
      // 触发自定义事件通知其他组件认证状态已更新
      window.dispatchEvent(new CustomEvent('authChange', { detail: { authenticated: false } }))
    } catch (error) {
      // 登出失败（如后端不可达）时 Cookie 仍有效，刷新会自动重新登录，
      // 必须提示用户，避免其误以为已登出
      console.error('Logout failed:', error)
      window.alert('登出失败，请重试')
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleToggleCollapse = () => {
    // 只有在桌面模式下才允许手动切换
    if (windowWidth >= 1024) {
      setUserPreferredCollapsed(!userPreferredCollapsed)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case '#containers':
        return <Containers />
      case '#images':
        return <Suspense fallback={<div className="p-4 text-gray-500">加载中...</div>}><Images /></Suspense>
      case '#compose':
        return <Suspense fallback={<div className="p-4 text-gray-500">加载中...</div>}><Compose /></Suspense>
      case '#icons':
        return <Suspense fallback={<div className="p-4 text-gray-500">加载中...</div>}><Icons /></Suspense>
      case '#backups':
        return <Suspense fallback={<div className="p-4 text-gray-500">加载中...</div>}><Backups /></Suspense>
      case '#notify':
        return <Suspense fallback={<div className="p-4 text-gray-500">加载中...</div>}><NotifySettings /></Suspense>
      case '#about':
        return <Suspense fallback={<div className="p-4 text-gray-500">加载中...</div>}><About /></Suspense>
      default:
        return <Containers />
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">无法连接后端服务</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">请检查后端服务是否启动，或稍后重试</p>
        <button
          onClick={() => {
            setAuthError(false)
            setIsCheckingAuth(true)
            setAuthRetryCount((c) => c + 1)
          }}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex-col lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        windowWidth={windowWidth}
      />
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        "overflow-y-auto",
        "min-h-screen",
        windowWidth < 768
          ? 'pb-[calc(88px+1rem+env(safe-area-inset-bottom))]'
          : windowWidth < 1024
            ? 'ml-20'
            : isSidebarCollapsed
              ? 'ml-20'
              : 'ml-64'
      )}>
        <div className="flex-1 p-2 sm:p-4 lg:p-4 pt-4 sm:pt-4">
          {renderContent()}
        </div>
      </main>
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        windowWidth={windowWidth}
      />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App