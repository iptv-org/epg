import { parseChannels } from 'epg-grabber'
import { Storage, Collection } from '@freearhey/core'

type ChannelsParserProps = {
  storage: Storage
}

export class ChannelsParser {
  storage: Storage

  constructor({ storage }: ChannelsParserProps) {
    this.storage = storage
  }

  async parse(filepath: string) {
    let parsedChannels = new Collection()

    const content = await this.storage.load(filepath)
    const channels = parseChannels(content)
    parsedChannels = parsedChannels.concat(new Collection(channels))

    return parsedChannels
  }
}
