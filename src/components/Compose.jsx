import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Layers,
  Plus,
  FileText,
  Play,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Edit,
  Eye,
  Terminal,
  Loader,
  Upload,
  WrapText
} from 'lucide-react'
import { composeAPI, progressAPI } from '../api/client.js'
import { cn } from '../utils/cn.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection, highlightSpecialChars, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { RangeSetBuilder } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { yaml } from '@codemirror/lang-yaml'
import { indentUnit, syntaxHighlighting, defaultHighlightStyle, HighlightStyle, foldGutter, indentOnInput, bracketMatching, foldKeymap, getIndentUnit } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c084fc' },
  { tag: tags.atom, color: '#67e8f9' },
  { tag: tags.bool, color: '#67e8f9' },
  { tag: tags.url, color: '#67e8f9', textDecoration: 'underline' },
  { tag: tags.definition(tags.variableName), color: '#67e8f9' },
  { tag: tags.string, color: '#86efac' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.special(tags.string), color: '#86efac' },
  { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#93c5fd' },
  { tag: tags.local(tags.variableName), color: '#93c5fd' },
  { tag: tags.meta, color: '#9ca3af' },
  { tag: tags.regexp, color: '#f87171' },
  { tag: tags.tagName, color: '#f87171' },
  { tag: tags.typeName, color: '#fbbf24' },
  { tag: tags.className, color: '#fbbf24' },
  { tag: tags.labelName, color: '#f87171' },
  { tag: tags.propertyName, color: '#93c5fd' },
  { tag: tags.operator, color: '#f9a8d4' },
  { tag: tags.punctuation, color: '#9ca3af' },
  { tag: tags.null, color: '#fbbf24' },
])
import { syntaxTree } from '@codemirror/language'

export function Compose() {
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showView, setShowView] = useState(null)
  const [deployTask, setDeployTask] = useState(null)

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning',
  })

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['compose'],
    queryFn: async () => {
      const response = await composeAPI.list()
      if (response.data.code === 200 || response.data.code === 0) {
        return response.data.data || []
      }
      throw new Error(response.data.msg)
    },
    refetchInterval: (showCreate || showEdit || showView || deployTask) ? false : 10000,
  })

  const handleCreate = async (name, content) => {
    try {
      setError(null)
      const response = await composeAPI.create(name, content)
      if (response.data.code === 200 || response.data.code === 0) {
        setShowCreate(false)
        setSuccess(`Compose 项目 "${name}" 创建成功`)
        refetch()
      } else {
        setError(response.data.msg || '创建失败')
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.message || '创建失败')
    }
  }

  const handleUpdate = async (name, content) => {
    try {
      setError(null)
      const response = await composeAPI.update(name, content)
      if (response.data.code === 200 || response.data.code === 0) {
        setShowEdit(null)
        setSuccess(`Compose 文件 "${name}" 更新成功`)
        refetch()
      } else {
        setError(response.data.msg || '更新失败')
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.message || '更新失败')
    }
  }

  const handleDelete = async (name) => {
    try {
      setError(null)
      const response = await composeAPI.delete(name)
      if (response.data.code === 200 || response.data.code === 0) {
        setSuccess(`Compose 项目 "${name}" 已删除`)
        refetch()
      } else {
        setError(response.data.msg || '删除失败')
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.message || '删除失败')
    }
  }

  const handleUp = async (name) => {
    try {
      setError(null)
      const response = await composeAPI.up(name)
      const taskID = response.data.data?.taskID
      if (!taskID) {
        setError('启动失败：未获取到任务ID')
        return
      }
      setDeployTask({ name, taskId: taskID, logs: [], isDone: false, success: false })
    } catch (err) {
      setError(err.response?.data?.msg || err.message || '启动失败')
    }
  }

  const pollRef = useRef(null)
  const logsEndRef = useRef(null)

  useEffect(() => {
    if (!deployTask || deployTask.isDone) return
    const taskId = deployTask.taskId
    const poll = async () => {
      try {
        const res = await progressAPI.getProgress(taskId)
        if (res.data.code === 200) {
          const data = res.data.data
          setDeployTask(prev => {
            if (!prev || prev.taskId !== taskId) return prev
            const newLogs = [...prev.logs]
            if (data.detailMsg) {
              const last = newLogs[newLogs.length - 1]
              if (!last || last !== data.detailMsg) {
                newLogs.push(data.detailMsg)
              }
            }
            const done = data.isDone
            return {
              ...prev,
              logs: newLogs,
              isDone: done,
              success: done && data.message === '部署完成',
              failMsg: done && data.message !== '部署完成' ? data.message : '',
            }
          })
          if (data.isDone) {
            clearInterval(pollRef.current)
            pollRef.current = null
            if (data.message === '部署完成') {
              refetch()
            }
          }
        } else {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      } catch {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [deployTask?.taskId, deployTask?.isDone])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [deployTask?.logs])

  const showDeleteConfirm = (name) => {
    setConfirmModal({
      isOpen: true,
      title: '删除 Compose 项目',
      message: `确定要删除 compose 项目 "${name}" 吗？此操作不可恢复。`,
      onConfirm: () => {
        setConfirmModal({ ...confirmModal, isOpen: false })
        handleDelete(name)
      },
      type: 'danger',
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="animate-pulse space-y-4">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* 确认弹窗 */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{confirmModal.title}</h3>
              <button onClick={() => setConfirmModal({ isOpen: false })} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 dark:text-gray-400">{confirmModal.message}</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end space-x-3">
              <button onClick={() => setConfirmModal({ isOpen: false })} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">取消</button>
              <button onClick={confirmModal.onConfirm} className={cn("px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors", confirmModal.type === 'danger' ? "bg-red-600 hover:bg-red-700" : "bg-primary-600 hover:bg-primary-700")}>确认</button>
            </div>
          </div>
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      {(showCreate || showEdit) && (
        <ComposeEditorModal
          project={showEdit}
          onSave={showCreate ? handleCreate : (name, content) => handleUpdate(showEdit, content)}
          onClose={() => { setShowCreate(false); setShowEdit(null) }}
        />
      )}

      {/* 查看内容弹窗 */}
      {showView && (
        <ComposeViewModal
          name={showView}
          onClose={() => setShowView(null)}
        />
      )}

      {/* 部署进度弹窗 */}
      {deployTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                部署 - {deployTask.name}
                {!deployTask.isDone && <Loader className="h-4 w-4 animate-spin text-primary-500" />}
                {deployTask.isDone && deployTask.success && <CheckCircle className="h-4 w-4 text-green-500" />}
                {deployTask.isDone && !deployTask.success && <AlertCircle className="h-4 w-4 text-red-500" />}
              </h3>
              {deployTask.isDone && (
                <button onClick={() => setDeployTask(null)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="px-6 py-4 max-h-96 overflow-auto bg-gray-950">
              <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
                {deployTask.logs.length === 0 ? (
                  <span className="text-gray-500">等待部署开始...</span>
                ) : (
                  deployTask.logs.map((line, i) => <div key={i}>{line}</div>)
                )}
                {!deployTask.isDone && (
                  <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />
                )}
                <div ref={logsEndRef} />
              </pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {!deployTask.isDone ? '部署进行中...' : deployTask.success ? '部署成功' : `部署失败: ${deployTask.failMsg || ''}`}
              </span>
              {deployTask.isDone && (
                <button onClick={() => setDeployTask(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors">关闭</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0 pt-4 sm:pt-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compose 管理</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">管理 Docker Compose 项目的创建、编辑和部署</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />刷新
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />新建项目
          </button>
        </div>
      </div>

      {/* 错误/成功提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-green-800 dark:text-green-200 text-sm">{success}</span>
        </div>
      )}

      {/* 统计信息 */}
      <div className="px-2 sm:px-6 py-4">
        <div className="grid grid-cols-3 gap-0 rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-3 sm:p-5 text-center border-r border-gray-200 dark:border-gray-700">
            <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{projects.length}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Compose 项目</div>
          </div>
          <div className="p-3 sm:p-5 text-center border-r border-gray-200 dark:border-gray-700">
            <div className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">{projects.length}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">配置文件</div>
          </div>
          <div className="p-3 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{projects.filter(p => p.name).length}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">可部署</div>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="px-2 sm:px-6 py-4">
        {projects.length === 0 ? (
          <div className="card p-12 text-center rounded-2xl">
            <Layers className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">暂无 Compose 项目</h3>
            <p className="text-gray-500 dark:text-gray-400">点击上方「新建项目」创建您的第一个 Compose 项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.name} className="group card p-4 rounded-2xl hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                      {project.name}
                      {project.deployed && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          已部署
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      docker-compose.yml
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setShowView(project.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors active:scale-95"
                    title="查看"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>查看</span>
                  </button>
                  <button
                    onClick={() => setShowEdit(project.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95"
                    title="编辑"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>编辑</span>
                  </button>
                  <button
                    onClick={() => handleUp(project.name)}
                    disabled={deployTask && !deployTask.isDone}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                    title="部署启动"
                  >
                    {deployTask && !deployTask.isDone && deployTask.name === project.name ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    <span>{deployTask && !deployTask.isDone && deployTask.name === project.name ? '部署中' : '部署'}</span>
                  </button>
                  <button
                    onClick={() => showDeleteConfirm(project.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

class IndentGuideWidget extends WidgetType {
  constructor(indentLevel) {
    super()
    this.indentLevel = indentLevel
  }

  toDOM() {
    const container = document.createElement('span')
    container.className = 'cm-indent-guides'
    container.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      pointer-events: none;
    `

    const indentUnit = 2
    for (let i = 1; i <= this.indentLevel; i++) {
      const line = document.createElement('span')
      line.className = 'cm-indent-guide'
      line.style.cssText = `
        position: absolute;
        left: ${i * indentUnit}ch;
        top: 0;
        bottom: 0;
        width: 1px;
      `
      container.appendChild(line)
    }

    return container
  }

  eq(other) {
    return this.indentLevel === other.indentLevel
  }

  get estimatedHeight() {
    return -1
  }
}

function indentGutterPlugin() {
  return ViewPlugin.fromClass(
    class {
      decorations

      constructor(view) {
        this.decorations = this.buildDecorations(view)
      }

      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view)
        }
      }

      buildDecorations(view) {
        const builder = new RangeSetBuilder()
        const indentUnit = getIndentUnit(view.state)

        for (const { from, to } of view.visibleRanges) {
          for (let pos = from; pos <= to; ) {
            const line = view.state.doc.lineAt(pos)
            const text = line.text
            const indent = text.match(/^(\s*)/)[1].length
            const indentLevel = Math.floor(indent / indentUnit)

            if (indentLevel > 0) {
              builder.add(
                line.from,
                line.from,
                Decoration.widget({
                  widget: new IndentGuideWidget(indentLevel),
                  side: -1,
                  block: false,
                })
              )
            }

            pos = line.to + 1
          }
        }

        return builder.finish()
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  )
}

function CodeMirrorEditor({ value, onChange, wrap = true }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const wrapCompartmentRef = useRef(null)
  const isDarkRef = useRef(false)

  useEffect(() => {
    if (!editorRef.current) return

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })

    const lightTheme = EditorView.theme({
      '&': { height: '100%', fontSize: '14px' },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        overflow: 'auto',
      },
      '.cm-content': { padding: '12px 0', position: 'relative' },
      '.cm-gutters': {
        backgroundColor: '#f9fafb',
        borderRight: '1px solid #e5e7eb',
        color: '#9ca3af',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 12px',
        minWidth: '3rem',
        textAlign: 'right',
      },
      '.cm-foldGutter .cm-gutterElement': { padding: '0 4px', cursor: 'pointer' },
      '.cm-activeLineGutter': { backgroundColor: '#f3f4f6' },
      '.cm-activeLine': { backgroundColor: '#f3f4f6' },
      '.cm-foldPlaceholder': {
        backgroundColor: '#e5e7eb', border: 'none', color: '#6b7280', margin: '0 4px',
      },
      '.cm-indent-guides': { pointerEvents: 'none' },
      '.cm-indent-guide': {
        position: 'absolute',
        top: '0',
        bottom: '0',
        width: '1px',
        backgroundColor: '#e5e7eb',
      },
    }, { dark: false })

    const darkTheme = EditorView.theme({
      '&': { height: '100%', fontSize: '14px', backgroundColor: '#1f2937', color: '#e5e7eb' },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        overflow: 'auto',
      },
      '.cm-content': { padding: '12px 0', position: 'relative', color: '#e5e7eb' },
      '.cm-gutters': {
        backgroundColor: '#111827',
        borderRight: '1px solid #374151',
        color: '#6b7280',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 12px',
        minWidth: '3rem',
        textAlign: 'right',
      },
      '.cm-foldGutter .cm-gutterElement': { padding: '0 4px', cursor: 'pointer' },
      '.cm-activeLineGutter': { backgroundColor: '#1f2937' },
      '.cm-activeLine': { backgroundColor: '#374151' },
      '.cm-foldPlaceholder': {
        backgroundColor: '#374151', border: 'none', color: '#9ca3af', margin: '0 4px',
      },
      '.cm-indent-guides': { pointerEvents: 'none' },
      '.cm-indent-guide': {
        position: 'absolute',
        top: '0',
        bottom: '0',
        width: '1px',
        backgroundColor: '#374151',
      },
    }, { dark: true })

    isDarkRef.current = document.documentElement.classList.contains('dark')
    const wrapCompartment = new Compartment()
    wrapCompartmentRef.current = wrapCompartment

    const state = EditorState.create({
      doc: value,
      extensions: [
        highlightSpecialChars(),
        drawSelection(),
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        indentUnit.of('  '),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        yaml(),
        updateListener,
        isDarkRef.current ? darkTheme : lightTheme,
        isDarkRef.current ? syntaxHighlighting(darkHighlightStyle) : syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        wrapCompartment.of(wrap ? EditorView.lineWrapping : []),
        indentGutterPlugin(),
      ],
    })

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    })

    const observer = new MutationObserver(() => {
      const newIsDark = document.documentElement.classList.contains('dark')
      viewRef.current.dispatch({
        effects: EditorView.reconfigure.of(newIsDark ? darkTheme : lightTheme),
      })
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      observer.disconnect()
      viewRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString()
      if (value !== currentValue) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentValue.length, insert: value },
        })
      }
    }
  }, [value])

  useEffect(() => {
    if (viewRef.current && wrapCompartmentRef.current) {
      viewRef.current.dispatch({
        effects: wrapCompartmentRef.current.reconfigure(wrap ? EditorView.lineWrapping : []),
      })
    }
  }, [wrap])

  return <div ref={editorRef} className="h-full" />
}

function extractContainerName(content) {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^container_name\s*:\s*(.*)$/)
    if (match) {
      const value = match[1].trim().replace(/^["']|["']$/g, '')
      if (value) return value
    }
  }
  return null
}

function ComposeEditorModal({ project, onSave, onClose }) {
  const [name, setName] = useState(project || '')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [wrap, setWrap] = useState(true)
  const fileInputRef = useRef(null)
  const isEdit = !!project

  const handleFileUpload = (file) => {
    if (!file.name.match(/\.(ya?ml|txt)$/i)) {
      setError('仅支持 .yml / .yaml / .txt 文件')
      return
    }
    if (file.size > 1024 * 1024) {
      setError('文件大小不能超过 1MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setContent(text)
      if (!isEdit && !name.trim()) {
        setName(extractContainerName(text) || file.name.replace(/\.(ya?ml|txt)$/i, ''))
      }
      setError(null)
    }
    reader.onerror = () => setError('文件读取失败')
    reader.readAsText(file)
  }

  React.useEffect(() => {
    if (isEdit) {
      setLoading(true)
      composeAPI.get(project).then(res => {
        if (res.data.code === 200 || res.data.code === 0) {
          setContent(res.data.data?.content || '')
        }
      }).catch(err => {
        setError(err.response?.data?.msg || err.message || '加载失败')
      }).finally(() => setLoading(false))
    } else {
      setContent(`version: '3'

services:
  app:
    image: nginx:latest
    container_name: my-app
    ports:
      - "80:80"
    restart: unless-stopped
`)
    }
  }, [project])

  const handleSubmit = () => {
    if (!isEdit && !name.trim()) {
      setError('请输入项目名称')
      return
    }
    if (!content.trim()) {
      setError('请输入 Compose 内容')
      return
    }
    onSave(name.trim(), content)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {isEdit ? `编辑 Compose - ${project}` : '新建 Compose 项目'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-800 dark:text-red-200">{error}</div>
          )}

          {!isEdit && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目名称</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如: myapp"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">docker-compose.yml</label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">YAML 格式</span>
              <button
                type="button"
                onClick={() => setWrap(!wrap)}
                className={cn(
                  "inline-flex items-center space-x-1 text-xs rounded-md border px-2 py-1 transition-colors",
                  wrap
                    ? "text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    : "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                title={wrap ? '关闭自动换行' : '开启自动换行'}
              >
                <WrapText size={14} />
                <span>自动换行</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <Upload size={14} />
                <span>上传文件</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden h-96">
              <CodeMirrorEditor value={content} onChange={setContent} wrap={wrap} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end space-x-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">取消</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors">
            {isEdit ? '保存' : '创建'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".yml,.yaml,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0]
            if (file) handleFileUpload(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

function ComposeViewModal({ name, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  React.useEffect(() => {
    composeAPI.get(name).then(res => {
      if (res.data.code === 200 || res.data.code === 0) {
        setContent(res.data.data?.content || '')
      } else {
        setError(res.data.msg || '加载失败')
      }
    }).catch(err => {
      setError(err.response?.data?.msg || err.message || '加载失败')
    }).finally(() => setLoading(false))
  }, [name])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {name} - docker-compose.yml
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-red-800 dark:text-red-200">{error}</div>
          ) : (
            <pre className="w-full h-96 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm overflow-auto whitespace-pre-wrap">{content || '（空）'}</pre>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors">关闭</button>
        </div>
      </div>
    </div>
  )
}
