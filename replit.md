# Bot de Discord - Sistema de Tickets

## Descripción del Proyecto
Bot de Discord con sistema completo de tickets que incluye:
- Sistema de tickets con crear/cerrar (múltiples tickets por usuario)
- Persistencia automática de datos que sobrevive reinicios del bot
- Generación automática de transcripts en HTML
- Envío de transcripts al canal configurado y por DM al usuario
- Gestión de usuarios (añadir/remover del ticket)
- Seguimiento automático de pedidos con 17TRACK para transportista MJ
- Sistema de actualización automática cada 10 minutos para tracking
- Tracking funciona en tickets creados por otros bots/sistemas
- Mensajes anclados con información de seguimiento en tiempo real
- Interfaz con botones de Discord

## Estructura del Proyecto

```
/
├── commands/           # Comandos slash del bot
│   ├── ticket.js      # Crear ticket
│   ├── close.js       # Cerrar ticket y generar transcript
│   ├── add.js         # Añadir usuario al ticket
│   ├── remove.js      # Remover usuario del ticket
│   ├── track.js       # Rastrear pedidos con 17TRACK
│   └── setup.js       # Configurar el sistema
├── events/            # Manejadores de eventos
│   ├── ready.js       # Evento cuando el bot se conecta
│   └── buttonHandler.js # Manejo de botones
├── utils/             # Utilidades
│   ├── tracking.js    # Funciones para 17TRACK
│   ├── trackingUpdater.js # Sistema de actualización automática
│   └── dataStore.js   # Sistema de persistencia de datos
├── data/              # Datos persistentes (ignorado en git)
│   └── tickets.json   # Información de tickets y trackings
├── index.js           # Archivo principal del bot
├── deploy-commands.js # Script para registrar comandos
├── config.json        # Configuración del bot
└── package.json       # Dependencias del proyecto
```

## Tecnologías Utilizadas
- Node.js v20
- Discord.js v14
- discord-html-transcripts v3.2.0
- axios para llamadas HTTP
- dotenv para variables de entorno

## Configuración Necesaria

### Variables de Entorno (.env)
- `DISCORD_TOKEN`: Token del bot de Discord
- `CLIENT_ID`: ID de la aplicación del bot
- `GUILD_ID`: ID del servidor de Discord (opcional para comandos globales)

### Configuración del Bot (config.json)
- `transcriptChannelId`: ID del canal donde se envían transcripts
- `ticketCategoryId`: ID de la categoría donde se crean tickets
- `supportRoleId`: ID del rol que puede ver todos los tickets
- `carrier`: Transportista para 17TRACK (por defecto "MJ")

## Comandos Disponibles

1. `/ticket` - Crear un nuevo ticket de soporte
2. `/close` - Cerrar el ticket actual y generar transcript
3. `/add @usuario` - Añadir usuario al ticket
4. `/remove @usuario` - Remover usuario del ticket
5. `/track <numero>` - Rastrear pedido con 17TRACK
6. `/setup` - Configurar el sistema (solo admin)

## Flujo de Trabajo del Sistema de Tickets

1. Usuario ejecuta `/ticket`
2. Se crea un canal privado con permisos solo para el usuario y staff
3. Se envía mensaje de bienvenida con botones de control
4. Al cerrar con `/close` o botón:
   - Se genera transcript HTML completo
   - Se envía al canal de transcripts configurado
   - Se envía por DM al creador del ticket
   - Se elimina el canal después de 5 segundos

## Características de Seguridad
- Permisos granulares por canal de ticket
- Solo el creador y staff pueden ver tickets
- No se puede remover al creador del ticket
- Validación de canales antes de ejecutar comandos

## Estado Actual
✅ Sistema de tickets con múltiples tickets por usuario
✅ Persistencia de datos con archivos JSON
✅ Restauración automática de trackings al reiniciar
✅ Generación de transcripts
✅ Envío por DM y canal
✅ Gestión de usuarios en tickets
✅ Integración con 17TRACK
✅ Tracking en canales externos (otros bots)
✅ Interfaz con botones
✅ Bot configurado y en ejecución

## Próximos Pasos
1. Usuario proporciona token del bot
2. Configurar variables de entorno
3. Ejecutar `node deploy-commands.js` para registrar comandos
4. Ejecutar `npm start` para iniciar el bot
5. Usar `/setup` en Discord para configurar canales y roles

## Cambios Recientes
- 2025-11-02: **Sistema de persistencia completo**: Los tickets y trackings ahora se guardan automáticamente y se restauran al reiniciar el bot
- 2025-11-02: **Múltiples tickets por usuario**: Eliminada la limitación de un ticket por usuario
- 2025-11-02: **Tracking en canales externos**: El comando `/track` ahora funciona en cualquier canal, no solo tickets creados por este bot
- 2025-11-02: **Limpieza automática**: El sistema elimina automáticamente datos de canales que ya no existen
- 2025-11-02: Implementación del sistema de tracking automático con actualización cada 10 minutos
- 2025-11-02: Implementación inicial del bot completo con todas las funcionalidades

## Sistema de Tracking Automático

El bot ahora incluye un sistema avanzado de seguimiento de pedidos:

### Funcionamiento:
1. El comando `/track` crea un mensaje anclado en el ticket
2. El mensaje se actualiza automáticamente cada 10 minutos
3. Muestra información en tiempo real del pedido
4. Se detiene automáticamente al cerrar el ticket

### Implementación:
- `utils/trackingUpdater.js`: Sistema de intervalos que actualiza todos los trackings activos
- `commands/track.js`: Comando modificado para crear mensajes anclados
- `client.tickets`: Cada ticket puede tener un objeto `tracking` con:
  - `trackingNumber`: Número de seguimiento
  - `messageId`: ID del mensaje anclado
  - `channelId`: ID del canal del ticket
  - `lastUpdate`: Timestamp de la última actualización

### Configuración:
- Intervalo de actualización: 10 minutos (600,000 ms)
- Se inicia automáticamente cuando el bot se conecta
- Logs en consola cada vez que actualiza
- Se detiene automáticamente cuando el bot se desconecta (SIGINT/SIGTERM)

### Persistencia de Datos:
- ✅ **Guardado automático**: Todos los tickets y trackings se guardan automáticamente en `data/tickets.json`
- ✅ **Restauración al reiniciar**: El bot carga automáticamente todos los tickets y trackings activos al iniciar
- ✅ **Limpieza inteligente**: Elimina automáticamente datos de canales que ya no existen
- ✅ **Sincronización continua**: Los cambios se guardan inmediatamente después de cada operación
- El intervalo de actualización se limpia correctamente al detener el bot para evitar memory leaks

### Características Avanzadas:
- **Múltiples tickets**: Los usuarios pueden tener varios tickets abiertos simultáneamente
- **Canales únicos**: Cada ticket tiene un nombre único basado en usuario + timestamp
- **Tickets externos**: El bot puede trackear pedidos en canales creados por otros sistemas
- **Limpieza automática**: Los trackings inválidos se eliminan y persisten automáticamente
