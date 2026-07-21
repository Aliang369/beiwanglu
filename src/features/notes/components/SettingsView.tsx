import {
  Camera,
  Cloud,
  Lock,
  Shield,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { userApi } from '../../../shared/api/modules/userApi'
import { uploadsApi } from '../../../shared/api/modules/uploadsApi'
import { isMockApiMode } from '../../../shared/api/config'
import { isApiError } from '../../../shared/api/types'
import { useAuthStore } from '../../../shared/store/authStore'
import { useSyncStore } from '../../../shared/store/syncStore'
import { getLocalBackendKind } from '../../../shared/data/localBackend'
import { getActiveNotesRepository } from '../../../shared/data/localBackend'
import { importNoteFiles } from '../../../shared/desktop/noteImport'
import { exportActiveNotesJsonBackup } from '../../../shared/desktop/noteExportBackup'
import { getSqliteBackendKind } from '../../../shared/data/sqlite/database'
import { isTauriRuntime } from '../../../shared/desktop/tauriBridge'
import type { User as AuthUser } from '../../../shared/types/auth'

export type SettingsTab = 'profile' | 'security' | 'sync'

interface SettingsViewProps {
  initialTab?: SettingsTab
}

const tabs = [
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'security', label: '账户安全', icon: Shield },
  { id: 'sync', label: '数据同步', icon: Cloud },
] satisfies Array<{ id: SettingsTab; label: string; icon: typeof User }>

function SettingsCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-surface-bright p-6 shadow-sm md:p-8 ${className ?? 'border-outline-variant/40'}`}>
      {children}
    </section>
  )
}

function SectionTitle({ icon: Icon, tone = 'primary', children }: { icon?: typeof User; tone?: 'primary' | 'secondary' | 'tertiary'; children: ReactNode }) {
  const toneClass =
    tone === 'secondary'
      ? 'bg-secondary-container text-on-secondary-container'
      : tone === 'tertiary'
        ? 'bg-tertiary-fixed text-tertiary'
        : 'bg-primary-container/10 text-primary'

  return (
    <div className="mb-6 flex items-center gap-3">
      {Icon ? (
        <div className={`flex size-9 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="size-5" />
        </div>
      ) : null}
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{children}</h3>
    </div>
  )
}

export function SettingsView({ initialTab = 'profile' }: SettingsViewProps) {
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  if (!user) {
    return null
  }

  return (
    <main className="relative mx-auto w-full flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-start gap-8 lg:flex-row lg:gap-10">
        <aside className="w-full shrink-0 rounded-2xl border border-outline-variant/40 bg-surface-bright p-3 shadow-sm lg:sticky lg:top-0 lg:w-[264px]">
          <h2 className="mb-3 px-3 pt-2 pb-3 font-headline-sm text-headline-sm text-on-surface">设置</h2>
          <nav className="flex flex-col gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-label-md text-label-md transition-colors ${
                    isActive ? 'bg-secondary-container font-medium text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 pb-16">
          {activeTab === 'profile' ? <ProfileSettings user={user} /> : null}
          {activeTab === 'security' ? <SecuritySettings /> : null}
          {activeTab === 'sync' ? <SyncSettings /> : null}
        </div>
      </div>
    </main>
  )
}

function ProfileSettings({ user }: { user: AuthUser }) {
  const setUser = useAuthStore((state) => state.setUser)
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [errors, setErrors] = useState<{ name?: string; avatar?: string; save?: string }>({})
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(user.name)
    setBio(user.bio)
    setAvatarUrl(user.avatarUrl)
  }, [user])

  async function processAvatarFile(file: File) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors((current) => ({ ...current, avatar: '请选择 JPG 或 PNG 图片' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, avatar: '头像文件不能超过 5MB' }))
      return
    }

    try {
      // real 模式：上传到后端，拿 URL 后存
      // mock 模式：本地压缩为 dataURL（保留原行为）
      let finalUrl: string
      if (isMockApiMode()) {
        finalUrl = await compressImageToDataUrl(file)
      } else {
        const relativeUrl = await uploadsApi.uploadImage(file)
        finalUrl = uploadsApi.resolveUrl(relativeUrl)
      }
      setAvatarUrl(finalUrl)
      setErrors((current) => ({ ...current, avatar: undefined }))
      setStatus(null)
    } catch (err) {
      const msg = isApiError(err) ? err.message : '无法处理该图片，请重试'
      setErrors((current) => ({ ...current, avatar: msg }))
    }
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    void processAvatarFile(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: { name?: string } = {}
    const nextName = name.trim()
    const nextBio = bio.trim()

    if (!nextName) {
      nextErrors.name = '请输入昵称'
    } else if (nextName.length > 32) {
      nextErrors.name = '昵称不能超过 32 个字符'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({ ...current, ...nextErrors, save: undefined }))
      setStatus(null)
      return
    }

    setIsSaving(true)
    setStatus(null)
    setErrors((current) => ({ ...current, save: undefined }))
    try {
      const profile = await userApi.updateProfile({
        name: nextName,
        bio: nextBio,
        avatarUrl,
      })
      setUser({
        ...user,
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        updatedAt: profile.updatedAt,
      })
      setName(profile.name)
      setBio(profile.bio)
      setAvatarUrl(profile.avatarUrl)
      setErrors({})
      setStatus('资料已保存')
    } catch (error) {
      setStatus(null)
      setErrors((current) => ({
        ...current,
        save: isApiError(error) ? error.message : '保存失败，请稍后重试',
      }))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="space-y-6">
        <SettingsCard>
          <SectionTitle icon={User}>基本信息</SectionTitle>

          <div className="flex flex-col gap-stack-lg">
            <div className="flex items-center gap-stack-md">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-describedby={errors.avatar ? 'avatar-error' : 'avatar-help'}
                className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface-container-high bg-primary-container text-on-primary"
                aria-label="更改头像"
              >
                {avatarUrl ? <img src={avatarUrl} alt="当前头像" className="size-full object-cover" /> : <User className="size-8" />}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="size-5 text-white" />
                </span>
              </button>
              <div className="flex flex-col gap-2">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-outline-variant/30 bg-surface-container px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-high"
                >
                  更改头像
                </button>
                <span className="font-label-sm text-label-sm text-outline">支持 JPG、PNG，最大 5MB</span>
                {errors.avatar ? <span className="font-label-sm text-label-sm text-error">{errors.avatar}</span> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="font-label-md text-label-md text-on-surface">昵称</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setErrors((current) => ({ ...current, name: undefined }))
                    setStatus(null)
                  }}
                  className={`border-0 border-b bg-transparent px-0 py-2 font-body-md text-body-md transition-colors focus:outline-none ${errors.name ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                  autoComplete="nickname"
                />
                {errors.name ? <span className="font-label-sm text-label-sm text-error">{errors.name}</span> : null}
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="font-label-md text-label-md text-on-surface">个人简介</span>
                <textarea
                  value={bio}
                  onChange={(event) => {
                    setBio(event.target.value)
                    setStatus(null)
                  }}
                  className="resize-none border-0 border-b border-outline-variant bg-transparent px-0 py-2 font-body-md text-body-md transition-colors focus:border-primary focus:outline-none"
                  placeholder="写点什么来介绍自己..."
                  maxLength={200}
                  rows={3}
                />
                <span className="text-right font-label-sm text-label-sm text-outline">{bio.length}/200</span>
              </label>
            </div>
          </div>
        </SettingsCard>

        <div className="flex items-center justify-end gap-4">
          {status ? <p className="font-label-md text-label-md text-primary" role="status">{status}</p> : null}
          {errors.save ? <p className="font-label-md text-label-md text-error" role="alert">{errors.save}</p> : null}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-primary px-8 py-2.5 font-label-md text-label-md font-medium text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:cursor-wait disabled:opacity-80"
          >
            {isSaving ? '保存中...' : '保存更改'}
          </button>
        </div>
      </div>
    </form>
  )
}

function getPasswordStrength(password: string) {
  if (!password) {
    return { label: '未输入', className: 'text-on-surface-variant' }
  }

  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) {
    return { label: '弱', className: 'text-error' }
  }
  if (score === 2) {
    return { label: '中', className: 'text-tertiary' }
  }
  return { label: '强', className: 'text-primary' }
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string; form?: string }>({})
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const passwordStrength = getPasswordStrength(newPassword)
  const canSubmitPassword =
    Boolean(currentPassword) &&
    newPassword.length >= 6 &&
    newPassword !== currentPassword &&
    confirmPassword === newPassword &&
    !isSubmitting

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: typeof errors = {}

    if (!currentPassword) {
      nextErrors.currentPassword = '请输入当前密码'
    }

    if (!newPassword) {
      nextErrors.newPassword = '请输入新密码'
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = '新密码至少需要 6 位'
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = '新密码不能与当前密码相同'
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = '请再次输入新密码'
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = '两次输入的新密码不一致'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus(null)
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setStatus(null)
    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus('密码已更新')
    } catch (error) {
      setErrors({
        form: isApiError(error) ? error.message : '修改密码失败，请稍后重试',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function updatePasswordField(field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) {
    if (field === 'currentPassword') setCurrentPassword(value)
    if (field === 'newPassword') setNewPassword(value)
    if (field === 'confirmPassword') setConfirmPassword(value)
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
    setStatus(null)
  }

  return (
    <div>
      <div className="space-y-6">
        <SettingsCard>
          <SectionTitle icon={Lock}>修改密码</SectionTitle>
          <form onSubmit={(event) => void handlePasswordSubmit(event)} noValidate>
            <div className="grid grid-cols-1 gap-6">
              <label>
                <span className="mb-1 ml-1 block font-label-sm text-label-sm text-on-surface-variant">当前密码</span>
                <input
                  value={currentPassword}
                  onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                  className={`w-full border-0 border-b bg-transparent px-1 py-2 font-body-md text-body-md focus:outline-none ${errors.currentPassword ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                  placeholder="输入当前密码"
                  type="password"
                  autoComplete="current-password"
                />
                {errors.currentPassword ? <span className="mt-1 block font-label-sm text-label-sm text-error">{errors.currentPassword}</span> : null}
              </label>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label>
                  <span className="mb-1 ml-1 block font-label-sm text-label-sm text-on-surface-variant">新密码</span>
                  <input
                    value={newPassword}
                    onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                    aria-invalid={Boolean(errors.newPassword)}
                    aria-describedby="new-password-feedback"
                    className={`w-full border-0 border-b bg-transparent px-1 py-2 font-body-md text-body-md focus:outline-none ${errors.newPassword ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                    placeholder="至少 6 位"
                    type="password"
                    autoComplete="new-password"
                  />
                  <div className="mt-1 flex items-center justify-between gap-3">
                    {errors.newPassword ? <span className="font-label-sm text-label-sm text-error">{errors.newPassword}</span> : <span className="font-label-sm text-label-sm text-on-surface-variant">建议使用字母、数字和符号组合</span>}
                    <span className={`shrink-0 font-label-sm text-label-sm ${passwordStrength.className}`}>强度：{passwordStrength.label}</span>
                  </div>
                </label>
                <label>
                  <span className="mb-1 ml-1 block font-label-sm text-label-sm text-on-surface-variant">确认新密码</span>
                  <input
                    value={confirmPassword}
                    onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                    className={`w-full border-0 border-b bg-transparent px-1 py-2 font-body-md text-body-md focus:outline-none ${errors.confirmPassword ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                    placeholder="再次输入新密码"
                    type="password"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword ? <span className="mt-1 block font-label-sm text-label-sm text-error">{errors.confirmPassword}</span> : null}
                </label>
              </div>
            </div>
            <div className="mt-6 flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
              {status ? <p className="font-label-md text-label-md text-primary" role="status">{status}</p> : null}
              {errors.form ? <p className="font-label-md text-label-md text-error" role="alert">{errors.form}</p> : null}
              <button
                type="submit"
                disabled={!canSubmitPassword}
                className="rounded-full bg-primary px-8 py-2.5 font-label-md text-label-md font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '更新中...' : '更新密码'}
              </button>
            </div>
          </form>
        </SettingsCard>

      </div>
    </div>
  )
}

function SyncSettings() {
  const enabled = useSyncStore((state) => state.enabled)
  const status = useSyncStore((state) => state.status)
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt)
  const lastError = useSyncStore((state) => state.lastError)
  const setEnabled = useSyncStore((state) => state.setEnabled)
  const syncNow = useSyncStore((state) => state.syncNow)
  const queue = useSyncStore((state) => state.queue)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleEnable() {
    setEnabled(true)
    if (!isAuthenticated) return
    setBusy(true)
    try {
      await syncNow({ force: true, forceRetryFailed: true })
    } finally {
      setBusy(false)
    }
  }

  function handleDisableRequest() {
    setConfirmDisable(true)
  }

  function confirmDisableSync() {
    setEnabled(false)
    setConfirmDisable(false)
  }

  return (
    <div className="space-y-6">
      <SettingsCard>
        <SectionTitle icon={Cloud}>云端同步</SectionTitle>
        <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
          本地优先：笔记优先保存在本机 SQLite；若 SQLite 不可用会自动回退 localStorage。登录后默认同步到云端；关闭后仅使用本机数据。
        </p>
        {getLocalBackendKind() !== 'sqlite' ? (
          <p className="mb-4 rounded-xl bg-tertiary-fixed/40 px-4 py-3 font-label-md text-label-md text-on-surface">
            当前为 localStorage 回退模式：本机数据在浏览器本地，云端同步仍可用（LWW 合并）。
          </p>
        ) : (
          <p className="mb-4 rounded-xl bg-primary-container/20 px-4 py-3 font-label-md text-label-md text-on-surface">
            {`当前本机后端：SQLite（${getSqliteBackendKind() === 'native' ? '桌面原生' : 'sql.js'}）`}
          </p>
        )}
        <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label-md text-label-md font-medium text-on-surface">
              {enabled ? '同步已开启' : '同步已关闭'}
            </p>
            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              {!isAuthenticated
                ? '登录后才会与云端交换数据'
                : status === 'syncing'
                  ? '正在与云端同步…'
                  : lastSyncedAt
                    ? `最近同步：${new Date(lastSyncedAt).toLocaleString('zh-CN')}`
                    : '尚未完成同步'}
            </p>
            {queue && queue.total > 0 ? (
              <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                待同步 {queue.pending} 条
                {queue.failed > 0 ? `，失败 ${queue.failed} 条` : ''}
              </p>
            ) : null}
            {lastError ? (
              <p className="mt-1 font-label-sm text-label-sm text-error" role="alert">
                {lastError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {enabled ? (
              <>
                <button
                  type="button"
                  disabled={!isAuthenticated || busy || status === 'syncing'}
                  onClick={() => void syncNow({ force: true, forceRetryFailed: true })}
                  className="rounded-full border border-outline-variant/40 px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'syncing' || busy ? '同步中...' : '立即同步'}
                </button>
                <button
                  type="button"
                  onClick={handleDisableRequest}
                  className="rounded-full bg-surface-container px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  关闭同步
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleEnable()}
                disabled={busy}
                className="rounded-full bg-primary px-4 py-2 font-label-md text-label-md font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? '开启并合并中...' : '开启同步'}
              </button>
            )}
          </div>
        </div>
      </SettingsCard>

      
      <SettingsCard>
        <SectionTitle icon={Cloud}>数据导入 / 导出</SectionTitle>
        <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
          导入支持 Markdown（.md）或 JSON 备份；导出为全部未删除笔记的 JSON 备份（不含回收站），可再导入恢复。
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 font-label-md text-label-md font-medium text-on-primary"
            onClick={() => {
              void (async () => {
                try {
                  const n = await importNoteFiles(getActiveNotesRepository())
                  window.alert(n > 0 ? `已导入 ${n} 篇笔记` : '未选择文件')
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : '导入失败')
                }
              })()
            }}
          >
            选择文件导入
          </button>
          <button
            type="button"
            className="rounded-full border border-outline-variant/40 px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
            onClick={() => {
              void (async () => {
                try {
                  const n = await exportActiveNotesJsonBackup(getActiveNotesRepository())
                  window.alert(n > 0 ? `已导出 ${n} 篇笔记备份` : '没有可导出的笔记')
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : '导出失败')
                }
              })()
            }}
          >
            导出 JSON 备份
          </button>
        </div>
        {isTauriRuntime() ? (
          <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">当前运行于桌面壳，也可使用菜单「文件 → 导入笔记…」。</p>
        ) : null}
      </SettingsCard>

      {confirmDisable ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="disable-sync-title">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface-bright p-6 shadow-lg">
            <h3 id="disable-sync-title" className="font-headline-sm text-headline-sm text-on-surface">
              关闭同步？
            </h3>
            <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
              关闭后不会再与云端同步。本机数据仍可继续编辑，再次开启时将自动合并云端与本地（冲突后写覆盖）。
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDisable(false)}
                className="rounded-full px-4 py-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDisableSync}
                className="rounded-full bg-error px-4 py-2 font-label-md text-label-md font-medium text-on-error"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function compressImageToDataUrl(file: File, maxSize = 256) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('invalid-image'))
        return
      }

      const image = new Image()
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('canvas-unavailable'))
          return
        }
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.onerror = () => reject(new Error('image-load-failed'))
      image.src = reader.result
    }
    reader.onerror = () => reject(new Error('file-read-failed'))
    reader.readAsDataURL(file)
  })
}
