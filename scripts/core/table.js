const table = {}

table.create = function (data, cols) {
  let output = '<table>\r\n'

  output += '  <thead>\r\n    <tr>'
  for (let column of cols) {
    output += `<th align="left">${column}</th>`
  }
  output += '</tr>\r\n  </thead>\r\n'

  output += '  <tbody>\r\n'
  output += getHTMLRows(data)
  output += '  </tbody>\r\n'

  output += '</table>'

  return output
}

function getHTMLRows(data) {
  let output = ''
  for (let group of data) {
    let rowspan = group.length
    for (let [j, row] of group.entries()) {
      output += '    <tr>'
      for (let [i, value] of row.entries()) {
        if (i === 0 && j === 0) {
          output += `<td valign="top" rowspan="${rowspan}">${value}</td>`
        } else if (i > 0) {
          if (typeof value === 'number') {
            output += `<td align="right" nowrap>${value}</td>`
          } else {
            output += `<td nowrap>${value}</td>`
          }
        }
      }
      output += '</tr>\r\n'
    }
  }

  return output
}

function getSpan() {}

module.exports = table
