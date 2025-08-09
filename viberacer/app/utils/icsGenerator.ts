export function generateICS(eventTitle: string, eventTime: string): string {
  // Parse the event time (e.g., "3:00pm today" or "11:00am tomorrow")
  const now = new Date();
  const timeMatch = eventTime.match(/(\d{1,2}):(\d{2})(am|pm)\s*(today|tomorrow)?/i);
  
  if (!timeMatch) {
    // Default to next hour if we can't parse
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return generateICSFromDate(eventTitle, nextHour);
  }
  
  let hour = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const period = timeMatch[3].toLowerCase();
  const day = timeMatch[4]?.toLowerCase() || 'today';
  
  // Convert to 24-hour format
  if (period === 'pm' && hour !== 12) {
    hour += 12;
  } else if (period === 'am' && hour === 12) {
    hour = 0;
  }
  
  // Create the date
  const eventDate = new Date(now);
  if (day === 'tomorrow') {
    eventDate.setDate(eventDate.getDate() + 1);
  }
  eventDate.setHours(hour, minutes, 0, 0);
  
  // If the time has already passed today, assume it's tomorrow
  if (day === 'today' && eventDate < now) {
    eventDate.setDate(eventDate.getDate() + 1);
  }
  
  return generateICSFromDate(eventTitle, eventDate);
}

function generateICSFromDate(title: string, startDate: Date): string {
  // Contest duration is 36 minutes (from :05 to :41)
  const endDate = new Date(startDate.getTime() + 36 * 60 * 1000);
  
  // Format dates for ICS (YYYYMMDDTHHmmss)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };
  
  const uid = `viberacer-${Date.now()}@viberacer.com`;
  const dtstamp = formatDate(new Date());
  const dtstart = formatDate(startDate);
  const dtend = formatDate(endDate);
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Viberacer//Hackathon Contest//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${title}`,
    'DESCRIPTION:Join the hourly Viberacer hackathon! Code fast\\, compete globally\\, and win glory.',
    'LOCATION:https://viberacer.com',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Viberacer contest starts in 15 minutes!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

export function downloadICS(eventTitle: string, eventTime: string): void {
  const icsContent = generateICS(eventTitle, eventTime);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `viberacer-${eventTitle.toLowerCase().replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
}