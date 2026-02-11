/* eslint-disable no-console */

require('dotenv').config();

const crypto = require('crypto');

// Ensure JwtService gets a usable base64 secret even if .env has a placeholder.
if (!process.env.JWT_SECRET_BASE64 || process.env.JWT_SECRET_BASE64 === 'CHANGE_ME') {
  process.env.JWT_SECRET_BASE64 = crypto.randomBytes(48).toString('base64');
}

const { createApp } = require('../app');
const prisma = require('../db/prisma');

function toQuery(params) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    usp.set(key, String(value));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

async function http(baseUrl, method, path, { query, json } = {}) {
  const url = `${baseUrl}${path}${toQuery(query)}`;
  const res = await fetch(url, {
    method,
    headers: json != null ? { 'Content-Type': 'application/json' } : undefined,
    body: json != null ? JSON.stringify(json) : undefined,
  });

  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // leave as text
  }

  return { status: res.status, ok: res.ok, body };
}

function assertNon500(name, response) {
  if (response.status >= 500) {
    const err = new Error(`${name} -> ${response.status}`);
    err.response = response;
    throw err;
  }
}

async function main() {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const suffix = Date.now();
  const ownerEmail = `smoke-owner-${suffix}@example.com`;
  const userEmail = `smoke-user-${suffix}@example.com`;
  const ownerPassword = 'SmokePass123!';
  const userPassword = 'SmokePass123!';

  const created = {
    venueId: null,
    sportId: null,
    bookingId: null,
    refundId: null,
    gameId: null,
    roomId: null,
  };

  const results = [];
  const record = (name, status, note) => results.push({ name, status, note });

  try {
    // --- User registration ---
    {
      const r1 = await http(baseUrl, 'POST', '/register', {
        json: {
          email: ownerEmail,
          password: ownerPassword,
          fullName: 'Smoke Owner',
          role: 'ROLE_FACILITY_OWNER',
        },
      });
      assertNon500('POST /register (owner)', r1);
      record('POST /register (owner)', r1.status, '');

      const r2 = await http(baseUrl, 'POST', '/register', {
        json: {
          email: userEmail,
          password: userPassword,
          fullName: 'Smoke User',
          role: 'ROLE_USER',
        },
      });
      assertNon500('POST /register (user)', r2);
      record('POST /register (user)', r2.status, '');

      const r3 = await http(baseUrl, 'GET', '/login', {
        query: { email: userEmail, password: userPassword },
      });
      assertNon500('GET /login', r3);
      record('GET /login', r3.status, typeof r3.body === 'string' ? 'token string' : '');

      const r4 = await http(baseUrl, 'GET', `/data/${encodeURIComponent(userEmail)}`);
      assertNon500('GET /data/:username', r4);
      record('GET /data/:username', r4.status, '');

      const r5 = await http(baseUrl, 'GET', '/getAllUsers');
      assertNon500('GET /getAllUsers', r5);
      record('GET /getAllUsers', r5.status, Array.isArray(r5.body) ? `count=${r5.body.length}` : '');
    }

    // --- Venue ---
    {
      const r0 = await http(baseUrl, 'GET', '/api/venues');
      assertNon500('GET /api/venues', r0);
      record('GET /api/venues', r0.status, Array.isArray(r0.body) ? `count=${r0.body.length}` : '');

      const r1 = await http(baseUrl, 'POST', '/api/venues', {
        query: { ownerEmail },
        json: {
          name: `Smoke Venue ${suffix}`,
          description: 'Smoke test venue',
          address: 'Smoke Street',
          photoUrls: [],
          amenities: [],
        },
      });
      assertNon500('POST /api/venues', r1);
      created.venueId = r1.body?.id ?? null;
      record('POST /api/venues', r1.status, created.venueId != null ? `venueId=${created.venueId}` : '');

      const r2 = await http(baseUrl, 'GET', `/api/venues/${created.venueId}`);
      assertNon500('GET /api/venues/:id', r2);
      record('GET /api/venues/:id', r2.status, '');

      const r3 = await http(baseUrl, 'PUT', `/api/venues/verify/${created.venueId}`);
      assertNon500('PUT /api/venues/verify/:venueId', r3);
      record('PUT /api/venues/verify/:venueId', r3.status, '');

      const r4 = await http(baseUrl, 'GET', `/api/venues/allVenues/${encodeURIComponent(ownerEmail)}`);
      assertNon500('GET /api/venues/allVenues/:ownerEmail', r4);
      record('GET /api/venues/allVenues/:ownerEmail', r4.status, Array.isArray(r4.body) ? `count=${r4.body.length}` : '');
    }

    // --- Sport ---
    {
      const r1 = await http(baseUrl, 'POST', `/api/sports/venue/${created.venueId}`, {
        json: {
          name: `Smoke Sport ${suffix}`,
          type: 'INDOOR',
          pricePerHour: 100,
          operatingHours: '09:00-17:00',
        },
      });
      assertNon500('POST /api/sports/venue/:venueId', r1);
      created.sportId = r1.body?.id ?? null;
      record('POST /api/sports/venue/:venueId', r1.status, created.sportId != null ? `sportId=${created.sportId}` : '');

      const r2 = await http(baseUrl, 'GET', `/api/sports/venue/${created.venueId}`);
      assertNon500('GET /api/sports/venue/:venueId', r2);
      record('GET /api/sports/venue/:venueId', r2.status, Array.isArray(r2.body) ? `count=${r2.body.length}` : '');

      const r3 = await http(baseUrl, 'GET', `/api/sports/${created.sportId}`);
      assertNon500('GET /api/sports/:id', r3);
      record('GET /api/sports/:id', r3.status, typeof r3.body === 'string' ? `name=${r3.body}` : '');
    }

    // --- Comment ---
    {
      const r1 = await http(baseUrl, 'POST', '/api/comments', {
        json: {
          text: `Smoke comment ${suffix}`,
          rating: 5,
          authorEmail: userEmail,
          sportId: created.sportId,
        },
      });
      assertNon500('POST /api/comments', r1);
      record('POST /api/comments', r1.status, r1.body?.id != null ? `commentId=${r1.body.id}` : '');

      const r2 = await http(baseUrl, 'GET', `/api/comments/sport/${created.sportId}`);
      assertNon500('GET /api/comments/sport/:sportId', r2);
      record('GET /api/comments/sport/:sportId', r2.status, Array.isArray(r2.body) ? `count=${r2.body.length}` : '');
    }

    // --- Booking + Earnings ---
    {
      const start = new Date(Date.now() + 5 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const r1 = await http(baseUrl, 'POST', '/api/bookings', {
        json: {
          sportId: created.sportId,
          venueId: created.venueId,
          facilityOwnerEmail: ownerEmail,
          userEmail,
          slots: [
            {
              startDateTime: start.toISOString(),
              endDateTime: end.toISOString(),
              price: 100,
            },
          ],
        },
      });
      assertNon500('POST /api/bookings', r1);
      created.bookingId = r1.body?.id ?? null;
      record('POST /api/bookings', r1.status, created.bookingId != null ? `bookingId=${created.bookingId}` : '');

      const r2 = await http(baseUrl, 'GET', '/api/bookings/slots', {
        query: { venueId: created.venueId, sportId: created.sportId },
      });
      assertNon500('GET /api/bookings/slots', r2);
      record('GET /api/bookings/slots', r2.status, Array.isArray(r2.body) ? `count=${r2.body.length}` : '');

      const r3 = await http(baseUrl, 'GET', '/api/bookings/getByOwner', {
        query: { ownerEmail },
      });
      assertNon500('GET /api/bookings/getByOwner', r3);
      record('GET /api/bookings/getByOwner', r3.status, Array.isArray(r3.body) ? `count=${r3.body.length}` : '');

      const r4 = await http(baseUrl, 'GET', `/api/bookings/user/${encodeURIComponent(userEmail)}`);
      assertNon500('GET /api/bookings/user/:id', r4);
      record('GET /api/bookings/user/:id', r4.status, Array.isArray(r4.body) ? `count=${r4.body.length}` : '');

      const r5 = await http(baseUrl, 'GET', '/api/bookings/monthlyTrends', {
        query: { ownerEmail },
      });
      assertNon500('GET /api/bookings/monthlyTrends', r5);
      record('GET /api/bookings/monthlyTrends', r5.status, Array.isArray(r5.body) ? '12 months array' : '');

      const r6 = await http(baseUrl, 'GET', `/api/earnings/${encodeURIComponent(ownerEmail)}/monthly`);
      assertNon500('GET /api/earnings/:email/monthly', r6);
      record('GET /api/earnings/:email/monthly', r6.status, Array.isArray(r6.body) ? '12 months array' : '');
    }

    // --- Cancel booking => Refund ---
    {
      const r1 = await http(baseUrl, 'DELETE', `/api/bookings/cancelBooking/${created.bookingId}`);
      assertNon500('DELETE /api/bookings/cancelBooking/:id', r1);
      record('DELETE /api/bookings/cancelBooking/:id', r1.status, String(r1.body));

      const r2 = await http(baseUrl, 'GET', '/api/refunds/pending');
      assertNon500('GET /api/refunds/pending', r2);
      created.refundId = Array.isArray(r2.body) && r2.body.length ? r2.body[0].id : null;
      record('GET /api/refunds/pending', r2.status, Array.isArray(r2.body) ? `count=${r2.body.length}` : '');

      const r3 = await http(baseUrl, 'GET', '/api/refunds/user', { query: { userEmail } });
      assertNon500('GET /api/refunds/user', r3);
      record('GET /api/refunds/user', r3.status, Array.isArray(r3.body) ? `count=${r3.body.length}` : '');

      const r4 = await http(baseUrl, 'GET', '/api/refunds/owner', { query: { ownerMail: ownerEmail } });
      assertNon500('GET /api/refunds/owner', r4);
      record('GET /api/refunds/owner', r4.status, Array.isArray(r4.body) ? `count=${r4.body.length}` : '');

      if (created.refundId != null) {
        const r5 = await http(baseUrl, 'GET', '/api/refunds/byId', { query: { id: created.refundId } });
        assertNon500('GET /api/refunds/byId', r5);
        record('GET /api/refunds/byId', r5.status, `refundId=${created.refundId}`);

        const r6 = await http(baseUrl, 'GET', '/api/refunds/bookingDetails', { query: { refundId: created.refundId } });
        assertNon500('GET /api/refunds/bookingDetails', r6);
        record('GET /api/refunds/bookingDetails', r6.status, r6.body?.id != null ? `bookingId=${r6.body.id}` : '');
      }
    }

    // --- Game + UserGameProfile ---
    {
      const r1 = await http(baseUrl, 'POST', '/api/games', {
        json: {
          gameName: `Smoke Game ${suffix}`,
          location: 'Smoke Location',
          timeDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          venue: 'Smoke Venue',
          playersRequired: 2,
        },
      });
      assertNon500('POST /api/games', r1);
      created.gameId = r1.body?.id ?? null;
      record('POST /api/games', r1.status, created.gameId != null ? `gameId=${created.gameId}` : '');

      const r2 = await http(baseUrl, 'GET', '/api/games');
      assertNon500('GET /api/games', r2);
      record('GET /api/games', r2.status, Array.isArray(r2.body) ? `count=${r2.body.length}` : '');

      const r3 = await http(baseUrl, 'POST', `/api/games/${created.gameId}/join`, { query: { userEmail } });
      assertNon500('POST /api/games/:id/join', r3);
      record('POST /api/games/:id/join', r3.status, '');

      const r4 = await http(baseUrl, 'GET', `/api/user-profiles/${encodeURIComponent(userEmail)}/game-ids`);
      assertNon500('GET /api/user-profiles/:email/game-ids', r4);
      record('GET /api/user-profiles/:email/game-ids', r4.status, Array.isArray(r4.body) ? `ids=${r4.body.length}` : '');

      const r5 = await http(baseUrl, 'POST', `/api/games/${created.gameId}/leave`, { query: { userEmail } });
      assertNon500('POST /api/games/:id/leave', r5);
      record('POST /api/games/:id/leave', r5.status, '');
    }

    // --- Room ---
    {
      const r1 = await http(baseUrl, 'POST', '/rooms', {
        json: { user1: ownerEmail, user2: userEmail },
      });
      assertNon500('POST /rooms', r1);
      record('POST /rooms', r1.status, '');

      const r2 = await http(baseUrl, 'POST', '/rooms/getRoomId', {
        json: { user1: ownerEmail, user2: userEmail },
      });
      assertNon500('POST /rooms/getRoomId', r2);
      created.roomId = typeof r2.body === 'string' ? r2.body : null;
      record('POST /rooms/getRoomId', r2.status, created.roomId ? `roomId=${created.roomId}` : '');

      if (created.roomId) {
        const r3 = await http(baseUrl, 'GET', `/rooms/message/${encodeURIComponent(created.roomId)}`);
        assertNon500('GET /rooms/message/:roomId', r3);
        record('GET /rooms/message/:roomId', r3.status, Array.isArray(r3.body) ? `count=${r3.body.length}` : '');
      }
    }

    console.log('\nAPI smoke test results:');
    for (const r of results) {
      const note = r.note ? ` (${r.note})` : '';
      console.log(`- [${String(r.status).padStart(3, ' ')}] ${r.name}${note}`);
    }

    console.log('\nNotes:');
    console.log('- Ollama endpoints are not mounted because ollamaService is not wired in app.js.');
    console.log('- ChatController is WebSocket/STOMP mapping only (not HTTP).');
  } finally {
    // Best-effort cleanup: delete only the smoke-test data.
    try {
      await prisma.message.deleteMany({ where: { sender: { in: [ownerEmail, userEmail] } } });
      await prisma.room.deleteMany({ where: { user1: ownerEmail, user2: userEmail } });
      await prisma.room.deleteMany({ where: { user1: userEmail, user2: ownerEmail } });

      await prisma.refundModel.deleteMany({ where: { userEmail } });
      await prisma.bookingSlot.deleteMany({ where: { booking: { userEmail } } });
      await prisma.booking.deleteMany({ where: { userEmail } });

      await prisma.comment.deleteMany({ where: { userEmail } });
      if (created.sportId != null) {
        await prisma.sport.deleteMany({ where: { id: created.sportId } });
      }
      if (created.venueId != null) {
        await prisma.venue.deleteMany({ where: { id: created.venueId } });
      }

      await prisma.userGameProfile.deleteMany({ where: { userEmail } });
      await prisma.game.deleteMany({ where: { id: created.gameId ?? -1 } });

      await prisma.monthEarning.deleteMany({ where: { facilityOwnerEmail: ownerEmail } });
      await prisma.facilityEarnings.deleteMany({ where: { facilityOwnerEmail: ownerEmail } });

      await prisma.facilityOwnerProfile.deleteMany({ where: { email: ownerEmail } });
      await prisma.userRegistrationsModel.deleteMany({ where: { email: { in: [ownerEmail, userEmail] } } });
    } catch (e) {
      console.warn('Cleanup warning:', e?.message ?? e);
    }

    await new Promise((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Smoke test failed:', err?.message ?? err);
  if (err?.response) console.error('Response:', err.response);
  process.exitCode = 1;
});
