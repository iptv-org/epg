const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const EPG_QUERY = `
query EpgPage(
  $pageId: ID!
  $previousAfter: ID
  $nextAfter: ID
  $skipPrevious: Boolean = false
  $skipNext: Boolean = false
) {
  page(id: $pageId) {
    ... on ElectronicProgramGuidePage {
      previous @skip(if: $skipPrevious) {
        paginatedItems(first: 100, after: $previousAfter) {
          ...epgListFragment
        }
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
    const edges = [...previousEdges, ...nextEdges]

    const programs = []
    edges.forEach((edge, index) => {
      const node = edge.node
      if (!node || !node.title) return

      const start = parseCursor(edge.cursor)
      if (!start) return

      const nextEdge = edges[index + 1]
      const stop = nextEdge ? parseCursor(nextEdge.cursor) : parseFallbackStop(start, node)
      if (!stop || !stop.isAfter(start)) return

      programs.push({
        title: node.title,
        description: node.description || null,
        season: parseSeason(node.primaryMeta),
        episode: parseEpisode(node.primaryMeta),
        image: node.image?.templateUrl || null,
        url: parseUrl(node.action),
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

  return link.startsWith('http') ? link : `${SITE_URL}${link}`
}

function buildPageId(channel, date) {
  return `/vrtmax/tv-gids/${channel.site_id}/${date.format('YYYY-MM-DD')}/`
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
            skipNext: listName !== 'next'
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
