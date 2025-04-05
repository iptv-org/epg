import { Collection } from '@freearhey/core'

type FeedData = {
  channel: string
  id: string
  name: string
  is_main: boolean
  broadcast_area: Collection
  languages: Collection
  timezones: Collection
  video_format: string
}

export class Feed {
  channelId: string
  id: string
  name: string
  isMain: boolean
  broadcastAreaCodes: Collection
  languageCodes: Collection
  timezoneIds: Collection
  videoFormat: string

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
}
