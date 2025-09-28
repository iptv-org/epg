const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'player.ee.co.uk',
  days: 2,
  url({ date, channel, hour = 0 }) {
    return `https://api.youview.tv/metadata/linear/v2/schedule/by-servicelocator?serviceLocator=${encodeURIComponent(
      channel.site_id
    )}&interval=${date.format('YYYY-MM-DD')}T${hour.toString().padStart(2, '0')}Z/PT12H`
  },
  request: {
    headers: {
      Referer: 'https://player.ee.co.uk/'
    }
  },
  async parser({ content, channel, date }) {
    const programs = []
    if (content) {
      const schedule = JSON.parse(content)
      // fetch next 12 hours schedule
      const { url, request } = module.exports
      const nextSchedule = await axios
        .get(url({ channel, date, hour: 12 }), { headers: request.headers })
        .then(response => response.data)
        .catch(console.error)

      if (schedule?.items) {
        // merge schedules
        if (nextSchedule?.items) {
          schedule.items.push(...nextSchedule.items)
        }
        schedule.items.forEach(item => {
          let season, episode
          const start = dayjs.utc(item.publishedStartTime)
          const stop = start.add(item.publishedDuration, 's')
          const description = item.synopsis
          if (description) {
            const matches = description.trim().match(/\(?S(\d+)[/\s]Ep(\d+)\)?/)
            if (matches) {
              if (matches[1]) {
                season = parseInt(matches[1])
              }
              if (matches[2]) {
                episode = parseInt(matches[2])
              }
            }
          }
          programs.push({
            title: item.title,
            description,
            season,
            episode,
            start,
            stop
          })
        })
      }
    }

    return programs
  },
  async channels() {
    const token =
      'eyJkaXNjb3ZlcnlVc2VyR3JvdXBzIjpbIkFMTFVTRVJTIiwiYWxsIiwiaHR0cDovL3JlZmRhd' +
      'GEueW91dmlldy5jb20vbXBlZzdjcy9Zb3VWaWV3QXBwbGljYXRpb25QbGF5ZXJDUy8yMDIxLT' +
      'A5LTEwI2FuZHJvaWRfcnVudGltZS1wcm9maWxlMSIsInRhZzpidC5jb20sMjAxOC0wNy0xMTp' +
      '1c2VyZ3JvdXAjR0JSLWJ0X25vd1RWX211bHRpY2FzdCIsInRhZzpidC5jb20sMjAyMS0xMC0y' +
      'NTp1c2VyZ3JvdXAjR0JSLWJ0X2V1cm9zcG9ydCJdLCJyZWdpb25zIjpbIkFMTFJFR0lPTlMiL' +
      'CJHQlIiLCJHQlItRU5HIiwiR0JSLUVORy1sb25kb24iLCJhbGwiXSwic3Vic2V0IjoiMy41Lj' +
      'EvYW5kcm9pZF9ydW50aW1lLXByb2ZpbGUxL0JST0FEQ0FTVF9JUC9HQlItYnRfYnJvYWRiYW5' +
      'kIiwic3Vic2V0cyI6WyIvLy8iLCIvL0JST0FEQ0FTVF9JUC8iLCIzLjUvLy8iXX0='
    const extensions = [
      'LinearCategoriesExtension',
      'LogicalChannelNumberExtension',
      'BTSubscriptionCodesExtension'
    ]
    const result = await axios
      .get('https://api.youview.tv/metadata/linear/v2/linear-services', {
        params: {
          contentTargetingToken: token,
          extensions: extensions.join(',')
        },
        headers: module.exports.request.headers
      })
      .then(response => response.data)
      .catch(console.error)

    return (
      result?.items
        .filter(channel => channel.contentTypes.indexOf('tv') >= 0)
        .map(channel => {
          return {
            lang: 'en',
            site_id: channel.serviceLocator,
            name: channel.fullName
          }
        }) || []
    )
  }
}
