import { ArrowRight, BookOpen, ChevronRight, HelpCircle, Palette, RefreshCw, Rocket, Search } from 'lucide-react'
import { useState } from 'react'

const categories = [
  { title: '快速入门', description: '从零开始了解如何创建、组织和管理您的第一篇灵感笔记。', icon: Rocket },
  { title: '功能指南', description: '深入探索高级排版、标签管理、文件夹嵌套等核心功能。', icon: BookOpen },
  { title: '常见问题', description: '查看其他用户常问的问题，快速找到账号、同步和隐私相关的解答。', icon: HelpCircle },
  { title: '同步与备份', description: '确保您的数据安全，了解如何在多设备间保持笔记一致。', icon: RefreshCw },
  { title: '外观与个性化', description: '自定义您的界面风格，设置深色模式和字体排版偏好。', icon: Palette },
]

const articles = [
  { id: 'restore-deleted-notes', title: '如何恢复误删的笔记？' },
  { id: 'keyboard-shortcuts', title: '支持哪些快捷键操作？' },
  { id: 'export-data', title: '如何导出我的所有数据？' },
  { id: 'offline-mode', title: '离线模式下如何使用？' },
]

export function HelpView() {
  const [query, setQuery] = useState('')
  const filteredArticles = articles.filter((article) => article.title.includes(query) || !query.trim())

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-lowest">
      <div className="mx-auto w-full max-w-container-max-width p-margin-page">
        <section className="mb-stack-lg text-center">
          <h1 className="mb-stack-sm font-headline-lg text-headline-lg text-on-background">需要帮助吗？</h1>
          <p className="mx-auto mb-stack-md max-w-2xl font-body-lg text-body-lg text-on-surface-variant">在灵感笔记帮助中心寻找答案、指南和技巧，让您的记录体验更加流畅。</p>
          <div className="mx-auto flex max-w-xl items-center rounded-full border border-outline-variant bg-surface p-2 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary">
            <Search className="ml-3 size-5 text-on-surface-variant" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 border-none bg-transparent px-4 py-3 font-body-md text-body-md outline-none" placeholder="输入您的问题或关键词，例如 '如何同步笔记'..." />
            <button type="button" className="rounded-full bg-primary-container px-6 py-2 font-label-md text-label-md text-on-primary-container transition-colors hover:bg-surface-container-high hover:shadow-sm">搜索</button>
          </div>
        </section>

        <section className="mb-stack-lg grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <article key={category.title} className="group rounded-xl border border-outline-variant bg-surface p-6 transition-all duration-300 hover:shadow-card">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-surface-container-low text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container"><Icon className="size-7" /></div>
                <h3 className="mb-2 font-headline-sm text-headline-sm text-on-background">{category.title}</h3>
                <p className="mb-4 font-body-md text-body-md text-on-surface-variant">{category.description}</p>
                <span className="flex items-center font-label-md text-label-md text-primary">了解更多 <ArrowRight className="ml-1 size-4" /></span>
              </article>
            )
          })}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface p-6">
          <h2 className="mb-4 font-headline-md text-headline-md text-on-background">热门帮助文章</h2>
          <ul className="divide-y divide-outline-variant">
            {filteredArticles.map((article) => (
              <li key={article.id} className="py-3">
                <button type="button" className="group flex w-full items-center justify-between text-left">
                  <span className="font-body-md text-body-md text-on-surface transition-colors group-hover:text-primary">{article.title}</span>
                  <ChevronRight className="size-4 text-on-surface-variant transition-colors group-hover:text-primary" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
