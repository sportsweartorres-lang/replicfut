module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ Bot conectado como ${client.user.tag}`);
        console.log(`📊 Servidores: ${client.guilds.cache.size}`);
        console.log(`👥 Usuarios: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);
    },
};
