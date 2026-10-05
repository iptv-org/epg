import { WorkerGuideSource } from './worker'

export interface ApiGuideData {
  channel: string | null
  feed: string | null
  site: string
  site_id: string
  site_name: string
  lang: string | null
  sources?: WorkerGuideSource[]
}

export class ApiGuide {
  channel: string | null
  feed: string | null
  site: string
  site_id: string
  site_name: string
  lang: string
  sources: WorkerGuideSource[] = []

  constructor(data: ApiGuideData) {
    this.channel = data.channel || null
    this.feed = data.feed || null
    this.site = data.site
    this.site_id = data.site_id
    this.site_name = data.site_name
    this.lang = data.lang || 'en'
    this.sources = data.sources || []
  }

  addSource(source: ApiGuideSource): this {
    this.sources.push(source)

    return this
  }

  toJSON(): ApiGuideData {
    return {
      channel: this.channel,
      feed: this.feed,
      site: this.site,
      site_id: this.site_id,
      site_name: this.site_name,
      lang: this.lang,
      sources: this.sources
    }
  }
}
