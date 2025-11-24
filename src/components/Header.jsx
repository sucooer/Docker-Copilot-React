import React from 'react'
import { 
  Box, 
  HardDrive, 
  LogOut, 
  Menu, 
  X,
  Server,
  Image,
  DatabaseBackup,
  Palette,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle.jsx'
import { UpdatePrompt } from './UpdatePrompt.jsx'
import { cn } from '../utils/cn.js'
import logoImg from '../assets/DockerCopilot-logo.png'
import { useVersionCheck } from '../hooks/useVersionCheck.js'

export function Sidebar({ activeTab, onTabChange, onLogout, isCollapsed = false, onToggleCollapse }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)
  const [isDevInfoExpanded, setIsDevInfoExpanded] = React.useState(false)
  
  // 时间格式转换函数 - 将UTC时间转换为北京时间
  const formatVersionBuildDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      
      // 转换为北京时间 (UTC+8)
      const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
      
      return beijingDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
    } catch (error) {
      return dateString
    }
  }
  
  // 使用版本检查 Hook
  const {
    showUpdatePrompt,
    setShowUpdatePrompt,
    backendVersion,
    remoteVersion,
    buildDate,
    hasBackendUpdate,
    updateBackend,
    checkForUpdates
  } = useVersionCheck()

  // 使用外部传入的收起状态，如果没有则使用内部状态
  const sidebarCollapsed = onToggleCollapse ? isCollapsed : internalCollapsed
  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  const navItems = [
    {
      id: '#containers',
      label: '容器',
      icon: Server,
    },
    {
      id: '#images',
      label: '镜像',
      icon: Box,
    },    
    {
      id: '#backups',
      label: '备份',
      icon: DatabaseBackup,
    },
    {
      id: '#icons',
      label: '图标',
      icon: Palette,
    },
    {
      id: '#about',
      label: '关于',
      icon: Info,
    },    
  ]

  return (
    <>
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 lg:hidden h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 sm:px-4 z-40 shadow-sm">
        {/* 左侧：Logo 按钮 */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 hover:scale-110 transition-transform active:scale-95 rounded-lg"
          title="打开菜单"
        >
          <img 
            src={logoImg}
            alt="菜单"
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg object-cover border-0"
          />
        </button>

        {/* 右侧：主题切换和退出登录 */}
        <div className="flex items-center gap-1">
          <ThemeToggle collapsed={false} />
          <button
            onClick={onLogout}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
            title="退出登录"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 添加顶部导航栏的占位符 */}
      <div className="lg:hidden h-14" />

      {/* 侧边栏遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-xl lg:shadow-none transform transition-all duration-300 ease-in-out flex flex-col",
          sidebarCollapsed ? "w-20" : "w-64 sm:w-72 md:w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "max-h-screen overflow-y-auto",
          "lg:top-0 top-14 border-r border-gray-200 dark:border-gray-700"
        )}
      >
        <div className="flex flex-col h-full">
          {/* 头部 - 现代卡片设计 */}
          <div className="p-4 sm:p-5 flex-shrink-0">
            <button
              onClick={handleToggleCollapse}
              className={cn(
                "w-full flex items-center transition-all duration-300 group cursor-pointer",
                sidebarCollapsed ? "justify-center" : "space-x-3"
              )}
              title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              <div className="flex-shrink-0">
                <img 
                  src={logoImg}
                  alt="Docker Copilot"
                  className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-cover shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 border-0"
                />
              </div>
              {!sidebarCollapsed && (
                <div className="text-left transition-all duration-300 min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">Docker Copilot</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">容器管理平台</p>
                </div>
              )}
            </button>
          </div>

          {/* 分割线 */}
          <div className="px-4 sm:px-5">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
          </div>

          {/* 导航菜单 */}
          <nav className={cn("flex-1 py-6 sm:py-8 overflow-y-auto space-y-2", sidebarCollapsed ? "px-2.5" : "px-3 sm:px-4")}>
            <ul className="space-y-0.5">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onTabChange(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center rounded-lg text-left transition-all duration-200 group active:scale-95 relative overflow-hidden",
                        sidebarCollapsed ? "justify-center p-2.5 sm:p-3" : "space-x-3 px-3 sm:px-4 py-2.5 sm:py-3",
                        isActive
                          ? "bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/10 text-primary-700 dark:text-primary-300 font-semibold shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      {/* 左侧指示条 */}
                      {isActive && !sidebarCollapsed && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-600" />
                      )}
                      
                      <Icon className={cn(
                        "flex-shrink-0 transition-all duration-200",
                        sidebarCollapsed ? "h-6 w-6" : "h-5 w-5",
                        isActive && "scale-110"
                      )} />
                      {!sidebarCollapsed && (
                        <span className="truncate text-sm sm:text-base font-medium">{item.label}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* 底部操作区 (桌面端显示) */}
          <div className={cn("hidden lg:flex flex-col flex-shrink-0", sidebarCollapsed ? "p-2.5" : "p-4 sm:p-5")}>
            {/* 分割线 */}
            <div className="mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
            </div>

            {/* 操作按钮 */}
            <div className={cn(
              "flex items-center gap-2 mb-4",
              sidebarCollapsed ? "flex-col" : "justify-between"
            )}>
              <ThemeToggle collapsed={sidebarCollapsed} />
              <button
                onClick={onLogout}
                className={cn(
                  "flex items-center justify-center gap-2 transition-all duration-200 group active:scale-95",
                  sidebarCollapsed 
                    ? "p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full"
                    : "px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-1"
                )}
                title={sidebarCollapsed ? "退出登录" : ""}
              >
                <LogOut className="h-4 w-4 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" />
                {!sidebarCollapsed && (
                  <span className="text-xs sm:text-sm font-medium">退出</span>
                )}
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="space-y-3">
                {/* 版本信息卡片 - 现代风格 */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 cursor-default">
                  <div className="space-y-3">
                    {/* 标题和状态 */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">版本信息</h3>
                        <p className="text-xs font-mono text-primary-600 dark:text-primary-400 mt-1.5 font-medium">
                          {backendVersion || '获取中...'}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        在线
                      </span>
                    </div>
                    
                    {/* 开发人员信息 */}
                    <div>
                      {isDevInfoExpanded ? (
                        <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
                          <button
                            onClick={() => setIsDevInfoExpanded(!isDevInfoExpanded)}
                            className="flex justify-between items-center w-full pb-2"
                          >
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">开发人员</span>
                            <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                          </button>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="text-xs bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                              <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">前端</p>
                              <p className="font-medium text-gray-900 dark:text-white">DongShu</p>
                            </div>
                            <div className="text-xs bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                              <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">后端</p>
                              <p className="font-medium text-gray-900 dark:text-white">onlyLTY</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsDevInfoExpanded(!isDevInfoExpanded)}
                          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors w-full py-1"
                        >
                          <span>开发人员</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    
                    {/* 更新和构建信息 */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          检查: {(new Date()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {hasBackendUpdate && (
                          <button
                            onClick={() => setShowUpdatePrompt(true)}
                            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 animate-pulse"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            有更新
                          </button>
                        )}
                      </div>
                      {buildDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400" title={formatVersionBuildDate(buildDate)}>
                          构建: {formatVersionBuildDate(buildDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>



      {/* 版本更新提示弹窗 */}
      <UpdatePrompt
        isVisible={showUpdatePrompt}
        onClose={() => setShowUpdatePrompt(false)}
        backendVersion={backendVersion}
        remoteVersion={remoteVersion}
        hasBackendUpdate={hasBackendUpdate}
        onUpdateBackend={updateBackend}
      />
    </>
  )
}