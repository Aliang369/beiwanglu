import { FolderOpen, Lightbulb, PenLine, Star } from 'lucide-react'

interface FirstRunGuideProps {
  onCreateNote: () => void
  onOpenHelp?: () => void
}

const guideItems = [
  { icon: Lightbulb, title: '快速记录灵感', description: '把想法、任务和资料先保存下来。' },
  { icon: FolderOpen, title: '用文件夹整理', description: '按主题归类，后续查找更轻松。' },
  { icon: Star, title: '收藏重要笔记', description: '把高频内容固定在收藏夹里。' },
]

export function FirstRunGuide({ onCreateNote, onOpenHelp }: FirstRunGuideProps) {
  return (
    <div className="flex min-h-[520px] items-center justify-center py-10">
      <div className="w-full max-w-4xl rounded-[2rem] border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-card md:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary-container/50 text-primary shadow-sm">
            <PenLine className="size-10" strokeWidth={1.7} />
          </div>
          <h2 className="mb-3 font-headline-lg text-headline-lg text-on-surface">开始记录你的第一条灵感</h2>
          <p className="mx-auto max-w-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">把想法、任务和资料整理到一个安静的空间里。</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCreateNote}
              className="rounded-full bg-primary px-7 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              新建第一篇笔记
            </button>
            {onOpenHelp ? (
              <button
                type="button"
                onClick={onOpenHelp}
                className="rounded-full border border-outline-variant bg-surface px-7 py-3 font-label-md text-label-md text-primary transition-colors hover:border-primary hover:bg-surface-container-low"
              >
                查看帮助
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {guideItems.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
              <Icon className="mb-4 size-6 text-primary" strokeWidth={1.8} />
              <h3 className="mb-2 font-label-md text-label-md text-on-surface">{title}</h3>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
