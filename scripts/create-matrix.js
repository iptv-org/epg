const file = require('./file.js')

file.list(['ad'], ['us-local']).then(files => {
  const country = files.map(file => file.replace(/channels\/|\.xml/gi, ''))
  const days = country.map(() => 2)
  const matrix = { country, days }
  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  console.log(output)
})
