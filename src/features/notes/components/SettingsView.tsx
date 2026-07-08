import {
  Camera,
  CheckCircle2,
  Laptop,
  Lock,
  Monitor,
  Palette,
  Shield,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

export type SettingsTab = 'profile' | 'appearance' | 'security'

interface SettingsViewProps {
  initialTab?: SettingsTab
}

const tabs = [
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'appearance', label: '外观设置', icon: Palette },
  { id: 'security', label: '账户安全', icon: Shield },
] satisfies Array<{ id: SettingsTab; label: string; icon: typeof User }>

const accentColors = ['bg-primary', 'bg-[#7C3AED]', 'bg-[#DB2777]', 'bg-[#059669]', 'bg-[#EA580C]', 'bg-[#475569]']

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`h-6 w-12 shrink-0 rounded-full p-0.5 transition-colors ${checked ? 'bg-primary' : 'bg-outline-variant'}`}
    >
      <span className={`block size-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : ''}`} />
    </button>
  )
}

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
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [accentColor, setAccentColor] = useState(accentColors[0])
  const [fontSize, setFontSize] = useState(16)
  const [glassEnabled, setGlassEnabled] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

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
          {activeTab === 'profile' ? <ProfileSettings /> : null}
          {activeTab === 'appearance' ? (
            <AppearanceSettings
              accentColor={accentColor}
              fontSize={fontSize}
              glassEnabled={glassEnabled}
              onAccentColorChange={setAccentColor}
              onFontSizeChange={setFontSize}
              onGlassToggle={() => setGlassEnabled((value) => !value)}
            />
          ) : null}
          {activeTab === 'security' ? (
            <SecuritySettings twoFactorEnabled={twoFactorEnabled} onTwoFactorToggle={() => setTwoFactorEnabled((value) => !value)} />
          ) : null}
        </div>
      </div>
    </main>
  )
}

function ProfileSettings() {
  return (
    <div>
      <div className="space-y-6">
        <SettingsCard>
          <SectionTitle icon={User}>基本信息</SectionTitle>

          <div className="flex flex-col gap-stack-lg">
            <div className="flex items-center gap-stack-md">
              <div className="group relative flex size-20 cursor-pointer items-center justify-center rounded-full border-2 border-surface-container-high bg-primary-container text-on-primary">
                <User className="size-8" />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="rounded-full border border-outline-variant/30 bg-surface-container px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-high"
                >
                  更改头像
                </button>
                <span className="font-label-sm text-label-sm text-outline">支持 JPG, PNG. 最大 5MB.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="font-label-md text-label-md text-on-surface">昵称</span>
                <input
                  className="border-0 border-b border-outline-variant bg-transparent px-0 py-2 font-body-md text-body-md transition-colors focus:border-primary focus:outline-none"
                  defaultValue="ProductiveUser"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-label-md text-label-md text-on-surface">邮箱</span>
                <input
                  className="border-0 border-b border-outline-variant bg-transparent px-0 py-2 font-body-md text-body-md transition-colors focus:border-primary focus:outline-none"
                  defaultValue="user@example.com"
                  type="email"
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="font-label-md text-label-md text-on-surface">个人简介</span>
                <textarea
                  className="resize-none border-0 border-b border-outline-variant bg-transparent px-0 py-2 font-body-md text-body-md transition-colors focus:border-primary focus:outline-none"
                  placeholder="写点什么来介绍自己..."
                  rows={3}
                />
              </label>
            </div>
          </div>
        </SettingsCard>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="rounded-full bg-primary px-8 py-2.5 font-label-md text-label-md font-medium text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  )
}

function AppearanceSettings({
  accentColor,
  fontSize,
  glassEnabled,
  onAccentColorChange,
  onFontSizeChange,
  onGlassToggle,
}: {
  accentColor: string
  fontSize: number
  glassEnabled: boolean
  onAccentColorChange: (color: string) => void
  onFontSizeChange: (size: number) => void
  onGlassToggle: () => void
}) {
  return (
    <div>
      <div className="space-y-6">
        <SettingsCard>
          <SectionTitle icon={Monitor}>主题模式</SectionTitle>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {['浅色模式', '深色模式', '跟随系统'].map((label, index) => (
              <button key={label} type="button" className={`group flex flex-col gap-3 text-left ${index === 0 ? '' : 'opacity-60 transition-opacity hover:opacity-100'}`}>
                <div
                  className={`relative aspect-video overflow-hidden rounded-xl ${
                    index === 0
                      ? 'border-2 border-primary bg-white shadow-sm ring-4 ring-primary/10'
                      : index === 1
                        ? 'border border-outline-variant bg-inverse-surface'
                        : 'flex border border-outline-variant bg-gradient-to-r from-white to-inverse-surface'
                  }`}
                >
                  <div className={`absolute top-3 left-3 h-2 w-12 rounded-full ${index === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
                  <div className={`absolute top-7 left-3 h-2 w-20 rounded-full ${index === 1 ? 'bg-slate-800' : 'bg-slate-50'}`} />
                  <div className={`absolute top-3 right-3 size-6 rounded-lg ${index === 1 ? 'bg-slate-700' : 'bg-slate-100'}`} />
                  {index === 2 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full border border-outline-variant bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg">Auto</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className={`font-label-md text-label-md ${index === 0 ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
                  {index === 0 ? <CheckCircle2 className="size-5 text-primary" /> : null}
                </div>
              </button>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard>
          <SectionTitle icon={Palette}>强调色</SectionTitle>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="font-label-sm text-label-sm text-on-surface-variant">选择界面的核心交互颜色</p>
            <div className="flex flex-wrap gap-3">
              {accentColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onAccentColorChange(color)}
                  className={`size-8 rounded-full ${color} transition-transform hover:scale-110 active:scale-95 ${accentColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                />
              ))}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard>
          <SectionTitle icon={Sparkles}>字体设置</SectionTitle>
          <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant">字体族</h4>
              {['Noto Sans SC', 'Source Serif', 'JetBrains Mono'].map((font, index) => (
                <button
                  key={font}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-xl p-4 text-left transition-colors ${
                    index === 0 ? 'border-2 border-primary bg-surface-container-low' : 'border border-outline-variant bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  <div>
                    <span className="block font-body-md text-body-md font-bold">{font}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {index === 0 ? '系统默认，阅读体验最佳' : index === 1 ? '优雅衬线，适合沉浸式阅读' : '等宽字体，适合记录代码段'}
                    </span>
                  </div>
                  {index === 0 ? <CheckCircle2 className="size-5 shrink-0 text-primary" /> : null}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant">字体大小</h4>
              <div className="flex h-[calc(100%-36px)] flex-col justify-center rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-[12px] text-on-surface-variant">A</span>
                  <input
                    value={fontSize}
                    onChange={(event) => onFontSizeChange(Number(event.target.value))}
                    className="mx-6 flex-1 cursor-pointer accent-primary"
                    max={24}
                    min={12}
                    type="range"
                  />
                  <span className="text-[24px] text-on-surface-variant">A</span>
                </div>
                <div className="rounded-lg border border-outline-variant/30 bg-surface-bright p-4 text-center">
                  <p style={{ fontSize }} className="text-on-surface">这是 {fontSize}px 大小的预览文本</p>
                </div>
                <p className="mt-4 text-center font-label-sm text-label-sm italic text-on-surface-variant">滑动调整，找到最舒适的字号</p>
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h4 className="font-body-lg text-body-lg font-bold text-on-surface">磨砂玻璃特效 (Glassmorphism)</h4>
                <p className="font-label-md text-label-md text-on-surface-variant">启用后侧边栏将呈现半透明模糊效果</p>
              </div>
            </div>
            <Toggle checked={glassEnabled} onToggle={onGlassToggle} />
          </div>
        </SettingsCard>

        <div className="flex justify-end gap-4">
          <button type="button" className="rounded-full px-6 py-2.5 font-label-md text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high">恢复默认</button>
          <button type="button" className="rounded-full bg-primary px-8 py-2.5 font-label-md text-label-md font-medium text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95">保存更改</button>
        </div>
      </div>
    </div>
  )
}

function SecuritySettings({ twoFactorEnabled, onTwoFactorToggle }: { twoFactorEnabled: boolean; onTwoFactorToggle: () => void }) {
  return (
    <div>
      <div className="space-y-6">
        <SettingsCard>
          <SectionTitle icon={Lock}>修改密码</SectionTitle>
          <div className="grid grid-cols-1 gap-6">
            <label>
              <span className="mb-1 ml-1 block font-label-sm text-label-sm text-on-surface-variant">当前密码</span>
              <input className="w-full border-0 border-b border-outline-variant bg-transparent px-1 py-2 font-body-md text-body-md focus:border-primary focus:outline-none" placeholder="输入当前密码" type="password" />
            </label>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label>
                <span className="mb-1 ml-1 block font-label-sm text-label-sm text-on-surface-variant">新密码</span>
                <input className="w-full border-0 border-b border-outline-variant bg-transparent px-1 py-2 font-body-md text-body-md focus:border-primary focus:outline-none" placeholder="输入新密码" type="password" />
              </label>
              <label>
                <span className="mb-1 ml-1 block font-label-sm text-label-sm text-on-surface-variant">确认新密码</span>
                <input className="w-full border-0 border-b border-outline-variant bg-transparent px-1 py-2 font-body-md text-body-md focus:border-primary focus:outline-none" placeholder="再次输入新密码" type="password" />
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" className="rounded-full bg-primary px-8 py-2.5 font-label-md text-label-md font-medium text-on-primary transition-opacity hover:opacity-90">更新密码</button>
          </div>
        </SettingsCard>

        <SettingsCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                <Shield className="size-5" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">双重验证</h3>
                <p className="mt-1 font-body-md text-body-md text-on-surface-variant">开启后，登录时将需要额外验证码以保护账户安全。</p>
              </div>
            </div>
            <Toggle checked={twoFactorEnabled} onToggle={onTwoFactorToggle} />
          </div>
        </SettingsCard>

        <SettingsCard>
          <SectionTitle icon={Monitor} tone="tertiary">登录活动</SectionTitle>
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
                    <button type="button" className="font-label-sm text-label-sm text-error opacity-0 transition-opacity group-hover:opacity-100">注销</button>
                  )}
                </div>
              )
            })}
          </div>
          <button type="button" className="mt-6 w-full rounded-lg py-2 font-label-md text-label-md font-medium text-primary transition-colors hover:bg-primary-fixed">退出所有其他会话</button>
        </SettingsCard>

        <SettingsCard className="border-error/20 bg-error-container/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-error-container text-error">
                <Shield className="size-5" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-error">注销账户</h3>
                <p className="mt-1 max-w-md font-body-md text-body-md text-on-surface-variant">永久删除您的账户及所有相关笔记、媒体文件。此操作不可撤销，请谨慎操作。</p>
              </div>
            </div>
            <button type="button" className="shrink-0 rounded-full border border-error px-6 py-2.5 font-label-md text-label-md text-error transition-all hover:bg-error hover:text-white">删除账户</button>
          </div>
        </SettingsCard>
      </div>
    </div>
  )
}
