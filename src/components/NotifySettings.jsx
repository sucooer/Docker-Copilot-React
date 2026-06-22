import React, { useState, useEffect, useCallback } from 'react'
import { Bell, Send, Loader, Globe } from 'lucide-react'
import { notifyAPI } from '../api/client.js'
import { cn } from '../utils/cn.js'

const channelMeta = {
  telegram: { label: 'Telegram', icon: Send, color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
  serverchan: { label: 'Server酱', icon: Bell, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  webhook: { label: '自定义 Webhook', icon: Globe, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
}

const emptyChannel = (type) => ({
  type,
  enabled: false,
  botToken: '',
  chatId: '',
  sendKey: '',
  webhookUrl: '',
})

export function NotifySettings() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [testingId, setTestingId] = useState(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const res = await notifyAPI.getConfig()
      if (res.data.code === 200 || res.data.code === 0) {
        const data = res.data.data
        if (data && data.channels && data.channels.length > 0) {
          setChannels(data.channels)
        } else {
          setChannels([emptyChannel('telegram'), emptyChannel('serverchan'), emptyChannel('webhook')])
        }
      }
    } catch {
      setChannels([emptyChannel('telegram'), emptyChannel('serverchan'), emptyChannel('webhook')])
    } finally {
      setLoading(false)
    }
  }

  const updateChannel = useCallback((index, field, value) => {
    setChannels(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMsg('保存中...')
      await notifyAPI.updateConfig({ channels })
      setSaveMsg('已保存')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch {
      setSaveMsg('保存失败')
      setTimeout(() => setSaveMsg(''), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (index) => {
    const ch = channels[index]
    if (!ch.enabled) return
    setTestingId(index)
    try {
      await notifyAPI.test(ch)
      setSaveMsg('测试消息已发送')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('测试发送失败')
      setTimeout(() => setSaveMsg(''), 3000)
    } finally {
      setTestingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4">
        <div className="flex items-center justify-center py-20">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">通知设置</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">配置自动更新成功/失败时的通知渠道</p>
          </div>
          {saveMsg && (
            <span className={cn(
              "text-sm px-3 py-1 rounded-full",
              saveMsg === '已保存' || saveMsg === '测试消息已发送'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : saveMsg === '保存失败' || saveMsg === '测试发送失败'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            )}>
              {saveMsg}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {channels.map((ch, index) => {
            const meta = channelMeta[ch.type] || {}
            const isTesting = testingId === index
            return (
              <div key={ch.type} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg", meta.color)}>
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{meta.label}</span>
                  </div>
                  <button
                    onClick={() => updateChannel(index, 'enabled', !ch.enabled)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      ch.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      ch.enabled ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>

                {ch.enabled && (
                  <div className="p-5 space-y-4">
                    {ch.type === 'telegram' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Bot Token</label>
                          <input
                            type="password"
                            value={ch.botToken}
                            onChange={(e) => updateChannel(index, 'botToken', e.target.value)}
                            placeholder="123456:ABC-DEF..."
                            className="input text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Chat ID</label>
                          <input
                            type="text"
                            value={ch.chatId}
                            onChange={(e) => updateChannel(index, 'chatId', e.target.value)}
                            placeholder="-100123456789"
                            className="input text-sm w-full"
                          />
                        </div>
                      </>
                    )}
                    {ch.type === 'serverchan' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">SendKey</label>
                        <input
                          type="password"
                          value={ch.sendKey}
                          onChange={(e) => updateChannel(index, 'sendKey', e.target.value)}
                          placeholder="sckey_..."
                          className="input text-sm w-full"
                        />
                      </div>
                    )}
                    {ch.type === 'webhook' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Webhook URL</label>
                        <input
                          type="url"
                          value={ch.webhookUrl}
                          onChange={(e) => updateChannel(index, 'webhookUrl', e.target.value)}
                          placeholder="https://hooks.example.com/notify"
                          className="input text-sm w-full"
                        />
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleTest(index)}
                        disabled={isTesting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        {isTesting ? (
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {isTesting ? '发送中...' : '发送测试'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
