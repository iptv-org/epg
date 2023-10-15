import { SiteConfig } from 'epg-grabber'
import _ from 'lodash'
import { pathToFileURL } from 'url'

export class ConfigLoader {
  async load(filepath: string): Promise<SiteConfig> {
    const fileUrl = pathToFileURL(filepath).toString()
    const config = (await import(fileUrl)).default

    return _.merge(
      {
        delay: 0,
        maxConnections: 1,
        request: {
          timeout: 30000
        }
      },
      config
    )
  }
}
