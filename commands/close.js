const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Cerrar el ticket actual'),
    
    async execute(interaction, client) {
        const channel = interaction.channel;
        
        if (!channel.name.startsWith(config.ticketPrefix)) {
            return interaction.reply({
                content: '❌ Este comando solo se puede usar en canales de tickets.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const ticketData = client.tickets.get(channel.id);
            
            const closingEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔒 Cerrando Ticket')
                .setDescription(`Ticket cerrado por ${interaction.user}\n\nGenerando transcript...`)
                .setTimestamp();

            await interaction.editReply({ embeds: [closingEmbed] });

            const transcript = await createTranscript(channel, {
                limit: -1,
                returnType: 'attachment',
                filename: `transcript-${channel.name}.html`,
                saveImages: true,
                poweredBy: false
            });

            const transcriptEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('📄 Transcript del Ticket')
                .setDescription(`**Ticket:** ${channel.name}\n**Cerrado por:** ${interaction.user}\n**Fecha:** ${new Date().toLocaleString('es-ES')}`)
                .setTimestamp();

            if (config.transcriptChannelId) {
                const transcriptChannel = await client.channels.fetch(config.transcriptChannelId).catch(() => null);
                if (transcriptChannel) {
                    await transcriptChannel.send({
                        embeds: [transcriptEmbed],
                        files: [transcript]
                    });
                }
            }

            if (ticketData && ticketData.userId) {
                try {
                    const user = await client.users.fetch(ticketData.userId);
                    await user.send({
                        content: `Hola ${user}, tu ticket **${channel.name}** ha sido cerrado.\n\nAquí está el transcript de la conversación:`,
                        files: [transcript]
                    }).catch(err => {
                        console.log(`No se pudo enviar DM a ${user.tag}:`, err.message);
                    });
                } catch (error) {
                    console.log('Error enviando DM:', error.message);
                }
            }

            client.tickets.delete(channel.id);

            setTimeout(async () => {
                await channel.delete().catch(console.error);
            }, 5000);

        } catch (error) {
            console.error('Error cerrando ticket:', error);
            await interaction.editReply({
                content: '❌ Hubo un error al cerrar el ticket.',
            });
        }
    },
};
