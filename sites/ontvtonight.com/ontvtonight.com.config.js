const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const uniqBy = require('lodash.uniqby')
const AwsWaf = require('@ntlab/awswaf')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let awsWafToken, awsWafTokenFetching
const cookies = {}
const headers = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
}

module.exports = {
  site: 'ontvtonight.com',
  days: 2,
  url({ date, channel }) {
    return getSiteUrl(channel, date)
  },
  request: {
    async headers({ date, channel }) {
      await fetchCookiesOrToken(getSiteUrl(channel, date))

      return  getHeaders()
    }
  },
  parser({ content, date, channel }) {
    const programs = []
    const [$, items] = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = $(item)
      let start = parseStart($item, date, channel)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ country }) {
    const channels = []
    const sUrls = []
    let $, providers, regions
    const u = (p, r) => {
      const res = []
      for (const provider of p) {
        for (const region of r) {
          const url = getScheduleUrl(country, provider, region)
          if (!sUrls.includes(url)) {
            sUrls.push(url)
            res.push(url)
          }
        }
      }

      return res
    }
    const v = items => {
      return items
        .toArray()
        .map(item => $(item).attr('value'))
    }
    const urls = [`${getBaseUrl(country)}/guide/tvbycity.html`]
    while (urls.length) {
      const url = urls.shift()
      await fetchCookiesOrToken(url)
      const data = await axios.request({
          url,
          method: url.includes('tvbycity') ? 'get' : 'post',
          headers: getHeaders()
        })
        .then(res => res.data)
        .catch(() => {
          // ignore error
        })
      if (data) {
        $ = cheerio.load(data)
        if (url.includes('tvbycity')) {
          $('article ul li a')
            .toArray()
            .forEach(el => {
              urls.push(`${getBaseUrl()}${$(el).attr('href')}`)
            })
        } else if (url.includes('listings')) {
          console.log(`Listing ${url}...`)
          providers = v($('#guide_provider option'))
          if ($('#guide_region').parents('.stream-filter').hasClass('d-none')) {
            regions = v($('#provider-zip'))
          } else {
            regions = v($('#guide_region option'))
          }
          const _urls = u(providers, regions)
          if (_urls.length) {
            urls.push(..._urls)
          }
        } else {
          console.log(`${url} (${urls.length} to go)...`)
          $('.channelname').each((i, el) => {
            let name = $(el).find('center > a:eq(1)').text()
            name = name.replace(/--/gi, '-')
            const url = $(el).find('center > a:eq(1)').attr('href')
            if (!url) return
            const [, number, slug] = url.match(/\/(\d+)\/(.*)\.html$/)

            channels.push({
              lang: 'en',
              name,
              site_id: `${country}#${number}/${slug}`
            })
          })
        }
      }
    }

    return uniqBy(channels, 'site_id')
  }
}

function parseStart($item, date, channel) {
  const timezones = {
    au: 'Australia/Sydney',
    ca: 'America/Toronto',
    us: 'America/New_York'
  }
  const [region] = channel.site_id.split('#')
  const timeString = $item.find('td:nth-child(1) > h5').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD H:mm a', timezones[region])
}

function parseTitle($item) {
  return $item.find('td:nth-child(2) > h5').text().trim()
}

function parseDescription($item) {
  return $item.find('td:nth-child(2) > h6').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return [$, $('table > tbody > tr').toArray()]
}

function getHeaders() {
  return {
    ...headers,
    cookie: Object.entries(cookies)
      .map(kv => `${kv[0]}=${kv[1]}`)
      .join('; ')
  }
}

function getBaseUrl(country) {
  return `https://www.ontvtonight.com${country && country !== 'us' ? '/' + country : ''}`
}

function getSiteUrl(channel, date) {
  const [country, id] = channel.site_id.split('#')

  return `${getBaseUrl(country)}/guide/listings/channel/${id}.html?dt=${date.format('YYYY-MM-DD')}`
}

function getScheduleUrl(country, provider, region) {
  return `${getBaseUrl(country)}/guide/schedule?provider=${
    provider
  }&region=${
    region
  }&TVperiod=Night&date=${dayjs().format('YYYY-MM-DD')}&st=0&u_time=0000&is_mobile=1`
}

async function fetchCookiesOrToken(url) {
  const f = async (m = 'head') => {
    let waf
    await axios[m](url, { headers: getHeaders() })
      .then(res => saveCookies(res))
      .catch(err => {
        if (err instanceof axios.AxiosError && err.status === 405) {
          waf = err.response
        }
      })
    if (waf) {
      if (m === 'head') {
        await f('get')
      } else if (waf.data) {
        console.log(`WAF triggered from ${url}, fetching token...`)
        awsWafTokenFetching = true
        try {
          await fetchWafToken(waf.data)
        } catch (err) {
          console.error(err)
        }
        awsWafTokenFetching = false
      }
    }
  }
  await f()
  if (awsWafTokenFetching) {
    // delay other connection to finish if token is fetching
    await new Promise(resolve => {
      process.nextTick(() => {
        if (!awsWafTokenFetching) {
          resolve()
        }
      })
    })
  }
}

function saveCookies(res) {
  if (res.headers && Array.isArray(res.headers['set-cookie'])) {
    res.headers['set-cookie']
      .map(cookie => cookie.split(';')[0].trim())
      .forEach(cookie => {
        const [k, v] = cookie.split('=')
        cookies[k] = v
      })
  }

  return res
}

async function fetchWafToken(content) {
  const $ = cheerio.load(content)
  const challengeJs = $('script[src]')
    .toArray()
    .map(s => $(s).attr('src'))
    .filter(s => s.includes('challenge.js'))
  if (challengeJs.length) {
    const [, endpoint] = challengeJs[0].match(/(https:\/\/[^"]+)\/challenge\.js/)
    const waf = new AwsWaf(endpoint, 'www.ontvtonight.com', headers['user-agent'])
    awsWafToken = await waf.getToken()
    if (awsWafToken) {
      console.log(`Got WAF token ${awsWafToken}...`)
      cookies['aws-waf-token'] = awsWafToken
    }
  }
}