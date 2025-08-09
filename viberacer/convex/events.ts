import { query } from "./_generated/server";

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = [];
    const now = new Date();
    
    // Get next 5 hourly races
    for (let i = 0; i < 5; i++) {
      const eventTime = new Date(now);
      eventTime.setHours(eventTime.getHours() + i);
      eventTime.setMinutes(0);
      eventTime.setSeconds(0);
      
      const hour = eventTime.getHours();
      const period = hour >= 12 ? 'pm' : 'am';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const timeString = `${displayHour}:00${period}`;
      
      events.push({
        type: "standard",
        time: timeString,
      });
    }
    
    return events;
  },
});
