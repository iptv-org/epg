module.exports = {
  site: 'example.com',
  days: 2,
  url() {
    return `https://example.com`
  },
  parser() {
    return [
      {
        title: 'Program1',
        start: '2022-03-06T04:30:00.000Z',
        stop: '2022-03-06T07:10:00.000Z'
      }
    ]
  }
}
