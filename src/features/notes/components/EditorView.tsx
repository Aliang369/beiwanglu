// 改动：编辑页接入 TipTap 富文本编辑器，工具栏绑定 editor 命令；标签可编辑；标题独立 TipTap；版本历史支持预览/恢复
import { ArrowLeft, ClipboardCopy, Expand, Eye, Globe2, Link2, Lock, MoreHorizontal, Share2, Star, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { Folder } from '../../../shared/types/folder'
import type { Note, NoteTag } from '../../../shared/types/note'
import type { Snapshot } from '../../../shared/types/snapshot'
import { ConfirmDialog } from './ConfirmDialog'
import { CoverDialog } from './CoverDialog'
import { EditorActionMenu } from './EditorActionMenu'
import { EditorEmptyState } from './EditorEmptyState'
import { EditorExportOverlay } from './EditorExportOverlay'
import { EditorHistoryPanel } from './EditorHistoryPanel'
import { EditorInfoPanel } from './EditorInfoPanel'
import { EditorMetaBar } from './EditorMetaBar'
import { EditorToolbar } from './EditorToolbar'
import { ImmersiveToolbar } from './ImmersiveToolbar'
import { NoteEditorTags } from './NoteEditorTags'
import { NoteSearchInput } from './NoteSearchInput'
import { NoteTitleEditor } from './NoteTitleEditor'
import { RichEditor } from './RichEditor'
import { useNotesEditor } from '../hooks/useNotesEditor'

type EditorMode = 'default' | 'info' | 'history' | 'immersive'

interface EditorViewProps {
  note: Note | undefined
  folders?: Folder[]
  availableTags?: NoteTag[]
  /** 当前笔记的快照列表（按 createdAt 倒序）。 */
  snapshots?: Snapshot[]
  /** 正在预览的快照 id；null 表示未预览。 */
  previewingSnapshotId?: string | null
  onBack: () => void
  onChange: (patch: Partial<Pick<Note, 'title' | 'content' | 'cover' | 'tags'>>) => void
  onToggleFavorite: (noteId: string) => void
  onTogglePinned: (noteId: string) => void
  onToggleReadOnly: (noteId: string) => void
  onMoveToTrash: (noteId: string) => void
  /** 请求移动到文件夹（打开移动弹窗） */
  onRequestMoveToFolder?: (noteId: string) => void
  /** 搜索提交（Enter 触发，跳转回列表页过滤） */
  onSubmitSearch?: (query: string) => void
  /** 保存成功后触发（用于自动创建快照）。 */
  onSaved?: (noteId: string, content: string, title: string) => void
  /** 进入历史面板时加载快照列表。 */
  onLoadSnapshots?: (noteId: string) => void
  /** 预览某个快照（编辑区切换为只读历史内容）。 */
  onPreviewSnapshot?: (snapshotId: string) => void
  /** 退出预览，恢复当前编辑内容。 */
  onExitPreview?: () => void
  /** 恢复到指定快照（先存当前内容为快照，再覆盖笔记）。 */
  onRestoreSnapshot?: (snapshotId: string) => void
}

export function EditorView({
  note,
  folders = [],
  availableTags = [],
  snapshots = [],
  previewingSnapshotId = null,
  onBack,
  onChange,
  onToggleFavorite,
  onTogglePinned,
  onToggleReadOnly,
  onMoveToTrash,
  onRequestMoveToFolder,
  onSubmitSearch,
  onSaved,
  onLoadSnapshots,
  onPreviewSnapshot,
  onExitPreview,
  onRestoreSnapshot,
}: EditorViewProps) {
  const [mode, setMode] = useState<EditorMode>('default')
  const [showMenu, setShowMenu] = useState(false)
  const [coverDialogOpen, setCoverDialogOpen] = useState(false)
  const [removeCoverOpen, setRemoveCoverOpen] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'editing'>('saved')
  const [titleDraft, setTitleDraft] = useState(note?.title ?? '')
  const saveTimerRef = useRef<number | undefined>(undefined)
  const lastNoteIdRef = useRef(note?.id)
  // 预览前缓存当前编辑内容（JSON 字符串），退出预览时恢复
  const prePreviewContentRef = useRef<string | null>(null)
  const prePreviewTitleRef = useRef<string | null>(null)
  // 跳过预览/退出/恢复时 setContent 触发的 onUpdate（计数器，应对多次触发）
  const skipNextUpdateRef = useRef(0)

  const markEditing = useCallback(() => {
    setSaveState('editing')
    window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      setSaveState('saved')
    }, 500)
  }, [])

  // 标题/标签快照防抖 timer（避免每个字符都产生快照）
  const snapshotTimerRef = useRef<number | undefined>(undefined)

  const updateNote = useCallback(
    (patch: Partial<Pick<Note, 'title' | 'content' | 'cover' | 'tags'>>) => {
      markEditing()
      onChange(patch)
      // 标题/标签变化也触发快照（debounce 800ms，content 字段保存当前笔记内容）
      if (note && ('title' in patch || 'tags' in patch)) {
        const titleForSnapshot = patch.title ?? note.title
        const contentForSnapshot = note.content
        window.clearTimeout(snapshotTimerRef.current)
        snapshotTimerRef.current = window.setTimeout(() => {
          onSaved?.(note.id, contentForSnapshot, titleForSnapshot)
        }, 800)
      }
    },
    [markEditing, onChange, note, onSaved],
  )

  // editor 必须在 note 空判断之前创建，保证 hooks 顺序稳定；note 为空时传 undefined
  const editor = useNotesEditor(note, (json) => updateNote({ content: json }), onSaved, skipNextUpdateRef)

  // 只读模式：根据 note.readOnly 切换 editor 的 editable 状态
  const isReadOnly = Boolean(note?.readOnly)
  useEffect(() => {
    if (!editor) {
      return
    }
    // 预览模式下也强制只读
    editor.setEditable(!isReadOnly && !previewingSnapshotId)
  }, [editor, isReadOnly, previewingSnapshotId])

  useEffect(() => {
    if (!note) {
      return
    }

    if (lastNoteIdRef.current === note.id) {
      return
    }

    lastNoteIdRef.current = note.id
    setTitleDraft(note.title)
  }, [note])

  useEffect(() => {
    return () => {
      window.clearTimeout(saveTimerRef.current)
      window.clearTimeout(snapshotTimerRef.current)
    }
  }, [])

  const folderName = useMemo(() => {
    if (!note?.folderId) {
      return null
    }
    return folders.find((folder) => folder.id === note.folderId)?.name ?? null
  }, [folders, note?.folderId])

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitleDraft(value)
      updateNote({ title: value })
    },
    [updateNote],
  )

  // 进入历史模式时加载快照（仅依赖 noteId，避免 note 对象引用变化触发循环）
  const noteId = note?.id
  useEffect(() => {
    if (mode === 'history' && noteId) {
      onLoadSnapshots?.(noteId)
    }
  }, [mode, noteId, onLoadSnapshots])

  // 预览快照：缓存当前内容，再用快照内容覆盖编辑器（不触发 onChange/快照）
  useEffect(() => {
    if (!editor || !note) {
      return
    }
    if (previewingSnapshotId) {
      const snapshot = snapshots.find((s) => s.id === previewingSnapshotId)
      if (!snapshot) {
        return
      }
      // 缓存当前内容（仅首次进入预览时缓存）
      if (prePreviewContentRef.current === null) {
        prePreviewContentRef.current = note.content
        prePreviewTitleRef.current = note.title
      }
      // 跳过预览 setContent 触发的 onUpdate（计数器 +1）
      skipNextUpdateRef.current += 1
      try {
        const parsed = JSON.parse(snapshot.content)
        if (parsed && parsed.type === 'doc') {
          editor.commands.setContent(parsed, { emitUpdate: false })
        } else {
          editor.commands.setContent(snapshot.content, { emitUpdate: false })
        }
      } catch {
        editor.commands.setContent(snapshot.content, { emitUpdate: false })
      }
      setTitleDraft(snapshot.noteTitle)
    } else {
      // 退出预览：恢复缓存内容
      if (prePreviewContentRef.current !== null) {
        skipNextUpdateRef.current += 1
        try {
          const parsed = JSON.parse(prePreviewContentRef.current)
          if (parsed && parsed.type === 'doc') {
            editor.commands.setContent(parsed, { emitUpdate: false })
          } else {
            editor.commands.setContent(prePreviewContentRef.current, { emitUpdate: false })
          }
        } catch {
          editor.commands.setContent(prePreviewContentRef.current, { emitUpdate: false })
        }
        if (prePreviewTitleRef.current !== null) {
          setTitleDraft(prePreviewTitleRef.current)
        }
        prePreviewContentRef.current = null
        prePreviewTitleRef.current = null
      }
    }
  }, [editor, note, previewingSnapshotId, snapshots])

  function handlePreviewSnapshot(snapshotId: string) {
    onPreviewSnapshot?.(snapshotId)
  }

  function handleExitPreview() {
    onExitPreview?.()
  }

  async function handleRestoreSnapshot(snapshotId: string) {
    if (!note) {
      return
    }
    // 直接调恢复（store 内会先存当前内容快照，再用目标快照覆盖 note.content）
    await Promise.resolve(onRestoreSnapshot?.(snapshotId))
    // 恢复后退出预览状态，编辑器会通过 note.content 变化同步
    // 但 useNotesEditor 仅在 noteId 变化时重置内容，同 noteId 不重置，
    // 因此这里清空预览缓存后，预览 effect 不会执行（prePreviewContentRef 已为 null 时退出分支不动作），
    // 需要手动让编辑器同步最新 note.content
    prePreviewContentRef.current = null
    prePreviewTitleRef.current = null
    onExitPreview?.()
  }

  if (!note) {
    return <EditorEmptyState onBack={onBack} />
  }

  if (mode === 'immersive') {
    return (
      <main className="relative h-screen w-full overflow-y-auto bg-surface-container-lowest px-6 pb-48 pt-24 md:px-margin-page md:pt-32">
        <button
          type="button"
          onClick={() => setMode('default')}
          className="fixed right-8 top-8 z-50 flex size-12 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest/50 text-on-surface-variant backdrop-blur-sm transition-all hover:bg-surface-container hover:text-primary hover:shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </button>
        <article className="mx-auto w-full max-w-[760px]">
          <NoteTitleEditor
            noteId={note.id}
            title={note.title}
            onChange={handleTitleChange}
            className="mb-3 border-none focus-within:border-transparent"
          />
          <EditorMetaBar note={{ ...note, title: titleDraft }} folderName={folderName} compact saveState={saveState} className="mb-4" />
          <RichEditor
            editor={editor}
            editorClassName="tiptap-content min-h-[560px] w-full border-none bg-transparent font-body-lg text-body-lg leading-relaxed text-on-surface outline-none focus:ring-0"
          />
        </article>
        <ImmersiveToolbar editor={editor} saveState={saveState} />
      </main>
    )
  }

  return (
    <div className="flex h-screen flex-1 flex-col bg-surface-container-lowest">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-gutter">
        <div className="flex min-w-0 items-center">
          <button type="button" onClick={onBack} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary" aria-label="返回">
            <ArrowLeft className="size-5" />
          </button>
        </div>
        <div className="hidden max-w-md flex-1 px-stack-lg lg:block">
          <NoteSearchInput onSubmit={onSubmitSearch} />
        </div>
        <div className="relative ml-auto flex items-center gap-2">
          <button type="button" onClick={() => onToggleFavorite(note.id)} className={`rounded-full p-2 transition-colors hover:bg-surface-container-high hover:text-primary ${note.isFavorite ? 'text-primary' : 'text-on-surface-variant'}`}><Star className="size-5" fill={note.isFavorite ? 'currentColor' : 'none'} /></button>
          <button type="button" onClick={() => setShowShare(true)} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"><Share2 className="size-5" /></button>
          <button type="button" onClick={() => setMode('immersive')} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"><Expand className="size-5" /></button>
          <button type="button" onClick={() => setShowMenu((value) => !value)} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"><MoreHorizontal className="size-5" /></button>
          {showMenu ? (
            <EditorActionMenu
              hasCover={Boolean(note.cover)}
              isPinned={Boolean(note.pinned)}
              onShowInfo={() => { setMode('info'); setShowMenu(false) }}
              onShowHistory={() => { setMode('history'); setShowMenu(false) }}
              onShowExport={() => { setShowExport(true); setShowMenu(false) }}
              onSetCover={() => {
                setShowMenu(false)
                setCoverDialogOpen(true)
              }}
              onRemoveCover={() => {
                setShowMenu(false)
                setRemoveCoverOpen(true)
              }}
              onTogglePinned={() => {
                setShowMenu(false)
                onTogglePinned(note.id)
              }}
              onMoveToFolder={() => {
                setShowMenu(false)
                onRequestMoveToFolder?.(note.id)
              }}
              onMoveToTrash={() => onMoveToTrash(note.id)}
            />
          ) : null}
        </div>
      </header>

      {isReadOnly ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-tertiary-container/30 bg-tertiary-container/15 px-gutter py-2">
          <Lock className="size-4 text-on-surface-variant" />
          <span className="font-label-md text-label-md text-on-surface-variant">此笔记已锁定为只读模式</span>
          <button
            type="button"
            onClick={() => onToggleReadOnly(note.id)}
            className="ml-auto rounded-full bg-primary px-3 py-1 font-label-sm text-label-sm text-on-primary transition-colors hover:bg-primary-container"
          >
            解锁
          </button>
        </div>
      ) : null}

      <EditorToolbar editor={editor} readOnly={isReadOnly || Boolean(previewingSnapshotId)} className="z-10 shrink-0 shadow-sm" />

      {previewingSnapshotId ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-tertiary-container/30 bg-tertiary-container/15 px-gutter py-2">
          <Eye className="size-4 text-primary" />
          <span className="font-label-md text-label-md text-primary">正在预览历史版本（只读）</span>
          <button
            type="button"
            onClick={handleExitPreview}
            className="ml-auto rounded-full bg-primary px-3 py-1 font-label-sm text-label-sm text-on-primary transition-colors hover:bg-primary-container"
          >
            退出预览
          </button>
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <article className="flex-1 overflow-y-auto bg-surface-container-lowest px-margin-page pb-20 pt-6">
          <div className="mx-auto w-full max-w-3xl">
            {note.cover ? (
              <button
                type="button"
                onClick={() => setCoverDialogOpen(true)}
                className="mb-4 block w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low transition-shadow duration-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                title="点击更换封面"
              >
                <img src={note.cover} alt="笔记封面" className="h-40 w-full object-cover" />
              </button>
            ) : null}
            <NoteTitleEditor noteId={note.id} title={note.title} onChange={isReadOnly ? () => {} : handleTitleChange} readOnly={isReadOnly} />
            <NoteEditorTags
              className="mb-3"
              tags={note.tags}
              availableTags={availableTags}
              onChange={(nextTags) => updateNote({ tags: nextTags })}
              readOnly={isReadOnly}
              trailing={
                <EditorMetaBar
                  note={{ ...note, title: titleDraft }}
                  folderName={folderName}
                  compact
                  saveState={saveState}
                />
              }
            />
            <RichEditor editor={editor} />
          </div>
        </article>
        {mode === 'info' ? (
          <EditorInfoPanel
            note={{ ...note, title: titleDraft }}
            availableTags={availableTags}
            onChangeTags={(nextTags) => updateNote({ tags: nextTags })}
            onToggleReadOnly={() => onToggleReadOnly(note.id)}
            onTogglePinned={() => onTogglePinned(note.id)}
            onClose={() => setMode('default')}
          />
        ) : null}
        {mode === 'history' ? (
          <EditorHistoryPanel
            snapshots={snapshots}
            previewingSnapshotId={previewingSnapshotId}
            onPreview={handlePreviewSnapshot}
            onRestore={(snapshotId) => void handleRestoreSnapshot(snapshotId)}
            onExitPreview={handleExitPreview}
            onClose={() => setMode('default')}
          />
        ) : null}
      </main>
      {coverDialogOpen ? (
        <CoverDialog
          mode={note.cover ? 'change' : 'set'}
          initialUrl={note.cover}
          onClose={() => setCoverDialogOpen(false)}
          onSubmit={(url) => {
            updateNote({ cover: url })
            setCoverDialogOpen(false)
          }}
        />
      ) : null}
      {removeCoverOpen ? (
        <ConfirmDialog
          isDestructive
          confirmLabel="移除封面"
          description={
            <>
              将移除「{titleDraft || '未命名笔记'}」的封面图。
              <span className="mt-1 block">此操作不会删除笔记本身，可随时重新设置封面。</span>
            </>
          }
          onClose={() => setRemoveCoverOpen(false)}
          onConfirm={() => {
            updateNote({ cover: null })
            setRemoveCoverOpen(false)
          }}
        />
      ) : null}
      {showShare ? <EditorShareDialog note={note} editor={editor} onClose={() => setShowShare(false)} /> : null}
      {showExport && note ? <EditorExportOverlay note={note} editor={editor} onClose={() => setShowExport(false)} /> : null}
    </div>
  )
}

type ShareAction = 'text' | 'link'
type ShareFeedback = { action: ShareAction; state: 'success' | 'error' } | null

function EditorShareDialog({ note, editor, onClose }: { note: Note; editor: Editor | null; onClose: () => void }) {
  const [feedback, setFeedback] = useState<ShareFeedback>(null)
  const feedbackTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(feedbackTimerRef.current)
  }, [])

  function showFeedback(action: ShareAction, state: 'success' | 'error') {
    window.clearTimeout(feedbackTimerRef.current)
    setFeedback({ action, state })
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 1800)
  }

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (!copied) {
      throw new Error('copy failed')
    }
  }

  async function handleCopyPlainText() {
    const title = note.title.trim() || '无标题'
    const tags = note.tags.length ? `标签：${note.tags.map((tag) => tag.name).join('、')}` : ''
    const body = editor?.getText().trim() || ''
    const value = [title, tags, body].filter(Boolean).join('\n\n')
    try {
      await copyText(value)
      showFeedback('text', 'success')
    } catch {
      showFeedback('text', 'error')
    }
  }

  async function handleCopyLocalLink() {
    const url = new URL(window.location.href)
    url.searchParams.set('note', note.id)
    try {
      await copyText(url.toString())
      showFeedback('link', 'success')
    } catch {
      showFeedback('link', 'error')
    }
  }

  function getButtonLabel(action: ShareAction, defaultLabel: string) {
    if (feedback?.action !== action) {
      return defaultLabel
    }
    return feedback.state === 'success' ? '已复制' : '复制失败'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/20 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-modal">
        <div className="flex items-start justify-between border-b border-outline-variant/50 px-6 py-5">
          <div>
            <h2 id="share-dialog-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface">分享笔记</h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">复制笔记内容，或生成仅限当前浏览器使用的本地链接。</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface" aria-label="关闭分享面板">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="flex items-center gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-container/50 text-primary">
              <ClipboardCopy className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-label-md text-label-md font-semibold text-on-surface">复制纯文本</div>
              <p className="mt-1 text-[12px] leading-relaxed text-on-surface-variant">包含标题、标签和正文，不包含更新时间。</p>
            </div>
            <button type="button" onClick={() => void handleCopyPlainText()} className={`shrink-0 rounded-full px-4 py-2 font-label-sm text-label-sm font-medium transition-colors ${feedback?.action === 'text' && feedback.state === 'success' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary text-on-primary hover:bg-primary-container'}`}>
              {getButtonLabel('text', '复制')}
            </button>
          </div>

          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-primary">
                <Link2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-label-md text-label-md font-semibold text-on-surface">复制本地笔记链接</div>
                <p className="mt-1 text-[12px] leading-relaxed text-on-surface-variant">重新打开链接时自动定位到当前笔记。</p>
              </div>
              <button type="button" onClick={() => void handleCopyLocalLink()} className={`shrink-0 rounded-full px-4 py-2 font-label-sm text-label-sm font-medium transition-colors ${feedback?.action === 'link' && feedback.state === 'success' ? 'bg-tertiary-container text-on-tertiary-container' : 'border border-primary/30 text-primary hover:bg-secondary-container'}`}>
                {getButtonLabel('link', '复制链接')}
              </button>
            </div>
            <div className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-[11px] leading-relaxed text-on-surface-variant">
              此链接仅用于当前浏览器的本地定位，不支持跨设备或他人公开访问。
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/50 p-4 opacity-70" aria-disabled="true">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
              <Globe2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-on-surface-variant">
                公开链接
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-medium">暂未开放</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-on-surface-variant">需要后端存储、公开页面与权限服务后开放。</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-outline-variant/50 bg-surface-bright px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-full border border-outline-variant px-5 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
