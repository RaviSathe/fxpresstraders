import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/* ------------------------------------------------------------------
 * Lead form: POST /api/leads
 * Saves each sign-up as one JSON line in data/leads.jsonl (relative to
 * the folder the server is started from, or LEADS_DIR if set).
 * There is deliberately no endpoint to read leads back: the file holds
 * personal data and is only for the site owner.
 * ------------------------------------------------------------------ */

const LEADS_DIR = process.env['LEADS_DIR'] || join(process.cwd(), 'data');
const LEADS_FILE = join(LEADS_DIR, 'leads.jsonl');

const EXPERIENCE = ['new', 'some', 'trading'] as const;
const INTEREST = ['forex', 'crypto', 'both'] as const;

/** Small in-memory rate limit: 5 submissions per IP per 10 minutes. */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

app.post('/api/leads', express.json({ limit: '10kb' }), async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  // Honeypot: real people never see or fill the "website" field.
  if (clean(body['website'], 200)) {
    res.status(200).json({ ok: true });
    return;
  }
  if (rateLimited(req.ip ?? 'unknown')) {
    res.status(429).json({ ok: false, error: 'Too many attempts. Please try again in a few minutes.' });
    return;
  }

  const name = clean(body['name'], 80);
  const phone = clean(body['phone'], 24);
  const email = clean(body['email'], 120);
  const experience = clean(body['experience'], 20);
  const interest = clean(body['interest'], 20);
  const consent = body['consent'] === true;

  const errors: Record<string, string> = {};
  if (name.length < 2) errors['name'] = 'Please enter your name.';
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone)) errors['phone'] = 'Please enter a valid phone number.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors['email'] = 'Please enter a valid email.';
  if (!EXPERIENCE.includes(experience as (typeof EXPERIENCE)[number])) errors['experience'] = 'Please choose one.';
  if (!INTEREST.includes(interest as (typeof INTEREST)[number])) errors['interest'] = 'Please choose one.';
  if (!consent) errors['consent'] = 'Please agree so we can contact you.';
  if (Object.keys(errors).length) {
    res.status(400).json({ ok: false, errors });
    return;
  }

  try {
    await mkdir(LEADS_DIR, { recursive: true });
    const lead = { name, phone, email, experience, interest, consent, page: clean(body['page'], 100), at: new Date().toISOString() };
    await appendFile(LEADS_FILE, JSON.stringify(lead) + '\n', 'utf8');
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Could not save lead', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

/* ------------------------------------------------------------------
 * Contact form: POST /api/contact  → data/messages.jsonl
 * ------------------------------------------------------------------ */

const MESSAGES_FILE = join(LEADS_DIR, 'messages.jsonl');
const TOPICS = ['course', 'community', 'partnership', 'other'] as const;

app.post('/api/contact', express.json({ limit: '20kb' }), async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (clean(body['website'], 200)) {
    res.status(200).json({ ok: true });
    return;
  }
  if (rateLimited(req.ip ?? 'unknown')) {
    res.status(429).json({ ok: false, error: 'Too many attempts. Please try again in a few minutes.' });
    return;
  }

  const name = clean(body['name'], 80);
  const email = clean(body['email'], 120);
  const phone = clean(body['phone'], 24);
  const topic = clean(body['topic'], 20);
  const message = clean(body['message'], 3000);
  const consent = body['consent'] === true;

  const errors: Record<string, string> = {};
  if (name.length < 2) errors['name'] = 'Please enter your name.';
  if (!email && !phone) errors['email'] = 'Add an email or a phone number so we can reply.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors['email'] = 'Please enter a valid email.';
  if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) errors['phone'] = 'Please enter a valid phone number.';
  if (!TOPICS.includes(topic as (typeof TOPICS)[number])) errors['topic'] = 'Please choose a topic.';
  if (message.length < 10) errors['message'] = 'Please write a little more (at least 10 characters).';
  if (!consent) errors['consent'] = 'Please agree so we can reply to you.';
  if (Object.keys(errors).length) {
    res.status(400).json({ ok: false, errors });
    return;
  }

  try {
    await mkdir(LEADS_DIR, { recursive: true });
    const entry = { name, email, phone, topic, message, consent, at: new Date().toISOString() };
    await appendFile(MESSAGES_FILE, JSON.stringify(entry) + '\n', 'utf8');
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Could not save message', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
