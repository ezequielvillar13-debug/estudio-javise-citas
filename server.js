const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { clients: {}, appointments: [], nextId: 1 };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'javise2026') {
    return res.json({ success: true, role: 'admin', name: 'Administrador' });
  }
  if (username === 'stylist' && password === 'estilista123') {
    return res.json({ success: true, role: 'stylist', name: 'Estilista' });
  }
  res.status(401).json({ success: false });
});

app.get('/api/appointments', (req, res) => {
  const db = loadDB();
  const list = db.appointments.filter(a => a.status !== 'cancelled');
  res.json(list);
});

app.post('/api/appointments', (req, res) => {
  const db = loadDB();
  const { client_phone, client_name, stylist_id, stylist_name, service, price, date, time, notes } = req.body;

  if (!db.clients[client_phone]) {
    db.clients[client_phone] = { name: client_name, visits: 0 };
  }
  const client = db.clients[client_phone];
  const nextVisit = client.visits + 1;
  const hasDiscount = nextVisit % 10 === 0;
  const final_price = hasDiscount ? Math.round(price * 0.9) : price;

  const appointment = {
    id: db.nextId++,
    client_phone,
    client_name,
    stylist_id,
    stylist_name,
    service,
    price,
    final_price,
    discount_applied: hasDiscount ? 1 : 0,
    date,
    time,
    notes: notes || '',
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  db.appointments.push(appointment);
  saveDB(db);

  res.json({ success: true, id: appointment.id, final_price, discount_applied: hasDiscount, visits: nextVisit });
});

app.post('/api/appointments/:id/attend', (req, res) => {
  const db = loadDB();
  const appnt = db.appointments.find(a => a.id == req.params.id);
  if (!appnt) return res.status(404).json({ error: 'No encontrada' });

  appnt.status = 'attended';
  if (!db.clients[appnt.client_phone]) db.clients[appnt.client_phone] = { name: appnt.client_name, visits: 0 };
  db.clients[appnt.client_phone].visits += 1;
  db.clients[appnt.client_phone].last_visit = new Date().toISOString();

  saveDB(db);
  res.json({ success: true, visits: db.clients[appnt.client_phone].visits });
});

app.post('/api/appointments/:id/move', (req, res) => {
  const db = loadDB();
  const { date, time } = req.body;
  const appnt = db.appointments.find(a => a.id == req.params.id);
  if (!appnt) return res.status(404).json({ error: 'No encontrada' });

  const conflict = db.appointments.some(a => 
    a.id != appnt.id && a.date === date && a.time === time && a.stylist_id === appnt.stylist_id && a.status !== 'cancelled'
  );
  if (conflict) return res.status(400).json({ error: 'Horario ocupado' });

  appnt.date = date;
  appnt.time = time;
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/appointments/:id/cancel', (req, res) => {
  const { pin } = req.body;
  if (pin !== '1234') return res.status(403).json({ error: 'PIN incorrecto' });

  const db = loadDB();
  const appnt = db.appointments.find(a => a.id == req.params.id);
  if (appnt) appnt.status = 'cancelled';
  saveDB(db);
  res.json({ success: true });
});

app.get('/api/loyalty/:phone', (req, res) => {
  const db = loadDB();
  const client = db.clients[req.params.phone];
  const visits = client ? client.visits : 0;
  res.json({ visits, next_is_discount: (visits + 1) % 10 === 0 });
});

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'javise_instagram_2026';

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'instagram') {
    body.entry?.forEach(entry => {
      if (entry.messaging) {
        entry.messaging.forEach(event => {
          if (event.message) {
            const senderId = event.sender.id;
            const messageText = event.message.text;
            console.log(`Mensaje de Instagram recibido de ${senderId}: ${messageText}`);
          }
        });
      }

      if (entry.changes) {
        entry.changes.forEach(change => {
          if (change.field === 'comments') {
            console.log('Nuevo comentario en Instagram:', change.value);
          }
          if (change.field === 'mentions') {
            console.log('Nueva mención en Instagram:', change.value);
          }
        });
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Javise listo en http://localhost:${PORT}`);
  console.log(`Webhook URL: https://tu-dominio.com/webhook`);
  console.log(`Verify Token: ${VERIFY_TOKEN}`);
});
