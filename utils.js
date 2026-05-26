const { EmbedBuilder } = require('discord.js');

function buildEmbed({ title, date, description, location, bring, color, announcedBy }) {
  const embed = new EmbedBuilder()
    .setColor(color ?? 0x5865f2)
    .setTitle(`📅  ${title}`)
    .setDescription(`## ${description}\n​`)
    .addFields({ name: '🗓️  When', value: `**${date}**`, inline: !!location });

  if (location) embed.addFields({ name: '📍  Location', value: `**${location}**`, inline: true });

  if (bring) embed.addFields({ name: '​', value: '​' });
  if (bring) embed.addFields({ name: '🎒  What to Bring', value: `**${bring}**` });

  embed.setFooter({ text: `📣 Announced by ${announcedBy}` }).setTimestamp();
  return embed;
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase().replace(/\s+/g, '');
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2] ?? '0');
  const meridiem = match[3];

  if (meridiem === 'pm' && hours !== 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
}

function advanceDate(dateStr, recurring) {
  const parts = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!parts) return dateStr;
  const d = new Date(new Date().getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]));
  if (recurring === 'daily') d.setDate(d.getDate() + 1);
  else if (recurring === 'weekly') d.setDate(d.getDate() + 7);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

module.exports = { buildEmbed, parseTime, advanceDate };
