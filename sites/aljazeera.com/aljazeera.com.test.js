const { url, request, parser } = require('./aljazeera.com.config.js');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const date = dayjs.utc('2025-12-05'); // The date we are testing for
const channel = { site_id: 'aje', xmltv_id: 'Al Jazeera English' };

it('can generate valid url', () => {
    const result = url({ channel, date });
    // Check that the URL contains the base and the specific site ID
    expect(result).toContain('https://www.aljazeera.com/graphql');
    expect(result).toContain('wp-site=aje');
    expect(result).toContain('operationName=ArchipelagoSchedulePageQuery');
});

it('can generate valid request headers', () => {
    // Check that the headers function injects the correct Wp-Site ID
    const headers = request.headers({ channel });
    expect(headers['Wp-Site']).toBe('aje');
    expect(headers['User-Agent']).toBeDefined();
});

it('can parse response', () => {
    // 1. Create a Fake API Response that mimics the Real One
    // We use a timestamp for Dec 5, 2025 to match our test date above
    const content = JSON.stringify({
        data: {
            post: {
                schedule: [
                    {
                        showName: "Morning News",
                        showDescription: "Global news update",
                        startDate: "1764892800", // This is Midnight Dec 5, 2025 (UTC)
                        showTimeslot: "10:00",
                        duration: "00:30:0"
                    }
                ]
            }
        }
    });

    // 2. Run the parser
    const result = parser({ content, channel, date });

    // 3. Verify the result matches our calculation
    // Base (Midnight) + 10 Hours = 10:00 AM
    expect(result).toMatchObject([
        {
            title: "Morning News",
            description: "Global news update",
            start: "2025-12-05T10:00:00.000Z", 
            stop: "2025-12-05T10:30:00.000Z"
        }
    ]);
});

it('can handle empty guide', () => {
    // Test what happens if the schedule is empty
    const content = JSON.stringify({
        data: {
            post: {
                schedule: []
            }
        }
    });
    const result = parser({ content, channel, date });
    expect(result).toMatchObject([]);
});
