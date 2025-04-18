import { Storage, Collection, Logger, Dictionary } from '@freearhey/core'
import { select, input } from '@inquirer/prompts'
import { ChannelsParser, XML } from '../../core'
import { Channel, Feed } from '../../models'
import { DATA_DIR } from '../../constants'
import nodeCleanup from 'node-cleanup'
import { Command } from 'commander'
import readline from 'readline'
import sjs from '@freearhey/search-js'
import { DataProcessor, DataLoader } from '../../core'
import type { DataLoaderData } from '../../types/dataLoader'
import type { DataProcessorData } from '../../types/dataProcessor'
import epgGrabber from 'epg-grabber'
import { ChannelSearchableData } from '../../types/channel'

type ChoiceValue = { type: string; value?: Feed | Channel }
type Choice = { name: string; short?: string; value: ChoiceValue; default?: boolean }

if (process.platform === 'win32') {
  readline
    .createInterface({
      input: process.stdin,
      output: process.stdout
    })
    .on('SIGINT', function () {
      process.emit('SIGINT')
    })
}

const program = new Command()

program.argument('<filepath>', 'Path to *.channels.xml file to edit').parse(process.argv)

const filepath = program.args[0]
const logger = new Logger()
const storage = new Storage()
let parsedChannels = new Collection()

main(filepath)
nodeCleanup(() => {
  save(filepath)
})

export default async function main(filepath: string) {
  if (!(await storage.exists(filepath))) {
    throw new Error(`File "${filepath}" does not exists`)
  }

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const { feedsGroupedByChannelId, channels, channelsKeyById }: DataProcessorData =
    processor.process(data)

  logger.info('loading channels...')
  const parser = new ChannelsParser({ storage })
  parsedChannels = await parser.parse(filepath)
  const parsedChannelsWithoutId = parsedChannels.filter(
    (channel: epgGrabber.Channel) => !channel.xmltv_id
  )

  logger.info(
    `found ${parsedChannels.count()} channels (including ${parsedChannelsWithoutId.count()} without ID)`
  )

  logger.info('creating search index...')
  const items = channels.map((channel: Channel) => channel.getSearchable()).all()
  const searchIndex = sjs.createIndex(items, {
    searchable: ['name', 'altNames', 'guideNames', 'streamNames', 'feedFullNames']
  })

  logger.info('starting...\n')

  for (const parsedChannel of parsedChannelsWithoutId.all()) {
    try {
      parsedChannel.xmltv_id = await selectChannel(
        parsedChannel,
        searchIndex,
        feedsGroupedByChannelId,
        channelsKeyById
      )
    } catch (err) {
      logger.info(err.message)
      break
    }
  }

  parsedChannelsWithoutId.forEach((channel: epgGrabber.Channel) => {
    if (channel.xmltv_id === '-') {
      channel.xmltv_id = ''
    }
  })
}

async function selectChannel(
  channel: epgGrabber.Channel,
  searchIndex,
  feedsGroupedByChannelId: Dictionary,
  channelsKeyById: Dictionary
): Promise<string> {
  const query = escapeRegex(channel.name)
  const similarChannels = searchIndex
    .search(query)
    .map((item: ChannelSearchableData) => channelsKeyById.get(item.id))

  const selected: ChoiceValue = await select({
    message: `Select channel ID for "${channel.name}" (${channel.site_id}):`,
    choices: getChannelChoises(new Collection(similarChannels)),
    pageSize: 10
  })

  switch (selected.type) {
    case 'skip':
      return '-'
    case 'type': {
      const typedChannelId = await input({ message: '  Channel ID:' })
      if (!typedChannelId) return ''
      const selectedFeedId = await selectFeed(typedChannelId, feedsGroupedByChannelId)
      if (selectedFeedId === '-') return typedChannelId
      return [typedChannelId, selectedFeedId].join('@')
    }
    case 'channel': {
      const selectedChannel = selected.value
      if (!selectedChannel) return ''
      const selectedFeedId = await selectFeed(selectedChannel.id, feedsGroupedByChannelId)
      if (selectedFeedId === '-') return selectedChannel.id
      return [selectedChannel.id, selectedFeedId].join('@')
    }
  }

  return ''
}

async function selectFeed(channelId: string, feedsGroupedByChannelId: Dictionary): Promise<string> {
  const channelFeeds = feedsGroupedByChannelId.has(channelId)
    ? new Collection(feedsGroupedByChannelId.get(channelId))
    : new Collection()
  const choices = getFeedChoises(channelFeeds)

  const selected: ChoiceValue = await select({
    message: `Select feed ID for "${channelId}":`,
    choices,
    pageSize: 10
  })

  switch (selected.type) {
    case 'skip':
      return '-'
    case 'type':
      return await input({ message: '  Feed ID:', default: 'SD' })
    case 'feed':
      const selectedFeed = selected.value
      if (!selectedFeed) return ''
      return selectedFeed.id
  }

  return ''
}

function getChannelChoises(channels: Collection): Choice[] {
  const choises: Choice[] = []

  channels.forEach((channel: Channel) => {
    const names = new Collection([channel.name, ...channel.getAltNames().all()]).uniq().join(', ')

    choises.push({
      value: {
        type: 'channel',
        value: channel
      },
      name: `${channel.id} (${names})`,
      short: `${channel.id}`
    })
  })

  choises.push({ name: 'Type...', value: { type: 'type' } })
  choises.push({ name: 'Skip', value: { type: 'skip' } })

  return choises
}

function getFeedChoises(feeds: Collection): Choice[] {
  const choises: Choice[] = []

  feeds.forEach((feed: Feed) => {
    let name = `${feed.id} (${feed.name})`
    if (feed.isMain) name += ' [main]'

    choises.push({
      value: {
        type: 'feed',
        value: feed
      },
      default: feed.isMain,
      name,
      short: feed.id
    })
  })

  choises.push({ name: 'Type...', value: { type: 'type' } })
  choises.push({ name: 'Skip', value: { type: 'skip' } })

  return choises
}

function save(filepath: string) {
  if (!storage.existsSync(filepath)) return
  const xml = new XML(parsedChannels)
  storage.saveSync(filepath, xml.toString())
  logger.info(`\nFile '${filepath}' successfully saved`)
}

function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}
