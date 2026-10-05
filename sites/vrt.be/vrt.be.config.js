const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const EPG_QUERY = `
query EpgPage($pageId: ID!, $lazyItemCount: Int = 100) {
  page(id: $pageId) {
    ... on ElectronicProgramGuidePage {
      previous {
        ...epgListFragment
      }
      next {
        ...epgListFragment
      }
    }
  }
}

fragment epgListFragment on PaginatedTileList {
  listId
  paginatedItems(first: $lazyItemCount) {
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
}

fragment epgTileFragment on Tile {
  ... on ITile {
    title
    description
    primaryMeta {
      value
      shortValue
    }
    indexMeta {
      value
    }
    progress {
      durationInSeconds
    }
    status {
      accessibilityLabel
      text {
        small
        default
      }
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
                link
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
const API_ENDPOINT = 'https://www.vrt.be/vrtnu-api/graphql/public/v1'
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
          pageId: `/vrtmax/tv-gids/${channel.site_id}/${date.format('YYYY-MM-DD')}/`
        }
      }
    }
  },
  parser({ content }) {
    let data
    try {
      data = JSON.parse(content)
    } catch {
      return []
    }
    if (!data.data?.page) return []

    const page = data.data?.page
    const previousEdges = page.previous?.paginatedItems?.edges || []
    const nextEdges = page.next?.paginatedItems?.edges || []
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
  const iso = cursor.replace(/^epg#[^#]+#/, '')
  const d = dayjs.utc(iso)
  return d.isValid() ? d : null
}

function parseFallbackStop(start, node) {
  // Try progress.durationInSeconds (radio)
  const durationS = node.progress?.durationInSeconds
  if (durationS) return start.add(durationS, 'second')

  // Try status.text.small e.g. "16 min"
  const statusSmall = node.status?.text?.small
  if (statusSmall) {
    const match = statusSmall.match(/(\d+)\s*min/)
    if (match) return start.add(parseInt(match[1], 10), 'minute')
  }

  return null
}
