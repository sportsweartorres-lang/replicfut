# 🎫 Bot de Discord - Sistema de Tickets

Bot de Discord con sistema completo de tickets, generación de transcripts automáticos, gestión de usuarios y seguimiento de pedidos con 17TRACK.

## 🌟 Características

- ✅ **Sistema de Tickets**: Crear y gestionar tickets de soporte
- 📄 **Transcripts Automáticos**: Generación de transcripts en HTML
- 💬 **Envío por DM**: Los transcripts se envían automáticamente al creador del ticket
- 👥 **Gestión de Usuarios**: Añadir y remover usuarios de tickets
- 📦 **Seguimiento de Pedidos**: Integración con 17TRACK para el transportista MJ
- 🎨 **Interfaz con Botones**: Panel de control con botones de Discord

## 📋 Requisitos Previos

1. **Crear un bot en Discord**:
   - Ve a [Discord Developer Portal](https://discord.com/developers/applications)
   - Crea una nueva aplicación
   - En la sección "Bot", crea un bot y copia el token
   - Habilita estos Privileged Gateway Intents:
     - ✅ SERVER MEMBERS INTENT
     - ✅ MESSAGE CONTENT INTENT
   - En OAuth2 > URL Generator:
     - Selecciona scope: `bot` y `applications.commands`
     - Permisos necesarios:
       - Manage Channels
       - Send Messages
       - Embed Links
       - Attach Files
       - Read Message History
       - Manage Messages
       - Add Reactions

2. **Obtener IDs necesarios**:
   - Habilita el Modo Desarrollador en Discord (Configuración > Avanzado > Modo Desarrollador)
   - CLIENT_ID: ID de tu aplicación (en Developer Portal > General Information)
   - GUILD_ID: Clic derecho en tu servidor > Copiar ID del servidor

## 🚀 Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
Crea un archivo `.env` con el siguiente contenido:
```env
DISCORD_TOKEN=tu_token_del_bot_aqui
CLIENT_ID=tu_client_id_aqui
GUILD_ID=tu_guild_id_aqui
TRACK17_API_KEY=tu_api_key_opcional
```

**Nota sobre TRACK17_API_KEY**: Esta clave es **opcional**. Si no la proporcionas, el comando `/track` seguirá funcionando mostrando un enlace directo a 17TRACK donde puedes ver el seguimiento manualmente. Para obtener una API key:
- Visita [17TRACK API](https://api.17track.net/)
- Regístrate y obtén tu API key
- Agrégala al archivo `.env`

3. **Registrar comandos**:
```bash
node deploy-commands.js
```

4. **Iniciar el bot**:
```bash
npm start
```

## ⚙️ Configuración Inicial

Una vez que el bot esté en línea, usa el comando `/setup` en tu servidor:

```
/setup
  canal_transcripts: #canal-donde-enviar-transcripts
  categoria_tickets: Categoría de Tickets
  rol_soporte: @Rol de Soporte
```

Este comando configurará:
- 📄 Canal donde se enviarán los transcripts
- 📁 Categoría donde se crearán los tickets
- 👥 Rol que puede ver todos los tickets

## 📖 Comandos Disponibles

### `/ticket`
Crea un nuevo ticket de soporte. Solo se puede tener un ticket abierto a la vez.

### `/close`
Cierra el ticket actual, genera el transcript y lo envía:
- Al canal de transcripts configurado
- Por mensaje privado al creador del ticket

### `/add @usuario`
Añade un usuario al ticket actual para que pueda ver y participar.

### `/remove @usuario`
Remueve un usuario del ticket actual.

### `/track <numero>`
Rastrea un pedido usando 17TRACK con el transportista MJ **(solo en tickets)**.
- Crea un mensaje anclado que se actualiza automáticamente cada 10 minutos
- Muestra el estado actual del pedido en tiempo real
- Muestra los últimos movimientos del envío
- Incluye enlace directo a 17TRACK
- Solo puede haber un tracking activo por ticket

### `/setup`
(Solo Administradores) Configura el sistema de tickets.

## 🎮 Uso de Botones

En cada ticket verás dos botones:

- 🔒 **Cerrar Ticket**: Cierra el ticket, genera transcript y lo envía
- 📄 **Generar Transcript**: Genera un transcript sin cerrar el ticket

## 📦 Seguimiento de Pedidos (Actualización Automática)

El bot incluye un sistema avanzado de seguimiento con 17TRACK que se actualiza automáticamente:

### 🔄 Funcionamiento:
1. Usa `/track <numero_de_seguimiento>` **dentro de un ticket**
2. El bot creará un mensaje anclado con la información del pedido
3. Este mensaje se actualizará automáticamente **cada 10 minutos**
4. Muestra en tiempo real:
   - Estado actual del pedido
   - Últimos 5 movimientos del envío
   - Enlace directo a 17TRACK
5. El seguimiento continúa hasta que se cierre el ticket

### ⚙️ Modos de operación:
- **Con API key (TRACK17_API_KEY)**: Obtiene información detallada automática del estado y movimientos
- **Sin API key**: Muestra estado básico y enlace directo a 17TRACK (100% funcional)

### 📌 Características:
- ✅ Un seguimiento activo por ticket
- ✅ Mensaje anclado para fácil acceso
- ✅ Actualización automática cada 10 minutos
- ✅ Transportista predeterminado: **MJ**
- ✅ Se detiene automáticamente al cerrar el ticket

## 🔧 Configuración Avanzada

Edita `config.json` para personalizar:

```json
{
  "embedColor": "#0099ff",
  "ticketPrefix": "ticket-",
  "supportRoleId": "ID_del_rol_de_soporte",
  "transcriptChannelId": "ID_del_canal_de_transcripts",
  "ticketCategoryId": "ID_de_la_categoria",
  "carrier": "MJ"
}
```

## 🛡️ Permisos Requeridos

El bot necesita estos permisos en tu servidor:
- Gestionar Canales
- Enviar Mensajes
- Insertar Enlaces
- Adjuntar Archivos
- Leer Historial de Mensajes
- Gestionar Mensajes
- Añadir Reacciones
- Anclar Mensajes (para el sistema de tracking)

## 📝 Notas

- Los transcripts se generan en formato HTML con todo el historial del ticket
- Los usuarios recibirán el transcript por DM al cerrar el ticket
- El bot requiere que los usuarios tengan DMs abiertos para recibir transcripts
- Los tickets se eliminan 5 segundos después de cerrarlos
- El sistema de tracking se actualiza automáticamente cada 10 minutos
- Solo puede haber un tracking activo por ticket
- El tracking funciona sin API key, pero con funcionalidad limitada
- **Importante**: Los trackings activos se almacenan en memoria. Si el bot se reinicia, deberás crear el tracking nuevamente con `/track`

## ❓ Solución de Problemas

**El bot no responde:**
- Verifica que el token sea correcto
- Asegúrate de que los intents estén habilitados
- Revisa que hayas registrado los comandos con `node deploy-commands.js`

**No puedo ver los comandos:**
- Espera unos minutos después de registrarlos
- Asegúrate de que el bot tenga permisos de `applications.commands`
- Intenta reiniciar Discord

**Los transcripts no se envían:**
- Verifica que hayas configurado el canal con `/setup`
- Asegúrate de que el bot tenga permisos en ese canal
- Confirma que los usuarios tengan DMs abiertos

**El tracking no funciona:**
- Verifica tu conexión a internet
- La API de 17TRACK puede tener limitaciones de uso
- Usa el enlace manual para verificar en 17TRACK directamente

## 📄 Licencia

ISC

## 🤝 Soporte

Si encuentras algún problema o tienes sugerencias, no dudes en abrir un issue.

---

**Desarrollado con ❤️ para Discord**
