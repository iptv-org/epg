const markdownInclude = require('markdown-include')
const file = require('./file')

const markdown = {}

markdown.createTable = function (data, cols) {
  let output = '<table>\n'

  output += '  <thead>\n    <tr>'
  for (let column of cols) {
    output += `<th align="left">${column}</th>`
  }
  output += '</tr>\n  </thead>\n'

  output += '  <tbody>\n'
  for (let groupId in data) {
    const group = data[groupId]
    for (let [i, item] of group.entries()) {
      const rowspan = group.length > 1 ? ` rowspan="${group.length}"` : ''
      output += '    <tr>'
      if (i === 0) {
        const name = item.flag ? `${item.flag} ${item.name}` : item.name
        output += `<td align="left" valign="top" nowrap${rowspan}>${name}</td>`
      }
      output += `<td align="right">${item.channels}</td>`
      output += `<td align="left" nowrap>${item.epg}</td>`
      output += '</tr>\n'
    }
  }
  output += '  </tbody>\n'

  output += '</table>'

  return output
}

markdown.compile = function (filepath) {
  markdownInclude.compileFiles(file.resolve(filepath))
}

module.exports = markdown
