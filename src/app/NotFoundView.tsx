type NotFoundViewProps = {
  onGoHome: () => void
}

export function NotFoundView({ onGoHome }: NotFoundViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-lowest px-6 text-on-surface">
      <section className="w-full max-w-md rounded-3xl border border-outline-variant/30 bg-surface p-8 text-center shadow-modal">
        <p className="font-label-md text-label-md text-primary">404</p>
        <h1 className="mt-3 font-display-sm text-display-sm">页面不存在</h1>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          你访问的页面不存在，可能是地址输入有误。
        </p>
        <button
          type="button"
          onClick={onGoHome}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90 active:scale-95"
        >
          返回首页
        </button>
      </section>
    </main>
  )
}
