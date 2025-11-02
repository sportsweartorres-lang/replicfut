const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

function translateToSpanish(text) {
    if (!text) return text;
    
    const translations = {
        '航班已起飞': 'Vuelo despegado',
        '预计': 'estimado',
        '抵达': 'llegada',
        '航班预计延误': 'Vuelo retrasado',
        '起飞': 'despegue',
        '落地': 'aterrizaje',
        '国内出口报关完成': 'Despacho aduanero de exportación completado',
        '抵达航司': 'Llegada a aerolínea',
        '预定航班中': 'Reservando vuelo',
        '货物打包完成': 'Paquete embalado',
        '已发往航司': 'enviado a aerolínea',
        'exit customs clearance complete': 'Despacho aduanero de salida completado',
        '到达收货点': 'Llegado al punto de recogida',
        '货物电子信息已经收到': 'Información electrónica del paquete recibida',
        'En tránsito internacional': 'En tránsito internacional',
        'Pendiente de recepción': 'Pendiente de recepción',
        'Ya tenemos todos los detalles de tu envío': 'Ya tenemos todos los detalles de tu envío',
        'Te lo entregaremos muy pronto': 'Te lo entregaremos muy pronto',
        'arrived at the delivery point': 'Llegado al punto de entrega',
        'package has been packed': 'Paquete ha sido embalado',
        'flight has taken off': 'Vuelo ha despegado',
        'customs clearance': 'despacho aduanero',
        'in transit': 'en tránsito',
        'delivered': 'entregado',
        'out for delivery': 'en reparto',
        'arrived': 'llegado'
    };

    let translatedText = text;
    
    for (const [original, translation] of Object.entries(translations)) {
        const regex = new RegExp(original, 'gi');
        translatedText = translatedText.replace(regex, translation);
    }
    
    return translatedText;
}

function createTrackingEmbed(trackingNumber, trackingInfo, carrier, embedColor, carrierName = null) {
    const displayCarrier = carrierName || carrier;
    const trackEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('📦 Seguimiento de Pedido')
        .addFields(
            { name: 'Número de Seguimiento', value: `\`${trackingNumber}\``, inline: true },
            { name: 'Transportista', value: displayCarrier, inline: true },
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
        console.log(`🔍 Registrando tracking: ${trackingNumber} con transportista: ${carrier}`);
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

        console.log(`📦 Respuesta de registro:`, JSON.stringify(response.data, null, 2));

        const isAccepted = response.data?.data?.accepted?.length > 0;
        const isAlreadyRegistered = response.data?.data?.rejected?.some(r => r.error?.code === -18019901);

        if (isAccepted) {
            console.log(`✅ Tracking registrado exitosamente, esperando 2 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (isAlreadyRegistered) {
            console.log(`ℹ️ Tracking ya estaba registrado, obteniendo información...`);
        } else {
            console.log(`❌ Tracking rechazado por la API`);
            return {
                status: 'Número de seguimiento rechazado',
                details: [],
                note: 'El número o transportista puede ser incorrecto. Verifica en el enlace manual.'
            };
        }

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

        console.log(`📊 Respuesta de tracking:`, JSON.stringify(trackResponse.data, null, 2));

        if (trackResponse.data && trackResponse.data.data && trackResponse.data.data.accepted && trackResponse.data.data.accepted.length > 0) {
            const trackData = trackResponse.data.data.accepted[0];
            const trackInfo = trackData.track_info;
            
            const latestStatus = trackInfo?.latest_status?.status || 'En tránsito';
            const latestEvent = trackInfo?.latest_event;
            const events = trackInfo?.tracking?.providers?.[0]?.events || [];
            
            const statusMap = {
                'InfoReceived': '📝 Información recibida',
                'InTransit': '🚚 En tránsito',
                'Expired': '⏱️ Expirado',
                'AvailableForPickup': '📦 Disponible para recogida',
                'OutForDelivery': '🚛 En reparto',
                'Delivered': '✅ Entregado',
                'Exception': '⚠️ Incidencia',
                'Returning': '↩️ En devolución',
                'Returned': '↩️ Devuelto'
            };

            const statusText = statusMap[latestStatus] || latestStatus;
            
            return {
                status: statusText,
                details: events.slice(0, 8).map(event => ({
                    date: event.time_raw?.date || 'Sin fecha',
                    status: translateToSpanish(event.description) || 'Sin información',
                    location: event.location || ''
                }))
            };
        }

        console.log(`⚠️ No se pudo obtener información del tracking`);
        return {
            status: 'Información no disponible',
            details: [],
            note: 'No hay información disponible para este número. Usa el enlace manual para verificar.'
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
