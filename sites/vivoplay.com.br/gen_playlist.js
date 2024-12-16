const fs = require("fs-extra");
const parser = require("iptv-playlist-parser");
const convert = require("xml-js");
const channelsFile = "./sites/vivoplay.com.br.channels.xml";
const staticChannels = fs.readFileSync("./926057-full.m3u", {
  encoding: "utf-8",
});

let playlistFileText = "#EXTM3U";

const xml = fs.readFileSync(channelsFile, { encoding: "utf-8" });
const result = convert.xml2js(xml);
const site = result.elements.find((el) => el.name === "site");
const channels = site.elements.find((el) => el.name === "channels");
const resultStatic = parser.parse(staticChannels);

channels.elements.map((el) => {
  const index = resultStatic.items.filter(
    (val) => parseName(val.tvg.name) == parseName(el.attributes.xmltv_id)
  );
  const filterBestQuality = filterChannelsByQuality(index)
  let itemHeader = "#EXTINF:-1,";

    if (el.attributes.site_id) itemHeader += ` tvg-id="${el.attributes.site_id}"`;
    if (el.attributes.logo) itemHeader += ` tvg-logo="${el.attributes.logo}"`;
    if (el.attributes.xmltv_id) itemHeader += ` tvg-name="${el.attributes.xmltv_id}"`;
    if (filterBestQuality[0]?.group?.title) itemHeader += ` group-title="${clearGroupName(filterBestQuality[0]?.group?.title)}"`;

    itemHeader += `,${el.attributes.xmltv_id}`;
    itemHeader +=  (filterBestQuality[0] !== undefined) ? `\n${filterBestQuality[0].url}` : '\n';
    playlistFileText += `\n${itemHeader}`;
    console.log((filterBestQuality[0] !== undefined) ? "Adicionado o canal: " + filterBestQuality[0].tvg.name : "Não encontrado streams para o canal:" + el.attributes.xmltv_id)
});
fs.outputFile("./gh-pages/playlist.m3u", playlistFileText, (err) => {
  console.log("Sucess");
});

function parseName(name) {
  return name.toLowerCase()
  .replace(/\[h265\]|\[h265\]/gi, "")
  .replace(/fhd | fhd/g, "")
  .replace(/hd | hd/g, "")
  .replace(/sd | sd/g, "")
  .replace(/&/g, '&amp;')
  .replace(/ cam/g, "")
  .trim()
  .trim()
}

function getQualityScore(name) {
  const qualityWeights = [
    { quality: "[H265]", weight: 1 },
    { quality: "FHD", weight: 2 },
    { quality: "HD", weight: 3 },
    { quality: "SD", weight: 4 },
  ];

  const lowercaseName = name.toLowerCase();
  
  for (const { quality, weight } of qualityWeights) {
    if (lowercaseName.includes(quality.toLowerCase())) {
      return weight;
    }
  }

  return qualityWeights.length + 1; // default score for other cases
}

function filterChannelsByQuality(channels) {
  return channels.sort((a, b) => {
    const scoreA = getQualityScore(a.tvg.name);
    const scoreB = getQualityScore(b.tvg.name);

    return scoreA - scoreB; // ascending order, change to b - a for descending order
  });
}

function clearGroupName(name) {
  return name
  .replace("Canais", "")
  .replace("|", "")
  .replace("PT: ", "")
  .trim()
}
