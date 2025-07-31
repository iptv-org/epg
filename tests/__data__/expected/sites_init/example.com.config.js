module.exports = {
  site: 'example.com',
  url({ channel, date }) {
    return `https://example.com/api/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser({ content }) {
    try {
      return JSON.parse(content)
    } catch {
      return []
    }
  },
  channels() {
    return []
  }
}
