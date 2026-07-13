import {
  Camera,
  Laptop,
  Lock,
  Monitor,
  Shield,
  Smartphone,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import type { MockUserAccount } from '../../auth/LoginView'

export type SettingsTab = 'profile' | 'security'

interface SettingsViewProps {
  initialTab?: SettingsTab
  account: MockUserAccount
  onAccountChange: (account: MockUserAccount) => void
}

const tabs = [
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'security', label: '账户安全', icon: Shield },
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

export function SettingsView({ initialTab = 'profile', account, onAccountChange }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

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
          {activeTab === 'profile' ? <ProfileSettings account={account} onAccountChange={onAccountChange} /> : null}
          {activeTab === 'security' ? (
            <SecuritySettings />
          ) : null}
        </div>
      </div>
    </main>
  )
}

function ProfileSettings({ account, onAccountChange }: { account: MockUserAccount; onAccountChange: (account: MockUserAccount) => void }) {
  const [name, setName] = useState(account.name)
  const [email, setEmail] = useState(account.email)
  const [bio, setBio] = useState(account.bio)
  const [avatarUrl, setAvatarUrl] = useState(account.avatarUrl)
  const [errors, setErrors] = useState<{ name?: string; email?: string; avatar?: string; save?: string }>({})
  const [status, setStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(account.name)
    setEmail(account.email)
    setBio(account.bio)
    setAvatarUrl(account.avatarUrl)
  }, [account])

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
      const dataUrl = await compressImageToDataUrl(file)
      setAvatarUrl(dataUrl)
      setErrors((current) => ({ ...current, avatar: undefined }))
      setStatus(null)
    } catch {
      setErrors((current) => ({ ...current, avatar: '无法处理该图片，请重试' }))
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: { name?: string; email?: string } = {}
    const nextName = name.trim()
    const nextEmail = email.trim()
    const nextBio = bio.trim()

    if (!nextName) {
      nextErrors.name = '请输入昵称'
    } else if (nextName.length > 32) {
      nextErrors.name = '昵称不能超过 32 个字符'
    }

    if (!nextEmail) {
      nextErrors.email = '请输入邮箱地址'
    } else if (!/^\S+@\S+\.\S+$/.test(nextEmail)) {
      nextErrors.email = '请输入有效的邮箱地址'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({ ...current, ...nextErrors }))
      setStatus(null)
      return
    }

    try {
      onAccountChange({
        ...account,
        account: account.account === account.email ? nextEmail : account.account,
        name: nextName,
        email: nextEmail,
        bio: nextBio,
        avatarUrl,
      })
      setName(nextName)
      setEmail(nextEmail)
      setBio(nextBio)
      setErrors({})
      setStatus('资料已保存到本地')
    } catch {
      setStatus(null)
      setErrors((current) => ({ ...current, avatar: '本地存储空间不足，请换更小的头像后重试' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
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
              <label className="flex flex-col gap-2">
                <span className="font-label-md text-label-md text-on-surface">邮箱</span>
                <input
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrors((current) => ({ ...current, email: undefined }))
                    setStatus(null)
                  }}
                  className={`border-0 border-b bg-transparent px-0 py-2 font-body-md text-body-md transition-colors focus:outline-none ${errors.email ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                  type="email"
                  autoComplete="email"
                />
                {errors.email ? <span className="font-label-sm text-label-sm text-error">{errors.email}</span> : null}
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
            className="rounded-full bg-primary px-8 py-2.5 font-label-md text-label-md font-medium text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            保存更改
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
  if (password.length >= 8) score += 1
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
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({})
  const [status, setStatus] = useState<string | null>(null)
  const passwordStrength = getPasswordStrength(newPassword)
  const canSubmitPassword =
    Boolean(currentPassword) &&
    newPassword.length >= 8 &&
    /[A-Za-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    newPassword !== currentPassword &&
    confirmPassword === newPassword

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: typeof errors = {}

    if (!currentPassword) {
      nextErrors.currentPassword = '请输入当前密码'
    }

    if (!newPassword) {
      nextErrors.newPassword = '请输入新密码'
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = '新密码至少需要 8 位'
    } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      nextErrors.newPassword = '新密码需同时包含字母和数字'
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

    setErrors({})
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setStatus('认证服务尚未接入，当前仅完成前端校验，密码未修改')
  }

  function updatePasswordField(field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) {
    if (field === 'currentPassword') setCurrentPassword(value)
    if (field === 'newPassword') setNewPassword(value)
    if (field === 'confirmPassword') setConfirmPassword(value)
    setErrors((current) => ({ ...current, [field]: undefined }))
    setStatus(null)
  }

  return (
    <div>
      <div className="space-y-6">
        <SettingsCard>
          <SectionTitle icon={Lock}>修改密码</SectionTitle>
          <form onSubmit={handlePasswordSubmit} noValidate>
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
                    placeholder="至少 8 位，包含字母和数字"
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
              {status ? <p className="font-label-md text-label-md text-on-surface-variant" role="status">{status}</p> : null}
              <button
                type="submit"
                aria-disabled={!canSubmitPassword}
                className="rounded-full bg-primary px-8 py-2.5 font-label-md text-label-md font-medium text-on-primary transition-opacity hover:opacity-90 aria-disabled:opacity-60"
              >
                更新密码
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard>
          <SectionTitle icon={Monitor} tone="tertiary">登录活动</SectionTitle>
          <p className="mb-4 rounded-xl bg-surface-container-low px-4 py-3 font-label-md text-label-md text-on-surface-variant">
            当前为演示数据，真实设备与会话记录需要接入账号后端后才会显示。
          </p>
          <div className="space-y-4">
            {[
              { icon: Laptop, title: 'MacBook Pro · 上海, 中国', description: 'Chrome 浏览器 · 正在活跃', current: true },
              { icon: Smartphone, title: 'iPhone 15 Pro · 杭州, 中国', description: 'iOS App · 2小时前', current: false },
              { icon: Monitor, title: 'Windows Desktop · 北京, 中国', description: 'Edge 浏览器 · 2023年10月24日', current: false },
            ].map((device) => {
              const Icon = device.icon

              return (
                <div key={device.title} className="group flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-surface-container-low">
                  <div className="flex items-center gap-4">
                    <Icon className="size-10 rounded-full bg-surface-container-high p-2 text-on-surface-variant" />
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">{device.title}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{device.description}</p>
                    </div>
                  </div>
                  {device.current ? (
                    <span className="rounded-full bg-primary-fixed px-3 py-1 font-label-sm text-label-sm font-bold text-primary">当前设备</span>
                  ) : (
                    <button type="button" disabled title="需要接入会话服务" className="cursor-not-allowed font-label-sm text-label-sm text-error/50">
                      注销
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <button
            type="button"
            disabled
            title="需要接入会话服务"
            className="mt-6 w-full cursor-not-allowed rounded-lg py-2 font-label-md text-label-md font-medium text-primary/50"
          >
            退出所有其他会话（待接入）
          </button>
        </SettingsCard>

        <SettingsCard className="border-error/20 bg-error-container/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-error-container text-error">
                <Shield className="size-5" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-error">注销账户</h3>
                <p className="mt-1 max-w-md font-body-md text-body-md text-on-surface-variant">永久删除账户需要身份复核和后端数据清理，当前仅保留入口。</p>
              </div>
            </div>
            <button
              type="button"
              disabled
              title="需要接入账号服务"
              className="shrink-0 cursor-not-allowed rounded-full border border-error/40 px-6 py-2.5 font-label-md text-label-md text-error/50"
            >
              删除账户（待接入）
            </button>
          </div>
        </SettingsCard>
      </div>
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
