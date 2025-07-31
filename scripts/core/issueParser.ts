import { Dictionary } from '@freearhey/core'
import { Issue } from '../models'

const FIELDS = new Dictionary({
  Site: 'site'
})

export class IssueParser {
  parse(issue: { number: number; body: string; labels: { name: string }[] }): Issue {
    const fields = issue.body.split('###')

    const data = new Dictionary()
    fields.forEach((field: string) => {
      const parsed = field.split(/\r?\n/).filter(Boolean)
      let _label = parsed.shift()
      _label = _label ? _label.trim() : ''
      let _value = parsed.join('\r\n')
      _value = _value ? _value.trim() : ''

      if (!_label || !_value) return data

      const id: string = FIELDS.get(_label)
      const value: string = _value === '_No response_' || _value === 'None' ? '' : _value

      if (!id) return

      data.set(id, value)
    })

    const labels = issue.labels.map(label => label.name)

    return new Issue({ number: issue.number, labels, data })
  }
}
