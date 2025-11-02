const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { trackPackage, createTrackingEmbed } = require('../utils/tracking');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('track')
        .setDescription('Rastrear un pedido con 17TRACK (actualización automática cada 10 minutos)')
        .addStringOption(option =>
            option.setName('numero')
                .setDescription('Número de seguimiento del pedido')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const channel = interaction.channel;
        
        if (!channel.name.startsWith(config.ticketPrefix)) {
            return interaction.reply({
                content: '❌ Este comando solo se puede usar en canales de tickets.',
                ephemeral: true
            });
        }

        const trackingNumber = interaction.options.getString('numero');
        const ticketData = client.tickets.get(channel.id);
        
        if (!ticketData) {
            return interaction.reply({
                content: '❌ No se encontró información del ticket.',
                ephemeral: true
            });
        }

        if (ticketData.tracking) {
            return interaction.reply({
                content: `❌ Ya hay un seguimiento activo en este ticket para el número: \`${ticketData.tracking.trackingNumber}\`\n\nPara cambiar el número de seguimiento, primero cierra este ticket y crea uno nuevo.`,
                ephemeral: true
            });
        }
        
        await interaction.deferReply();

        try {
            const trackingInfo = await trackPackage(trackingNumber, config.carrier);
            const trackEmbed = createTrackingEmbed(trackingNumber, trackingInfo, config.carrier, config.embedColor, config.carrierName);

            await interaction.editReply({
                content: '📌 Seguimiento iniciado. Este mensaje se actualizará automáticamente cada 10 minutos.',
                embeds: [trackEmbed]
            });

            const message = await interaction.fetchReply();
            await message.pin();

            ticketData.tracking = {
                trackingNumber: trackingNumber,
                messageId: message.id,
                channelId: channel.id,
                lastUpdate: Date.now()
            };

            await interaction.followUp({
                content: '✅ Seguimiento configurado correctamente. El mensaje ha sido anclado y se actualizará automáticamente.',
                ephemeral: true
            });

        } catch (error) {
            console.error('Error configurando seguimiento:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error al Configurar Seguimiento')
                .setDescription(`No se pudo configurar el seguimiento del pedido.\n\n**Número:** ${trackingNumber}\n**Transportista:** ${config.carrierName || config.carrier}`)
                .addFields({
                    name: '🔗 Rastrear Manualmente',
                    value: `[Ver en 17TRACK](https://www.17track.net/en/track?nums=${trackingNumber})`
                })
                .setTimestamp();

            await interaction.editReply({ 
                content: null,
                embeds: [errorEmbed] 
            });
        }
    },
};
