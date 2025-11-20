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
import { LOGO_CONFIG } from '../assets/logo.js'
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
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>

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
          "fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none transform transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-20" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className={cn(
              "flex items-center w-full",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}>
              {/* Logo区域 - 点击可收起/展开 */}
              <button
                onClick={handleToggleCollapse}
                className={cn(
                  "flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer group",
                  sidebarCollapsed ? "p-2" : "space-x-3 p-2 -m-2"
                )}
                title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
              >
                <div className="flex-shrink-0">
                  <img 
                    {...LOGO_CONFIG}
                    className="h-10 w-10 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                {!sidebarCollapsed && (
                  <div className="text-left transition-all duration-300">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Docker Copilot</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">容器管理平台</p>
                  </div>
                )}
              </button>

              {/* 移动端关闭按钮 */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className={cn("flex-1 py-6", sidebarCollapsed ? "px-2" : "px-4")}>
            <ul className={cn("space-y-1", sidebarCollapsed ? "space-y-8" : "space-y-1")}>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onTabChange(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center rounded-xl text-left transition-all duration-200 group",
                        sidebarCollapsed ? "justify-center px-2 py-3" : "space-x-3 px-4 py-4",
                        activeTab === item.id
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn("flex-shrink-0", sidebarCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* 底部 */}
          <div className={cn("border-t border-gray-200 dark:border-gray-700", sidebarCollapsed ? "p-2" : "p-4")}>
            {/* 操作按钮区域 */}
            <div className={cn(
              "flex items-center gap-2",
              sidebarCollapsed ? "flex-col" : "justify-between"
            )}>
              {/* 主题切换按钮 */}
              <div className={cn(
                "flex items-center justify-center",
                sidebarCollapsed ? "w-full" : ""
              )}>
                <ThemeToggle collapsed={sidebarCollapsed} />
              </div>
              
              {/* 退出登录按钮 */}
              <button
                onClick={onLogout}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-all duration-200 group",
                  sidebarCollapsed ? "w-full p-2" : "flex-1"
                )}
                title={sidebarCollapsed ? "退出登录" : ""}
              >
                <LogOut className="h-4 w-4 flex-shrink-0 group-hover:rotate-12 transition-transform duration-200" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">退出</span>
                )}
              </button>
            </div>
            {!sidebarCollapsed && (
              <div className="mt-4">
                {/* 版本信息卡片 */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="space-y-3">
                    {/* 标题和版本 */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">版本信息</h3>
                        <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">
                          {backendVersion || '获取中...'}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                        在线
                      </span>
                    </div>
                    
                    {/* 开发人员信息 - 可展开/折叠 */}
                    {isDevInfoExpanded ? (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <div 
                          className="flex justify-between items-center cursor-pointer pb-2"
                          onClick={() => setIsDevInfoExpanded(!isDevInfoExpanded)}
                        >
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">开发人员信息</span>
                          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="text-xs">
                            <p className="text-gray-500 dark:text-gray-400">前端</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">DongShu</p>
                          </div>
                          <div className="text-xs">
                            <p className="text-gray-500 dark:text-gray-400">后端</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">onlyLTY</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center cursor-pointer py-1"
                        onClick={() => setIsDevInfoExpanded(!isDevInfoExpanded)}
                      >
                        <span className="text-xs text-gray-600 dark:text-gray-400">显示开发人员</span>
                        <ChevronRight className="h-3 w-3 text-gray-500 dark:text-gray-400 ml-1" />
                      </div>
                    )}
                    
                    {/* 操作和更新信息 */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        最后检查: {(new Date()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {hasBackendUpdate && (
                        <div className="flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1 animate-pulse"></span>
                          <button
                            onClick={() => setShowUpdatePrompt(true)}
                            className="text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                          >
                            有更新
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 构建时间 */}
                    {buildDate && (
                      <div className="pt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400" title={formatVersionBuildDate(buildDate)}>
                          构建: {formatVersionBuildDate(buildDate)}
                        </p>
                      </div>
                    )}
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