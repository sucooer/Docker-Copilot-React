import axios from 'axios'

// 清理旧版本遗留的配置键（老版本曾将 API 地址/token 存于 localStorage，
// 迁移到同源 + HttpOnly Cookie 后这些键会破坏新认证方案或残留误导）
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('api_base_url')
    localStorage.removeItem('docker_copilot_token')
  } catch {
    // localStorage 不可用（隐私模式等）时静默跳过
  }
}

// 动态获取 API 基础地址
// 优先级：环境变量 > window.__API_BASE_URL > 当前主机 > 默认值
function getAPIBaseURL() {
  // 1. 最高优先级：环境变量（构建时注入）
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 2. 检查全局变量（注入的配置）
  if (typeof window !== 'undefined' && window.__API_BASE_URL) {
    return window.__API_BASE_URL
  }

  // 3. 使用当前主机（同源部署，Cookie 认证可用）
  if (typeof window !== 'undefined' && window.location.host) {
    return `${window.location.protocol}//${window.location.host}`
  }

  // 4. 最后的默认值
  return 'http://localhost'
}

const API_BASE_URL = getAPIBaseURL()

// 创建axios实例
// withCredentials: 携带 HttpOnly Cookie 完成认证，token 不再存于 localStorage
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器 - 处理认证过期
// token 由 HttpOnly Cookie 承载，前端无法读取；收到 401 即视为未认证
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('authChange', { detail: { authenticated: false } }))
    }
    return Promise.reject(error)
  }
)

// 认证相关API
export const authAPI = {
  login: (secretKey) => {
    const formData = new FormData()
    formData.append('secretKey', secretKey)
    return apiClient.post('/api/auth', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  logout: () => apiClient.post('/api/auth/logout'),
}

// 版本相关API
export const versionAPI = {
  getVersion: (type) => {
    // 如果type参数为空，则不添加查询参数
    if (!type) {
      return apiClient.get('/api/version')
    }
    return apiClient.get(`/api/version?type=${encodeURIComponent(type)}`)
  },
  updateProgram: () => apiClient.put('/api/program'),
}

// 容器相关API
export const containerAPI = {
  getContainers: () => apiClient.get('/api/containers'),
  getContainer: (id) => apiClient.get(`/api/container/${encodeURIComponent(id)}`),
  startContainer: (id) => apiClient.post(`/api/container/${encodeURIComponent(id)}/start`),
  stopContainer: (id) => apiClient.post(`/api/container/${encodeURIComponent(id)}/stop`),
  restartContainer: (id) => apiClient.post(`/api/container/${encodeURIComponent(id)}/restart`),
  getLogs: (id, tail = 200) => apiClient.get(`/api/container/${encodeURIComponent(id)}/logs?tail=${tail}`),
  renameContainer: (id, newName) => {
    return apiClient.post(`/api/container/${encodeURIComponent(id)}/rename?newName=${encodeURIComponent(newName)}`)
  },
  updateContainer: (id, containerName, imageNameAndTag, delOldContainer) => {
    const formData = new FormData()
    formData.append('containerName', containerName)
    formData.append('imageNameAndTag', imageNameAndTag)
    formData.append('delOldContainer', delOldContainer ? 'true' : 'false')
    return apiClient.post(`/api/container/${encodeURIComponent(id)}/update`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  backupContainer: () => apiClient.get('/api/container/backup'),
  listBackups: () => apiClient.get('/api/container/listBackups'),
  restoreContainer: (filename) => {
    return apiClient.post(`/api/container/backups/${encodeURIComponent(filename)}/restore`)
  },
  deleteBackup: (filename) => apiClient.delete(`/api/container/backups?filename=${encodeURIComponent(filename)}`),
  backupToCompose: () => apiClient.get('/api/container/backup2compose'),
  deleteContainer: (id) => apiClient.delete(`/api/container/${encodeURIComponent(id)}`),
}

// 镜像相关API
export const imageAPI = {
  getImages: () => apiClient.get('/api/images'),
  getIcons: () => apiClient.get('/api/icons'),
  deleteImage: (id, force = false) => apiClient.delete(`/api/image/${encodeURIComponent(id)}?force=${force}`),
  uploadIcon: (file, imageName, containerName) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('imageName', imageName)
    if (containerName) {
      formData.append('containerName', containerName)
    }
    return apiClient.post('/api/icons', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// Compose 相关API
export const composeAPI = {
  list: () => apiClient.get('/api/compose'),
  get: (name) => apiClient.get(`/api/compose/${encodeURIComponent(name)}`),
  create: (name, content) => apiClient.post('/api/compose', { name, content }),
  update: (name, content) => apiClient.put(`/api/compose/${encodeURIComponent(name)}`, { content }),
  delete: (name) => apiClient.delete(`/api/compose/${encodeURIComponent(name)}`),
  up: (name) => apiClient.post(`/api/compose/${encodeURIComponent(name)}/up`),
}

// 自动更新相关API
export const autoUpdateAPI = {
  list: () => apiClient.get('/api/auto-update'),
  update: (id, enabled, intervalMinutes) => apiClient.put(`/api/auto-update/${id}`, { enabled, intervalMinutes }),
  run: () => apiClient.post('/api/auto-update/run'),
}

// 进度查询API
export const progressAPI = {
  getProgress: (taskid) => apiClient.get(`/api/progress/${taskid}`),
}

// 定时重启API
export const restartScheduleAPI = {
  list: () => apiClient.get('/api/restart-schedule'),
  update: (id, enabled, intervalMinutes) => apiClient.put(`/api/restart-schedule/${id}`, { enabled, intervalMinutes }),
  run: () => apiClient.post('/api/restart-schedule/run'),
}

// 通知设置API
export const notifyAPI = {
  getConfig: () => apiClient.get('/api/notify/config'),
  updateConfig: (config) => apiClient.put('/api/notify/config', config),
  test: (channel) => apiClient.post('/api/notify/test', { channel }),
}

// GitHub API - 用于检查前端更新
export const githubAPI = {
  /**
   * 获取 GitHub 仓库的最新 Release
   * @param {string} owner - 仓库所有者
   * @param {string} repo - 仓库名称
   * @returns {Promise} 返回最新 Release 信息
   */
  getLatestRelease: async (owner, repo) => {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
        timeout: 5000,
      })
      return response.data
    } catch (error) {
      console.warn('获取 GitHub 最新版本失败:', error.message)
      throw error
    }
  },

  /**
   * 获取 GitHub 仓库的所有 Releases
   * @param {string} owner - 仓库所有者
   * @param {string} repo - 仓库名称
   * @param {number} perPage - 每页返回数量
   * @returns {Promise} 返回 Release 列表
   */
  getReleases: async (owner, repo, perPage = 5) => {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`, {
        params: { per_page: perPage },
        timeout: 5000,
      })
      return response.data
    } catch (error) {
      console.warn('获取 GitHub Releases 列表失败:', error.message)
      throw error
    }
  },

  /**
   * 获取 GitHub 仓库信息
   * @param {string} owner - 仓库所有者
   * @param {string} repo - 仓库名称
   * @returns {Promise} 返回仓库信息
   */
  getRepoInfo: async (owner, repo) => {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        timeout: 5000,
      })
      return response.data
    } catch (error) {
      console.warn('获取 GitHub 仓库信息失败:', error.message)
      throw error
    }
  },
}

export default apiClient
