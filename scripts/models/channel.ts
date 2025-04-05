import { Collection } from '@freearhey/core'

type ChannelData = {
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
  logo: string
}

export class Channel {
  id: string
  name: string
  altNames: Collection
  network?: string
  owners: Collection
  countryCode: string
  subdivisionCode?: string
  cityName?: string
  categoryIds: Collection
  categories?: Collection
  isNSFW: boolean
  launched?: string
  closed?: string
  replacedBy?: string
  website?: string
  logo: string

  constructor(data: ChannelData) {
    this.id = data.id
    this.name = data.name
    this.altNames = new Collection(data.alt_names)
    this.network = data.network || undefined
    this.owners = new Collection(data.owners)
    this.countryCode = data.country
    this.subdivisionCode = data.subdivision || undefined
    this.cityName = data.city || undefined
    this.categoryIds = new Collection(data.categories)
    this.isNSFW = data.is_nsfw
    this.launched = data.launched || undefined
    this.closed = data.closed || undefined
    this.replacedBy = data.replaced_by || undefined
    this.website = data.website || undefined
    this.logo = data.logo
  }
}
