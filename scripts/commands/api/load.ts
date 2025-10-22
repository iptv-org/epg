import { DATA_DIR } from '../../constants.js'
import { DataLoader } from '../../core/dataLoader.js'

async function main() {
  const { Storage } = await import('@freearhey/storage-js')
  const storage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage })

  await Promise.all([
    loader.download('blocklist.json'),
    loader.download('categories.json'),
    loader.download('channels.json'),
    loader.download('countries.json'),
    loader.download('languages.json'),
    loader.download('regions.json'),
    loader.download('subdivisions.json'),
    loader.download('feeds.json'),
    loader.download('timezones.json'),
    loader.download('guides.json'),
    loader.download('streams.json'),
    loader.download('logos.json')
  ])
}

main()
