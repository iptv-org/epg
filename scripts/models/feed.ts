import { Collection, Dictionary } from '@freearhey/core'
import { FeedData } from '../types/feed'
import { Channel } from './channel'

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
  guides?: Collection
  streams?: Collection

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

  withGuides(guidesGroupedByStreamId: Dictionary): this {
    this.guides = new Collection(guidesGroupedByStreamId.get(`${this.channelId}@${this.id}`))

    if (this.isMain) {
      this.guides = this.guides.concat(new Collection(guidesGroupedByStreamId.get(this.channelId)))
    }

    return this
  }

  getGuides(): Collection {
    if (!this.guides) return new Collection()

    return this.guides
  }

  getStreams(): Collection {
    if (!this.streams) return new Collection()

    return this.streams
  }

  getFullName(): string {
    if (!this.channel) return ''

    return `${this.channel.name} ${this.name}`
  }
}
