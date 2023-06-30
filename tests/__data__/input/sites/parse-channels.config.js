module.exports = {
  site: 'parse-channels.com',
  url() {
    return `https://parse-channels.com`
  },
  parser() {
    return []
  },
  channels() {
    return [
      {
        lang: 'en',
        site_id: 140,
        name: 'CNN International'
      },
      {
        lang: 'en',
        site_id: 240,
        name: 'BBC World News'
      }
    ]
  }
}
