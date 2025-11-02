const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creando directorio de datos:', error);
    }
}

async function saveTickets(ticketsMap) {
    try {
        await ensureDataDir();
        const ticketsArray = Array.from(ticketsMap.entries()).map(([channelId, data]) => ({
            channelId,
            ...data
        }));
        await fs.writeFile(TICKETS_FILE, JSON.stringify(ticketsArray, null, 2));
        
        const trackingCount = ticketsArray.filter(t => t.tracking).length;
        console.log(`💾 ${ticketsArray.length} ticket(s) guardado(s) (${trackingCount} con tracking)`);
    } catch (error) {
        console.error('Error guardando tickets:', error);
    }
}

async function loadTickets() {
    try {
        const data = await fs.readFile(TICKETS_FILE, 'utf8');
        const ticketsArray = JSON.parse(data);
        const ticketsMap = new Map();
        
        ticketsArray.forEach(ticket => {
            const { channelId, ...data } = ticket;
            ticketsMap.set(channelId, data);
        });
        
        const trackingCount = Array.from(ticketsMap.values()).filter(t => t.tracking).length;
        console.log(`📂 ${ticketsMap.size} ticket(s) cargado(s) (${trackingCount} con tracking)`);
        return ticketsMap;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📂 No hay datos de tickets previos (archivo no existe)');
            return new Map();
        }
        console.error('Error cargando tickets:', error);
        return new Map();
    }
}

async function cleanupOldData(client) {
    try {
        let cleaned = 0;
        const toDelete = [];
        
        for (const [channelId, ticketData] of client.tickets.entries()) {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) {
                toDelete.push(channelId);
                cleaned++;
            }
        }
        
        toDelete.forEach(channelId => client.tickets.delete(channelId));
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} ticket(s) eliminado(s) (canales no existen)`);
            await saveTickets(client.tickets);
        }
        
        return cleaned;
    } catch (error) {
        console.error('Error limpiando datos:', error);
        return 0;
    }
}

module.exports = {
    saveTickets,
    loadTickets,
    cleanupOldData
};
