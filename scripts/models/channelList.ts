import { Collection } from '@freearhey/core'
import epgGrabber from 'epg-grabber'

export class ChannelList {
  channels: Collection = new Collection()

  constructor(data: { channels: epgGrabber.Channel[] }) {
    this.channels = new Collection(data.channels)
  }

  add(channel: epgGrabber.Channel): this {
    this.channels.add(channel)

    return this
  }

  get(siteId: string): epgGrabber.Channel | undefined {
    return this.channels.find((channel: epgGrabber.Channel) => channel.site_id == siteId)
  }

  sort(): this {
    this.channels = this.channels.orderBy([
      (channel: epgGrabber.Channel) => channel.lang || '_',
      (channel: epgGrabber.Channel) => (channel.xmltv_id ? channel.xmltv_id.toLowerCase() : '0'),
      (channel: epgGrabber.Channel) => channel.site_id
    ])

    return this
  }

  toString() {
    function escapeString(value: string, defaultValue = '') {
      if (!value) return defaultValue

      const regex = new RegExp(
        '((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF' +
          'FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD' +
          'FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])' +
          '|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\' +
          'uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF' +
          '[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
          'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
          '(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))',
        'g'
      )

      value = String(value || '').replace(regex, '')

      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/\n|\r/g, ' ')
        .replace(/  +/g, ' ')
        .trim()
    }

    let output = '<?xml version="1.0" encoding="UTF-8"?>\r\n<channels>\r\n'

    this.channels.forEach((channel: epgGrabber.Channel) => {
      const logo = channel.logo ? ` logo="${channel.logo}"` : ''
      const xmltv_id = channel.xmltv_id ? escapeString(channel.xmltv_id) : ''
      const lang = channel.lang || ''
      const site_id = channel.site_id || ''
      const site = channel.site || ''
      const displayName = channel.name ? escapeString(channel.name) : ''

      output += `  <channel site="${site}" lang="${lang}" xmltv_id="${xmltv_id}" site_id="${site_id}"${logo}>${displayName}</channel>\r\n`
    })

    output += '</channels>\r\n'

    return output
  }
}
