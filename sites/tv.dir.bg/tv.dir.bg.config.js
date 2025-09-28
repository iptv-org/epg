const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let sessionCache = null

async function getSession(forceRefresh = false) {
  if (sessionCache && !forceRefresh) {
    return sessionCache
  }
  
  try {
    const initResponse = await axios.get('https://tv.dir.bg/init')
    
    if (!initResponse.data) {
      throw new Error('No response data from init endpoint')
    }
    
    // Extract cookies from response headers
    const setCookieHeader = initResponse.headers['set-cookie']
    let xsrfToken = null
    let dirSessionCookie = null
    
    if (setCookieHeader) {
      setCookieHeader.forEach(cookie => {
        // Extract XSRF token from cookie
        const xsrfMatch = cookie.match(/XSRF-TOKEN=([^;]+)/)
        if (xsrfMatch) {
          xsrfToken = decodeURIComponent(xsrfMatch[1])
        }
        
        // Extract dir_session cookie
        const sessionMatch = cookie.match(/dir_session=([^;]+)/)
        if (sessionMatch) {
          dirSessionCookie = sessionMatch[1]
        }
      })
    }
    
    const csrfToken = initResponse.data.csrfToken

    if (!csrfToken) {
      throw new Error('No CSRF/XSRF token found in response')
    }
    
    // Build cookie string
    let cookieString = ''
    if (xsrfToken) {
      cookieString += `XSRF-TOKEN=${encodeURIComponent(xsrfToken)}`
    }
    if (dirSessionCookie) {
      if (cookieString) cookieString += '; '
      cookieString += `dir_session=${dirSessionCookie}`
    }
    
    sessionCache = {
      csrfToken,
      cookieString,
      timestamp: Date.now()
    }
    
    return sessionCache
    
  } catch (error) {
    console.error('Error getting session:', error.message)
    throw error
  }
}

module.exports = {
  site: 'tv.dir.bg',
  days: 2,
  url: 'https://tv.dir.bg/load/programs',
  request: {
    maxContentLength: 125000000, // 10 MB
    method: 'POST',
    async headers() {
      try {
        const session = await getSession()
        return {
          'Cookie': session.cookieString,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        }
        
      } catch (error) {
        console.error('Error getting headers:', error.message)
        throw error
      }
    },
    async data({ channel, date }) {
      try {
        const session = await getSession()
        
        const params = new URLSearchParams()
        params.append('_token', session.csrfToken)
        params.append('channel', channel.site_id)
        params.append('day', date.format('YYYY-MM-DD'))
        
        return params
        
      } catch (error) {
        console.error('Error preparing request data:', error.message)
        throw error
      }
    },
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)

    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
        }
        prev.stop = start
      }
      
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  },
  
  async channels() {
    try {
      const response = await axios.get('https://tv.dir.bg/channels')
      const $ = cheerio.load(response.data)
      
      const channels = []
      
      $('.channel_cont').each((_index, element) => {
        const $element = $(element)
        
        const $link = $element.find('a.channel_link')
        const href = $link.attr('href')
        
        const $img = $element.find('img')
        const name = $img.attr('alt')
        const logo = $img.attr('src')
        
        const site_id = href ? href.match(/\/programa\/(\d+)/)?.[1] : ''
        
        if (site_id && name) {
          channels.push({
            lang: 'bg',
            site_id: site_id,
            name: name.trim(),
            logo: logo ? (logo.startsWith('http') ? logo : `https://tv.dir.bg${logo}`) : null
          })
        }
      })
    
      return channels
    
    } catch (error) {
      console.error('Error fetching channels:', error.message)
      return []
    }
  },
  
  clearSession() {
    sessionCache = null
  }
}

function parseStart($item, date) {
  const time = $item('.broadcast-time').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${time}`
  
  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Europe/Sofia')
}


function parseTitle($item) {
  return $item('.broadcast-title').text()
    .replace(/\s+/g, ' ')
    .trim()
}

function parseItems(content) {
  try { 
    const json = JSON.parse(content)

    if (!json || json.status !== true) {
      return []
    }
    
    const $ = cheerio.load(json.html)
    const items = $('.broadcast-item').toArray()
    
    return items
    
  } catch (error) {
    console.error('❌ Error parsing items:', error.message)
    console.error('Error stack:', error.stack)
    return []
  }
}