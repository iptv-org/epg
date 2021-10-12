const file = require('./file')
const parser = require('./parser')

const days = 2
const includes = []

file.list('sites/*.channels.xml', includes).then(files => {
  const matrix = {
    site: [],
    country: [],
    days: []
  }

  files.forEach(filename => {
    const channelsFile = file.read(filename)
    const parsed = parser.parseChannels(channelsFile)
    parsed.groups.forEach(group => {
      matrix.site.push(parsed.site)
      matrix.country.push(group.country.toLowerCase())
      matrix.days.push(days)
    })
  })

  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  console.log(output)
})
