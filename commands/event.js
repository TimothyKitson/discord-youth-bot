const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { buildEmbed, parseTime } = require('../utils');
const { saveRecurringEvent } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage server events')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand(sub =>
      sub
        .setName('announce')
        .setDescription('Announce an upcoming event in #announcements')
        .addStringOption(opt =>
          opt.setName('title').setDescription('Event title').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('date').setDescription('Date (e.g. 5/28 or Wednesday June 4)').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('description').setDescription('What is this event about?').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('recurring')
            .setDescription('How often should this repeat?')
            .setRequired(true)
            .addChoices(
              { name: 'None', value: 'none' },
              { name: 'Daily', value: 'daily' },
              { name: 'Weekly', value: 'weekly' }
            )
        )
        .addStringOption(opt =>
          opt.setName('time')
            .setDescription('Time to send recurring announcements (e.g. 5:30 PM). Required if recurring.')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('location').setDescription('Where is it?').setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('bring').setDescription('What should people bring?').setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('color').setDescription('Embed color hex (e.g. #FF6B00)').setRequired(false)
        )
    ),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const date = interaction.options.getString('date');
    const description = interaction.options.getString('description');
    const recurring = interaction.options.getString('recurring');
    const timeStr = interaction.options.getString('time');
    const location = interaction.options.getString('location');
    const bring = interaction.options.getString('bring');
    const colorInput = interaction.options.getString('color');

    if (recurring !== 'none' && !timeStr) {
      return interaction.reply({
        content: 'You must provide a **time** when using Daily or Weekly recurring.',
        ephemeral: true
      });
    }

    let color = 0x5865f2;
    if (colorInput) {
      const parsed = parseInt(colorInput.replace('#', ''), 16);
      if (!isNaN(parsed)) color = parsed;
    }

    const announcementChannel = interaction.guild.channels.cache.find(
      ch => ch.name === 'announcements' && ch.type === ChannelType.GuildText
    );

    if (!announcementChannel) {
      return interaction.reply({
        content: 'Could not find a **#announcements** channel. Please create one first.',
        ephemeral: true
      });
    }

    const embed = buildEmbed({
      title, date, description, location, bring, color,
      announcedBy: interaction.user.tag
    });

    await announcementChannel.send({ content: '@everyone', embeds: [embed] });

    if (recurring !== 'none') {
      const parsedTime = parseTime(timeStr);
      if (!parsedTime) {
        return interaction.reply({
          content: `Announced! But couldn't parse time "${timeStr}" — use a format like **5:30 PM** or **17:30**. Recurring was not set up.`,
          ephemeral: true
        });
      }

      saveRecurringEvent(interaction.client, {
        guildId: interaction.guild.id,
        channelId: announcementChannel.id,
        title, description, location, bring, color,
        recurring,
        time: parsedTime,
        timeStr,
        currentDate: date,
        announcedBy: interaction.user.tag
      });

      return interaction.reply({
        content: `Event announced and set to repeat **${recurring}** at **${timeStr}**!`,
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `Event announced in ${announcementChannel}!`,
      ephemeral: true
    });
  }
};
