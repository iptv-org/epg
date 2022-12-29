const chalk = require('chalk')
const libxml = require('libxmljs2')
const { program } = require('commander')
const { logger, file } = require('../../core')

const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="site">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="channels"/>
      </xs:sequence>
      <xs:attribute name="site" use="required" type="xs:string"/>
    </xs:complexType>
  </xs:element>
  <xs:element name="channels">
    <xs:complexType>
      <xs:sequence>
        <xs:element minOccurs="0" maxOccurs="unbounded" ref="channel"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  <xs:element name="channel">
    <xs:complexType mixed="true">
      <xs:attribute name="lang" use="required" type="xs:string"/>
      <xs:attribute name="site_id" use="required" type="xs:string"/>
      <xs:attribute name="xmltv_id" use="required" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`

program.argument('<filepath>', 'Path to file to validate').parse(process.argv)

async function main() {
  if (!program.args.length) {
    logger.error('required argument "filepath" not specified')
  }

  let errors = []

  for (const filepath of program.args) {
    if (!filepath.endsWith('.xml')) continue

    const xml = await file.read(filepath)

    let localErrors = []

    try {
      const xsdDoc = libxml.parseXml(xsd)
      const doc = libxml.parseXml(xml)

      if (!doc.validate(xsdDoc)) {
        localErrors = doc.validationErrors
      }
    } catch (error) {
      localErrors.push(error)
    }

    if (localErrors.length) {
      logger.info(`\n${chalk.underline(filepath)}`)
      localErrors.forEach(error => {
        const position = `${error.line}:${error.column}`
        logger.error(` ${chalk.gray(position.padEnd(4, ' '))} ${error.message.trim()}`)
      })

      errors = errors.concat(localErrors)
    }
  }

  if (errors.length) {
    logger.error(chalk.red(`\n${errors.length} error(s)`))
    process.exit(1)
  }
}

main()
