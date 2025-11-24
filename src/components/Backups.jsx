import React, { useState, useEffect } from 'react'
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  RotateCcw,
  FileCode,
  Save
} from 'lucide-react'
import { containerAPI } from '../api/client.js'
import { cn } from '../utils/cn.js'

export function Backups() {
  const [backups, setBackups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchBackups = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await containerAPI.listBackups()
      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        setBackups(response.data.data || [])
      } else {
        setError(response.data?.msg || '获取备份列表失败')
        setBackups([])
      }
    } catch (error) {
      setError(error.response?.data?.msg || error.message || '网络错误，请检查后端服务')
      setBackups([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const handleBackup = async () => {
    try {
      setIsBackingUp(true)
      setSuccess(null)
      setError(null)
      
      const response = await containerAPI.backupContainer()
      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        setSuccess('备份创建成功')
        // 刷新备份列表
        fetchBackups()
      } else {
        setError(response.data?.msg || '备份创建失败')
      }
    } catch (error) {
      setError(error.response?.data?.msg || error.message || '备份创建失败')
    } finally {
      setIsBackingUp(false)
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleBackupToCompose = async () => {
    try {
      setIsBackingUp(true)
      setSuccess(null)
      setError(null)
      
      const response = await containerAPI.backupToCompose()
      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        setSuccess('Compose备份创建成功')
        // 刷新备份列表
        fetchBackups()
      } else {
        setError(response.data?.msg || 'Compose备份创建失败')
      }
    } catch (error) {
      setError(error.response?.data?.msg || error.message || 'Compose备份创建失败')
    } finally {
      setIsBackingUp(false)
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleRestore = async (filename) => {
    try {
      if (!window.confirm(`确定要恢复备份文件 ${filename} 吗？这将覆盖当前容器配置。`)) {
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      const response = await containerAPI.restoreContainer(filename)
      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        setSuccess(`备份 ${filename} 恢复成功`)
      } else {
        setError(response.data?.msg || `备份 ${filename} 恢复失败`)
      }
    } catch (error) {
      setError(error.response?.data?.msg || error.message || `备份 ${filename} 恢复失败`)
    } finally {
      setIsLoading(false)
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000)
      
      // 刷新备份列表
      fetchBackups()
    }
  }

  const handleDelete = async (filename) => {
    try {
      if (!window.confirm(`确定要删除备份文件 ${filename} 吗？此操作不可恢复。`)) {
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      const response = await containerAPI.deleteBackup(filename)
      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        setSuccess(`备份 ${filename} 删除成功`)
        // 从列表中移除已删除的备份
        setBackups(backups.filter(backup => backup !== filename))
      } else {
        setError(response.data?.msg || `备份 ${filename} 删除失败`)
      }
    } catch (error) {
      setError(error.response?.data?.msg || error.message || `备份 ${filename} 删除失败`)
    } finally {
      setIsLoading(false)
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const getFileType = (filename) => {
    if (filename.endsWith('.json')) return 'JSON'
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'YAML'
    return '未知'
  }

  const formatFilename = (filename) => {
    // 移除文件扩展名
    return filename.replace(/\.(json|yaml|yml)$/i, '')
  }

  // 按日期分组备份文件（用于时间线视图）
  const groupBackupsByDate = (backupList) => {
    const groups = {}
    
    backupList.forEach(backup => {
      // 从文件名中提取日期部分
      const dateMatch = backup.match(/backup-(\d{4}-\d{2}-\d{2})/)
      const date = dateMatch ? dateMatch[1] : '未知日期'
      
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(backup)
    })
    
    // 转换为数组并按日期排序（最新的在前）
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
  }

  // 获取备份文件的日期
  const getBackupDate = (filename) => {
    const dateMatch = filename.match(/backup-(\d{4}-\d{2}-\d{2})/)
    return dateMatch ? dateMatch[1] : '未知日期'
  }

  if (isLoading && backups.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面头部 */}
        <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">备份管理</h2>
            <p className="text-gray-600 dark:text-gray-400">创建、恢复和删除容器备份</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBackupToCompose}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50"
            >
              <FileCode className={`h-4 w-4 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">YAML</span>
            </button>
            <button 
              onClick={handleBackup}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              <Save className={`h-4 w-4 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">JSON</span>
            </button>
            <button 
              onClick={fetchBackups}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">刷新</span>
            </button>
          </div>
        </div>
      </div>

      {/* 状态消息 */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <span className="text-green-800 dark:text-green-200 text-sm">{success}</span>
        </div>
      )}

      {/* 统计信息 */}
      <div className="px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4 sm:p-6 rounded-2xl">
          <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            {backups.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">总备份数</div>
        </div>
        <div className="card p-4 sm:p-6 rounded-2xl">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {backups.filter(b => b.endsWith('.json')).length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">JSON 备份</div>
        </div>
        <div className="card p-4 sm:p-6 rounded-2xl">
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {backups.filter(b => b.endsWith('.yaml') || b.endsWith('.yml')).length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">YAML 备份</div>
        </div>
      </div>

      {/* 备份列表 */}
      <div className="px-4 sm:px-6 py-4">
        {backups.length === 0 ? (
          <div className="card p-12 text-center rounded-2xl">
            <HardDrive className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">暂无备份</h3>
            <p className="text-gray-500 dark:text-gray-400">点击上方按钮创建您的第一个备份</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupBackupsByDate(backups).map(([date, dateBackups]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {date}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {dateBackups.length} 个
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateBackups.map((backup) => (
                    <div key={backup} className="group card p-4 rounded-2xl hover:shadow-lg transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <HardDrive className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {formatFilename(backup)}
                            </h4>
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded flex-shrink-0",
                              getFileType(backup) === 'JSON'
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                            )}>
                              {getFileType(backup)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {backup}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => handleRestore(backup)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors active:scale-95"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>恢复</span>
                        </button>
                        <button
                          onClick={() => handleDelete(backup)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
                          title="删除备份"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>删除</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}