import { parseChannels } from 'epg-grabber'
import { Storage } from '@freearhey/core'
import { ChannelList } from '../models'

interface ChannelsParserProps {
  storage: Storage
}

export class ChannelsParser {
  storage: Storage

  constructor({ storage }: ChannelsParserProps) {
    this.storage = storage
  }

  async parse(filepath: string): Promise<ChannelList> {
    const content = await this.storage.load(filepath)
    const parsed = parseChannels(content)

    return new ChannelList({ channels: parsed })
  }
}
