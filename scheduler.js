const fs = require('fs');
const path = require('path');
const { buildEmbed, advanceDate } = require('./utils');

const EVENTS_FILE = path.join(__dirname, 'events.json');

function loadEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8')); }
  catch { return []; }
}

function saveEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

function scheduleEvent(client, event) {
  const now = new Date();
  const next = new Date();
  next.setHours(event.time.hours, event.time.minutes, 0, 0);

  if (next <= now) {
    if (event.recurring === 'daily') next.setDate(next.getDate() + 1);
    else if (event.recurring === 'weekly') next.setDate(next.getDate() + 7);
  }

  const delay = next.getTime() - now.getTime();

  setTimeout(async () => {
    try {
      const guild = await client.guilds.fetch(event.guildId).catch(() => null);
      if (!guild) return;
      const channel = guild.channels.cache.get(event.channelId);
      if (!channel) return;

      const embed = buildEmbed({
        title: event.title,
        date: event.currentDate,
        description: event.description,
        location: event.location,
        bring: event.bring,
        color: event.color,
        announcedBy: event.announcedBy
      });

      await channel.send({ content: '@everyone', embeds: [embed] });

      const events = loadEvents();
      const idx = events.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        events[idx].currentDate = advanceDate(event.currentDate, event.recurring);
        saveEvents(events);
        scheduleEvent(client, events[idx]);
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  }, delay);

  const h = String(event.time.hours).padStart(2, '0');
  const m = String(event.time.minutes).padStart(2, '0');
  console.log(`Scheduled "${event.title}" (${event.recurring}) → next send at ${next.toLocaleString()} [${h}:${m}]`);
}

function saveRecurringEvent(client, eventData) {
  const events = loadEvents();
  const newEvent = { id: Date.now().toString(), ...eventData };
  events.push(newEvent);
  saveEvents(events);
  scheduleEvent(client, newEvent);
}

function startScheduler(client) {
  const events = loadEvents();
  for (const event of events) scheduleEvent(client, event);
  if (events.length) console.log(`Loaded ${events.length} recurring event(s).`);
}

module.exports = { startScheduler, saveRecurringEvent };
