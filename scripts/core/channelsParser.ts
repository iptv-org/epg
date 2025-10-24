import { EPGGrabber } from 'epg-grabber'
import { Storage } from '@freearhey/storage-js'
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
    const parsed = EPGGrabber.parseChannelsXML(content)

    return new ChannelList({ channels: parsed })
  }
}
