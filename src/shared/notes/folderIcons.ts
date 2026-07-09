import { BookOpen, BriefcaseBusiness, Folder, Lightbulb, Plane, ReceiptText, Utensils, type LucideIcon } from 'lucide-react'
import type { FolderIcon } from '../types/folder'

export const FOLDER_ICON_MAP: Record<FolderIcon, LucideIcon> = {
  work: BriefcaseBusiness,
  study: BookOpen,
  travel: Plane,
  ideas: Lightbulb,
  recipes: Utensils,
  finance: ReceiptText,
  folder: Folder,
}

export function getFolderIcon(icon: FolderIcon): LucideIcon {
  return FOLDER_ICON_MAP[icon] ?? Folder
}
