import { URL } from 'node:url'

type ProxyParserResult = {
  protocol: string | null
  auth: {
    username: string | null
    password: string | null
  }
  host: string
  port: number | null
}

export class ProxyParser {
  parse(_url: string): ProxyParserResult {
    const parsed = new URL(_url)

    return {
      protocol: parsed.protocol.replace(':', '') || null,
      auth: {
        username: parsed.username || null,
        password: parsed.password || null
      },
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : null
    }
  }
}
