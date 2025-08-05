import { Collection, Dictionary } from '@freearhey/core'

export interface DataProcessorData {
  guideChannelsGroupedByStreamId: Dictionary
  feedsGroupedByChannelId: Dictionary
  logosGroupedByChannelId: Dictionary
  logosGroupedByStreamId: Dictionary
  feedsKeyByStreamId: Dictionary
  streamsGroupedById: Dictionary
  channelsKeyById: Dictionary
  guideChannels: Collection
  channels: Collection
  streams: Collection
  feeds: Collection
  logos: Collection
}
