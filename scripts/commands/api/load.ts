import { Logger } from '@freearhey/core'
import { ApiClient } from '../../core'

async function main() {
  const logger = new Logger()
  const client = new ApiClient({ logger })

  const requests = [
    client.download('channels.json'),
    client.download('feeds.json'),
    client.download('countries.json'),
    client.download('regions.json'),
    client.download('subdivisions.json')
  ]

  await Promise.all(requests)
}

main()
