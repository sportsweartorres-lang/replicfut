const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

function createTrackingEmbed(trackingNumber, trackingInfo, carrier, embedColor) {
    const trackEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('📦 Seguimiento de Pedido')
        .addFields(
            { name: 'Número de Seguimiento', value: `\`${trackingNumber}\``, inline: true },
            { name: 'Transportista', value: carrier, inline: true },
            { name: 'Estado', value: trackingInfo.status || 'Información no disponible', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: '🔄 Se actualiza cada 10 minutos | 17TRACK' });

    if (trackingInfo.note) {
        trackEmbed.addFields({
            name: '💡 Nota',
            value: trackingInfo.note,
            inline: false
        });
    }

    if (trackingInfo.details && trackingInfo.details.length > 0) {
        const detailsText = trackingInfo.details.slice(0, 5).map(detail => {
            return `**${detail.date}** - ${detail.status}`;
        }).join('\n');
        
        trackEmbed.addFields({
            name: 'Últimos Movimientos',
            value: detailsText || 'No hay detalles disponibles'
        });
    }

    trackEmbed.addFields({
        name: '🔗 Ver Detalles Completos',
        value: `[Rastrear en 17TRACK](https://www.17track.net/en/track?nums=${trackingNumber})`
    });

    return trackEmbed;
}

async function trackPackage(trackingNumber, carrier = 'MJ') {
    const apiKey = process.env.TRACK17_API_KEY;
    
    if (!apiKey) {
        return {
            status: 'Configuración pendiente',
            details: [],
            note: 'Se requiere TRACK17_API_KEY para obtener información detallada automáticamente. Usa el enlace manual para rastrear.'
        };
    }

    try {
        const response = await axios.post(
            'https://api.17track.net/track/v2.2/register',
            [{
                number: trackingNumber,
                carrier: carrier
            }],
            {
                headers: {
                    '17token': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        if (response.data && response.data.data && response.data.data.accepted && response.data.data.accepted.length > 0) {
            const trackResponse = await axios.post(
                'https://api.17track.net/track/v2.2/gettrackinfo',
                [{
                    number: trackingNumber,
                    carrier: carrier
                }],
                {
                    headers: {
                        '17token': apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            if (trackResponse.data && trackResponse.data.data && trackResponse.data.data.length > 0) {
                const trackData = trackResponse.data.data[0];
                
                return {
                    status: trackData?.track?.e || 'En tránsito',
                    details: trackData?.track?.z?.map(item => ({
                        date: item.a || 'Sin fecha',
                        status: item.z || 'Sin información',
                        location: item.c || ''
                    })) || []
                };
            }
        }

        return {
            status: 'Información no disponible a través de la API',
            details: [],
            note: 'Usa el enlace manual para ver el estado actualizado.'
        };

    } catch (error) {
        console.error('Error en trackPackage:', error.message);
        
        return {
            status: 'No se pudo obtener información automáticamente',
            details: [],
            error: error.message,
            note: 'La API de 17TRACK requiere autenticación. Usa el enlace manual para rastrear.'
        };
    }
}

module.exports = { trackPackage, createTrackingEmbed };
