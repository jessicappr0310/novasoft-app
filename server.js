// NovaSoft — Agenda Online (versión definitiva)
// Node.js puro, sin dependencias externas.
// Correr local:  node server.js   -> http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const OVERRIDES_FILE = path.join(__dirname, 'data', 'schedule_overrides.json');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

// ---------- Configuración de negocio ----------

// 0=domingo ... 6=sábado — horario base (el admin puede sobrescribir día a día)
const BUSINESS_HOURS = {
  0: null,
  1: [9, 20],
  2: [9, 20],
  3: [9, 20],
  4: [9, 20],
  5: [9, 20],
  6: [10, 17],
};
const SLOT_STEP_MIN = 60;
const DEPOSIT_PER_PERSON = 10000;

const VERTICALS = {
  salud: {
    id: 'salud',
    label: 'Personal de salud',
    mode: 'simple', // sin catálogo de servicios visible
    services: [
      { id: 'consulta', name: 'Hora de atención', durationMin: 45, price: 0 },
    ],
  },
  belleza: {
    id: 'belleza',
    label: 'Belleza y peluquería',
    mode: 'services',
    services: [
      { id: 'corte', name: 'Corte de cabello', durationMin: 45, price: 12000 },
      { id: 'color', name: 'Coloración', durationMin: 120, price: 45000 },
      { id: 'keratina', name: 'Tratamiento de keratina', durationMin: 90, price: 38000 },
      { id: 'manicure', name: 'Manicure', durationMin: 40, price: 9000 },
    ],
  },
  turismo: {
    id: 'turismo',
    label: 'Turismo y actividades',
    mode: 'activity', // pide cantidad de personas
    services: [
      { id: 'kayak', name: 'Kayak en el lago', durationMin: 120, price: 15000 },
      { id: 'cabalgata', name: 'Cabalgata al atardecer', durationMin: 150, price: 25000 },
      { id: 'volcan', name: 'Tour al volcán', durationMin: 240, price: 40000 },
      { id: 'bicicleta', name: 'Arriendo de bicicleta (día)', durationMin: 480, price: 12000 },
    ],
  },
};

function findService(serviceId) {
  for (const v of Object.values(VERTICALS)) {
    const s = v.services.find(s => s.id === serviceId);
    if (s) return s;
  }
  return null;
}

// ---------- Persistencia ----------
function readJSON(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
const readBookings = () => readJSON(BOOKINGS_FILE, []);
const writeBookings = list => writeJSON(BOOKINGS_FILE, list);
const readOverrides = () => readJSON(OVERRIDES_FILE, {});
const writeOverrides = obj => writeJSON(OVERRIDES_FILE, obj);

// ---------- Utilidades de horario ----------
function toMinutes(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function toHHMM(mins) { return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`; }
function dayOfWeek(dateStr) { const [y,m,d] = dateStr.split('-').map(Number); return new Date(y, m-1, d).getDay(); }

// Horas base del día (sin considerar reservas), respetando overrides del admin
function getRawDaySlots(dateStr) {
  const overrides = readOverrides();
  const ov = overrides[dateStr];
  if (ov) {
    if (ov.closed) return { slots: [], closed: true };
    return { slots: [...ov.slots].sort(), closed: false };
  }
  const dow = dayOfWeek(dateStr);
  const hours = BUSINESS_HOURS[dow];
  if (!hours) return { slots: [], closed: true };
  const [openH, closeH] = hours;
  const slots = [];
  for (let m = openH*60; m < closeH*60; m += SLOT_STEP_MIN) slots.push(toHHMM(m));
  return { slots, closed: false };
}

// Disponibilidad real para un servicio (raw slots menos reservas que se crucen)
function getAvailability(dateStr, serviceId) {
  const service = findService(serviceId);
  if (!service) return { error: 'Servicio inválido' };
  const raw = getRawDaySlots(dateStr);
  if (raw.closed) return { slots: [], closed: true };

  const existing = readBookings().filter(b => b.date === dateStr && b.status !== 'cancelada');
  const slots = raw.slots.filter(t => {
    const start = toMinutes(t);
    const end = start + service.durationMin;
    return !existing.some(b => {
      const bStart = toMinutes(b.time);
      const bEnd = bStart + b.durationMin;
      return start < bEnd && end > bStart;
    });
  });
  return { slots, closed: false };
}

// ---------- Helpers HTTP ----------
function sendJSON(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
function readBody(req, cb) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => { try { cb(null, body ? JSON.parse(body) : {}); } catch(e){ cb(e); } });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // ---- Verticales y servicios ----
  if (p === '/api/verticals' && req.method === 'GET') {
    return sendJSON(res, 200, VERTICALS);
  }

  // ---- Disponibilidad (cliente) ----
  if (p === '/api/availability' && req.method === 'GET') {
    const date = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId');
    if (!date || !serviceId) return sendJSON(res, 400, { error: 'Falta date o serviceId' });
    return sendJSON(res, 200, getAvailability(date, serviceId));
  }

  // ---- Reservas ----
  if (p === '/api/bookings' && req.method === 'GET') {
    const list = readBookings().sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    return sendJSON(res, 200, list);
  }

  if (p === '/api/bookings' && req.method === 'POST') {
    return readBody(req, (err, body) => {
      if (err) return sendJSON(res, 400, { error: 'JSON inválido' });
      const { serviceId, date, time, name, phone, people, vertical } = body;
      const service = findService(serviceId);
      if (!service || !date || !time || !name || !phone) {
        return sendJSON(res, 400, { error: 'Faltan datos obligatorios' });
      }
      const avail = getAvailability(date, serviceId);
      if (!avail.slots || !avail.slots.includes(time)) {
        return sendJSON(res, 409, { error: 'Ese horario ya no está disponible. Elige otro.' });
      }
      const bookings = readBookings();
      const id = bookings.length ? Math.max(...bookings.map(b=>b.id))+1 : 1;
      const peopleCount = Number(people) || 1;
      const booking = {
        id, vertical: vertical || '', serviceId, serviceName: service.name, date, time,
        durationMin: service.durationMin, price: service.price, people: peopleCount,
        name, phone, deposit: DEPOSIT_PER_PERSON * peopleCount,
        status: 'pendiente_pago', createdAt: new Date().toISOString(),
      };
      bookings.push(booking);
      writeBookings(bookings);
      return sendJSON(res, 201, booking);
    });
  }

  const confirmMatch = p.match(/^\/api\/bookings\/(\d+)\/confirm-payment$/);
  if (confirmMatch && req.method === 'POST') {
    const id = Number(confirmMatch[1]);
    const bookings = readBookings();
    const b = bookings.find(x => x.id === id);
    if (!b) return sendJSON(res, 404, { error: 'No encontrada' });
    b.status = 'confirmada'; b.paidAt = new Date().toISOString();
    writeBookings(bookings);
    return sendJSON(res, 200, b);
  }

  const cancelMatch = p.match(/^\/api\/bookings\/(\d+)\/cancel$/);
  if (cancelMatch && req.method === 'POST') {
    const id = Number(cancelMatch[1]);
    const bookings = readBookings();
    const b = bookings.find(x => x.id === id);
    if (!b) return sendJSON(res, 404, { error: 'No encontrada' });
    b.status = 'cancelada';
    writeBookings(bookings);
    return sendJSON(res, 200, b);
  }

  // ---- Gestión de horarios (admin) ----
  if (p === '/api/business-hours' && req.method === 'GET') {
    return sendJSON(res, 200, BUSINESS_HOURS);
  }

  if (p === '/api/admin/overrides' && req.method === 'GET') {
    return sendJSON(res, 200, readOverrides());
  }

  if (p === '/api/admin/schedule' && req.method === 'GET') {
    const date = url.searchParams.get('date');
    if (!date) return sendJSON(res, 400, { error: 'Falta date' });
    return sendJSON(res, 200, getRawDaySlots(date));
  }

  if (p === '/api/admin/schedule/close' && req.method === 'POST') {
    return readBody(req, (err, body) => {
      if (err || !body.date) return sendJSON(res, 400, { error: 'Falta date' });
      const overrides = readOverrides();
      overrides[body.date] = { closed: true, slots: [] };
      writeOverrides(overrides);
      return sendJSON(res, 200, getRawDaySlots(body.date));
    });
  }

  if (p === '/api/admin/schedule/reset' && req.method === 'POST') {
    return readBody(req, (err, body) => {
      if (err || !body.date) return sendJSON(res, 400, { error: 'Falta date' });
      const overrides = readOverrides();
      delete overrides[body.date];
      writeOverrides(overrides);
      return sendJSON(res, 200, getRawDaySlots(body.date));
    });
  }

  if (p === '/api/admin/schedule/add-slot' && req.method === 'POST') {
    return readBody(req, (err, body) => {
      if (err || !body.date || !body.time) return sendJSON(res, 400, { error: 'Falta date o time' });
      const overrides = readOverrides();
      if (!overrides[body.date] || overrides[body.date].closed) {
        const raw = getRawDaySlots(body.date);
        overrides[body.date] = { closed: false, slots: raw.closed ? [] : [...raw.slots] };
      }
      if (!overrides[body.date].slots.includes(body.time)) {
        overrides[body.date].slots.push(body.time);
        overrides[body.date].slots.sort();
      }
      writeOverrides(overrides);
      return sendJSON(res, 200, getRawDaySlots(body.date));
    });
  }

  if (p === '/api/admin/schedule/remove-slot' && req.method === 'POST') {
    return readBody(req, (err, body) => {
      if (err || !body.date || !body.time) return sendJSON(res, 400, { error: 'Falta date o time' });
      const overrides = readOverrides();
      if (!overrides[body.date] || overrides[body.date].closed) {
        const raw = getRawDaySlots(body.date);
        overrides[body.date] = { closed: false, slots: raw.closed ? [] : [...raw.slots] };
      }
      overrides[body.date].slots = overrides[body.date].slots.filter(t => t !== body.time);
      writeOverrides(overrides);
      return sendJSON(res, 200, getRawDaySlots(body.date));
    });
  }

  // ---- Archivos estáticos ----
  let filePath = p === '/' ? '/index.html' : p;
  filePath = path.join(PUBLIC_DIR, filePath);
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); return res.end('404'); }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => console.log(`NovaSoft — servidor corriendo en el puerto ${PORT}`));
