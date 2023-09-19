module.exports = {
  site: 'example.com',
  days: 1,
  request: {
    timeout: 1000
  },
  url() {
    return `https://example.com`
  },
  parser({ channel }) {
    if (channel.xmltv_id === 'Channel2.us') return []

    return [
      {
        title: 'Program1',
        start: '2022-03-06T04:30:00.000Z',
        stop: '2022-03-06T07:10:00.000Z'
      }
    ]
  }
}
