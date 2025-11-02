const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configurar el sistema de tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('canal_transcripts')
                .setDescription('Canal donde se enviarán los transcripts')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('categoria_tickets')
                .setDescription('Categoría donde se crearán los tickets')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('rol_soporte')
                .setDescription('Rol que puede ver todos los tickets')
                .setRequired(false)),
    
    async execute(interaction, client) {
        const transcriptChannel = interaction.options.getChannel('canal_transcripts');
        const ticketCategory = interaction.options.getChannel('categoria_tickets');
        const supportRole = interaction.options.getRole('rol_soporte');

        const configPath = path.join(__dirname, '..', 'config.json');
        const config = require(configPath);

        if (transcriptChannel) {
            config.transcriptChannelId = transcriptChannel.id;
        }
        if (ticketCategory) {
            config.ticketCategoryId = ticketCategory.id;
        }
        if (supportRole) {
            config.supportRoleId = supportRole.id;
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const setupEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('⚙️ Configuración Actualizada')
            .setDescription('El sistema de tickets ha sido configurado correctamente.')
            .setTimestamp();

        if (transcriptChannel) {
            setupEmbed.addFields({ name: '📄 Canal de Transcripts', value: `${transcriptChannel}`, inline: true });
        }
        if (ticketCategory) {
            setupEmbed.addFields({ name: '📁 Categoría de Tickets', value: `${ticketCategory.name}`, inline: true });
        }
        if (supportRole) {
            setupEmbed.addFields({ name: '👥 Rol de Soporte', value: `${supportRole}`, inline: true });
        }

        await interaction.reply({ embeds: [setupEmbed], ephemeral: true });
    },
};
