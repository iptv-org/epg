import { ChannelData, ChannelSearchableData } from '../types/channel'
import { Collection, Dictionary } from '@freearhey/core'
import { Stream, Feed, Logo, GuideChannel } from './'

export class Channel {
  id?: string
  name?: string
  altNames?: Collection
  network?: string
  owners?: Collection
  countryCode?: string
  subdivisionCode?: string
  cityName?: string
  categoryIds?: Collection
  isNSFW = false
  launched?: string
  closed?: string
  replacedBy?: string
  website?: string
  feeds?: Collection
  logos: Collection = new Collection()

  constructor(data?: ChannelData) {
    if (!data) return

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
  }

  withFeeds(feedsGroupedByChannelId: Dictionary): this {
    if (this.id) this.feeds = new Collection(feedsGroupedByChannelId.get(this.id))

    return this
  }

  withLogos(logosGroupedByChannelId: Dictionary): this {
    if (this.id) this.logos = new Collection(logosGroupedByChannelId.get(this.id))

    return this
  }

  getFeeds(): Collection {
    if (!this.feeds) return new Collection()

    return this.feeds
  }

  getGuideChannels(): Collection {
    let channels = new Collection()

    this.getFeeds().forEach((feed: Feed) => {
      channels = channels.concat(feed.getGuideChannels())
    })

    return channels
  }

  getGuideChannelNames(): Collection {
    return this.getGuideChannels()
      .map((channel: GuideChannel) => channel.siteName)
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

  getLogos(): Collection {
    function feed(logo: Logo): number {
      if (!logo.feed) return 1
      if (logo.feed.isMain) return 1

      return 0
    }

    function format(logo: Logo): number {
      const levelByFormat: Record<string, number> = {
        SVG: 0,
        PNG: 3,
        APNG: 1,
        WebP: 1,
        AVIF: 1,
        JPEG: 2,
        GIF: 1
      }

      return logo.format ? levelByFormat[logo.format] : 0
    }

    function size(logo: Logo): number {
      return Math.abs(512 - logo.width) + Math.abs(512 - logo.height)
    }

    return this.logos.orderBy([feed, format, size], ['desc', 'desc', 'asc'], false)
  }

  getLogo(): Logo | undefined {
    return this.getLogos().first()
  }

  hasLogo(): boolean {
    return this.getLogos().notEmpty()
  }

  getLogoUrl(): string {
    const logo = this.getLogo()
    if (!logo) return ''

    return logo.url || ''
  }

  getSearchable(): ChannelSearchableData {
    return {
      id: this.getId(),
      name: this.getName(),
      altNames: this.getAltNames().all(),
      guideNames: this.getGuideChannelNames().all(),
      streamNames: this.getStreamNames().all(),
      feedFullNames: this.getFeedFullNames().all()
    }
  }
}
