const dayjs = require('dayjs');
module.exports = {
	site: 'aljazeera.com',
	days: 2,
	
	url: function({channel}) {
		return `https://www.aljazeera.com/graphql?wp-site=${channel.site_id}&operationName=ArchipelagoSchedulePageQuery&variables=%7B%22postName%22%3A%22schedule%22%2C%22preview%22%3A%22%22%7D`;
	},
	request: {
	headers: function({channel}) {
		  return {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
			"Wp-Site": channel.site_id
		  };	
		}
	},
	
	parser: function(context) {
		const parsed = JSON.parse(context.content);
		const rawPrograms = parsed.data.post.schedule;
		const programs = rawPrograms.map(function(item){
		  const parts = item.showTimeslot.split(':');
		  const startSeconds = parseInt(item.startDate) + (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60);
		  const startObj = new Date(startSeconds * 1000);
		  const durParts = item.duration.split(':');
		  const durationSeconds = (parseInt(durParts[0]) * 3600) + (parseInt(durParts[1]) * 60) + (parseInt(durParts[2] || 0)); 
		  const stopObj = new Date((startSeconds + durationSeconds) * 1000);

		  return {
			title: item.showName,
			description: item.showDescription,
			start: startObj.toISOString(),
			stop: stopObj.toISOString()
		  };
		});
		const targetDate = context.date.format('YYYY-MM-DD');
		return programs.filter(p => p.start.substring(0, 10) === targetDate);
	}
};	