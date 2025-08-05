import { Collection } from '@freearhey/core'

export interface ChannelData {
  id: string
  name: string
  alt_names: string[]
  network: string
  owners: Collection
  country: string
  subdivision: string
  city: string
  categories: Collection
  is_nsfw: boolean
  launched: string
  closed: string
  replaced_by: string
  website: string
}

export interface ChannelSearchableData {
  id: string
  name: string
  altNames: string[]
  guideNames: string[]
  streamNames: string[]
  feedFullNames: string[]
}
