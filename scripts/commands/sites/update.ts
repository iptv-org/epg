import { Logger, Storage, Collection } from '@freearhey/core'
import { IssueLoader, HTMLTable, Markdown } from '../../core'
import { Issue, Site } from '../../models'
import { SITES_DIR, DOT_SITES_DIR } from '../../constants'
import path from 'path'

async function main() {
  const logger = new Logger({ disabled: true })
  const loader = new IssueLoader()
  const storage = new Storage(SITES_DIR)
  const sites = new Collection()

  logger.info('loading list of sites')
  const folders = await storage.list('*/')

  logger.info('loading issues...')
  const issues = await loadIssues(loader)

  logger.info('putting the data together...')
  folders.forEach((domain: string) => {
    const filteredIssues = issues.filter((issue: Issue) => domain === issue.data.get('site'))
    const site = new Site({
      domain,
      issues: filteredIssues
    })

    sites.add(site)
  })

  logger.info('creating sites table...')
  const data = new Collection()
  sites.forEach((site: Site) => {
    data.add([
      `<a href="sites/${site.domain}">${site.domain}</a>`,
      site.getStatus().emoji,
      site.getIssues().all().join(', ')
    ])
  })

  const table = new HTMLTable(data.all(), [{ name: 'Site' }, { name: 'Status' }, { name: 'Notes' }])

  const readmeStorage = new Storage(DOT_SITES_DIR)
  await readmeStorage.save('_table.md', table.toString())

  logger.info('updating sites.md...')
  const configPath = path.join(DOT_SITES_DIR, 'config.json')
  const sitesMarkdown = new Markdown(configPath)
  sitesMarkdown.compile()
}

main()

async function loadIssues(loader: IssueLoader) {
  const issuesWithStatusWarning = await loader.load({ labels: ['broken guide', 'status:warning'] })
  const issuesWithStatusDown = await loader.load({ labels: ['broken guide', 'status:down'] })

  return issuesWithStatusWarning.concat(issuesWithStatusDown)
}
