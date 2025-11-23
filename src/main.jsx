import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import logoImg from './assets/DockerCopilot-logo.png'

// 设置浏览器 favicon
const setFavicon = () => {
  // 移除现有的 favicon
  const existingFavicon = document.querySelector("link[rel*='icon']")
  if (existingFavicon) {
    existingFavicon.remove()
  }

  // 创建新的 favicon link
  const link = document.createElement('link')
  link.type = 'image/png'
  link.rel = 'icon'
  link.href = logoImg

  // 添加到 head
  document.head.appendChild(link)
}

// 在应用启动时设置 favicon
setFavicon()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)