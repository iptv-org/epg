const dayjs = require('dayjs')
const axios = require('axios')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const doFetch = require('@ntlab/sfetch')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let session

module.exports = {
  site: 'xem.kplus.vn',
  days: 2,
  url({ channel, date }) {
    return `https://tvapi-sgn.solocoo.tv/v1/assets?query=schedule,forrelated,${
      channel.site_id
    }&from=${date.format('YYYY-MM-DDTHH:mm:ss[Z]')}&limit=1000`
  },
  request: {
    async headers() {
      if (!session) {
        session = await loadSessionDetails()
        if (!session || !session.token) return null
      }

      return {
        authorization: `Bearer ${session.token}`
      }
    }
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      programs.push({
        title: item.title,
        categories: parseCategories(item),
        images: parseImages(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const session = await loadSessionDetails()
    if (!session || !session.token) throw new Error('The session token is missing')

    const groups = [
      'Channels_Kplus',
      'Channels_VTV',
      'Channels_VTVcab',
      'Channels_Kênh Quốc Tế',
      'Channels_SCTV',
      'Channels_HTV-HTVC',
      'Channels_THVL',
      'Channels_Kênh Thiết Yếu',
      'Channels_Kênh Địa Phương'
    ]

    const queue = groups.map(group => ({
      url: `https://tvapi-sgn.solocoo.tv/v1/assets?query=nav,${group}&limit=100`,
      params: {
        headers: {
          authorization: `Bearer ${session.token}`
        }
      }
    }))

    let channels = []
    await doFetch(queue, (url, data) => {
      data.assets.forEach(channel => {
        if (!channel?.params?.params?.id) return

        channels.push({
          lang: 'vi',
          name: channel.params.internalTitle.replace('Channels_', ''),
          site_id: channel.params.params.id
        })
      })
    })

    return channels
  }
}

function parseCategories(item) {
  return Array.isArray(item?.params?.genres) ? item.params.genres.map(i => i.title) : []
}

function parseImages(item) {
  return Array.isArray(item?.images)
    ? item.images
        .filter(i => i.url.indexOf('orientation=landscape') > 0)
        .map(i => `${i.url}&w=460&h=260`)
    : []
}

function parseStart(item) {
  return item?.params?.start ? dayjs.utc(item.params.start, 'YYYY-MM-DDTHH:mm:ss[Z]') : null
}

function parseStop(item) {
  return item?.params?.end ? dayjs.utc(item.params.end, 'YYYY-MM-DDTHH:mm:ss[Z]') : null
}

function parseItems(content, date) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.assets)) return []

    return data.assets.filter(
      p => p?.params?.start && date.isSame(dayjs.utc(p.params.start, 'YYYY-MM-DDTHH:mm:ss[Z]'), 'd')
    )
  } catch (err) {
    console.log(err)
    return []
  }
}

function loadSessionDetails() {
  return axios
    .post('https://tvapi-sgn.solocoo.tv/v1/session', {
      ssoToken:
        'eyJhbGciOiJkaXIiLCJrZXkiOiJ2c3R2IiwiZW5jIjoiQTEyOENCQy1IUzI1NiJ9..6jMKWv5bSqODWOWLmeERqw._WcKmMW2ij3yPJkhFllQHgXOkW7powvzT-5p6G4_jjYa8vzJybmHu_1CwIEb_s2hVOyaNDi6M-NVLNY9CaNU3aSC-ojZ4UoQ7QLRTFWP-2uY-mL5IgJtL7Xknus5blHJbR8B-xaOODXIJh8PneZORmPHa5EHhs1vOmqpGb1COZwqlw_WFbGT9EsFq6W8fsYH3O5cUqec608Uad-wK59OQIJyofZJwrb6VTthmwwIDxX6Dn-kyYssfdXvPF_BXu5A-e2MFOsdzvMjENdq0FHCk-b9OojzENR6S-JEtSTrZHrgSfHsqb1DwVbtuaetFlV-A3-gxyqqHH7QIvkRM38StNMAp_q8TUauhluwKK3nuXbgogiQ9d9Kc9s7WGoBPOVHsZ4w6wJ9fDBIyhApOJUAdEINi7dLpe1pTBBk6ZA504PVyQ0d6DtdhJhkbT6I88wwxz2U6sF5tInZBcdyZzCa1KKHWQuonTJ4IPcILGQFuzo.lhVv2QaTOaxTS9F4Ht2L3A',
      osVersion: 'Windows 10',
      deviceModel: 'Chrome',
      deviceType: 'PC',
      deviceSerial: 'w408a0eb0-d50f-11ef-affa-af9775b838ad',
      deviceOem: 'Chrome',
      devicePrettyName: 'Chrome 128.0.0.0',
      appVersion: '12.1',
      language: 'en_US',
      brand: 'vstv',
      memberId: '0',
      featureLevel: 6,
      provisionData:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MzcxNDU4MjYsImljIjp0cnVlLCJ1cCI6ImNwaSIsImJyIjoidnN0diIsImRzIjoidzQwOGEwZWIwLWQ1MGYtMTFlZi1hZmZhLWFmOTc3NWI4MzhhZCIsImRlIjoiYnJhbmRNYXBwaW5nIn0.Ou6yh5qXtlK4NhyWHciVszARr98PLL1TkaXKpqQtub8'
    })
    .then(r => r.data)
    .catch(console.log)
}
