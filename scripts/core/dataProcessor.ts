import { Channel, Feed, GuideChannel, Logo, Stream } from '../models'
import { DataLoaderData } from '../types/dataLoader'
import { Collection } from '@freearhey/core'

export class DataProcessor {
  
  process(data: DataLoaderData) {
    let channels = new Collection(data.channels).map(data => new Channel(data))
    const channelsKeyById = channels.keyBy((channel: Channel) => channel.id)

    const guideChannels = new Collection(data.guides).map(data => new GuideChannel(data))
    const guideChannelsGroupedByStreamId = guideChannels.groupBy((channel: GuideChannel) =>
      channel.getStreamId()
    )

    const streams = new Collection(data.streams).map(data => new Stream(data))
    const streamsGroupedById = streams.groupBy((stream: Stream) => stream.getId())

    let feeds = new Collection(data.feeds).map(data =>
      new Feed(data)
        .withGuideChannels(guideChannelsGroupedByStreamId)
        .withStreams(streamsGroupedById)
        .withChannel(channelsKeyById)
    )
    const feedsKeyByStreamId = feeds.keyBy((feed: Feed) => feed.getStreamId())

    const logos = new Collection(data.logos).map(data =>
      new Logo(data).withFeed(feedsKeyByStreamId)
    )
    const logosGroupedByChannelId = logos.groupBy((logo: Logo) => logo.channelId)
    const logosGroupedByStreamId = logos.groupBy((logo: Logo) => logo.getStreamId())

    feeds = feeds.map((feed: Feed) => feed.withLogos(logosGroupedByStreamId))
    const feedsGroupedByChannelId = feeds.groupBy((feed: Feed) => feed.channelId)

    channels = channels.map((channel: Channel) =>
      channel.withFeeds(feedsGroupedByChannelId).withLogos(logosGroupedByChannelId)
    )

    return {
      guideChannelsGroupedByStreamId,
      feedsGroupedByChannelId,
      logosGroupedByChannelId,
      logosGroupedByStreamId,
      streamsGroupedById,
      feedsKeyByStreamId,
      channelsKeyById,
      guideChannels,
      channels,
      streams,
      feeds,
      logos
    }
  }
}
