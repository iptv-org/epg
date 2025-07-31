import { IssueLoader, HTMLTable, ChannelsParser } from '../../core'
import { Logger, Storage, Collection } from '@freearhey/core'
import { ChannelList, Issue, Site } from '../../models'
import { SITES_DIR, ROOT_DIR } from '../../constants'
import { Channel } from 'epg-grabber'

async function main() {
  const logger = new Logger({ level: -999 })
  const issueLoader = new IssueLoader()
  const sitesStorage = new Storage(SITES_DIR)
  const sites = new Collection()

  logger.info('loading channels...')
  const channelsParser = new ChannelsParser({
    storage: sitesStorage
  })

  logger.info('loading list of sites')
  const folders = await sitesStorage.list('*/')

  logger.info('loading issues...')
  const issues = await issueLoader.load()

  logger.info('putting the data together...')
  const brokenGuideReports = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'broken guide')
  )
  for (const domain of folders) {
    const filteredIssues = brokenGuideReports.filter(
      (issue: Issue) => domain === issue.data.get('site')
    )

    const site = new Site({
      domain,
      issues: filteredIssues
    })

    const files = await sitesStorage.list(`${domain}/*.channels.xml`)
    for (const filepath of files) {
      const channelList: ChannelList = await channelsParser.parse(filepath)

      site.totalChannels += channelList.channels.count()
      site.markedChannels += channelList.channels
        .filter((channel: Channel) => channel.xmltv_id)
        .count()
    }

    sites.add(site)
  }

  logger.info('creating sites table...')
  const tableData = new Collection()
  sites.forEach((site: Site) => {
    tableData.add([
      { value: `<a href="sites/${site.domain}">${site.domain}</a>` },
      { value: site.totalChannels, align: 'right' },
      { value: site.markedChannels, align: 'right' },
      { value: site.getStatus().emoji, align: 'center' },
      { value: site.getIssues().all().join(', ') }
    ])
  })

  logger.info('updating sites.md...')
  const table = new HTMLTable(tableData.all(), [
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
