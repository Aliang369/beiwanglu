import { FolderOpen, Lightbulb, PenLine, Star } from 'lucide-react'
import { EmptyState } from './EmptyState'

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
    <EmptyState
      icon={PenLine}
      title="开始记录你的第一条灵感"
      description="把想法、任务和资料整理到一个安静的空间里。"
      variant="firstRun"
      primaryAction={{ label: '新建第一篇笔记', onClick: onCreateNote }}
      secondaryAction={onOpenHelp ? { label: '查看帮助', onClick: onOpenHelp } : undefined}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {guideItems.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 text-left">
            <Icon className="mb-4 size-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <h4 className="mb-2 font-label-md text-label-md text-on-surface">{title}</h4>
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{description}</p>
          </div>
        ))}
      </div>
    </EmptyState>
  )
}
