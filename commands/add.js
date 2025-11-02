const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Añadir un usuario al ticket')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a añadir al ticket')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const channel = interaction.channel;
        
        if (!channel.name.startsWith(config.ticketPrefix)) {
            return interaction.reply({
                content: '❌ Este comando solo se puede usar en canales de tickets.',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id);

        try {
            await channel.permissionOverwrites.create(member, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            });

            await interaction.reply({
                content: `✅ ${user} ha sido añadido al ticket.`,
            });

        } catch (error) {
            console.error('Error añadiendo usuario:', error);
            await interaction.reply({
                content: '❌ No se pudo añadir el usuario al ticket.',
                ephemeral: true
            });
        }
    },
};
