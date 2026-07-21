const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const API_URL = 'https://rail-router.discovery.indazn.com/eu/v10/Rail'
const IMAGE_API_URL = 'https://image.discovery.indazn.com/eu/v3/linear-channel/none'
const DEFAULT_COUNTRY = 'de'
const SUPPORTED_COUNTRIES =
  'ad ae af ag ai al am ao aq ar at au aw ax az ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bv bw bz ca cc cd cf cg ch ci ck cl cm co cr cv cw cx cy cz de dj dk dm do dz ec ee eg eh er es et fi fj fk fm fo fr ga gb gd ge gf gh gl gm gn gp gq gr gs gt gu gw gy hk hm hn hr ht hu id ie il in io iq is it jm jo jp ke kg kh ki km kn kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa pe pf pg ph pk pl pm pn ps pt pw py qa re ro rs rw sa sb sc sd se sg sh si sj sk sl sn so sr ss st sv sx sz tc td tf tg th tj tk tl tm tn to tr tt tv tw tz ua ug um us uy uz vc ve vg vi vn vu wf ws xk ye yt za zm zw'.split(
    ' '
  )
const COUNTRY_LANGUAGES = {
  ar: 'es',
  at: 'de',
  be: 'fr',
  bo: 'es',
  br: 'pt',
  ch: 'de',
  cl: 'es',
  co: 'es',
  cr: 'es',
  de: 'de',
  do: 'es',
  ec: 'es',
  es: 'es',
  fr: 'fr',
  gt: 'es',
  hn: 'es',
  it: 'it',
  jp: 'ja',
  li: 'de',
  lu: 'fr',
  mc: 'fr',
  mx: 'es',
  ni: 'es',
  nl: 'nl',
  pa: 'es',
  pe: 'es',
  pt: 'pt',
  py: 'es',
  sv: 'es',
  tw: 'zh',
  uy: 'es',
  ve: 'es'
}
const PREFERRED_COUNTRIES = {
  de: 'de',
  en: 'gb',
  es: 'es',
  fr: 'fr',
  it: 'it',
  ja: 'jp',
  nl: 'nl',
  pt: 'pt',
  zh: 'tw'
}
const HEADERS = {
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.dazn.com/'
}

module.exports = {
  site: 'dazn.de',
  days: 3,
  url({ channel }) {
    const { country } = parseSiteId(channel.site_id)

    return createApiUrl(country, channel.lang || getLanguage(country))
  },
  request: {
    headers: HEADERS,
    cache: {
      ttl: 5 * 60 * 1000
    }
  },
  parser({ content, channel, date }) {
    const data = parseData(content)
    const tiles = Array.isArray(data?.Tiles) ? data.Tiles : []
    const { assetId } = parseSiteId(channel.site_id)
    const tile = tiles.find(item => item.AssetId === assetId)

    if (!tile?.LinearSchedule) return []

    const schedule = tile.LinearSchedule
    const programs = [
      schedule.Now,
      schedule.Next,
      ...(Array.isArray(schedule.Later) ? schedule.Later : [])
    ].filter(Boolean)

    return programs
      .filter(item => item.Start && item.End && dayjs.utc(item.Start).isSame(date, 'day'))
      .map(parseProgram)
  },
  async channels({ country, lang } = {}) {
    if (country) return loadChannels(country, lang)

    const channelsByAssetAndLanguage = new Map()
    for (const supportedCountry of SUPPORTED_COUNTRIES) {
      for (const channel of await loadChannels(supportedCountry)) {
        const { assetId, country } = parseSiteId(channel.site_id)
        const key = `${assetId}#${channel.lang}`
        const current = channelsByAssetAndLanguage.get(key)

        if (!current || isPreferredCountry(country, channel.lang)) {
          channelsByAssetAndLanguage.set(key, channel)
        }
      }
    }

    return Array.from(channelsByAssetAndLanguage.values())
  }
}

async function loadChannels(country, lang) {
  country = country.toLowerCase()
  if (!SUPPORTED_COUNTRIES.includes(country)) {
    throw new Error(`Unsupported DAZN country: ${country}`)
  }

  const language = lang || getLanguage(country)
  const { data } = await axios.get(createApiUrl(country, language), { headers: HEADERS })
  const tiles = Array.isArray(data?.Tiles) ? data.Tiles : []

  return tiles
    .filter(tile => tile.AssetId && tile.Title)
    .map(tile => ({
      lang: language,
      site_id: createSiteId(country, tile.AssetId),
      name: tile.Title,
      logo: createImageUrl(tile.LogoImage, {
        resizeAction: 'contain',
        width: 68,
        height: 56,
        format: 'png'
      })
    }))
}

function createApiUrl(country, language) {
  const params = new URLSearchParams({
    platform: 'web',
    id: 'Livetvschedule',
    country,
    brand: 'dazn',
    languageCode: language
  })

  return `${API_URL}?${params}`
}

function createSiteId(country, assetId) {
  return country === DEFAULT_COUNTRY ? assetId : `${country}#${assetId}`
}

function parseSiteId(siteId) {
  const separator = siteId.indexOf('#')

  if (separator === -1) return { country: DEFAULT_COUNTRY, assetId: siteId }

  return {
    country: siteId.slice(0, separator),
    assetId: siteId.slice(separator + 1)
  }
}

function getLanguage(country) {
  return COUNTRY_LANGUAGES[country] || 'en'
}

function isPreferredCountry(country, language) {
  return country === PREFERRED_COUNTRIES[language]
}

function parseData(content) {
  try {
    return typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return null
  }
}

function parseProgram(item) {
  const program = {
    title: item.Title,
    start: item.Start,
    stop: item.End
  }

  if (item.EpisodeTitle) program.subTitle = item.EpisodeTitle
  if (item.Description) program.description = item.Description
  if (item.EventYear) program.date = item.EventYear
  if (item.TvRating) program.rating = item.TvRating

  const categories = (Array.isArray(item.Genre) ? item.Genre : [])
    .map(genre => genre?.name)
    .filter(Boolean)
  if (item.ProgramType) categories.push(item.ProgramType)
  if (categories.length) program.categories = [...new Set(categories)]

  const image = item.BackgroundImage || item.GradientBackgroundImage || item.Image
  const icon = createImageUrl(image)
  if (icon) program.icon = icon

  return program
}

function createImageUrl(
  image,
  { resizeAction = 'fill', width = 856, height = 481, format = 'webp' } = {}
) {
  if (!image?.Id) return null

  return `${IMAGE_API_URL}/${encodeURIComponent(
    image.Id
  )}/${resizeAction}/center/center/none/80/${width}/${height}/${format}/image?brand=dazn`
}
