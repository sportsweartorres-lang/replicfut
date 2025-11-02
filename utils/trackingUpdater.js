const { trackPackage, createTrackingEmbed } = require('./tracking');
const { saveTickets } = require('./dataStore');
const config = require('../config.json');

let updateInterval = null;

async function updateAllTrackings(client) {
    let updatedCount = 0;
    let cleanedCount = 0;
    
    for (const [channelId, ticketData] of client.tickets.entries()) {
        if (!ticketData.tracking) continue;

        try {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) {
                console.log(`Canal ${channelId} no encontrado, eliminando tracking.`);
                delete ticketData.tracking;
                cleanedCount++;
                continue;
            }

            const message = await channel.messages.fetch(ticketData.tracking.messageId).catch(() => null);
            if (!message) {
                console.log(`Mensaje de tracking ${ticketData.tracking.messageId} no encontrado.`);
                delete ticketData.tracking;
                cleanedCount++;
                continue;
            }

            const trackingInfo = await trackPackage(ticketData.tracking.trackingNumber, config.carrier);
            const trackEmbed = createTrackingEmbed(
                ticketData.tracking.trackingNumber, 
                trackingInfo, 
                config.carrier, 
                config.embedColor,
                config.carrierName
            );

            await message.edit({
                content: '📌 Seguimiento activo. Este mensaje se actualiza automáticamente cada 10 minutos.',
                embeds: [trackEmbed]
            });

            ticketData.tracking.lastUpdate = Date.now();
            updatedCount++;
            
            console.log(`✅ Tracking actualizado: ${ticketData.tracking.trackingNumber} en canal ${channel.name}`);

        } catch (error) {
            console.error(`Error actualizando tracking en canal ${channelId}:`, error.message);
        }
    }

    if (cleanedCount > 0) {
        console.log(`🧹 ${cleanedCount} tracking(s) inválido(s) eliminado(s)`);
        await saveTickets(client.tickets);
    }

    return { updated: updatedCount, cleaned: cleanedCount };
}

function startTrackingUpdater(client) {
    const UPDATE_INTERVAL = 10 * 60 * 1000;

    if (updateInterval) {
        console.log('⚠️  Sistema de tracking ya está en ejecución.');
        return;
    }

    console.log('🔄 Sistema de actualización de tracking iniciado (cada 10 minutos)');

    updateInterval = setInterval(async () => {
        const activeTrackings = Array.from(client.tickets.values()).filter(t => t.tracking).length;
        
        if (activeTrackings === 0) {
            console.log('⏭️  No hay trackings activos para actualizar.');
            return;
        }

        console.log(`🔄 Actualizando ${activeTrackings} tracking(s) activo(s)...`);
        const result = await updateAllTrackings(client);
        console.log(`✅ Actualización completada: ${result.updated} tracking(s) actualizados, ${result.cleaned} eliminados.`);
        
        if (result.updated > 0) {
            await saveTickets(client.tickets);
        }
        
    }, UPDATE_INTERVAL);
}

function stopTrackingUpdater() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
        console.log('🛑 Sistema de actualización de tracking detenido.');
    }
}

module.exports = { startTrackingUpdater, stopTrackingUpdater, updateAllTrackings };
