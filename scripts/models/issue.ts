import { EOL, OWNER, REPO } from '../constants'
import { Dictionary } from '@freearhey/core'

const FIELDS = new Dictionary({
  Site: 'site'
})

interface IssueData {
  number: number
  body: string
  labels: { name: string }[]
}

export class Issue {
  number: number
  labels: string[]
  data: Dictionary<string>

  constructor(issue: IssueData) {
    const fields = typeof issue.body === 'string' ? issue.body.split('###') : []

    this.data = new Dictionary<string>()
    fields.forEach((field: string) => {
      const parsed = field.split(/\r?\n/).filter(Boolean)
      let _label = parsed.shift()
      _label = _label ? _label.trim() : ''
      let _value = parsed.join(EOL)
      _value = _value ? _value.trim() : ''

      if (!_label || !_value) return

      const id: string | undefined = FIELDS.get(_label)
      const value: string = _value === '_No response_' || _value === 'None' ? '' : _value

      if (!id) return

      this.data.set(id, value)
    })

    this.labels = issue.labels.map(label => label.name)
    this.number = issue.number
  }

  getURL() {
    return `https://github.com/${OWNER}/${REPO}/issues/${this.number}`
  }
}
