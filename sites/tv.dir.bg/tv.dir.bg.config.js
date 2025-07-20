const axios = require('axios')
const cheerio = require('cheerio')
const url = require('url')
const { DateTime } = require('luxon')

let cachedToken = null
let tokenExpiry = null

module.exports = {
  site: 'tv.dir.bg',
  days: 2,
  async url({ channel, date }) {
    const token = await getToken()
    if (!token) {
      throw new Error('Unable to retrieve CSRF token')
    }
    
    const form = new url.URLSearchParams({ 
      _token: token,
      channel: channel.site_id, 
      day: date.format('YYYY-MM-DD') 
    })
    
    return axios.post('https://tv.dir.bg/load/programs', form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (!start) return
      
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.plus({ days: 1 })
        }
        prev.stop = start
      }
      
      const stop = start.plus({ minutes: 30 })
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
      
      $('.channel_cont').each((index, element) => {
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
            name: name,
            logo: logo
          })
        }
      })
    
    return channels
    
  } catch (error) {
    console.error('Error fetching channels:', error)
    return []
  }
}
}

async function getToken() {
  if (cachedToken && tokenExpiry && DateTime.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await axios.get('https://tv.dir.bg/init', { headers: {'X-Requested-With': 'XMLHttpRequest'} })

    // Check different possible locations for the token
    let token = null
    if (response.data && response.data.csrfToken) {
      token = response.data.csrfToken
    }
    
    if (token) {
      cachedToken = token
      tokenExpiry = DateTime.now().plus({ hours: 1 })
      return token
    } else {
      console.error('CSRF token not found in response structure:', Object.keys(response.data || {}))
      return null
    }
  } catch (error) {
    console.error('Error fetching token:', error.message)
    return null
  }
}

function parseStart($item, date) {
  const timeText = $item('.broadcast-time').text().trim()
  if (!timeText) return null
  
  const [hours, minutes] = timeText.split(':').map(Number)
  const dateTime = date.isValid ? date : DateTime.fromISO(date)
  return dateTime.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
}

function parseTitle($item) {
  return $item('.broadcast-title').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)
  return $('.broadcast-item').toArray()
}
