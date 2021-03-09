**------------------------------------------------------------------------------------------------
* @header_start
* WebGrab+Plus ini for grabbing EPG data from TvGuide websites
* @Site: beinconnect.es
* @MinSWversion:
* @Revision 0 - [02/03/2017] Netuddki
*     - create
* @Remarks: your_remarks
* @header_end
**------------------------------------------------------------------------------------------------

site {url=beinconnect.es|timezone=Europe/Madrid|maxdays=6|cultureinfo=es-ES|charset=UTF-8|titlematchfactor=90}
*site {ratingsystem=ES|episodesystem=onscreen}
url_index{url|https://beinconnect.es/programacion}
url_index.headers {customheader=Accept-Encoding=gzip,deflate}
*urldate.format {datestring|yyyy-MM-dd}

index_variable_element.modify {set|'config_site_id'}
index_showsplit.scrub {multi(includeblock="'index_variable_element'\\"")|{\"uuid|{\"sub||]}

index_start.scrub {regex||\\"start\\":{.*?timestamp\\":(\d+)},||}
index_end.scrub {regex||\\"end\\":{.*?timestamp\\":(\d+)},||}
index_title.scrub {regex||\\"title\\":\\"(.*?)\\"||}
index_subtitle.scrub {regex||Title\\":\\"(.*?)\\"||}
index_title.modify {addstart('index_title' "")|'index_subtitle'}
*
*
**  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _
**      #####  CHANNEL FILE CREATION (only to create the xxx-channel.xml file)
**
** @auto_xml_channel_start
*url_index{url|https://beinconnect.es/programacion}
*index_site_channel.scrub {multi|,\"name\":\"||\",\"}
*index_site_id.scrub {multi|,\"name\":\"||\",\"}
*index_site_id.modify {cleanup(removeduplicates=equal,100 link="index_site_channel")}
** @auto_xml_channel_end
