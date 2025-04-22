import { Collection, Dictionary } from '@freearhey/core'

export type DataProcessorData = {
  feedsGroupedByChannelId: Dictionary
  guidesGroupedByStreamId: Dictionary
  streamsGroupedById: Dictionary
  channelsKeyById: Dictionary
  channels: Collection
  streams: Collection
  guides: Collection
  feeds: Collection
}
