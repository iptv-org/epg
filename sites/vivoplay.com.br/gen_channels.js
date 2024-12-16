const axios = require("axios");
const fs = require("fs-extra");
const convert = require("xml-js");
const endPoint = "https://contentapi-br.cdn.telefonica.com/25/default/pt-BR/contents/all?contentTypes=LCH&ca_active=true&ca_requiresPin=false&fields=Pid,Name,images.icon&orderBy=contentOrder&limit=10000";
const options = {compact: true, ignoreComment: true, spaces: 4}

function getUniqueListBy(arr, key) {
  return [...new Map(arr.map(item => [item[key], item])).values()]
}

axios.get(endPoint).then((body) => {
  const channel = body.data.Content.List.map((chn, index) => {
    const _attributes = {
      site_id: chn.Pid,
      logo: chn.Images.Icon ? chn.Images.Icon[0].Url : null,
      xmltv_id: chn.Title.replace(/HD | HD/g, "").replace(/&/g, '&amp;').trim(),
    };
    const _text = chn.Title.replace(/HD | HD/g, "").replace(/&/g, '&amp;').trim()
    return {
      _attributes,
      _text
    };
  })

  const filterChennels = channel
  .filter(item => !!item._attributes.logo)
  .sort((a,b) => a._text.localeCompare(b._text))

  const json = {
    _declaration: {
      _attributes: { version: '1.0', encoding: 'UTF-8', standalone: 'yes' }
    },
    site: {
      _attributes: { 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance' },
      channels: { channel: getUniqueListBy(filterChennels, '_text')  }
    }
  }

  fs.outputFile("./sites/vivoplay.com.br.channels.xml", convert.json2xml(json, options), (err) => {
    console.log("Sucess");
  });
});
