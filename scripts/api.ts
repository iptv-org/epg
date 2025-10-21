import { Collection, Dictionary } from '@freearhey/core'
import { DATA_DIR } from './constants'
import cliProgress from 'cli-progress'
import * as sdk from '@iptv-org/sdk'

const data = {
  channelsKeyById: new Dictionary<sdk.Models.Channel>(),
  feedsKeyByStreamId: new Dictionary<sdk.Models.Feed>(),
  feedsGroupedByChannelId: new Dictionary<sdk.Models.Feed[]>()
}

interface SearchIndex {
  search: (query: string) => sdk.Types.ChannelSearchableData[]
}

let searchIndex: SearchIndex

async function loadData() {
  const dataManager = new sdk.DataManager({ dataDir: DATA_DIR })
  await dataManager.loadFromDisk()
  dataManager.processData()

  const { channels, feeds } = dataManager.getProcessedData()

  data.channelsKeyById = channels.keyBy((channel: sdk.Models.Channel) => channel.id)
  data.feedsKeyByStreamId = feeds.keyBy((feed: sdk.Models.Feed) => feed.getStreamId())
  data.feedsGroupedByChannelId = feeds.groupBy((feed: sdk.Models.Feed) => feed.channel)

  searchIndex = sdk.SearchEngine.createIndex<sdk.Models.Channel>(channels)
}

async function downloadData() {
  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const files = [
    'blocklist',
    'categories',
    'channels',
    'cities',
    'countries',
    'feeds',
    'guides',
    'languages',
    'logos',
    'regions',
    'streams',
    'subdivisions',
    'timezones'
  ]

  const multiBar = new cliProgress.MultiBar({
    stopOnComplete: true,
    hideCursor: true,
    forceRedraw: true,
    barsize: 36,
    format(options, params, payload) {
      const filename = payload.filename.padEnd(18, ' ')
      const barsize = options.barsize || 40
      const percent = (params.progress * 100).toFixed(2)
      const speed = payload.speed ? formatBytes(payload.speed) + '/s' : 'N/A'
      const total = formatBytes(params.total)
      const completeSize = Math.round(params.progress * barsize)
      const incompleteSize = barsize - completeSize
      const bar =
        options.barCompleteString && options.barIncompleteString
          ? options.barCompleteString.substr(0, completeSize) +
            options.barGlue +
            options.barIncompleteString.substr(0, incompleteSize)
          : '-'.repeat(barsize)

      return `${filename} [${bar}] ${percent}% | ETA: ${params.eta}s | ${total} | ${speed}`
    }
  })

  const dataManager = new sdk.DataManager({ dataDir: DATA_DIR })

  let requests: Promise<unknown>[] = []
  for (let basename of files) {
    const filename = `${basename}.json`
    const progressBar = multiBar.create(0, 0, { filename })
    const request = dataManager.downloadFileToDisk(basename, {
      onDownloadProgress({ total, loaded, rate }) {
        if (total) progressBar.setTotal(total)
        progressBar.update(loaded, { speed: rate })
      }
    })

    requests.push(request)
  }

  await Promise.allSettled(requests).catch(console.error)
}

function searchChannels(query: string): Collection<sdk.Models.Channel> {
  if (!searchIndex) return new Collection<sdk.Models.Channel>()

  const results = searchIndex.search(query)

  const channels = new Collection<sdk.Models.Channel>()

  new Collection<sdk.Types.ChannelSearchableData>(results).forEach(
    (item: sdk.Types.ChannelSearchableData) => {
      const channel = data.channelsKeyById.get(item.id)
      if (channel) channels.add(channel)
    }
  )

  return channels
}

export { data, loadData, downloadData, searchChannels }
