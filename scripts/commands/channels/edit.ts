import { Storage, Collection, Logger, Dictionary } from '@freearhey/core'
import { select, input } from '@inquirer/prompts'
import { ChannelsParser, XML } from '../../core'
import { Channel, Feed } from '../../models'
import { DATA_DIR } from '../../constants'
import nodeCleanup from 'node-cleanup'
import epgGrabber from 'epg-grabber'
import { Command } from 'commander'
import readline from 'readline'
import Fuse from 'fuse.js'

type ChoiceValue = { type: string; value?: Feed | Channel }
type Choice = { name: string; short?: string; value: ChoiceValue }

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

  const parser = new ChannelsParser({ storage })
  parsedChannels = await parser.parse(filepath)

  const dataStorage = new Storage(DATA_DIR)
  const channelsData = await dataStorage.json('channels.json')
  const channels = new Collection(channelsData).map(data => new Channel(data))
  const feedsData = await dataStorage.json('feeds.json')
  const feeds = new Collection(feedsData).map(data => new Feed(data))
  const feedsGroupedByChannelId = feeds.groupBy((feed: Feed) => feed.channelId)

  const searchIndex: Fuse<Channel> = new Fuse(channels.all(), {
    keys: ['name', 'alt_names'],
    threshold: 0.4
  })

  for (const channel of parsedChannels.all()) {
    if (channel.xmltv_id) continue
    try {
      channel.xmltv_id = await selectChannel(channel, searchIndex, feedsGroupedByChannelId)
    } catch {
      break
    }
  }

  parsedChannels.forEach((channel: epgGrabber.Channel) => {
    if (channel.xmltv_id === '-') {
      channel.xmltv_id = ''
    }
  })
}

async function selectChannel(
  channel: epgGrabber.Channel,
  searchIndex: Fuse<Channel>,
  feedsGroupedByChannelId: Dictionary
): Promise<string> {
  const similarChannels = searchIndex
    .search(channel.name)
    .map((result: { item: Channel }) => result.item)

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
      const typedFeedId = await input({ message: '  Feed ID:', default: 'SD' })
      return [typedChannelId, typedFeedId].join('@')
    }
    case 'channel': {
      const selectedChannel = selected.value
      if (!selectedChannel) return ''
      const selectedFeedId = await selectFeed(selectedChannel.id, feedsGroupedByChannelId)
      return [selectedChannel.id, selectedFeedId].join('@')
    }
  }

  return ''
}

async function selectFeed(channelId: string, feedsGroupedByChannelId: Dictionary): Promise<string> {
  const channelFeeds = feedsGroupedByChannelId.get(channelId) || []
  if (channelFeeds.length <= 1) return ''

  const selected: ChoiceValue = await select({
    message: `Select feed ID for "${channelId}":`,
    choices: getFeedChoises(channelFeeds),
    pageSize: 10
  })

  switch (selected.type) {
    case 'type':
      return await input({ message: '  Feed ID:' })
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
    const names = [channel.name, ...channel.altNames.all()].join(', ')

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
      name,
      short: feed.id
    })
  })

  choises.push({ name: 'Type...', value: { type: 'type' } })

  return choises
}

function save(filepath: string) {
  if (!storage.existsSync(filepath)) return
  const xml = new XML(parsedChannels)
  storage.saveSync(filepath, xml.toString())
  logger.info(`\nFile '${filepath}' successfully saved`)
}
