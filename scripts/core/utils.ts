import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { TESTING, OWNER, REPO, EOL } from '../constants'
import { Collection } from '@freearhey/core'
import { Channel } from '../models/channel'
import { AxiosProxyConfig } from 'axios'
import { Octokit } from '@octokit/core'
import { pathToFileURL } from 'url'
import { Issue } from '../models'
import { URL } from 'node:url'

export function generateChannelsXML(channels: Collection<Channel>): string {
  let output = `<?xml version="1.0" encoding="UTF-8"?>${EOL}<channels>${EOL}`

  channels.forEach((channel: Channel) => {
    const logo = channel.logo ? ` logo="${escapeString(channel.logo)}"` : ''
    const xmltv_id = channel.xmltv_id ? escapeString(channel.xmltv_id) : ''
    const lang = channel.lang || ''
    const site_id = channel.site_id ? escapeString(channel.site_id) : ''
    const site = channel.site || ''
    const displayName = channel.name ? escapeString(channel.name) : ''

    output += `  <channel site="${site}" site_id="${site_id}" lang="${lang}"${logo} xmltv_id="${xmltv_id}">${displayName}</channel>${EOL}`
  })

  output += `</channels>${EOL}`

  return output
}

export function escapeString(value: string, defaultValue = '') {
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

export function parseProxy(string: string): AxiosProxyConfig {
  const parsed = new URL(string)

  const proxy: AxiosProxyConfig = {
    protocol: parsed.protocol.replace(':', ''),
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port) : 8080
  }

  if (parsed.username || parsed.password) {
    proxy.auth = { username: parsed.username, password: parsed.password }
  }

  return proxy
}

export async function loadJs(filepath: string) {
  const fileUrl = pathToFileURL(filepath).toString()

  return (await import(fileUrl)).default
}

export async function loadIssues(props?: { labels: string[] | string }) {
  const CustomOctokit = Octokit.plugin(paginateRest, restEndpointMethods)
  const octokit = new CustomOctokit()

  let labels = ''
  if (props && props.labels) {
    labels = Array.isArray(props.labels) ? props.labels.join(',') : props.labels
  }
  let issues: object[] = []
  if (TESTING) {
    issues = (await import('../../tests/__data__/input/sites_update/issues.mjs')).default
  } else {
    issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner: OWNER,
      repo: REPO,
      per_page: 100,
      labels,
      state: 'open',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }

  return new Collection(issues).map(data => new Issue(data))
}

export function parseNumber(value: string): number {
  return parseInt(value)
}
