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
        xmltv_id: 'CNNInternational.us',
        site_id: 140,
        name: 'CNN International'
      }
    ]
  }
}
