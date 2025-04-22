import { DataLoaderData } from '../types/dataLoader'
import { Collection } from '@freearhey/core'
import { Channel, Feed, Guide, Stream } from '../models'

export class DataProcessor {
  constructor() {}

  process(data: DataLoaderData) {
    let channels = new Collection(data.channels).map(data => new Channel(data))
    const channelsKeyById = channels.keyBy((channel: Channel) => channel.id)

    const guides = new Collection(data.guides).map(data => new Guide(data))
    const guidesGroupedByStreamId = guides.groupBy((guide: Guide) => guide.getStreamId())

    const streams = new Collection(data.streams).map(data => new Stream(data))
    const streamsGroupedById = streams.groupBy((stream: Stream) => stream.getId())

    const feeds = new Collection(data.feeds).map(data =>
      new Feed(data)
        .withGuides(guidesGroupedByStreamId)
        .withStreams(streamsGroupedById)
        .withChannel(channelsKeyById)
    )
    const feedsGroupedByChannelId = feeds.groupBy((feed: Feed) => feed.channelId)

    channels = channels.map((channel: Channel) => channel.withFeeds(feedsGroupedByChannelId))

    return {
      feedsGroupedByChannelId,
      guidesGroupedByStreamId,
      streamsGroupedById,
      channelsKeyById,
      channels,
      streams,
      guides,
      feeds
    }
  }
}
