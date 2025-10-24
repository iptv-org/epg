import { HTMLTableDataItem, HTMLTableRow, HTMLTableColumn } from '../../types/htmlTable'
import { SITES_DIR, ROOT_DIR } from '../../constants'
import { Logger, Collection } from '@freearhey/core'
import { Issue, Site, Channel } from '../../models'
import { HTMLTable, loadIssues } from '../../core'
import { Storage } from '@freearhey/storage-js'
import * as epgGrabber from 'epg-grabber'
import { EPGGrabber } from 'epg-grabber'

async function main() {
  const logger = new Logger({ level: -999 })
  const sitesStorage = new Storage(SITES_DIR)
  const sites = new Collection<Site>()

  logger.info('loading list of sites')
  const folders = await sitesStorage.list('*/')

  logger.info('loading issues...')
  const issues = await loadIssues()

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
      const xml = await sitesStorage.load(filepath)
      const channelsFromXML = EPGGrabber.parseChannelsXML(xml)
      const channels = new Collection(channelsFromXML).map(
        (channel: epgGrabber.Channel) => new Channel(channel.toObject())
      )

      site.totalChannels += channels.count()
      site.markedChannels += channels.filter((channel: Channel) => channel.xmltv_id).count()
    }

    sites.add(site)
  }

  logger.info('creating sites table...')
  const rows = new Collection<HTMLTableRow>()
  sites.forEach((site: Site) => {
    rows.add(
      new Collection<HTMLTableDataItem>([
        { value: `<a href="sites/${site.domain}">${site.domain}</a>` },
        { value: site.totalChannels.toString(), align: 'right' },
        { value: site.markedChannels.toString(), align: 'right' },
        { value: site.getStatus().emoji, align: 'center' },
        { value: site.getIssueUrls().all().join(', ') }
      ])
    )
  })

  logger.info('updating sites.md...')
  const table = new HTMLTable(
    rows,
    new Collection<HTMLTableColumn>([
      { name: 'Site', align: 'left' },
      { name: 'Channels<br>(total / with xmltv-id)', colspan: 2, align: 'left' },
      { name: 'Status', align: 'left' },
      { name: 'Notes', align: 'left' }
    ])
  )
  const rootStorage = new Storage(ROOT_DIR)
  const sitesTemplate = await new Storage().load('scripts/templates/_sites.md')
  const sitesContent = sitesTemplate.replace('_TABLE_', table.toString())
  await rootStorage.save('SITES.md', sitesContent)
}

main()
