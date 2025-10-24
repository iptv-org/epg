import { loadData, data, searchChannels } from '../../api'
import epgGrabber, { EPGGrabber } from 'epg-grabber'
import { Collection, Logger } from '@freearhey/core'
import { select, input } from '@inquirer/prompts'
import { generateChannelsXML } from '../../core'
import { Storage } from '@freearhey/storage-js'
import { Channel } from '../../models'
import nodeCleanup from 'node-cleanup'
import * as sdk from '@iptv-org/sdk'
import { Command } from 'commander'
import readline from 'readline'

interface ChoiceValue {
  type: string
  value?: sdk.Models.Feed | sdk.Models.Channel
}
interface Choice {
  name: string
  short?: string
  value: ChoiceValue
  default?: boolean
}

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
let channelsFromXML = new Collection<Channel>()

main(filepath)
nodeCleanup(() => {
  save(filepath, channelsFromXML)
})

export default async function main(filepath: string) {
  if (!(await storage.exists(filepath))) {
    throw new Error(`File "${filepath}" does not exists`)
  }

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading channels...')
  const xml = await storage.load(filepath)
  const parsedChannels = EPGGrabber.parseChannelsXML(xml)
  channelsFromXML = new Collection(parsedChannels).map(
    (channel: epgGrabber.Channel) => new Channel(channel.toObject())
  )
  const channelsFromXMLWithoutId = channelsFromXML.filter((channel: Channel) => !channel.xmltv_id)

  logger.info(
    `found ${channelsFromXML.count()} channels (including ${channelsFromXMLWithoutId.count()} without ID)`
  )

  logger.info('starting...')
  console.log()

  for (const channel of channelsFromXMLWithoutId.all()) {
    try {
      channel.xmltv_id = await selectChannel(channel)
    } catch {
      break
    }
  }

  channelsFromXMLWithoutId.forEach((channel: epgGrabber.Channel) => {
    if (channel.xmltv_id === '-') {
      channel.xmltv_id = ''
    }
  })
}

async function selectChannel(channel: epgGrabber.Channel): Promise<string> {
  const query = escapeRegex(channel.name)
  const similarChannels = searchChannels(query)
  const choices = getChoicesForChannel(similarChannels).all()

  const selected: ChoiceValue = await select({
    message: `Select channel ID for "${channel.name}" (${channel.site_id}):`,
    choices,
    pageSize: 10
  })

  switch (selected.type) {
    case 'skip':
      return '-'
    case 'type': {
      const typedChannelId = await input({ message: '  Channel ID:' })
      if (!typedChannelId) return ''
      const selectedFeedId = await selectFeed(typedChannelId)
      if (selectedFeedId === '-') return typedChannelId
      return [typedChannelId, selectedFeedId].join('@')
    }
    case 'channel': {
      const selectedChannel = selected.value
      if (!selectedChannel) return ''
      const selectedFeedId = await selectFeed(selectedChannel.id || '')
      if (selectedFeedId === '-') return selectedChannel.id || ''
      return [selectedChannel.id, selectedFeedId].join('@')
    }
  }

  return ''
}

async function selectFeed(channelId: string): Promise<string> {
  const channelFeeds = new Collection(data.feedsGroupedByChannelId.get(channelId))
  const choices = getChoicesForFeed(channelFeeds).all()

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
      return selectedFeed.id || ''
  }

  return ''
}

function getChoicesForChannel(channels: Collection<sdk.Models.Channel>): Collection<Choice> {
  const choices = new Collection<Choice>()

  channels.forEach((channel: sdk.Models.Channel) => {
    const names = new Collection([channel.name, ...channel.alt_names]).uniq().join(', ')

    choices.add({
      value: {
        type: 'channel',
        value: channel
      },
      name: `${channel.id} (${names})`,
      short: `${channel.id}`
    })
  })

  choices.add({ name: 'Type...', value: { type: 'type' } })
  choices.add({ name: 'Skip', value: { type: 'skip' } })

  return choices
}

function getChoicesForFeed(feeds: Collection<sdk.Models.Feed>): Collection<Choice> {
  const choices = new Collection<Choice>()

  feeds.forEach((feed: sdk.Models.Feed) => {
    let name = `${feed.id} (${feed.name})`
    if (feed.is_main) name += ' [main]'

    choices.add({
      value: {
        type: 'feed',
        value: feed
      },
      default: feed.is_main,
      name,
      short: feed.id
    })
  })

  choices.add({ name: 'Type...', value: { type: 'type' } })
  choices.add({ name: 'Skip', value: { type: 'skip' } })

  return choices
}

function save(filepath: string, channelsFromXML: Collection<Channel>) {
  if (!storage.existsSync(filepath)) return
  const xml = generateChannelsXML(channelsFromXML)
  storage.saveSync(filepath, xml)
  console.log()
  logger.info(`File '${filepath}' successfully saved`)
}

function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}
