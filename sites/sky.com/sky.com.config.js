const axios = require('axios')
const dayjs = require('dayjs')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:sky.com')
const fs = require('fs')
const path = require('path')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

doFetch.setCheckResult(false).setDebugger(debug)

const ATLANTIS_API_ENDPOINT = 'https://atlantis.epgsky.com/as'
const CHANNELS_FILE = path.join(__dirname, 'sky.com.channels.xml')
const HAWK_API_ENDPOINT = 'https://awk.epgsky.com/hawk/linear'
const LANG_BY_TERRITORY = {
  DE: 'de',
  GB: 'en',
  IT: 'it'
}
const MAX_SIDS_PER_REQUEST = 20
const GRAB_START_DATE = dayjs.utc(process.env.CURR_DATE || new Date().toISOString()).startOf('d')
const eventIds = new Set()
const scheduleRequests = new Map()
let scheduleBatches

module.exports = {
  site: 'sky.com',
  days: 2,
  request: {
    headers({ channel }) {
      const { territory } = parseSiteId(channel.site_id)

      return isUhdChannel(channel) ? getAtlantisHeaders(territory) : getHeaders(territory)
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 1 day
      vary: ['X-SkyOTT-Territory']
    }
  },
  url({ date, channel }) {
    const { sid } = parseSiteId(channel.site_id)
    if (isUhdChannel(channel)) {
      return `${ATLANTIS_API_ENDPOINT}/schedule/${date.format('YYYYMMDD')}/${sid}`
    }

    const sids = getScheduleBatch(channel.site_id) || [sid]

    return `${HAWK_API_ENDPOINT}/schedule/${date.format('YYYYMMDD')}/${sids.join(',')}`
  },
  async parser({ content, channel, date, config }) {
    const programs = []
    const events = new Map()
    const range = getGrabRange(config)

    collectEvents(content, channel, events)

    date = date.startOf('d')
    if (date.isSame(range.lastDate, 'd')) {
      try {
        const response = await getSchedule(channel, date.add(1, 'd'))
        collectEvents(response, channel, events)
      } catch (error) {
        debug('Unable to load the final Sky schedule batch: %s', error.message)
      }
    }

    for (const event of events.values()) {
      const start = dayjs.utc(event.st * 1000)
      const stop = start.add(event.d, 's')
      const eventId = getEventId(channel, event)
      if (
        start.isBefore(range.stop) &&
        stop.isAfter(range.start) &&
        !eventIds.has(eventId)
      ) {
        eventIds.add(eventId)
        const image = event.programmeuuid
          ? `https://images.metadata.sky.com/pd-image/${event.programmeuuid}/16-9/640`
          : null

        programs.push({
          title: event.t,
          description: event.sy,
          season: event.seasonnumber,
          episode: event.episodenumber,
          start,
          stop,
          icon: image,
          image
        })
      }
    }

    return programs
  },
  async channels() {
    const territories = Object.entries(LANG_BY_TERRITORY)
    const queue = territories.map(([territory, lang]) => ({
      type: 'regions',
      lang,
      territory,
      url: `${HAWK_API_ENDPOINT}/regions`,
      params: {
        headers: getHeaders(territory)
      }
    }))
    const channels = new Map()
    const regions = new Set()
    const failures = []
    const states = new Map(
      territories.map(([territory]) => [
        territory,
        {
          channels: 0,
          regionsLoaded: false,
          serviceRequests: 0,
          serviceResponses: 0
        }
      ])
    )

    await doFetch(queue, (request, response) => {
      const state = states.get(request.territory)
      if (request.type === 'regions') {
        if (!Array.isArray(response?.regions) || !response.regions.length) {
          failures.push(`${request.territory}: ${request.url}`)
          return
        }

        state.regionsLoaded = true
        for (const region of response.regions) {
          if (region?.bouquetId === undefined || region?.subBouquetId === undefined) {
            failures.push(`${request.territory}: ${request.url} (invalid region)`)
            continue
          }

          const regionId = `${region.bouquetId}/${region.subBouquetId}`
          const key = `${request.territory}:${regionId}`
          if (regions.has(key)) continue

          regions.add(key)
          const serviceRequests = [
            {
              source: 'hawk',
              url: `${HAWK_API_ENDPOINT}/services/${regionId}`,
              headers: getHeaders(request.territory)
            },
            {
              source: 'atlantis',
              url: `${ATLANTIS_API_ENDPOINT}/services/${regionId}`,
              headers: getAtlantisHeaders(request.territory)
            }
          ]

          state.serviceRequests += serviceRequests.length
          for (const serviceRequest of serviceRequests) {
            queue.push({
              type: 'services',
              lang: request.lang,
              source: serviceRequest.source,
              territory: request.territory,
              url: serviceRequest.url,
              params: {
                headers: serviceRequest.headers
              }
            })
          }
        }
        return
      }

      if (!Array.isArray(response?.services)) {
        failures.push(`${request.territory}: ${request.url}`)
        return
      }

      state.serviceResponses++
      for (const service of response.services) {
        if (service?.sid === undefined) {
          failures.push(`${request.territory}: ${request.url} (invalid service)`)
          continue
        }

        if (!service.t) continue
        if (request.source === 'atlantis' && service.schedule !== true) continue

        const siteId = `${request.territory}#${service.sid}`
        if (!channels.has(siteId) || request.source === 'hawk') {
          const isNew = !channels.has(siteId)
          channels.set(siteId, {
            lang: request.lang,
            site_id: siteId,
            name: service.t
          })
          if (isNew) state.channels++
        }
      }
    })

    const incomplete = [...states]
      .filter(
        ([, state]) =>
          !state.regionsLoaded ||
          !state.serviceRequests ||
          state.serviceResponses !== state.serviceRequests ||
          !state.channels
      )
      .map(([territory]) => territory)

    if (incomplete.length || failures.length) {
      const reasons = [...new Set([...failures, ...incomplete])].join(', ')
      throw new Error(`Unable to load complete Sky channel list: ${reasons || 'no channels found'}`)
    }

    return [...channels.values()]
  }
}

function getHeaders(territory) {
  return {
    'X-SkyOTT-Territory': territory
  }
}

function getAtlantisHeaders(territory) {
  return {
    'X-SkyOTT-Proposition': 'SKYQ',
    'X-SkyOTT-Provider': 'SKY',
    ...getHeaders(territory)
  }
}

function getEventId(channel, event) {
  return `${channel.site_id}:${event.eid}`
}

function getGrabRange(config) {
  const configuredDays = Number(config?.days)
  const days =
    Number.isInteger(configuredDays) && configuredDays > 0 ? configuredDays : module.exports.days
  const stop = GRAB_START_DATE.add(days, 'd')

  return {
    lastDate: stop.subtract(1, 'd'),
    start: GRAB_START_DATE,
    stop
  }
}

function getSchedule(channel, date) {
  const { territory } = parseSiteId(channel.site_id)
  const url = module.exports.url({ channel, date })
  const key = `${territory}:${url}`

  if (!scheduleRequests.has(key)) {
    const request = axios
      .get(url, {
        headers: module.exports.request.headers({ channel })
      })
      .then(response => response.data)
      .catch(error => {
        scheduleRequests.delete(key)
        throw error
      })

    scheduleRequests.set(key, request)
  }

  return scheduleRequests.get(key)
}

function getScheduleBatch(siteId) {
  if (!scheduleBatches) scheduleBatches = loadScheduleBatches()

  return scheduleBatches.get(siteId)
}

function loadScheduleBatches() {
  const channelsXml = fs.readFileSync(CHANNELS_FILE, 'utf8')
  const sidsByTerritory = new Map(
    Object.keys(LANG_BY_TERRITORY).map(territory => [territory, new Set()])
  )

  for (const match of channelsXml.matchAll(/<channel\b([^>]*)>([^<]*)<\/channel>/g)) {
    const siteId = match[1].match(/\bsite_id="([^"]+)"/)?.[1]
    if (!siteId || isUhdChannel({ name: match[2] })) continue

    const { sid, territory } = parseSiteId(siteId)
    sidsByTerritory.get(territory).add(sid)
  }

  const batches = new Map()
  for (const [territory, sidSet] of sidsByTerritory) {
    const sids = [...sidSet]
    for (let index = 0; index < sids.length; index += MAX_SIDS_PER_REQUEST) {
      const batch = sids.slice(index, index + MAX_SIDS_PER_REQUEST)
      for (const sid of batch) {
        batches.set(`${territory}#${sid}`, batch)
      }
    }
  }

  return batches
}

function collectEvents(content, channel, events) {
  const data = parseContent(content)
  if (!Array.isArray(data?.schedule)) return

  const { sid } = parseSiteId(channel.site_id)
  for (const schedule of data.schedule) {
    if (String(schedule.sid) !== sid || !Array.isArray(schedule.events)) continue

    for (const event of schedule.events) {
      if (event?.eid !== undefined && !events.has(event.eid)) {
        events.set(event.eid, event)
      }
    }
  }
}

function isUhdChannel(channel) {
  return /uhd|ultra\s*hd|4k/i.test(`${channel?.name || ''} ${channel?.xmltv_id || ''}`)
}

function parseSiteId(siteId) {
  const [territory, sid, ...extra] = String(siteId || '').split('#')
  if (!LANG_BY_TERRITORY[territory] || !sid || extra.length) {
    throw new Error(
      `Invalid Sky site_id "${siteId || ''}". Expected "<territory>#<sid>" with territory "DE", "GB" or "IT".`
    )
  }

  return { sid, territory }
}

function parseContent(content) {
  if (!content) return null

  try {
    if (Buffer.isBuffer(content)) content = content.toString()

    return typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return null
  }
}
