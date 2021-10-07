const glob = require('glob')

fileList(['ad'], []).then(files => {
  const country = files.map(file => file.replace(/channels\/|\.xml/gi, ''))
  const days = country.map(() => 2)
  const matrix = { country, days }
  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  console.log(output)
})

function fileList(include = [], exclude = []) {
  return new Promise(resolve => {
    glob('channels/**/*.xml', function (err, files) {
      if (include.length) {
        include = include.map(filename => `channels/${filename}.xml`)
        files = files.filter(filename => include.includes(filename))
      }

      if (exclude.length) {
        exclude = exclude.map(filename => `channels/${filename}.xml`)
        files = files.filter(filename => !exclude.includes(filename))
      }

      resolve(files)
    })
  })
}
