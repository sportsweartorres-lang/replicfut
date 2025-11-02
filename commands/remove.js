const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remover un usuario del ticket')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a remover del ticket')
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
        const ticketData = client.tickets.get(channel.id);

        if (ticketData && ticketData.userId === user.id) {
            return interaction.reply({
                content: '❌ No puedes remover al creador del ticket.',
                ephemeral: true
            });
        }

        try {
            await channel.permissionOverwrites.delete(user.id);

            await interaction.reply({
                content: `✅ ${user} ha sido removido del ticket.`,
            });

        } catch (error) {
            console.error('Error removiendo usuario:', error);
            await interaction.reply({
                content: '❌ No se pudo remover el usuario del ticket.',
                ephemeral: true
            });
        }
    },
};
