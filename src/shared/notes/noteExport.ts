/**
 * 笔记导出工具
 * - PNG 长图：html2canvas 渲染预览节点 → 下载 .png
 * - PDF 文档：html2canvas + jsPDF 拼接分页 → 下载 .pdf
 * - Word：docx 库遍历 ProseMirror JSON → 下载 .docx
 */
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { Note } from '../types/note'

/** 清理文件名非法字符（Windows/macOS/Linux 通用） */
function sanitizeFileName(name: string): string {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '_')
  return cleaned || '未命名笔记'
}

/** 渲染节点为 canvas（统一参数） */
async function renderToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })
}

/**
 * 导出为 PNG 长图
 * @param node 预览纸张 DOM 节点
 * @param fileName 文件名（不含扩展名）
 */
export async function exportNoteToPng(node: HTMLElement, fileName: string): Promise<void> {
  const canvas = await renderToCanvas(node)
  const dataUrl = canvas.toDataURL('image/png')
  triggerDownload(dataUrl, `${sanitizeFileName(fileName)}.png`)
}

/**
 * 导出为 PDF 文档
 * - A4 纵向，按内容高度自动分页
 * @param node 预览纸张 DOM 节点
 * @param fileName 文件名（不含扩展名）
 */
export async function exportNoteToPdf(node: HTMLElement, fileName: string): Promise<void> {
  const canvas = await renderToCanvas(node)
  const imgData = canvas.toDataURL('image/png')

  // A4 纵向尺寸（mm）
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // 图片按页面宽度等比缩放
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  // 内容高度不超过一页时单页输出
  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  } else {
    // 多页：按页面高度切分，每页绘制对应区段
    let remainingHeight = imgHeight
    let position = 0
    while (remainingHeight > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      remainingHeight -= pageHeight
      position -= pageHeight
      if (remainingHeight > 0) {
        pdf.addPage()
      }
    }
  }

  pdf.save(`${sanitizeFileName(fileName)}.pdf`)
}

/** 触发浏览器下载 */
function triggerDownload(href: string, fileName: string): void {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** 触发 Blob 下载 */
function triggerDownloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  triggerDownload(url, fileName)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ==================== Word 导出 ====================

/** ProseMirror 文档节点 */
interface ProseNode {
  type: string
  content?: ProseNode[]
  text?: string
  marks?: ProseMark[]
  attrs?: Record<string, unknown>
}

interface ProseMark {
  type: string
  attrs?: Record<string, unknown>
}

/** TextRun 样式片段 */
interface TextRunStyles {
  bold?: boolean
  italics?: boolean
  strike?: boolean
  color?: string
  highlight?: 'yellow'
  font?: string
}

const HEADING_LEVEL_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
}

/** 将 ProseMirror mark 列表转为 docx TextRun 样式 */
function convertMarksToStyles(marks: ProseMark[] = []): TextRunStyles {
  const styles: TextRunStyles = {}
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        styles.bold = true
        break
      case 'italic':
        styles.italics = true
        break
      case 'strike':
        styles.strike = true
        break
      case 'code':
        styles.font = 'Courier New'
        break
      case 'color':
      case 'textStyle': {
        const color = mark.attrs?.color
        if (typeof color === 'string' && color.startsWith('#')) {
          styles.color = color.slice(1)
        }
        break
      }
      case 'highlight':
        styles.highlight = 'yellow'
        break
    }
  }
  return styles
}

/** 将 ProseMirror 对齐值转为 docx AlignmentType */
function convertAlignment(align: unknown): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  if (align === 'left') return AlignmentType.LEFT
  if (align === 'center') return AlignmentType.CENTER
  if (align === 'right') return AlignmentType.RIGHT
  if (align === 'justify') return AlignmentType.JUSTIFIED
  return undefined
}

/** 转换 inline 节点为 TextRun/ExternalHyperlink 数组 */
function convertInline(nodes: ProseNode[] = []): Array<TextRun | ExternalHyperlink> {
  const runs: Array<TextRun | ExternalHyperlink> = []
  for (const node of nodes) {
    if (node.type === 'text' && node.text) {
      const styles = convertMarksToStyles(node.marks)
      const linkMark = node.marks?.find((m) => m.type === 'link')
      if (linkMark?.attrs?.href) {
        runs.push(new ExternalHyperlink({
          children: [new TextRun({ text: node.text, ...styles, color: '0563C1', underline: {} })],
          link: String(linkMark.attrs.href),
        }))
      } else {
        runs.push(new TextRun({ text: node.text, ...styles }))
      }
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ break: 1 }))
    } else if (node.type === 'image') {
      runs.push(new TextRun({ text: '[图片]', italics: true, color: '888888' }))
    } else if (node.type === 'mathematics' || node.type === 'math') {
      const latex = node.attrs?.latex || node.text || ''
      runs.push(new TextRun({ text: String(latex) || '[公式]', italics: true }))
    } else if (node.text) {
      runs.push(new TextRun({ text: node.text, ...convertMarksToStyles(node.marks) }))
    }
  }
  return runs
}

/** 转换 block 节点为 Paragraph/Table 数组 */
function convertBlock(node: ProseNode): Array<Paragraph | Table> {
  switch (node.type) {
    case 'paragraph':
      return [new Paragraph({
        children: convertInline(node.content),
        alignment: convertAlignment(node.attrs?.textAlign),
      })]

    case 'heading': {
      const level = Number(node.attrs?.level ?? 1)
      return [new Paragraph({
        children: convertInline(node.content),
        heading: HEADING_LEVEL_MAP[level] ?? HeadingLevel.HEADING_1,
        alignment: convertAlignment(node.attrs?.textAlign),
      })]
    }

    case 'bulletList':
    case 'orderedList': {
      const isOrdered = node.type === 'orderedList'
      const paragraphs: Paragraph[] = []
      ;(node.content ?? []).forEach((item, index) => {
        if (item.type !== 'listItem') return
        const prefix = isOrdered ? `${index + 1}. ` : '• '
        ;(item.content ?? []).forEach((inner, innerIdx) => {
          if (inner.type !== 'paragraph') return
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({ text: innerIdx === 0 ? prefix : '' }),
              ...convertInline(inner.content),
            ],
            indent: { left: 360 },
            alignment: convertAlignment(inner.attrs?.textAlign),
          }))
        })
      })
      return paragraphs
    }

    case 'taskList': {
      const paragraphs: Paragraph[] = []
      for (const item of node.content ?? []) {
        if (item.type !== 'taskItem') continue
        const checkbox = item.attrs?.checked ? '[x] ' : '[ ] '
        ;(item.content ?? []).forEach((inner, innerIdx) => {
          if (inner.type !== 'paragraph') return
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({ text: innerIdx === 0 ? checkbox : '' }),
              ...convertInline(inner.content),
            ],
            indent: { left: 360 },
          }))
        })
      }
      return paragraphs
    }

    case 'codeBlock': {
      const text = (node.content ?? []).map((n) => n.text ?? '').join('')
      return [new Paragraph({
        children: [new TextRun({ text, font: 'Courier New', size: 20 })],
        spacing: { before: 100, after: 100 },
      })]
    }

    case 'blockquote': {
      const paragraphs: Paragraph[] = []
      for (const inner of node.content ?? []) {
        if (inner.type === 'paragraph') {
          paragraphs.push(new Paragraph({
            children: convertInline(inner.content),
            indent: { left: 720 },
            spacing: { before: 100, after: 100 },
          }))
        }
      }
      return paragraphs
    }

    case 'table': {
      const tableRows: TableRow[] = []
      for (const row of node.content ?? []) {
        if (row.type !== 'tableRow') continue
        const cells = row.content ?? []
        const tableCells: TableCell[] = []
        for (const cell of cells) {
          if (cell.type !== 'tableCell' && cell.type !== 'tableHeader') continue
          const cellParas: Paragraph[] = []
          for (const inner of cell.content ?? []) {
            if (inner.type === 'paragraph') {
              cellParas.push(new Paragraph({ children: convertInline(inner.content) }))
            }
          }
          tableCells.push(new TableCell({
            children: cellParas.length ? cellParas : [new Paragraph('')],
            width: { size: Math.floor(100 / Math.max(cells.length, 1)), type: WidthType.PERCENTAGE },
          }))
        }
        if (tableCells.length) {
          tableRows.push(new TableRow({ children: tableCells }))
        }
      }
      return tableRows.length ? [new Table({ rows: tableRows })] : []
    }

    case 'horizontalRule':
      return [new Paragraph({
        children: [new TextRun({ text: '────────────────', color: 'AAAAAA' })],
        alignment: AlignmentType.CENTER,
      })]

    case 'image':
      return [new Paragraph({
        children: [new TextRun({ text: '[图片]', italics: true, color: '888888' })],
        alignment: AlignmentType.CENTER,
      })]

    case 'youtube':
      return [new Paragraph({
        children: [new TextRun({ text: `[视频] ${node.attrs?.src ?? ''}`, italics: true, color: '888888' })],
        alignment: AlignmentType.CENTER,
      })]

    default:
      if (node.content) {
        return [new Paragraph({ children: convertInline(node.content) })]
      }
      return []
  }
}

/**
 * 导出为 Word(.docx) 文档
 * - 遍历 editor.getJSON() 的 ProseMirror 结构，映射为 docx 段落/表格
 * - 标题、元信息（更新时间、标签）置于正文前
 * @param json editor.getJSON() 返回的文档对象
 * @param note 笔记元数据
 * @param fileName 文件名（不含扩展名）
 */
export async function exportNoteToDocx(
  json: ProseNode,
  note: Note,
  fileName: string,
): Promise<void> {
  const children: Array<Paragraph | Table> = []

  // 标题
  children.push(new Paragraph({
    children: [new TextRun({ text: note.title || '未命名笔记', bold: true, size: 36 })],
    spacing: { after: 120 },
  }))

  // 元信息：仅保留标签
  if (note.tags?.length) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `标签: ${note.tags.map((t) => t.name).join(', ')}`, italics: true, color: '666666', size: 18 })],
      spacing: { after: 240 },
    }))
  }

  // 正文：遍历顶层 block 节点
  if (json?.type === 'doc' && Array.isArray(json.content)) {
    for (const node of json.content) {
      children.push(...convertBlock(node))
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  triggerDownloadBlob(blob, `${sanitizeFileName(fileName)}.docx`)
}
