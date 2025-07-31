module.exports = {
  site: 'example.com',
  url: 'https://example.com',
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
