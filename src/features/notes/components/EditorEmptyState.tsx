import { FilePlus2 } from 'lucide-react'

interface EditorEmptyStateProps {
  onBack: () => void
}

export function EditorEmptyState({ onBack }: EditorEmptyStateProps) {
  return (
    <main className="flex h-screen flex-1 items-center justify-center bg-surface-container-lowest p-margin-page">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 flex size-32 items-center justify-center rounded-full bg-surface-container-low shadow-inner">
          <FilePlus2 className="size-16 text-primary/40" />
        </div>
        <h2 className="mb-4 font-headline-lg text-headline-lg text-on-surface">开始一篇新笔记</h2>
        <p className="mb-8 font-body-md text-body-md text-on-surface-variant">选择一篇笔记或创建新笔记后，就可以在这里专注编辑内容。</p>
        <button type="button" onClick={onBack} className="rounded-full border border-outline-variant bg-surface px-8 py-3 font-label-md text-label-md text-primary transition-colors hover:border-primary hover:bg-surface-container-low">
          返回笔记列表
        </button>
      </div>
    </main>
  )
}
