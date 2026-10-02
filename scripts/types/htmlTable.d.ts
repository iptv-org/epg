import { Collection } from '@freearhey/core'

export interface HTMLTableColumn {
  name: string
  nowrap?: boolean
  align?: string
  colspan?: number
}

export interface HTMLTableDataItem {
  value: string
  nowrap?: boolean
  align?: string
  colspan?: number
}

export type HTMLTableRow = Collection<HTMLTableDataItem>
