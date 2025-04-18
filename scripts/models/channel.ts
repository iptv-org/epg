import { ChannelData, ChannelSearchableData } from '../types/channel'
import { Collection, Dictionary } from '@freearhey/core'
import { Stream, Guide, Feed } from './'

export class Channel {
  id: string
  name: string
  altNames?: Collection
  network?: string
  owners?: Collection
  countryCode: string
  subdivisionCode?: string
  cityName?: string
  categoryIds?: Collection
  isNSFW: boolean
  launched?: string
  closed?: string
  replacedBy?: string
  website?: string
  logo?: string
  feeds?: Collection

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

  withFeeds(feedsGroupedByChannelId: Dictionary): this {
    this.feeds = new Collection(feedsGroupedByChannelId.get(this.id))

    return this
  }

  getFeeds(): Collection {
    if (!this.feeds) return new Collection()

    return this.feeds
  }

  getGuides(): Collection {
    let guides = new Collection()

    this.getFeeds().forEach((feed: Feed) => {
      guides = guides.concat(feed.getGuides())
    })

    return guides
  }

  getGuideNames(): Collection {
    return this.getGuides()
      .map((guide: Guide) => guide.siteName)
      .uniq()
  }

  getStreams(): Collection {
    let streams = new Collection()

    this.getFeeds().forEach((feed: Feed) => {
      streams = streams.concat(feed.getStreams())
    })

    return streams
  }

  getStreamNames(): Collection {
    return this.getStreams()
      .map((stream: Stream) => stream.getName())
      .uniq()
  }

  getFeedFullNames(): Collection {
    return this.getFeeds()
      .map((feed: Feed) => feed.getFullName())
      .uniq()
  }

  getName(): string {
    return this.name || ''
  }

  getId(): string {
    return this.id || ''
  }

  getAltNames(): Collection {
    return this.altNames || new Collection()
  }

  getSearchable(): ChannelSearchableData {
    return {
      id: this.getId(),
      name: this.getName(),
      altNames: this.getAltNames().all(),
      guideNames: this.getGuideNames().all(),
      streamNames: this.getStreamNames().all(),
      feedFullNames: this.getFeedFullNames().all()
    }
  }
}
