const file = require('./file')
const parser = require('./parser')

file
  .list('sites/*.channels.xml', [
    'sites/andorradifusio.ad.channels.xml',
    'sites/arianaafgtv.com.channels.xml'
  ])
  .then(files => {
    const matrix = {
      site: [],
      country: []
    }

    files.forEach(filename => {
      const channelsFile = file.read(filename)
      const parsed = parser.parseChannels(channelsFile)
      parsed.groups.forEach(group => {
        matrix.site.push(parsed.site)
        matrix.country.push(group.country.toLowerCase())
      })
    })

    const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
    console.log(output)
  })
