// NeuroCast proxy server
// Run: node server.js
// Then open: http://localhost:3000

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load .env file if present (no npm dependency needed)
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const EL_KEY       = process.env.EL_KEY || '';
const PORT         = process.env.PORT || 3000;
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS || '5', 10); // per IP per hour
const RATE_WINDOW  = 60 * 60 * 1000;
const rateLimits   = new Map();

function getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (fwd ? fwd.split(',')[0] : req.socket.remoteAddress || '').trim();
}

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = rateLimits.get(ip) || { count: 0, resetAt: now + RATE_WINDOW };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RATE_WINDOW; }
  entry.count++;
  rateLimits.set(ip, entry);
  return entry.count > MAX_REQUESTS;
}

// Prune expired entries hourly to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) if (now > entry.resetAt) rateLimits.delete(ip);
}, RATE_WINDOW);

function proxyRequest(targetUrl, options, body, res) {
  const parsed = url.parse(targetUrl);
  const reqOptions = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.path,
    method: options.method || 'POST',
    headers: { ...options.headers, 'host': parsed.hostname }
  };

  const proxyReq = https.request(reqOptions, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
}

// Helper: make an HTTPS POST and return parsed JSON
function httpsPost(hostname, path, elKey, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname, port: 443, path,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'xi-api-key': elKey,
        'content-length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch(e) { reject(new Error('JSON parse failed: ' + chunks.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': '*',
    });
    res.end();
    return;
  }

  // Generate script via ElevenLabs agent (server-side, no CORS issues)
  if (req.url === '/api/generate-script' && req.method === 'POST') {
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (isRateLimited(getIp(req))) {
      res.writeHead(429, cors);
      res.end(JSON.stringify({ error: 'Rate limit reached. Try again in an hour.' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { mood, stress, focus, energy, agentId } = JSON.parse(body);
        const elKey = EL_KEY;

        const prompt = `Write a NeuroCast podcast episode. Neural state: Mood=${mood.name}, Genre=${mood.genre}, Stress=${stress}/100, Focus=${focus}/100, Energy=${energy}/100.
4 segments: 1. HOST INTRO (2-3 sentences): Host "Alex" welcomes and teases the story. 2. STORY PART 1 (3-4 sentences): Narrator begins a gripping story matching the genre. 3. STORY PART 2 (3-4 sentences): Story reaches climax or turning point. 4. HOST OUTRO (2 sentences): Alex reflects on the neural state.
Also give a creative title and for each narrator segment include a short sound effect description (5-8 words).
Respond ONLY with raw JSON, no markdown:
{"title":"...","segments":[{"role":"host","text":"...","sfx":null},{"role":"narrator","text":"...","sfx":"sound effect description"},{"role":"narrator","text":"...","sfx":"sound effect description"},{"role":"host","text":"...","sfx":null}]}`;

        const elRes = await httpsPost('api.elevenlabs.io', `/v1/convai/agents/${agentId}/simulate-conversation`, elKey, {
          simulation_specification: {
            simulated_user_config: {
              type: 'scripted',
              scripted_turns: [{ role: 'user', message: prompt }]
            }
          }
        });

        let txt = '';
        if (elRes.transcript) {
          const turn = elRes.transcript.find(t => t.role === 'agent' || t.role === 'assistant');
          txt = turn?.message || turn?.content || turn?.text || '';
        }
        if (!txt && elRes.messages) {
          const msg = elRes.messages.find(m => m.role === 'agent' || m.role === 'assistant');
          txt = msg?.content || msg?.message || msg?.text || '';
        }
        if (!txt) txt = elRes.response || elRes.content || '';

        if (!txt) {
          console.error('Agent raw response:', JSON.stringify(elRes, null, 2));
          res.writeHead(500, cors);
          res.end(JSON.stringify({ error: 'No text in agent response', raw: elRes }));
          return;
        }

        const match = txt.match(/\{[\s\S]*\}/);
        if (!match) {
          res.writeHead(500, cors);
          res.end(JSON.stringify({ error: 'No JSON in agent response', text: txt.substring(0, 300) }));
          return;
        }

        const script = JSON.parse(match[0]);
        res.writeHead(200, cors);
        res.end(JSON.stringify(script));

      } catch (e) {
        console.error('generate-script error:', e.message);
        res.writeHead(500, cors);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Proxy /api/elevenlabs/* → https://api.elevenlabs.io/*
  if (req.url.startsWith('/api/elevenlabs/')) {
    if (isRateLimited(getIp(req))) {
      res.writeHead(429, { 'access-control-allow-origin': '*', 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Rate limit reached. Try again in an hour.' }));
      return;
    }
    const targetPath = req.url.replace('/api/elevenlabs', '');
    const targetUrl = `https://api.elevenlabs.io${targetPath}`;
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      proxyRequest(targetUrl, {
        method: req.method,
        headers: {
          'content-type': req.headers['content-type'] || 'application/json',
          'xi-api-key': EL_KEY,
        }
      }, Buffer.concat(body), res);
    });
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(process.cwd(), filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[ext] || 'text/plain';
    res.writeHead(200, { 'content-type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✓ NeuroCast server running at http://localhost:${PORT}`);
  if (!EL_KEY) console.warn('  ⚠  EL_KEY not set — add it to a .env file (see README)');
  console.log(`  Open http://localhost:${PORT}\n`);
});
