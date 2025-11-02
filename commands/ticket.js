const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Crear un nuevo ticket de soporte'),
    
    async execute(interaction, client) {
        const guild = interaction.guild;
        const member = interaction.member;
        
        const existingTicketInMemory = Array.from(client.tickets.values()).find(
            ticket => ticket.userId === member.id
        );

        if (existingTicketInMemory) {
            const channel = await guild.channels.fetch(existingTicketInMemory.channelId).catch(() => null);
            if (channel) {
                return interaction.reply({
                    content: `❌ Ya tienes un ticket abierto: ${channel}`,
                    ephemeral: true
                });
            } else {
                client.tickets.delete(existingTicketInMemory.channelId);
            }
        }

        const normalizedUsername = member.user.username.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const expectedChannelName = `${config.ticketPrefix}${normalizedUsername}`;
        
        const existingChannel = guild.channels.cache.find(
            channel => channel.name === expectedChannelName && channel.type === ChannelType.GuildText
        );

        if (existingChannel) {
            client.tickets.set(existingChannel.id, {
                userId: member.id,
                createdAt: Date.now(),
                channelId: existingChannel.id
            });
            
            return interaction.reply({
                content: `❌ Ya tienes un ticket abierto: ${existingChannel}`,
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const ticketChannel = await guild.channels.create({
                name: expectedChannelName,
                type: ChannelType.GuildText,
                parent: config.ticketCategoryId || null,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                        ],
                    },
                ],
            });

            if (config.supportRoleId) {
                await ticketChannel.permissionOverwrites.create(config.supportRoleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                });
            }

            const ticketEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🎫 Ticket Creado')
                .setDescription(`Hola ${member}, gracias por contactar con soporte.\n\nUn miembro del equipo te atenderá pronto.\n\n**Comandos disponibles:**\n\`/close\` - Cerrar este ticket\n\`/add @usuario\` - Añadir usuario al ticket\n\`/remove @usuario\` - Remover usuario del ticket\n\`/track <numero>\` - Rastrear pedido con 17TRACK`)
                .setTimestamp()
                .setFooter({ text: `Ticket de ${member.user.tag}`, iconURL: member.user.displayAvatarURL() });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Cerrar Ticket')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('transcript_ticket')
                        .setLabel('Generar Transcript')
                        .setEmoji('📄')
                        .setStyle(ButtonStyle.Primary)
                );

            await ticketChannel.send({
                content: `${member} - Tu ticket ha sido creado.`,
                embeds: [ticketEmbed],
                components: [row]
            });

            client.tickets.set(ticketChannel.id, {
                userId: member.id,
                createdAt: Date.now(),
                channelId: ticketChannel.id
            });

            await interaction.editReply({
                content: `✅ Ticket creado: ${ticketChannel}`,
            });

        } catch (error) {
            console.error('Error creando ticket:', error);
            await interaction.editReply({
                content: '❌ Hubo un error al crear el ticket. Verifica los permisos del bot.',
            });
        }
    },
};
