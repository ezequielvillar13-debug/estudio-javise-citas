# Estudio de Belleza Javise - Sistema de Citas

Sistema completo con:
- Backend real (Node.js + Express + base de datos JSON)
- Programa de fidelización (10 visitas = 10% descuento)
- Roles: Admin, Estilista, Cliente
- Optimizado para móvil
- Integración con Instagram (@estudiodebelleza_javise)
- Más estilistas y servicios

## Credenciales
- Admin: usuario `admin` / contraseña `javise2026` (PIN cancelar: `1234`)
- Estilista: usuario `stylist` / contraseña `estilista123`

## Cómo ejecutar localmente

1. Instala Node.js (si no lo tienes)
2. En esta carpeta ejecuta:
   ```bash
   npm install
   npm start
   ```
3. Abre http://localhost:3000

## Cómo obtener un link público

1. Conecta este repositorio a [Render.com](https://render.com)
2. Render detecta el package.json y despliega automáticamente
3. Obtienes un link tipo: https://estudio-javise.onrender.com

Ese link lo puedes poner en Instagram, WhatsApp y Facebook.

## Configurar Webhooks de Instagram

1. Crea una app en Meta for Developers
2. Callback URL: https://tu-dominio.onrender.com/webhook
3. Verify Token: javise_instagram_2026
