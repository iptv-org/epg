import { Channel } from 'epg-grabber'
import { Logger, Storage, Collection } from '@freearhey/core'
import { IssueLoader, HTMLTable, ChannelsParser } from '../../core'
import { Issue, Site } from '../../models'
import { SITES_DIR, ROOT_DIR } from '../../constants'

async function main() {
  const logger = new Logger({ disabled: true })
  const loader = new IssueLoader()
  const sitesStorage = new Storage(SITES_DIR)
  const channelsParser = new ChannelsParser({ storage: sitesStorage })
  const sites = new Collection()

  logger.info('loading list of sites')
  const folders = await sitesStorage.list('*/')

  logger.info('loading issues...')
  const issues = await loadIssues(loader)

  logger.info('putting the data together...')
  for (const domain of folders) {
    const filteredIssues = issues.filter((issue: Issue) => domain === issue.data.get('site'))
    const site = new Site({
      domain,
      issues: filteredIssues
    })

    const files = await sitesStorage.list(`${domain}/*.channels.xml`)
    for (const filepath of files) {
      const channels = await channelsParser.parse(filepath)

      site.totalChannels += channels.count()
      site.markedChannels += channels.filter((channel: Channel) => channel.xmltv_id).count()
    }

    sites.add(site)
  }

  logger.info('creating sites table...')
  const data = new Collection()
  sites.forEach((site: Site) => {
    data.add([
      { value: `<a href="sites/${site.domain}">${site.domain}</a>` },
      { value: site.totalChannels, align: 'right' },
      { value: site.markedChannels, align: 'right' },
      { value: site.getStatus().emoji, align: 'center' },
      { value: site.getIssues().all().join(', ') }
    ])
  })

  logger.info('updating sites.md...')
  const table = new HTMLTable(data.all(), [
    { name: 'Site', align: 'left' },
    { name: 'Channels<br>(total / with xmltv-id)', colspan: 2, align: 'left' },
    { name: 'Status', align: 'left' },
    { name: 'Notes', align: 'left' }
  ])
  const rootStorage = new Storage(ROOT_DIR)
  const sitesTemplate = await new Storage().load('scripts/templates/_sites.md')
  const sitesContent = sitesTemplate.replace('_TABLE_', table.toString())
  await rootStorage.save('SITES.md', sitesContent)
}

main()

async function loadIssues(loader: IssueLoader) {
  const issuesWithStatusWarning = await loader.load({ labels: ['broken guide', 'status:warning'] })
  const issuesWithStatusDown = await loader.load({ labels: ['broken guide', 'status:down'] })

  return issuesWithStatusWarning.concat(issuesWithStatusDown)
}
