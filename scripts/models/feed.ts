import { Collection, Dictionary } from '@freearhey/core'
import { FeedData } from '../types/feed'
import { Logo, Channel } from '.'

export class Feed {
  channelId: string
  channel?: Channel
  id: string
  name: string
  isMain: boolean
  broadcastAreaCodes: Collection
  languageCodes: Collection
  timezoneIds: Collection
  videoFormat: string
  guideChannels?: Collection
  streams?: Collection
  logos: Collection = new Collection()

  constructor(data: FeedData) {
    this.channelId = data.channel
    this.id = data.id
    this.name = data.name
    this.isMain = data.is_main
    this.broadcastAreaCodes = new Collection(data.broadcast_area)
    this.languageCodes = new Collection(data.languages)
    this.timezoneIds = new Collection(data.timezones)
    this.videoFormat = data.video_format
  }

  withChannel(channelsKeyById: Dictionary): this {
    this.channel = channelsKeyById.get(this.channelId)

    return this
  }

  withStreams(streamsGroupedById: Dictionary): this {
    this.streams = new Collection(streamsGroupedById.get(`${this.channelId}@${this.id}`))

    if (this.isMain) {
      this.streams = this.streams.concat(new Collection(streamsGroupedById.get(this.channelId)))
    }

    return this
  }

  withGuideChannels(guideChannelsGroupedByStreamId: Dictionary): this {
    this.guideChannels = new Collection(
      guideChannelsGroupedByStreamId.get(`${this.channelId}@${this.id}`)
    )

    if (this.isMain) {
      this.guideChannels = this.guideChannels.concat(
        new Collection(guideChannelsGroupedByStreamId.get(this.channelId))
      )
    }

    return this
  }

  withLogos(logosGroupedByStreamId: Dictionary): this {
    this.logos = new Collection(logosGroupedByStreamId.get(this.getStreamId()))

    return this
  }

  getGuideChannels(): Collection {
    if (!this.guideChannels) return new Collection()

    return this.guideChannels
  }

  getStreams(): Collection {
    if (!this.streams) return new Collection()

    return this.streams
  }

  getFullName(): string {
    if (!this.channel) return ''

    return `${this.channel.name} ${this.name}`
  }

  getStreamId(): string {
    return `${this.channelId}@${this.id}`
  }

  getLogos(): Collection {
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

    return this.logos.orderBy([format, size], ['desc', 'asc'], false)
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
}
