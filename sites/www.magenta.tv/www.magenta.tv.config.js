const axios = require('axios')
const crypto = require('crypto')
const dayjs = require('dayjs')
const fs = require('fs')
const path = require('path')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const MANIFEST_URL = 'https://prod.dcm.telekom-dienste.de/v1/settings/web-mtv/manifest'
const DEVICE_MODEL = 'WEB2_FTV'
const PORTAL = 'release'
const SUBSCRIBER_TYPE = 'FTV_FREEMIUM_DT'
const CHANNEL_PAGE_SIZE = 100
const CHANNEL_PAGE_LIMIT = 1000
const DATABASE_DIR = path.resolve(__dirname, '../../temp/data')

const FALLBACK_MPX = Object.freeze({
    accountPid: 'mdeprod',
    locationIdUri:
        'http://data.entertainment.tv.theplatform.eu/entertainment/data/Location/245991976396',
    feeds: {
        allChannelSchedulesFeed:
            'https://feed.entertainment.tv.theplatform.eu/f/{MpxAccountPid}/{MpxAccountPid}-all-channel-schedules',
        allChannelStationsFeed:
            'https://feed.entertainment.tv.theplatform.eu/f/{MpxAccountPid}/{MpxAccountPid}-channel-stations-main'
    }
})

const QUALITY_DEFINITIONS = Object.freeze([
    {
        kind: '8K',
        label: '8K',
        aliases: ['8K', '4320P'],
        formats: ['4320p']
    },
    {
        kind: 'UHD',
        label: 'UHD',
        aliases: ['UHD', 'ULTRA HD', 'ULTRAHD', '4K', '2160P'],
        formats: ['2160p']
    },
    {
        kind: 'HD',
        label: 'HD',
        aliases: ['FULL HD', 'FULLHD', 'FHD', 'HD', '720P', '1080I', '1080P'],
        formats: ['720p', '1080i', '1080p']
    },
    {
        kind: 'SD',
        label: 'SD',
        aliases: ['SD', '480I', '480P', '576I', '576P'],
        formats: ['480i', '480p', '576i', '576p']
    }
])

let session
let manifestPromise
let databasePromise

module.exports = {
    site: 'www.magenta.tv',
    days: 2,
    request: {
        cache: {
            ttl: 60 * 60 * 1000 // 1 hour
        }
    },
    async url({ channel, date }) {
        const mpx = await getMpxConfig()
        const currentSession = getSession()
        const window = getUtcWindow(date)

        return buildScheduleUrl({
            mpx,
            session: currentSession,
            siteIds: [channel.site_id],
            window
        })
    },
    async parser({ content, channel }) {
        return parseScheduleResponse(content, channel)
    },
    async channels() {
        const [mpx, database] = await Promise.all([getMpxConfig(), getDatabase()])
        const currentSession = getSession()
        const channels = []

        for (let start = 1; start <= CHANNEL_PAGE_LIMIT; start += CHANNEL_PAGE_SIZE) {
            const entries = await getChannelEntries({
                mpx,
                session: currentSession,
                start,
                end: start + CHANNEL_PAGE_SIZE - 1
            })

            if (!entries.length) break

            entries.forEach(entry => {
                const channel = parseChannel(entry, database)
                if (channel) channels.push(channel)
            })

            if (entries.length < CHANNEL_PAGE_SIZE) break
        }

        return channels
    }
}

function createSession() {
    return {
        deviceId: crypto.randomUUID(),
        sessionId: crypto.randomUUID()
    }
}

function getSession() {
    if (!session) {
        session = createSession()
    }

    return session
}

function buildCid(currentSession) {
    return `${currentSession.sessionId}::${crypto.randomUUID()}`
}

function getManifestRequestConfig(currentSession) {
    return {
        headers: {
            'X-DT-Call-ID': crypto.randomUUID(),
            'X-DT-Session-ID': currentSession.sessionId
        },
        params: {
            deviceId: currentSession.deviceId,
            deviceModel: DEVICE_MODEL,
            portal: PORTAL,
            subscriberType: SUBSCRIBER_TYPE,
            $redirect: false,
            sid: currentSession.sessionId
        }
    }
}

async function getManifest() {
    if (!manifestPromise) {
        manifestPromise = axios
            .get(MANIFEST_URL, getManifestRequestConfig(getSession()))
            .then(r => r.data)
            .catch(() => null)
    }

    return manifestPromise
}

async function getMpxConfig() {
    const manifest = await getManifest()
    const manifestMpx = manifest && manifest.mpx ? manifest.mpx : {}

    return {
        ...FALLBACK_MPX,
        ...manifestMpx,
        feeds: {
            ...FALLBACK_MPX.feeds,
            ...(manifestMpx.feeds || {})
        }
    }
}

async function getDatabase() {
    if (!databasePromise) {
        databasePromise = Promise.all([
            loadDatabaseFile('channels'),
            loadDatabaseFile('feeds')
        ]).then(([channels, feeds]) => buildDatabaseIndex(channels, feeds))
    }

    return databasePromise
}

async function loadDatabaseFile(basename) {
    const filepath = path.resolve(DATABASE_DIR, `${basename}.json`)

    try {
        const content = await fs.promises.readFile(filepath, 'utf8')
        const data = JSON.parse(content)

        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

function buildDatabaseIndex(channels, feeds) {
    const feedsByChannel = new Map()

    feeds.forEach(feed => {
        if (!feed || !feed.channel || !feed.id) return

        const channelFeeds = feedsByChannel.get(feed.channel) || []
        channelFeeds.push(feed)
        feedsByChannel.set(feed.channel, channelFeeds)
    })

    return {
        channels: channels.filter(channel => channel && channel.id && channel.name),
        feedsByChannel
    }
}

async function getChannelEntries({ mpx, session, start, end }) {
    const url = buildChannelFeedUrl({ mpx, session, start, end })
    const data = await axios
        .get(url)
        .then(r => r.data)
        .catch(() => null)

    return Array.isArray(data && data.entries) ? data.entries : []
}

function buildChannelFeedUrl({ mpx, session, start, end }) {
    const url = new URL(resolveFeedTemplate(mpx.feeds.allChannelStationsFeed, mpx.accountPid))

    url.searchParams.set('lang', 'short-de')
    url.searchParams.set('sort', 'dt$displayChannelNumber')
    url.searchParams.set('range', `${start}-${end}`)
    url.searchParams.set('cid', buildCid(session))

    return url.toString()
}

function buildScheduleUrl({ mpx, session, siteIds, window }) {
    const url = new URL(resolveFeedTemplate(mpx.feeds.allChannelSchedulesFeed, mpx.accountPid))

    url.searchParams.set('byId', siteIds.join('|'))
    url.searchParams.set('byListingTime', window)
    url.searchParams.set('byLocationId', mpx.locationIdUri)
    url.searchParams.set('cid', buildCid(session))

    return url.toString()
}

function resolveFeedTemplate(template, accountPid) {
    return template.replaceAll('{MpxAccountPid}', accountPid)
}

function getUtcWindow(date) {
    const start = date.utc().startOf('day')
    const end = start.add(1, 'day')

    return `${start.toISOString()}~${end.toISOString()}`
}

function parseScheduleResponse(content, channel) {
    const data = parseJson(content)
    const entries = Array.isArray(data && data.entries) ? data.entries : []
    const targetSiteId = channel && channel.site_id ? String(channel.site_id) : null
    const programs = []

    entries.forEach(entry => {
        if (targetSiteId && extractNumericId(entry.id) !== targetSiteId) return
        if (!Array.isArray(entry.listings)) return

        entry.listings.forEach(listing => {
            const program = parseProgramme(entry, listing)
            if (program) programs.push(program)
        })
    })

    return programs
}

function parseChannel(entry, database) {
    if (!entry || entry['dt$isRadio']) return null

    const station = getFirstStation(entry)
    const siteId = extractNumericId(entry.id)

    if (!station || !siteId) return null

    const quality = parseChannelQuality(entry, station)
    const name = parseChannelName(entry, station, quality)

    if (!name) return null

    return {
        lang: 'de',
        site_id: siteId,
        xmltv_id: resolveXmltvId(entry, station, name, quality, database),
        name
    }
}

function resolveXmltvId(entry, station, displayName, quality, database) {
    const match = database.channels.length
        ? findChannelMatch(entry, station, quality, database.channels)
        : null

    const baseName = parseBaseChannelName(entry, station, quality)
    const channelId = match ? match.channel.id : buildGeneratedChannelId(baseName)

    if (!channelId) return ''

    const feeds = match ? database.feedsByChannel.get(match.channel.id) || [] : []
    const feed = match ? findFeedMatch(displayName, quality, match, feeds) : null
    const feedId = feed ? feed.id : buildGeneratedFeedId(quality)

    return feedId ? `${channelId}@${feedId}` : channelId
}

function findChannelMatch(entry, station, quality, channels) {
    const providerNames = getProviderChannelNames(entry, station, quality)
    const matches = []

    channels.forEach(channel => {
        const databaseNames = [channel.name, ...(channel.alt_names || [])]
            .filter(Boolean)
            .map(name => ({
                value: name,
                normalized: normalizeName(name)
            }))
            .filter(item => item.normalized)

        let bestScore = 0
        let matchedName = null

        providerNames.forEach(providerName => {
            databaseNames.forEach(databaseName => {
                if (providerName.normalized === databaseName.normalized) {
                    const score = providerName.weight + 100

                    if (score > bestScore) {
                        bestScore = score
                        matchedName = databaseName.value
                    }

                    return
                }

                if (
                    databaseName.normalized.length >= 4 &&
                    providerName.normalized.startsWith(databaseName.normalized)
                ) {
                    const score =
                        providerName.weight + 40 + Math.min(databaseName.normalized.length, 30)

                    if (score > bestScore) {
                        bestScore = score
                        matchedName = databaseName.value
                    }
                }
            })
        })

        if (!bestScore || !matchedName) return

        if (channel.country === 'DE') bestScore += 15
        if (channel.closed || channel.replaced_by) bestScore -= 100

        matches.push({
            channel,
            matchedName,
            score: bestScore
        })
    })

    matches.sort((a, b) => b.score - a.score)

    if (!matches.length || matches[0].score <= 0) return null
    if (matches[1] && matches[0].score === matches[1].score) return null

    return matches[0]
}

function getProviderChannelNames(entry, station, quality) {
    const names = [
        {
            value: station.title,
            weight: 100
        },
        {
            value: stripQuality(cleanChannelTitle(entry.title), quality),
            weight: 95
        },
        {
            value: stripQuality(humanizeProviderId(station['dt$serviceId']), quality),
            weight: 75
        },
        {
            value: stripQuality(humanizeProviderId(station.guid), quality),
            weight: 70
        }
    ]

    const seen = new Set()

    return names
        .filter(item => item.value)
        .map(item => ({
            ...item,
            normalized: normalizeName(item.value)
        }))
        .filter(item => {
            if (!item.normalized || seen.has(item.normalized)) return false

            seen.add(item.normalized)

            return true
        })
}

function findFeedMatch(displayName, quality, channelMatch, feeds) {
    if (!feeds.length) return null

    if (quality.kind === 'UNKNOWN') {
        const mainFeeds = feeds.filter(feed => feed.is_main)

        if (mainFeeds.length === 1) return mainFeeds[0]
        if (feeds.length === 1) return feeds[0]

        return null
    }

    const compatibleFeeds = feeds.filter(feed => isFeedCompatibleWithQuality(feed, quality))

    if (!compatibleFeeds.length) return null

    const providerVariant = getProviderVariant(
        displayName,
        channelMatch.matchedName,
        quality
    )

    const matches = compatibleFeeds.map(feed => {
        let score = 0

        const feedNames = [feed.id, feed.name, ...(feed.alt_names || [])]
            .filter(Boolean)
            .map(normalizeName)
            .filter(Boolean)

        if (providerVariant) {
            const variantWithoutQuality = stripNormalizedQuality(providerVariant, quality)

            feedNames.forEach(feedName => {
                if (feedName === providerVariant) {
                    score = Math.max(score, 180)
                }

                if (variantWithoutQuality && feedName === variantWithoutQuality) {
                    score = Math.max(score, 160)
                }

                if (feedName && providerVariant.startsWith(feedName)) {
                    score = Math.max(score, 120)
                }
            })
        }

        const qualityAliases = getNormalizedQualityAliases(quality)

        feedNames.forEach(feedName => {
            if (qualityAliases.includes(feedName)) {
                score = Math.max(score, 110)
            }

            if (qualityAliases.some(alias => alias && feedName.endsWith(alias))) {
                score = Math.max(score, 90)
            }
        })

        if (quality.formats.includes(feed.format)) score += 60
        if ((feed.broadcast_area || []).includes('c/DE')) score += 30
        if ((feed.timezones || []).includes('Europe/Berlin')) score += 15
        if ((feed.languages || []).includes('deu')) score += 10
        if (feed.is_main) score += 2

        return {
            feed,
            score
        }
    })

    matches.sort((a, b) => b.score - a.score)

    if (!matches.length || matches[0].score <= 0) return null
    if (matches[1] && matches[0].score === matches[1].score) return null

    return matches[0].feed
}

function isFeedCompatibleWithQuality(feed, quality) {
    if (quality.kind === 'UNKNOWN') return true

    const feedNames = [feed.id, feed.name, ...(feed.alt_names || [])]
        .filter(Boolean)
        .map(normalizeName)

    const aliases = getNormalizedQualityAliases(quality)

    if (feedNames.some(name => aliases.some(alias => alias && name.endsWith(alias)))) {
        return true
    }

    return quality.formats.includes(feed.format)
}

function getProviderVariant(displayName, matchedChannelName, quality) {
    const providerName = normalizeName(displayName)
    const channelName = normalizeName(matchedChannelName)

    if (!providerName || !channelName || !providerName.startsWith(channelName)) {
        return ''
    }

    return stripNormalizedQuality(providerName.slice(channelName.length), quality)
}

function stripNormalizedQuality(value, quality) {
    let normalized = value

    getNormalizedQualityAliases(quality).forEach(alias => {
        if (alias && normalized.endsWith(alias)) {
            normalized = normalized.slice(0, -alias.length)
        }
    })

    return normalized
}

function getNormalizedQualityAliases(quality) {
    const aliases = quality.definition ? quality.definition.aliases : [quality.raw]

    return aliases.map(normalizeName).filter(Boolean)
}

function parseChannelQuality(entry, station) {
    const explicitQuality = normalizeWhitespace(station['dt$quality'])

    if (explicitQuality) {
        const definition = findQualityDefinition(explicitQuality)
        const detectedQuality = definition ? null : findQualityInText(explicitQuality)

        if (detectedQuality) {
            return {
                ...detectedQuality,
                raw: explicitQuality
            }
        }

        return {
            kind: definition ? definition.kind : 'OTHER',
            label: definition ? definition.label : explicitQuality,
            raw: explicitQuality,
            formats: definition ? definition.formats : [],
            definition
        }
    }

    const values = [entry.title, station.guid, station['dt$serviceId']]

    for (const value of values) {
        const match = findQualityInText(value)
        if (match) return match
    }

    if (station.isHd === true) {
        const definition = QUALITY_DEFINITIONS.find(item => item.kind === 'HD')

        return {
            kind: definition.kind,
            label: definition.label,
            raw: definition.label,
            formats: definition.formats,
            definition
        }
    }

    return {
        kind: 'UNKNOWN',
        label: null,
        raw: null,
        formats: [],
        definition: null
    }
}

function findQualityDefinition(value) {
    const normalized = normalizeName(value)

    return QUALITY_DEFINITIONS.find(definition =>
        definition.aliases.some(alias => normalizeName(alias) === normalized)
    )
}

function findQualityInText(value) {
    if (!value || typeof value !== 'string') return null

    const text = value.replaceAll(/[_-]+/g, ' ')

    for (const definition of QUALITY_DEFINITIONS) {
        for (const alias of definition.aliases) {
            const pattern = new RegExp(
                `(^|[^a-z0-9])${escapeRegExp(alias)}($|[^a-z0-9])`,
                'i'
            )

            if (!pattern.test(text)) continue

            return {
                kind: definition.kind,
                label: definition.label,
                raw: alias,
                formats: definition.formats,
                definition
            }
        }
    }

    return null
}

function parseChannelName(entry, station, quality) {
    return parseBaseChannelName(entry, station, quality) || null
}

function parseBaseChannelName(entry, station, quality) {
    const stationName = normalizeWhitespace(station.title)
    const providerName = cleanChannelTitle(entry.title)
    const baseName = stationName || providerName

    return stripQuality(baseName, quality)
}

function buildGeneratedChannelId(name) {
    if (!name) return ''

    const id = String(name)
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replaceAll('ß', 'ss')
        .replaceAll('&', 'and')
        .replaceAll('+', 'Plus')
        .replace(/[^a-z0-9]/gi, '')

    return id ? `${id}.de` : ''
}

function buildGeneratedFeedId(quality) {
    if (!quality || quality.kind === 'UNKNOWN') return ''

    if (quality.label) {
        return sanitizeIdPart(quality.label)
    }

    return sanitizeIdPart(quality.raw)
}

function sanitizeIdPart(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replaceAll('ß', 'ss')
        .replace(/[^a-z0-9]/gi, '')
}

function cleanChannelTitle(value) {
    return normalizeWhitespace(value)
        .replace(/\s+-\s+Main$/i, '')
        .trim()
}

function stripQuality(value, quality) {
    let result = normalizeWhitespace(value)

    if (!result) return ''

    const aliases = quality.definition ? quality.definition.aliases : [quality.raw]

    aliases.filter(Boolean).forEach(alias => {
        const pattern = new RegExp(
            `(^|[^a-z0-9])${escapeRegExp(alias)}(?=$|[^a-z0-9])`,
            'gi'
        )

        result = result.replace(pattern, '$1')
    })

    return normalizeWhitespace(result)
}

function humanizeProviderId(value) {
    if (!value || typeof value !== 'string') return ''

    return normalizeWhitespace(value.replaceAll(/[_-]+/g, ' '))
}

function normalizeName(value) {
    if (!value) return ''

    return String(value)
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replaceAll('ß', 'ss')
        .replaceAll('&', 'and')
        .replaceAll('+', 'plus')
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase()
}

function normalizeWhitespace(value) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseProgramme(entry, listing) {
    if (
        !listing ||
        !listing.program ||
        listing.startTime === null ||
        listing.startTime === undefined ||
        listing.endTime === null ||
        listing.endTime === undefined
    ) {
        return null
    }

    const program = listing.program
    const programInfo = parseProgramInfo(listing['dt$programInfo'])
    const title = program.title

    if (!title) return null

    const parsed = {
        title,
        description: program.description || null,
        category: parseCategories(program.tags),
        sub_title: parseSubTitle(program, listing),
        rating: parseRating(program.ratings),
        season: normalizeNumber(program.tvSeasonNumber ?? programInfo.tvSeasonNumber),
        episode: normalizeNumber(
            program.tvSeasonEpisodeNumber ??
            programInfo.tvSeasonEpisodeNumber ??
            programInfo.seriesEpisodeNumber
        ),
        image: parseProgramImage(program),
        icon: parseProgramImage(program),
        start: dayjs(Number(listing.startTime)),
        stop: dayjs(Number(listing.endTime)),
        country: parseCountry(program['dt$countries']),
        date: program.year ? String(program.year) : null
    }

    if (parsed.image === null) delete parsed.image
    if (parsed.icon === null) delete parsed.icon
    if (parsed.category === null) delete parsed.category
    if (parsed.sub_title === null) delete parsed.sub_title
    if (parsed.rating === null) delete parsed.rating
    if (parsed.season === null) delete parsed.season
    if (parsed.episode === null) delete parsed.episode
    if (parsed.country === null) delete parsed.country
    if (parsed.date === null) delete parsed.date

    return parsed
}

function parseSubTitle(program, listing) {
    if (program.secondaryTitle && program.secondaryTitle !== program.title) {
        return program.secondaryTitle
    }

    if (listing['dt$seriesTitle'] && listing['dt$seriesTitle'] !== program.title) {
        return listing['dt$seriesTitle']
    }

    return null
}

function parseCategories(tags) {
    if (!Array.isArray(tags)) return null

    const categories = tags
        .filter(
            tag =>
                ['category', 'genre-primary', 'genre-secondary'].includes(tag.scheme) &&
                tag.title
        )
        .map(tag => tag.title)

    return categories.length ? [...new Set(categories)] : null
}

function parseRating(ratings) {
    if (!Array.isArray(ratings)) return null

    const rating = ratings.find(item => item && item.rating && item.rating !== 'UNKNOWN')

    if (!rating) return null

    return {
        system: rating.scheme || 'magenta',
        value: rating.rating
    }
}

function parseProgramInfo(value) {
    if (!value || typeof value !== 'string') return {}

    try {
        return JSON.parse(value.replaceAll("'", '"'))
    } catch {
        return {}
    }
}

function parseProgramImage(program) {
    if (!program || !program.thumbnails) return null

    const thumbnails = Object.values(program.thumbnails)
        .filter(thumbnail => thumbnail && thumbnail.url)
        .sort(
            (a, b) =>
                (b.width || 0) * (b.height || 0) -
                (a.width || 0) * (a.height || 0)
        )

    return thumbnails[0] ? thumbnails[0].url : null
}

function parseCountry(value) {
    if (!value || typeof value !== 'string') return null

    return value.toUpperCase()
}

function getFirstStation(entry) {
    if (!entry || !entry.stations || typeof entry.stations !== 'object') {
        return null
    }

    return Object.values(entry.stations)[0] || null
}

function extractNumericId(uri) {
    if (!uri || typeof uri !== 'string') return null

    const match = uri.match(/(\d+)(?!.*\d)/)

    return match ? match[1] : null
}

function normalizeNumber(value) {
    return value === null || value === undefined || value === '' ? null : value
}

function parseJson(content) {
    if (!content) return {}
    if (typeof content !== 'string') return content

    try {
        return JSON.parse(content)
    } catch {
        return {}
    }
}