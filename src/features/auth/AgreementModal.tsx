import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface AgreementModalProps {
  type: 'terms' | 'privacy'
  onClose: () => void
}

export function AgreementModal({ type, onClose }: AgreementModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose])

  const content = agreementContent[type]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={content.title}>
      <button type="button" className="absolute inset-0 bg-inverse-surface/45 backdrop-blur-sm" onClick={onClose} aria-label={`关闭${content.title}弹窗`} />
      <section
        className="relative flex max-h-[calc(100vh-48px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary-fixed to-primary" />
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-6 py-5">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{content.title}</h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{content.subtitle}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label={`关闭${content.title}`}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="space-y-5 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            <p className="rounded-2xl bg-surface-container-low px-4 py-3 text-on-surface">
              {content.notice}
            </p>

            {content.sections.map((section) => (
              <AgreementSection key={section.title} title={section.title}>
                {section.body}
              </AgreementSection>
            ))}
          </div>
        </div>

        <div className="border-t border-outline-variant/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
          >
            关闭
          </button>
        </div>
      </section>
    </div>
  )
}

function AgreementSection({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h3 className="mb-2 font-label-md text-label-md text-on-surface">{title}</h3>
      <p>{children}</p>
    </section>
  )
}

const agreementContent = {
  terms: {
    title: '服务条款',
    subtitle: '灵感笔记示例条款',
    notice: '以下内容为产品原型中的示例服务条款，用于说明交互与信息展示方式，不构成正式法律意见或最终法律文本。',
    sections: [
      {
        title: '1. 服务说明',
        body: '灵感笔记提供笔记记录、内容整理、收藏、文件夹管理和回收站等知识管理相关功能。当前注册流程为演示用途，部分账号能力和数据同步能力可能尚未接入真实服务。',
      },
      {
        title: '2. 用户内容',
        body: '您在应用中创建的笔记、标签、标题和正文等内容仍归您所有。请确保您记录和上传的内容不侵犯他人权益，不包含违法、恶意或未经授权的信息。',
      },
      {
        title: '3. 数据与隐私提示',
        body: '当前原型可能使用本地存储保存示例数据。后续若接入云同步、账号登录或跨设备访问，应在正式隐私政策中说明数据收集、使用、保存、删除和安全保护方式。',
      },
      {
        title: '4. 可接受使用',
        body: '请勿使用本服务存储、传播违法内容，或进行攻击、滥用、干扰服务稳定性的行为。若发现异常使用，服务提供方可根据实际情况限制相关功能。',
      },
      {
        title: '5. 免责声明',
        body: '本应用按现状提供。示例版本中的内容保存、账号认证和服务可用性不作正式承诺。请在重要内容上自行做好备份，并谨慎保存敏感信息。',
      },
      {
        title: '6. 条款更新',
        body: '服务条款可能随着产品功能、数据处理方式和运营策略调整而更新。正式上线后，应在条款更新时以合理方式通知用户，并说明生效时间。',
      },
      {
        title: '7. 联系与反馈',
        body: '如果您对服务条款、数据处理或产品体验有疑问，可以通过应用内帮助与反馈入口联系产品团队。正式版本应提供明确的联系邮箱或客服渠道。',
      },
    ],
  },
  privacy: {
    title: '隐私政策',
    subtitle: '灵感笔记示例隐私政策',
    notice: '以下内容为产品原型中的示例隐私政策，用于说明隐私信息展示方式，不构成正式法律意见或最终法律文本。',
    sections: [
      {
        title: '1. 我们收集哪些信息',
        body: '在当前原型中，可能涉及您主动输入的用户名、密码字段、注册勾选状态，以及应用内创建的笔记标题、正文、标签和文件夹等内容。',
      },
      {
        title: '2. 笔记内容和用户内容如何处理',
        body: '您的笔记内容用于在应用内展示、编辑、搜索和整理。当前实现以本地演示为主，不会承诺已接入真实云端处理、加密同步或跨设备分发能力。',
      },
      {
        title: '3. 本地存储与同步说明',
        body: '当前原型可能通过浏览器本地存储保存示例笔记和界面状态。当你未来启用同步功能时，相关数据可能需要传输到服务端，并应在正式政策中说明保存位置、同步范围和删除方式。',
      },
      {
        title: '4. 账号信息和登录信息',
        body: '注册和登录界面目前用于演示认证流程。若未来接入真实账号系统，可能会处理用户名、登录凭证和安全审计信息。',
      },
      {
        title: '5. 数据使用目的',
        body: '相关数据主要用于提供笔记管理、内容检索、账号识别、安全校验、问题排查和产品体验改进。我们不应将您的笔记内容用于与产品无关的用途。',
      },
      {
        title: '6. 数据安全',
        body: '正式服务应采用合理的安全措施保护数据。当前原型不承诺已经具备完整后端安全、云端加密或灾备能力，请避免保存高度敏感信息，并自行备份重要内容。',
      },
      {
        title: '7. 用户控制和删除权利',
        body: '您应能够查看、编辑和删除自己创建的笔记内容。未来接入账号和同步服务后，应提供账号数据访问、更正、导出或删除的合理渠道。',
      },
      {
        title: '8. 第三方服务说明',
        body: '当前原型不包含真实短信、邮件或支付服务。未来如接入第三方服务，应说明其用途、共享的数据类型和对应的第三方隐私规则。',
      },
      {
        title: '9. 政策更新',
        body: '隐私政策可能随产品功能、数据处理方式或法律要求变化而更新。正式上线后，应在政策更新时以合理方式提示用户。',
      },
      {
        title: '10. 联系与反馈',
        body: '如果您对隐私政策、数据处理或个人信息控制有疑问，可以通过应用内帮助与反馈入口联系产品团队。正式版本应提供明确的联系邮箱或客服渠道。',
      },
    ],
  },
}
