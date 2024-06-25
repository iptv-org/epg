import { SiteConfig } from 'epg-grabber'
import { pathToFileURL } from 'url'

export class ConfigLoader {
  async load(filepath: string): Promise<SiteConfig> {
    const fileUrl = pathToFileURL(filepath).toString()
    const config = (await import(fileUrl)).default
    const defaultConfig = {
      days: 2,
      delay: 0,
      output: 'guide.xml',
      request: {
        method: 'GET',
        maxContentLength: 5242880,
        timeout: 30000,
        withCredentials: true,
        jar: null,
        responseType: 'arraybuffer',
        cache: false,
        headers: null,
        data: null
      },
      maxConnections: 1,
      site: undefined,
      url: undefined,
      parser: undefined,
      channels: undefined
    }

    return { ...defaultConfig, ...config }
  }
}
