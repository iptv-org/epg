const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const TILE_FRAGMENT = `
fragment epgTileFragment on Tile {
  ... on ITile {
    title
    description
    primaryMeta {
      shortValue
    }
    statusMeta {
      value
    }
    image {
      templateUrl
    }
    action {
      ... on LinkAction {
        link
      }
    }
  }
}
`

const EPG_QUERY = `
query EpgPage(
  $pageId: ID!
  $previousAfter: ID
  $nextAfter: ID
  $skipPrevious: Boolean = false
  $skipNext: Boolean = false
  $skipCurrent: Boolean = false
) {
  page(id: $pageId) {
    ... on ElectronicProgramGuidePage {
      previous @skip(if: $skipPrevious) {
        paginatedItems(first: 100, after: $previousAfter) {
          ...epgListFragment
        }
      }
      current @skip(if: $skipCurrent) {
        objectId
      }
      next @skip(if: $skipNext) {
        paginatedItems(first: 100, after: $nextAfter) {
          ...epgListFragment
        }
      }
    }
  }
}

fragment epgListFragment on TileConnection {
  edges {
    cursor
    node {
      ...epgTileFragment
    }
  }
  pageInfo {
    hasNextPage
    endCursor
  }
}
${TILE_FRAGMENT}`

const SNAPSHOT_QUERY = `
query LiveSnapshot($listId: ID!) {
  list(listId: $listId) {
    ... on PaginatedTileList {
      paginatedItems(first: 1) {
        edges {
          cursor
          node {
            ...epgTileFragment
            ... on ITile {
              actionItems {
                action {
                  ... on LinkAction {
                    link
                  }
                }
              }
            }
            ... on EpisodeTile {
              whatsonId
            }
          }
        }
      }
    }
  }
}
${TILE_FRAGMENT}`

const PROGRAM_LISTS_QUERY = `
query ProgramLists($id: ID!) {
  page(id: $id) {
    ... on ProgramPage {
      menu {
        items {
          components {
            __typename
            ... on PaginatedTileList {
              listId
            }
            ... on ContainerNavigation {
              items {
                title
                active
                objectId
              }
            }
          }
        }
      }
    }
  }
}`

const EPISODE_LIST_QUERY = `
query EpisodeList($listId: ID!, $after: ID) {
  list(listId: $listId) {
    ... on PaginatedTileList {
      paginatedItems(first: 50, after: $after) {
        edges {
          node {
            ... on EpisodeTile {
              whatsonId
              action {
                ... on LinkAction {
                  link
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}`

const CHANNELS_QUERY = `
query ProgramGuidePage($pageId: ID!) {
  page(id: $pageId) {
    ... on ElectronicProgramGuidePage {
      channelNavigation {
        items {
          ... on ContentTile {
            title
            brandLogos {
              primary
              type
            }
            action {
              ... on LinkAction {
                linkTokens {
                  placeholder
                  value
                }
              }
            }
          }
        }
      }
    }
  }
}
`
const SITE_URL = 'https://www.vrt.be'
const API_ENDPOINT = 'https://www.vrt.be/vrtnu-api/graphql/public/v1'
// The airing program's real url only surfaces on the non-public schema (whatsonId + actionItems).
const PRIVATE_API_ENDPOINT = 'https://www.vrt.be/vrtnu-api/graphql/v1'
const MAX_PAGE_REQUESTS = 20
const API_HEADERS = {
  'content-type': 'application/json',
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0',
  'x-vrt-client-name': 'WEB'
}

module.exports = {
  site: 'vrt.be',
  days: 2,
  url: API_ENDPOINT,
  request: {
    method: 'POST',
    headers: API_HEADERS,
    data({ channel, date }) {
      return {
        query: EPG_QUERY,
        variables: {
          pageId: buildPageId(channel, date)
        }
      }
    }
  },
  async parser({ content, channel, date }) {
    let data
    try {
      data = JSON.parse(content)
    } catch {
      return []
    }
    const page = data.data?.page
    if (!page) return []

    const pageId = buildPageId(channel, date)
    const previousEdges = await loadAllEdges(page.previous?.paginatedItems, 'previous', pageId)
    const nextEdges = await loadAllEdges(page.next?.paginatedItems, 'next', pageId)

    const items = []
    ;[...previousEdges, ...nextEdges].forEach(edge => {
      const node = edge.node
      if (!node || !node.title) return

      const start = parseCursor(edge.cursor)
      if (!start) return

      items.push({ start, node, url: parseUrl(node.action) })
    })

    const currentEdge = await loadCurrentEdge(page.current, [...previousEdges, ...nextEdges])
    const currentStart = currentEdge?.node?.title ? parseCursor(currentEdge.cursor) : null
    if (currentStart && !items.some(item => item.start.valueOf() === currentStart.valueOf())) {
      items.push({
        start: currentStart,
        node: currentEdge.node,
        url: await resolveCurrentUrl(currentEdge.node)
      })
    }

    items.sort((a, b) => a.start.valueOf() - b.start.valueOf())

    const programs = []
    items.forEach((item, index) => {
      const { node, start } = item
      const nextItem = items[index + 1]
      const stop = nextItem ? nextItem.start : parseFallbackStop(start, node)
      if (!stop || !stop.isAfter(start)) return

      programs.push({
        title: node.title,
        description: node.description || null,
        season: parseSeason(node.primaryMeta),
        episode: parseEpisode(node.primaryMeta),
        image: node.image?.templateUrl || null,
        url: item.url,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .post(
        API_ENDPOINT,
        {
          query: CHANNELS_QUERY,
          variables: { pageId: '/vrtmax/tv-gids/' }
        },
        { headers: API_HEADERS }
      )
      .then(r => r.data)
      .catch(console.error)

    if (!data) return []

    const items = data.data?.page?.channelNavigation?.items || []
    return items
      .map(item => {
        const siteId = item.action?.linkTokens?.find(
          t => t.placeholder === ':livestreamName'
        )?.value
        if (!siteId) return null

        const logo = item.brandLogos?.find(l => l.type === 'png')?.primary || null

        return {
          lang: 'nl',
          site_id: siteId,
          name: item.title,
          logo
        }
      })
      .filter(Boolean)
  }
}

function parseSeason(primaryMeta) {
  if (!Array.isArray(primaryMeta)) return null
  const item = primaryMeta.find(m => /^S\d+$/.test(m.shortValue))
  return item ? parseInt(item.shortValue.slice(1), 10) : null
}

function parseEpisode(primaryMeta) {
  if (!Array.isArray(primaryMeta)) return null
  const item = primaryMeta.find(m => /^Afl\.\d+$/.test(m.shortValue))
  return item ? parseInt(item.shortValue.replace('Afl.', ''), 10) : null
}

function parseCursor(cursor) {
  if (!cursor) return null

  // Cursor looks like "o%49|O8|d%1786420800000||%", with the start time as epoch in milliseconds
  const epoch = cursor.match(/\d{13}/)
  if (!epoch) return null

  const d = dayjs.utc(parseInt(epoch[0], 10))
  return d.isValid() ? d : null
}

function parseUrl(action) {
  const link = action?.link
  if (!link) return null

  // Whatever is airing links to the channel's livestream rather than to itself.
  if (link.startsWith('/vrtmax/livestream/')) return null

  return link.startsWith('http') ? link : `${SITE_URL}${link}`
}

function buildPageId(channel, date) {
  return `/vrtmax/tv-gids/${channel.site_id}/${date.format('YYYY-MM-DD')}/`
}

// previous/next skip the airing program, and the guide only has it as a livestream tile without a
// cursor. The channel's "snapshot" list starts at whatever is on right now and does carry one.
async function loadCurrentEdge(current, edges) {
  // That list ignores the requested date, so without this it would leak into every other day too.
  if (!current) return null

  const channelCode = edges[0]?.cursor?.split('|')[1]
  if (!channelCode) return null

  const listId = `$${Buffer.from(`o%31|snapshot|${channelCode}||||%`).toString('base64')}`
  const data = await axios
    .post(
      PRIVATE_API_ENDPOINT,
      { query: SNAPSHOT_QUERY, variables: { listId } },
      { headers: API_HEADERS }
    )
    .then(r => r.data)
    .catch(console.error)

  return data?.data?.list?.paginatedItems?.edges?.[0] || null
}

// The guide never exposes the airing slot's own /vrtmax/a-z/ url (its tile links to the livestream).
// Recover it by matching the tile's whatsonId in the episode lists of its program page.
async function resolveCurrentUrl(node) {
  const whatsonId = node?.whatsonId
  const programLink = (node?.actionItems || [])
    .map(item => item?.action?.link)
    .find(link => link?.startsWith('/vrtmax/a-z/'))
  if (!whatsonId || !programLink) return null

  const season = parseSeason(node.primaryMeta)
  for (const listId of await loadProgramListIds(programLink, season)) {
    const link = await findEpisodeLink(listId, whatsonId)
    if (link) return link.startsWith('http') ? link : `${SITE_URL}${link}`
  }

  return null
}

// A program page carries flat lists plus (for multi-season programs) one episode list per season,
// nested under a second ContainerNavigation. The episode airs from exactly one season, so only that
// season's list is searched, alongside the program's flat lists.
async function loadProgramListIds(programLink, season) {
  const data = await postPrivate(PROGRAM_LISTS_QUERY, { id: programLink })
  const items = data?.data?.page?.menu?.items || []

  const flatLists = []
  const seasonLists = []
  items.forEach(item => {
    ;(item.components || []).forEach(component => {
      if (component?.__typename === 'PaginatedTileList' && component.listId) {
        flatLists.push(component.listId)
      }
      if (component?.__typename === 'ContainerNavigation') {
        ;(component.items || []).forEach(tab => {
          const listId = buildSeasonListId(tab)
          if (listId) seasonLists.push({ listId, number: seasonNumber(tab.title) })
        })
      }
    })
  })

  const seasons =
    season == null ? [] : seasonLists.filter(s => s.number === season).map(s => s.listId)
  return [...seasons, ...flatLists]
}

// Season tabs only inline a usable listId for the active season; the others are derived from the
// tab's objectId. The list wrapper is o%35 with a trailing marker that is b%0 for the active season
// and b%1 for every other one.
function buildSeasonListId(tab) {
  if (!tab?.objectId?.startsWith('$')) return null

  const inner = Buffer.from(tab.objectId.slice(1), 'base64').toString()
  const index = inner.match(/\|(\d+)\|%$/)?.[1]
  if (!index) return null

  const marker = tab.active ? 0 : 1
  return `$${Buffer.from(`o%35|${inner}|${index}|b%${marker}|n%1%`).toString('base64')}`
}

function seasonNumber(title) {
  const match = (title || '').match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

async function findEpisodeLink(listId, whatsonId) {
  let after = null
  for (let requests = 0; requests < MAX_PAGE_REQUESTS; requests++) {
    const data = await postPrivate(EPISODE_LIST_QUERY, { listId, after })
    const items = data?.data?.list?.paginatedItems
    if (!items) return null

    const match = (items.edges || []).find(edge => edge.node?.whatsonId === whatsonId)
    if (match) return match.node.action?.link || null

    if (!items.pageInfo?.hasNextPage) return null
    after = items.pageInfo.endCursor
  }

  return null
}

function postPrivate(query, variables) {
  return axios
    .post(PRIVATE_API_ENDPOINT, { query, variables }, { headers: API_HEADERS })
    .then(r => r.data)
    .catch(console.error)
}

// The API caps every list at 50 items, whatever `first` asks for, so busy channels like Ketnet need
// to be paged through with the cursor from pageInfo.
async function loadAllEdges(paginatedItems, listName, pageId) {
  if (!paginatedItems) return []

  const edges = [...(paginatedItems.edges || [])]
  let pageInfo = paginatedItems.pageInfo
  let requests = 0

  while (pageInfo?.hasNextPage && pageInfo.endCursor && requests < MAX_PAGE_REQUESTS) {
    requests++

    const data = await axios
      .post(
        API_ENDPOINT,
        {
          query: EPG_QUERY,
          variables: {
            pageId,
            [`${listName}After`]: pageInfo.endCursor,
            skipPrevious: listName !== 'previous',
            skipNext: listName !== 'next',
            skipCurrent: true
          }
        },
        { headers: API_HEADERS }
      )
      .then(r => r.data)
      .catch(console.error)

    const items = data?.data?.page?.[listName]?.paginatedItems
    if (!items?.edges?.length) break

    edges.push(...items.edges)
    pageInfo = items.pageInfo
  }

  return edges
}

// The last program of the day has no successor to take its stop time from. statusMeta is the only
// duration the API exposes for it, always formatted as "16 min".
function parseFallbackStop(start, node) {
  const statusMeta = node.statusMeta?.[0]?.value
  if (!statusMeta) return null

  const match = statusMeta.match(/(\d+)\s*min/)
  return match ? start.add(parseInt(match[1], 10), 'minute') : null
}
