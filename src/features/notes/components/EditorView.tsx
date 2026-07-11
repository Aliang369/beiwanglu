// 改动：编辑页接入 TipTap 富文本编辑器，工具栏绑定 editor 命令
import { ArrowLeft, Expand, Image, Link, MoreHorizontal, Search, Share2, ShieldCheck, Star } from 'lucide-react'
import { useState } from 'react'
import type { Note } from '../../../shared/types/note'
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
import { RichEditor } from './RichEditor'
import { useNotesEditor } from '../hooks/useNotesEditor'

type EditorMode = 'default' | 'info' | 'history' | 'immersive'

interface EditorViewProps {
  note: Note | undefined
  onBack: () => void
  onChange: (patch: Partial<Pick<Note, 'title' | 'content' | 'cover'>>) => void
  onToggleFavorite: (noteId: string) => void
  onMoveToTrash: (noteId: string) => void
}

export function EditorView({ note, onBack, onChange, onToggleFavorite, onMoveToTrash }: EditorViewProps) {
  const [mode, setMode] = useState<EditorMode>('default')
  const [showMenu, setShowMenu] = useState(false)
  const [coverDialogOpen, setCoverDialogOpen] = useState(false)
  const [removeCoverOpen, setRemoveCoverOpen] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'editing'>('saved')

  // editor 必须在 note 空判断之前创建，保证 hooks 顺序稳定；note 为空时传 undefined
  const editor = useNotesEditor(note, (json) => updateNote({ content: json }))

  if (!note) {
    return <EditorEmptyState onBack={onBack} />
  }

  function updateNote(patch: Partial<Pick<Note, 'title' | 'content' | 'cover'>>) {
    setSaveState('editing')
    onChange(patch)
    window.setTimeout(() => setSaveState('saved'), 500)
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
          <input
            value={note.title}
            onChange={(event) => updateNote({ title: event.target.value })}
            className="mb-6 w-full border-none bg-transparent p-0 font-headline-lg text-headline-lg text-on-surface outline-none placeholder:text-outline-variant/60 focus:ring-0"
            placeholder="无标题笔记..."
          />
          <EditorMetaBar note={note} className="mb-8" />
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
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-gutter">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onBack} className="mr-2 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary"><ArrowLeft className="size-5" /></button>
          <span className="font-headline-md text-headline-md font-bold text-primary">灵感笔记</span>
          <span className="mx-2 text-outline-variant">/</span>
          <span className="max-w-[240px] truncate font-label-md text-label-md text-on-surface-variant">{note.title || '未命名笔记'}</span>
        </div>
        <div className="hidden max-w-md flex-1 px-stack-lg lg:block"><div className="relative rounded-full bg-surface-container-low focus-within:ring-2 focus-within:ring-primary"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" /><input className="h-10 w-full rounded-full border-none bg-transparent pl-10 pr-4 font-body-md text-body-md outline-none placeholder:text-on-surface-variant/60" placeholder="搜索笔记..." /></div></div>
        <div className="relative ml-auto flex items-center gap-2">
          <button type="button" onClick={() => onToggleFavorite(note.id)} className={`rounded-full p-2 transition-colors hover:bg-surface-container-high hover:text-primary ${note.isFavorite ? 'text-primary' : 'text-on-surface-variant'}`}><Star className="size-5" fill={note.isFavorite ? 'currentColor' : 'none'} /></button>
          <button type="button" onClick={() => setShowShare(true)} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"><Share2 className="size-5" /></button>
          <button type="button" onClick={() => setMode('immersive')} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"><Expand className="size-5" /></button>
          <button type="button" onClick={() => setShowMenu((value) => !value)} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"><MoreHorizontal className="size-5" /></button>
          {showMenu ? (
            <EditorActionMenu
              hasCover={Boolean(note.cover)}
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
              onMoveToTrash={() => onMoveToTrash(note.id)}
            />
          ) : null}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <article className="flex-1 overflow-y-auto bg-surface-container-lowest px-margin-page pb-20 pt-12">
          <div className="mx-auto flex w-full max-w-container-max-width flex-col">
            <div className="mb-8 flex items-center justify-between text-on-surface-variant">
              <EditorMetaBar note={note} />
              <div className="shrink-0 font-label-sm text-label-sm">{saveState === 'editing' ? '自动保存中...' : '已保存'}</div>
            </div>
            <EditorToolbar editor={editor} />
            <div className="mx-auto w-full max-w-3xl flex-1">
              {note.cover ? (
                <button
                  type="button"
                  onClick={() => setCoverDialogOpen(true)}
                  className="mb-6 block w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low transition-shadow duration-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  title="点击更换封面"
                >
                  <img src={note.cover} alt="笔记封面" className="h-40 w-full object-cover" />
                </button>
              ) : null}
              <input
                value={note.title}
                onChange={(event) => updateNote({ title: event.target.value })}
                className="mb-6 w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-2 font-headline-lg text-headline-lg text-on-surface transition-colors placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-0"
                placeholder="笔记标题"
              />
              <div className="mb-8 flex flex-wrap gap-2">
                {note.tags.map((tag) => <span key={tag.id} className="rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant"># {tag.name}</span>)}
                <button className="rounded-full border border-dashed border-outline-variant bg-surface-container-low px-3 py-1 font-label-sm text-label-sm text-outline-variant hover:border-primary hover:text-primary">添加标签</button>
              </div>
              <RichEditor editor={editor} />
            </div>
          </div>
        </article>
        {mode === 'info' ? <EditorInfoPanel note={note} onClose={() => setMode('default')} /> : null}
        {mode === 'history' ? <EditorHistoryPanel onClose={() => setMode('default')} /> : null}
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
              将移除「{note.title || '未命名笔记'}」的封面图。
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
      {showShare ? <EditorSharePlaceholder onClose={() => setShowShare(false)} /> : null}
      {showExport ? <EditorExportOverlay onClose={() => setShowExport(false)} /> : null}
    </div>
  )
}

function EditorSharePlaceholder({ onClose }: { onClose: () => void }) {
  const sharePlans = [
    { title: '分享链接', description: '为当前笔记生成可访问链接', icon: Link },
    { title: '访问权限', description: '设置仅自己、指定成员或公开访问', icon: ShieldCheck },
    { title: '复制链接', description: '一键复制分享地址到剪贴板', icon: Share2 },
    { title: '公开预览', description: '查看访客打开后的阅读页面', icon: Image },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-modal">
        <div className="border-b border-outline-variant/50 px-6 py-5">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">分享功能开发中</h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">后续将支持更完整的笔记分享能力。</p>
          </div>
        </div>
        <div className="space-y-3 px-6 py-5">
          {sharePlans.map(({ title, description, icon: Icon }) => (
            <div key={title} className="flex items-center rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3">
              <div className="mr-4 flex size-10 items-center justify-center rounded bg-primary-container/40 text-primary"><Icon className="size-5" /></div>
              <div>
                <div className="font-label-md text-label-md font-semibold text-on-surface">{title}</div>
                <div className="mt-0.5 text-[12px] text-on-surface-variant">{description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-outline-variant/50 bg-surface-bright p-6">
          <button type="button" onClick={onClose} className="w-full rounded-full bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary shadow-sm hover:bg-primary-container">
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}
