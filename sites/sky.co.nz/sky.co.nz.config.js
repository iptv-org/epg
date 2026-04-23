const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const tz = require('dayjs/plugin/timezone')
const timezone = 'Pacific/Auckland'

dayjs.extend(utc)
dayjs.extend(tz)


module.exports = {
  site: 'sky.co.nz',
  days: 2,
  url: 'https://api.skyone.co.nz/exp/graph',
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data({ date } = {}) {
      return ({
        query: `{
            experience(appId: TV_GUIDE_WEB) {
              channelGroup(id: "4b7LA20J4iHaThwky9iVqn") {
                id
                title
                channels {
                  ... on LinearChannel {
                    id
                    title
                    number
                    tileImage {
                      uri
                    }
                    slotsForDay(date: "${dayjs.tz(date || dayjs(), timezone).format('YYYY-MM-DD')}") {
                      slots {
                        id
                        startMs
                        endMs
                        live
                        nzBsaRatingString
                        programme {
                          ... on Episode {
                            id
                            title
                            synopsis
                          }
                          ... on Movie {
                            id
                            title
                          }
                          ... on PayPerViewEventProgram {
                            id
                            title
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }`
      })
    }
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.synopsis,
        rating: parseRating(item),
        start: dayjs(parseInt(item.start)),
        stop: dayjs(parseInt(item.end))
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://skywebconfig.msl-prod.skycloud.co.nz/sky/json/channels.prod.json')
      .then(r => r.data)
      .catch(console.log)

    return data.map(item => {
      return {
        lang: 'en',
        site_id: parseInt(item.number).toString(),
        name: item.sort
      }
    })
  }
}

function parseItems(content, channel) {
  if (!channel?.site_id) return []

  let data
  try {
    data = JSON.parse(content)
  } catch {
    return []
  }

  const channels = data?.data?.experience?.channelGroup?.channels
  
  if (!Array.isArray(channels)) return []
  
  const channelData = channels.find(i => i.number === parseInt(channel.site_id))

  if (!channelData?.slotsForDay?.slots) return []
  
  return channelData.slotsForDay.slots.map(slot => ({
    title: slot.programme.title || null,
    synopsis: slot.programme.synopsis || null,
    rating: slot.nzBsaRatingString || null,
    start: slot.startMs,
    end: slot.endMs
  }))
}

function parseRating(item) {
  if (!item.rating) return null
  return {
    system: 'OFLC',
    value: item.rating
  }
}
