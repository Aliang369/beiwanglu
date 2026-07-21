import { describe, expect, it } from 'vitest'
import type { Folder } from '../types/folder'
import {
  assertValidParentId,
  buildFolder,
  canMoveFolder,
  canPlaceFoldersInParent,
  collectSubtreeIds,
  getValidMoveTargets,
  hasFolderNameConflict,
  normalizeFolders,
  sortFoldersByName,
} from './folderDomain'

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'f1',
    name: '根文件夹',
    icon: 'folder',
    parentId: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('folderDomain', () => {
  it('buildFolder 清洗名称并默认 parentId', () => {
    const folder = buildFolder({ name: '  工作  ', icon: 'work' }, 'id-1', '2026-07-21T00:00:00.000Z')
    expect(folder).toMatchObject({
      id: 'id-1',
      name: '工作',
      icon: 'work',
      parentId: null,
    })
  })

  it('normalizeFolders 压平非法深层嵌套', () => {
    const folders = normalizeFolders([
      makeFolder({ id: 'root', name: '根' }),
      makeFolder({ id: 'child', name: '子', parentId: 'root' }),
      makeFolder({ id: 'deep', name: '孙', parentId: 'child' }),
      makeFolder({ id: 'orphan', name: '孤儿', parentId: 'missing' }),
    ])
    expect(folders.find((f) => f.id === 'deep')?.parentId).toBeNull()
    expect(folders.find((f) => f.id === 'orphan')?.parentId).toBeNull()
    expect(folders.find((f) => f.id === 'child')?.parentId).toBe('root')
  })

  it('assertValidParentId 仅允许根级父文件夹', () => {
    const folders = [
      makeFolder({ id: 'root', name: '根' }),
      makeFolder({ id: 'child', name: '子', parentId: 'root' }),
    ]
    expect(() => assertValidParentId(folders, null)).not.toThrow()
    expect(() => assertValidParentId(folders, 'root')).not.toThrow()
    expect(() => assertValidParentId(folders, 'child')).toThrow('只能放在根级文件夹下')
    expect(() => assertValidParentId(folders, 'missing')).toThrow('目标文件夹不存在')
  })

  it('hasFolderNameConflict 同级重名检测', () => {
    const folders = [
      makeFolder({ id: 'a', name: '同名', parentId: null }),
      makeFolder({ id: 'b', name: '同名', parentId: 'a' }),
    ]
    expect(hasFolderNameConflict(folders, '同名', null)).toBe(true)
    expect(hasFolderNameConflict(folders, '同名', null, new Set(['a']))).toBe(false)
    expect(hasFolderNameConflict(folders, '同名', 'a')).toBe(true)
    expect(hasFolderNameConflict(folders, '新名', null)).toBe(false)
  })

  it('canMoveFolder / canPlaceFoldersInParent 保持一层规则', () => {
    const folders = [
      makeFolder({ id: 'root', name: '根A' }),
      makeFolder({ id: 'root2', name: '根B' }),
      makeFolder({ id: 'child', name: '子', parentId: 'root' }),
      makeFolder({ id: 'leaf', name: '叶子', parentId: null }),
    ]

    expect(canMoveFolder(folders, 'leaf', 'root')).toBe(true)
    expect(canMoveFolder(folders, 'leaf', 'child')).toBe(false)
expect(canMoveFolder(folders, 'root', 'root2')).toBe(false) // 有子文件夹只能保持根
expect(canMoveFolder(folders, 'child', 'root')).toBe(false) // 已在该父级
expect(canPlaceFoldersInParent(folders, ['leaf'], 'root2')).toBe(true)
expect(canPlaceFoldersInParent(folders, ['leaf'], null)).toBe(true) // 自身排除后无同级重名
expect(canPlaceFoldersInParent(folders, ['leaf'], 'root')).toBe(true)
})

  it('collectSubtreeIds 与 getValidMoveTargets', () => {
    const folders = [
      makeFolder({ id: 'root', name: '根' }),
      makeFolder({ id: 'child', name: '子', parentId: 'root' }),
      makeFolder({ id: 'other', name: '其他' }),
    ]
    expect([...collectSubtreeIds(folders, 'root')].sort()).toEqual(['child', 'root'])
    const targets = getValidMoveTargets(folders, ['root'])
    expect(targets.rootOnly).toBe(true)
    expect(targets.rootFolders).toEqual([])
    expect(targets.allowRoot).toBe(true)

    const leafTargets = getValidMoveTargets(folders, ['other'])
    expect(leafTargets.rootOnly).toBe(false)
    expect(leafTargets.rootFolders.map((f) => f.id)).toEqual(['root'])
  })

  it('sortFoldersByName 中文排序', () => {
    const folders = [makeFolder({ id: '2', name: '工作' }), makeFolder({ id: '1', name: '灵感' })]
    expect(sortFoldersByName(folders).map((f) => f.name)).toEqual(
      [...folders].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')).map((f) => f.name),
    )
  })
})
