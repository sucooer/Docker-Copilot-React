import React, { useState, useEffect } from 'react'
import { HardDrive, Trash2, RefreshCw, Link, BrushCleaning, X, AlertCircle, CheckCircle } from 'lucide-react'
import { imageAPI } from '../api/client.js'
import { cn } from '../utils/cn.js'
import { getImageLogo } from '../config/imageLogos.js'

// 安全的图片组件
function SafeImage({ src, alt, className, fallback }) {
  const [hasError, setHasError] = React.useState(false)
  
  if (hasError || !src) {
    return fallback
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setHasError(true)}
    />
  )
}

export function Images() {
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, image: null })

  const fetchImages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await imageAPI.getImages()
      
      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        setImages(response.data.data || [])
      } else {
        const errorMsg = response.data?.msg || '获取镜像列表失败'
        setError(errorMsg)
        setImages([])
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || '网络错误，请检查后端服务'
      setError(errorMsg)
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleDeleteImage = async (imageId, force = false) => {
    try {
      setIsLoading(true)
      setDeleteModal({ isOpen: false, image: null })
      
      await imageAPI.deleteImage(imageId, force)
      
      setSuccess(`镜像删除成功`)
      fetchImages()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || '删除镜像失败'
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  const handlePrune = async (type) => {
    try {
      setIsLoading(true)
      setError(null)
      
      let imagesToDelete = []
      if (type === 'dangling') {
        imagesToDelete = images.filter(img => img.tag === 'None' || img.tag === '<none>')
      } else if (type === 'unused') {
        imagesToDelete = images.filter(img => !img.inUsed)
      }
      
      if (imagesToDelete.length === 0) {
        setError('没有找到需要清理的镜像')
        setIsLoading(false)
        return
      }
      
      // 批量删除
      const deletePromises = imagesToDelete.map(image => 
        imageAPI.deleteImage(image.id, false)
      )
      
      await Promise.all(deletePromises)
      
      const message = type === 'dangling' 
        ? `成功清理 ${imagesToDelete.length} 个无Tag镜像`
        : `成功清理 ${imagesToDelete.length} 个未使用的镜像`
      
      setSuccess(message)
      fetchImages()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || '清理镜像失败'
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  const formatImageSize = (sizeStr) => {
    if (!sizeStr) return '0 MB'
    return sizeStr.replace(/mb/gi, 'MB')
                  .replace(/gb/gi, 'GB')
                  .replace(/kb/gi, 'KB')
  }

  const getSizeColor = (size) => {
    const sizeInMB = parseInt(size)
    if (sizeInMB < 100) return 'text-green-600 dark:text-green-400'
    if (sizeInMB < 300) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (isLoading && images.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6 h-48 rounded-2xl"></div>
            ))}
          </div>
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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">镜像管理</h2>
            <p className="text-gray-600 dark:text-gray-400">查看和管理Docker镜像</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrune('dangling')}
              disabled={isLoading || images.filter(img => img.tag === 'None' || img.tag === '<none>').length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <BrushCleaning className="h-4 w-4" />
              <span>无Tag</span>
            </button>
            <button
              onClick={() => handlePrune('unused')}
              disabled={isLoading || images.filter(img => !img.inUsed).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <BrushCleaning className="h-4 w-4" />
              <span>未使用</span>
            </button>
            <button
              onClick={fetchImages}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>
      </div>

      {/* 状态消息 */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-800 dark:text-red-200 text-sm flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <span className="text-green-800 dark:text-green-200 text-sm flex-1">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 统计信息 */}
      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 rounded-2xl">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            {images.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">总镜像数</div>
        </div>
        <div className="card p-6 rounded-2xl">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {images.filter(img => img.inUsed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">使用中</div>
        </div>
        <div className="card p-6 rounded-2xl">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            {images.filter(img => !img.inUsed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">未使用</div>
        </div>
        <div className="card p-6 rounded-2xl">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            {images.filter(img => img.tag === 'None' || img.tag === '<none>').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">无Tag</div>
        </div>
      </div>

      {/* 镜像网格 */}
      <div className="px-4 sm:px-6 py-4">
        {images.length === 0 ? (
          <div className="card p-12 text-center rounded-2xl">
            <HardDrive className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">暂无镜像</h3>
            <p className="text-gray-500 dark:text-gray-400">您还没有任何Docker镜像</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="group card p-4 rounded-2xl hover:shadow-lg transition-all">
                {/* 头部：图标和操作按钮 */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <SafeImage
                      src={getImageLogo(image.name)}
                      alt={image.name}
                      className="h-10 w-10 object-cover"
                      fallback={<HardDrive className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                      {image.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {image.tag}
                    </p>
                  </div>

                  {/* 悬停时显示的操作按钮 */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <a
                      href={`https://hub.docker.com/r/${image.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
                      title="在Docker Hub查看"
                    >
                      <Link className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* 镜像信息 */}
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">大小:</span>
                    <span className={cn("font-semibold", getSizeColor(image.size))}>
                      {formatImageSize(image.size)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">状态:</span>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      image.inUsed
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    )}>
                      {image.inUsed ? '使用中' : '未使用'}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, image, force: false })}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>删除</span>
                  </button>
                  {image.inUsed && (
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, image, force: true })}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors active:scale-95"
                      title="强制删除正在使用的镜像"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>强制删除</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {deleteModal.force ? '强制删除镜像' : '删除镜像'}
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {deleteModal.force
                  ? `确定要强制删除镜像"${deleteModal.image?.name}"吗？这将删除正在使用的镜像！`
                  : `确定要删除镜像"${deleteModal.image?.name}"吗？`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, image: null })}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => deleteModal.image && handleDeleteImage(deleteModal.image.id, deleteModal.force)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
