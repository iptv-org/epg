import { SiteConfig } from 'epg-grabber'
import _ from 'lodash'

export class ConfigLoader {
  async load(filepath: string): Promise<SiteConfig> {
    const config = (await import(filepath)).default

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
