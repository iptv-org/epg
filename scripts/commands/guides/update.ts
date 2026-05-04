import { HTMLTableRow, HTMLTableDataItem, HTMLTableColumn } from '../../types/htmlTable'
import { Worker, WorkerData, WorkerGuideSource } from '../../models'
import { DATA_DIR, ROOT_DIR } from '../../constants'
import { Storage } from '@freearhey/storage-js'
import { Collection } from '@freearhey/core'
import { Logger } from '@freearhey/core'
import { HTMLTable } from '../../core'

async function main() {
  const logger = new Logger({ level: process.env.NODE_ENV === 'test' ? -999 : 3 })
  const dataStorage = new Storage(DATA_DIR)

  logger.info('loading workers.json...')
  const workers = await dataStorage.json('workers.json')

  if (!Array.isArray(workers)) return

  logger.info('creating guides table...')
  const rows = new Collection<HTMLTableRow>()
  workers.forEach((data: WorkerData) => {
    const worker = new Worker(data)

    const sources = worker.getGuideSources()
    rows.add(
      new Collection<HTMLTableDataItem>([
        { value: worker.host },
        { value: worker.getStatusEmoji(), align: 'center' },
        { value: worker.getChannelsCount().toString(), align: 'right' },
        { value: worker.getLastUpdated(), align: 'left' },
        {
          value: sources.length
            ? sources
                .map((source: WorkerGuideSource) => `<a href="${source.url}">${source.format}</a>`)
                .join(' | ')
            : '-'
        }
      ])
    )
  })

  logger.info('updating guides.md...')
  const rootStorage = new Storage(ROOT_DIR)
  const table = new HTMLTable(
    rows,
    new Collection<HTMLTableColumn>([
      { name: 'Host', align: 'left' },
      { name: 'Status', align: 'left' },
      { name: 'Channels', align: 'left' },
      { name: 'Last Updated', align: 'left' },
      { name: 'Links', align: 'left' }
    ])
  )
  const guidesTemplate = await new Storage().load('scripts/templates/_guides.md')
  const guidesContent = guidesTemplate.replace('_TABLE_', table.toString())
  await rootStorage.save('GUIDES.md', guidesContent)
}

main()
