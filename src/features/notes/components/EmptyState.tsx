import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateVariant = 'firstRun' | 'notes' | 'favorites' | 'trash' | 'folders' | 'search' | 'filter'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  variant?: EmptyStateVariant
  compact?: boolean
  children?: ReactNode
}

const variantStyles: Record<EmptyStateVariant, { icon: string; glow: string }> = {
  firstRun: { icon: 'text-primary', glow: 'bg-primary-container/50' },
  notes: { icon: 'text-primary', glow: 'bg-primary-container/35' },
  favorites: { icon: 'text-tertiary', glow: 'bg-tertiary-container/30' },
  trash: { icon: 'text-outline', glow: 'bg-surface-container-high' },
  folders: { icon: 'text-secondary', glow: 'bg-secondary-container/35' },
  search: { icon: 'text-on-surface-variant', glow: 'bg-surface-container-high' },
  filter: { icon: 'text-on-surface-variant', glow: 'bg-surface-container-high' },
}

export function EmptyState({ icon: Icon, title, description, primaryAction, secondaryAction, variant = 'notes', compact = false, children }: EmptyStateProps) {
  const styles = variantStyles[variant]
  const hasChildren = Boolean(children)

  return (
    <div
      role="status"
      className={`flex w-full items-center justify-center ${compact ? 'py-8' : 'min-h-[420px] py-10'}`}
    >
      <div
        className={`w-full rounded-[2rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card ${
          hasChildren ? 'max-w-4xl p-8 md:p-10' : compact ? 'max-w-lg p-6 md:p-8' : 'max-w-lg p-8 md:p-10'
        }`}
      >
        <div className={`mx-auto flex flex-col items-center text-center ${hasChildren ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className={`relative mb-6 flex ${compact ? 'size-24' : 'size-32'} items-center justify-center`}>
            <div className={`absolute inset-0 rounded-full ${styles.glow} blur-2xl`} aria-hidden="true" />
            <div className="relative flex size-20 items-center justify-center rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-card">
              <Icon className={`${compact ? 'size-8' : 'size-10'} ${styles.icon}`} strokeWidth={1.7} aria-hidden="true" />
            </div>
          </div>

          <h3 className={`mb-3 text-on-surface ${compact ? 'font-headline-sm text-headline-sm' : 'font-headline-md text-headline-md'}`}>
            {title}
          </h3>
          <p className="max-w-md font-body-md text-body-md leading-relaxed text-on-surface-variant">{description}</p>

          {primaryAction || secondaryAction ? (
            <div className={`flex flex-wrap items-center justify-center gap-3 ${compact ? 'mt-6' : 'mt-8'}`}>
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container hover:text-on-primary-container"
                >
                  {primaryAction.label}
                </button>
              ) : null}
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="rounded-full border border-outline-variant bg-surface-container-lowest px-6 py-3 font-label-md text-label-md text-primary transition-colors hover:border-primary hover:bg-surface-container-low"
                >
                  {secondaryAction.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {children ? <div className={`${primaryAction || secondaryAction ? 'mt-10' : 'mt-6'} w-full`}>{children}</div> : null}
      </div>
    </div>
  )
}
