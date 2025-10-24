import * as epgGrabber from 'epg-grabber'
import _ from 'lodash'

const _default = {
  days: 1,
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
  channels: undefined,
  lang: 'en',
  debug: false,
  gzip: false,
  curl: false,
  logo: ''
}

export class SiteConfig {
  days: number
  lang: string
  delay: number
  debug: boolean
  gzip: boolean
  curl: boolean
  maxConnections: number
  output: string
  request: epgGrabber.Types.SiteConfigRequestConfig
  site: string
  channels?: string | string[]
  url: ((context: epgGrabber.Types.SiteConfigRequestContext) => string | Promise<string>) | string
  parser: (
    context: epgGrabber.Types.SiteConfigParserContext
  ) =>
    | epgGrabber.Types.SiteConfigParserResult[]
    | Promise<epgGrabber.Types.SiteConfigParserResult[]>
  logo: ((context: epgGrabber.Types.SiteConfigRequestContext) => string | Promise<string>) | string
  filepath: string

  constructor(config: epgGrabber.Types.SiteConfigObject) {
    this.site = config.site
    this.channels = config.channels
    this.url = config.url
    this.parser = config.parser
    this.filepath = config.filepath

    this.days = config.days || _default.days
    this.lang = config.lang || _default.lang
    this.delay = config.delay || _default.delay
    this.debug = config.debug || _default.debug
    this.maxConnections = config.maxConnections || _default.maxConnections
    this.gzip = config.gzip || _default.gzip
    this.curl = config.curl || _default.curl
    this.output = config.output || _default.output
    this.logo = config.logo || _default.logo

    this.request = _.merge(_default.request, config.request)
  }
}
