const { Client, GatewayIntentBits, Collection, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { startTrackingUpdater, stopTrackingUpdater } = require('./utils/trackingUpdater');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();
client.tickets = new Map();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

client.on('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);
    console.log(`👥 Usuarios: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);
    
    client.user.setActivity('🎫 Sistema de Tickets', { type: 'WATCHING' });
    
    startTrackingUpdater(client);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo bot...');
    stopTrackingUpdater();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Deteniendo bot...');
    stopTrackingUpdater();
    client.destroy();
    process.exit(0);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            const reply = { content: '❌ Hubo un error al ejecutar este comando.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }
});

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ ERROR: No se encontró DISCORD_TOKEN en las variables de entorno.');
    console.log('📝 Por favor, crea un archivo .env con tu token del bot.');
    console.log('   Ejemplo: DISCORD_TOKEN=tu_token_aqui');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('❌ Error al iniciar sesión:', err.message);
    console.log('🔑 Verifica que tu DISCORD_TOKEN sea válido.');
});
