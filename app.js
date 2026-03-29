// ── Canvas / Brainwave Visualizer ─────────────────────────────────────────────
const canvas = document.getElementById('wave-canvas');
const ctx = canvas.getContext('2d');
let phase = 0, S = 50, F = 50, E = 50, epCount = 0;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
}
resizeCanvas();

function drawWave() {
  const w = canvas.offsetWidth, h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  [
    { freq:.02+S*.0003, amp:8+S*.1,  col:'#f76a8c', sp:.04+S*.0007  },
    { freq:.03+F*.0002, amp:6+F*.07, col:'#7c6af7', sp:.03+F*.0005  },
    { freq:.015+E*.0002,amp:5+E*.09, col:'#6af7c8', sp:.025+E*.0004 },
  ].forEach((wv, wi) => {
    ctx.beginPath(); ctx.strokeStyle=wv.col; ctx.lineWidth=1.5; ctx.globalAlpha=.65;
    for (let x=0; x<=w; x++) {
      const y = h/2 + Math.sin(x*wv.freq+phase*wv.sp*20+wi*2)*wv.amp
                     + Math.sin(x*wv.freq*2.3+phase*wv.sp*15)*wv.amp*.35;
      x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke(); ctx.globalAlpha=1;
  });
  phase++; requestAnimationFrame(drawWave);
}
drawWave();

function updateMetrics() {
  document.getElementById('m-alpha').textContent = (8  + (100-S)*0.06 + E*0.01).toFixed(1)+' Hz';
  document.getElementById('m-beta').textContent  = (12 + S*0.10      + E*0.06).toFixed(1)+' Hz';
  document.getElementById('m-theta').textContent = (4  + (100-E)*0.04 + F*0.02).toFixed(1)+' Hz';
  document.getElementById('m-delta').textContent = (1  + (100-S)*0.015 + (100-E)*0.015).toFixed(1)+' Hz';
}

// ── Mood Detection ────────────────────────────────────────────────────────────
const MUSIC_PROMPTS = {
  'Anxious':       'tense dark ambient drone, low pulsing synth, unsettling atmospheric tension, thriller underscore',
  'Hyper-focused': 'minimal electronic pulse, clean repetitive beat, focused concentration music, steady rhythmic drone',
  'Euphoric':      'uplifting orchestral swell, bright cinematic adventure music, soaring strings and brass',
  'Burnt Out':     'soft melancholy piano, slow ambient pad, quiet introspective underscore, gentle and tired',
  'Wired':         'fast paced electronic tension, driving rhythm, urgent cinematic underscore, high energy pulse',
  'Flow State':    'warm flowing ambient, gentle melodic synth, serene focus music, smooth and effortless',
  'Dreamy':        'ethereal ambient soundscape, soft reverb pads, dreamy floating textures, hypnagogic music',
  'Balanced':      'calm neutral ambient, gentle orchestral pad, peaceful background underscore, soft and steady',
};

const MOODS = [
  { name:'Anxious',       genre:'Psychological Thriller', ok:(a,v,t)=>a>60&&v<45&&t<55 },
  { name:'Wired',         genre:'Action Thriller',        ok:(a,v,t)=>a>75&&v<50 },
  { name:'Euphoric',      genre:'Adventure',              ok:(a,v,t)=>a>55&&v>65 },
  { name:'Flow State',    genre:'Epic Journey',           ok:(a,v,t)=>a>40&&a<75&&v>50&&t>65 },
  { name:'Hyper-focused', genre:'Sci-Fi Mystery',         ok:(a,v,t)=>t>70&&a<65 },
  { name:'Burnt Out',     genre:'Melancholy Drama',       ok:(a,v,t)=>a<40&&v<45 },
  { name:'Dreamy',        genre:'Surreal Fantasy',        ok:(a,v,t)=>a<45&&v>=45&&t<45 },
  { name:'Balanced',      genre:'Neutral Drama',          ok:()=>true },
];
function getMood() { return MOODS.find(m=>m.ok(S,F,E))||MOODS[7]; }
function updateMood() {
  const m = getMood();
  document.getElementById('mood-name').textContent  = m.name;
  document.getElementById('mood-genre').textContent = '→ ' + m.genre;
}
function updSlider(el, pct, col) {
  el.style.background = `linear-gradient(to right,${col} ${pct}%,#2a2a3d ${pct}%)`;
}

document.getElementById('sl-s').addEventListener('input', e => { S=+e.target.value; document.getElementById('v-s').textContent=S; updSlider(e.target,S,'#f76a8c'); updateMood(); updateMetrics(); });
document.getElementById('sl-f').addEventListener('input', e => { F=+e.target.value; document.getElementById('v-f').textContent=F; updSlider(e.target,F,'#7c6af7'); updateMood(); updateMetrics(); });
document.getElementById('sl-e').addEventListener('input', e => { E=+e.target.value; document.getElementById('v-e').textContent=E; updSlider(e.target,E,'#6af7c8'); updateMood(); updateMetrics(); });
updateMood(); updateMetrics();

// ── Status Helpers ────────────────────────────────────────────────────────────
function setStat(msg) { document.getElementById('status').classList.add('show'); document.getElementById('status-txt').textContent=msg; }
function hideStat()   { document.getElementById('status').classList.remove('show'); }

// ── Episode Scripts ───────────────────────────────────────────────────────────
const SCRIPTS = {
  'Anxious': {
    title: "The Signal in the Static",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. Tonight your mind is running hot — elevated stress, scattered focus. We have a story that meets you exactly where you are.", sfx: null },
      { role:'narrator', text:"She had been staring at the same blinking cursor for three hours when the phone rang. Unknown number. She answered anyway, her pulse spiking before the first word was spoken. The voice on the other end simply said: 'You were right. About all of it.'", sfx: "phone ringing then being picked up, tense silence" },
      { role:'narrator', text:"She stood up so fast her chair hit the wall. Outside her window, the city hummed its indifferent tune — but something had shifted. The pieces she had been obsessing over for weeks snapped together in a single, terrifying instant of clarity.", sfx: "chair scraping floor, distant city traffic ambience, tense heartbeat" },
      { role:'host',     text:"Your brain is in high alert tonight — that tension you feel? It's also the edge where breakthroughs happen. Rest soon. You've earned it.", sfx: null }
    ]
  },
  'Hyper-focused': {
    title: "The Architecture of Nothing",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. Your focus is dialed in tonight — sharp, locked, precise. We have a story built for a mind operating at full capacity.", sfx: null },
      { role:'narrator', text:"Dr. Yuen had spent eleven years mapping a structure that, according to every known law of physics, could not exist. And yet there it was — a protein fold that defied entropy, tucked inside a sample collected from the deepest trench in the Pacific. She ran the simulation a fourth time. Same result.", sfx: "computer processing beeps, laboratory ambient hum, keyboard typing" },
      { role:'narrator', text:"If her model was correct, it wasn't just a biological anomaly. It was evidence that life had solved a problem the universe was never supposed to pose. She saved the file, locked the lab, and walked home in total silence — already planning tomorrow's experiment.", sfx: "door locking click, footsteps on quiet street at night" },
      { role:'host',     text:"You're in the zone tonight — the rare state where complexity feels navigable. Protect this energy. Whatever you're building, keep going.", sfx: null }
    ]
  },
  'Euphoric': {
    title: "Freefall with a View",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. Your energy is soaring and your stress is low — that's a beautiful combination. Tonight's story is built to match that altitude.", sfx: null },
      { role:'narrator', text:"Marcus had always said he would jump from a plane before he turned thirty. At 11,000 feet, door open, wind screaming past the fuselage, he realised he hadn't been afraid — not for a single second. He had been waiting for this his whole life.", sfx: "airplane engine roar, rushing wind, sliding aircraft door opening" },
      { role:'narrator', text:"He stepped out. The world unfolded beneath him like a map of every good decision he'd ever made. For forty seconds he was pure motion, pure presence — and when the chute opened and the silence returned, he laughed so hard the instructor thought something had gone wrong.", sfx: "freefall wind rush, parachute deploying whoosh, sudden relative silence" },
      { role:'host',     text:"Your brain is flooded with the good stuff right now — ride it. Moments of pure aliveness don't come often. This is one of them.", sfx: null }
    ]
  },
  'Burnt Out': {
    title: "The Last Train to Somewhere Quiet",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. Your energy is low and your mind is tired tonight. This story isn't here to excite you — it's here to sit with you.", sfx: null },
      { role:'narrator', text:"She took the last train out of the city without packing a bag. Just her keys, her coat, and a vague notion that the coast existed somewhere beyond all this noise. The seat was warm. The carriage was nearly empty. She let her head fall against the window.", sfx: "train departing station, rhythmic train on tracks, quiet carriage ambience" },
      { role:'narrator', text:"An hour later, the city lights gave way to dark fields and the faint shimmer of the sea. She didn't have a plan. That was, she realised, the entire point. For the first time in months, no one needed anything from her. The world could wait.", sfx: "gentle ocean waves at night, soft wind, peaceful coastal ambience" },
      { role:'host',     text:"You've been running on empty. That's not a weakness — it's information. Tonight, the only thing required of you is rest.", sfx: null }
    ]
  },
  'Wired': {
    title: "Three Seconds Ahead",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. You're running high on both stress and energy tonight — that's a combustible mix. We've got a story that can keep up.", sfx: null },
      { role:'narrator', text:"Rafi had been a courier in the city for six years and he knew, in his bones, that something about this package was wrong. He had ninety seconds to deliver it to the forty-second floor before the window closed. He hit the lobby at a dead sprint.", sfx: "city street ambience, running footsteps on pavement, glass lobby door swinging open" },
      { role:'narrator', text:"The elevator was out. He took the stairs. By floor twenty he'd stopped thinking and started calculating — weight, speed, angle, time. He burst through the fire door at exactly the right moment. The man waiting for the package simply nodded and said: 'You're the only one who ever makes it.'", sfx: "rapid footsteps pounding up stairs, heavy breathing, fire door bursting open" },
      { role:'host',     text:"Your system is fully activated right now. Channel that output somewhere intentional — wired energy without direction burns you out fast.", sfx: null }
    ]
  },
  'Flow State': {
    title: "The Current",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. You are in a rare state tonight — focused, energised, calm. This is what peak performance feels like from the inside.", sfx: null },
      { role:'narrator', text:"The sculptor had stopped hearing the music hours ago. She wasn't sure when. Her hands moved as though they already knew the shape inside the stone — they were simply removing what didn't belong. Time had become elastic, unhelpful, irrelevant.", sfx: "chisel on stone gentle rhythmic tapping, quiet studio ambience" },
      { role:'narrator', text:"When she finally stepped back, the studio was dark except for her work light. The piece was done. Not finished — done. The difference, she knew, was everything. She sat on the cold floor and just looked at it for a long time, feeling absolutely nothing but gratitude.", sfx: "footsteps stepping back on concrete floor, profound silence, distant wind outside" },
      { role:'host',     text:"Flow state is the brain operating at its most integrated. You found it tonight. Remember what it feels like — you can find your way back.", sfx: null }
    ]
  },
  'Dreamy': {
    title: "The Library at the Edge of Sleep",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. Your mind is soft and drifting tonight — low energy, low stress, low focus. The perfect conditions for something a little strange.", sfx: null },
      { role:'narrator', text:"The library only appeared after midnight, and only if you already knew it was there. Its shelves held books that hadn't been written yet — memoirs of lives still being lived, novels whose endings were still undecided. The librarian never spoke. She only pointed.", sfx: "old library ambience, pages turning softly, creaking wooden floorboards at night" },
      { role:'narrator', text:"He found his own book on the third visit. It was thinner than he expected. But the last chapter was blank — every page completely empty — and when he looked up, the librarian was smiling for the first time. He understood. It wasn't unfinished. It was waiting for him.", sfx: "book being opened, blank pages rustling, mysterious soft chime" },
      { role:'host',     text:"Your mind is wandering in the best possible way tonight. Let it. The half-asleep brain makes connections the waking mind misses entirely.", sfx: null }
    ]
  },
  'Balanced': {
    title: "Wednesday at the Edge of Something",
    segments: [
      { role:'host',     text:"Welcome to NeuroCast. Your readings are steady tonight — stress, focus, energy all in balance. It's a good state to receive a story in.", sfx: null },
      { role:'narrator', text:"Nothing remarkable had happened to Joel in thirty-four years, which is why he was completely unprepared for the moment the stranger at the bus stop handed him a folded note that said: 'You're going to have to make a decision soon. Choose the one that scares you more.'", sfx: "bus stop ambience, city sounds, paper note being folded and handed over" },
      { role:'narrator', text:"He never saw the stranger again. But three days later, standing at a genuine fork in his life — job offer in one hand, resignation letter in the other — he remembered those words. He chose the one that scared him. It turned out to be the same choice either way.", sfx: "quiet office ambience, papers rustling, contemplative silence" },
      { role:'host',     text:"Balance is underrated. It's from steady ground that the best decisions get made. Whatever's in front of you tonight — you're in a good state to face it.", sfx: null }
    ]
  }
};

const AGENT_ID = 'agent_8401kmvc98g4e7e8yfe74fza4k0f';

async function genScript(mood) {
  const prompt = `Write a NeuroCast podcast episode. Neural state: Mood=${mood.name}, Genre=${mood.genre}, Arousal=${S}/100, Valence=${F}/100, Attention=${E}/100.

Write EXACTLY 4 segments:
1. HOST INTRO (2-3 sentences): Host "Alex" welcomes listeners and teases the story based on the mood.
2. STORY PART 1 (3-4 sentences): Narrator begins a gripping story matching the genre — original, specific, cinematic.
3. STORY PART 2 (3-4 sentences): Story reaches its climax or turning point.
4. HOST OUTRO (2 sentences): Alex closes with a reflection tied to the listener's neural state.

Respond ONLY with raw JSON, no markdown, no explanation:
{"title":"...","segments":[{"role":"host","text":"..."},{"role":"narrator","text":"..."},{"role":"narrator","text":"..."},{"role":"host","text":"..."}]}`;

  try {
    // Route through server.js to avoid CORS — server calls ElevenLabs agent directly
    const r = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: { name: mood.name, genre: mood.genre },
        stress: S, focus: F, energy: E,
        agentId: AGENT_ID, elKey: EL_KEY
      })
    });

    if (!r.ok) throw new Error('Server error ' + r.status);
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    const script = data;
    if (!script.segments || script.segments.length < 4) throw new Error('Invalid script structure');

    // Add sfx prompts based on mood
    const sfxMap = {
      'Anxious':       ['phone ringing then being picked up, tense silence', 'chair scraping floor, distant city traffic ambience'],
      'Hyper-focused': ['computer processing beeps, laboratory ambient hum', 'door locking click, footsteps on quiet street at night'],
      'Euphoric':      ['airplane engine roar, rushing wind', 'freefall wind rush, parachute deploying whoosh'],
      'Burnt Out':     ['train departing station, rhythmic train on tracks', 'gentle ocean waves at night, soft wind'],
      'Wired':         ['city street ambience, running footsteps on pavement', 'rapid footsteps pounding up stairs, fire door bursting open'],
      'Flow State':    ['chisel on stone gentle rhythmic tapping, quiet studio', 'footsteps stepping back on concrete floor, distant wind'],
      'Dreamy':        ['old library ambience, pages turning softly', 'book being opened, blank pages rustling, mysterious soft chime'],
      'Balanced':      ['bus stop ambience, city sounds, paper rustling', 'quiet office ambience, papers rustling, contemplative silence'],
    };
    const sfxList = sfxMap[mood.name] || sfxMap['Balanced'];
    let sfxIdx = 0;
    script.segments = script.segments.map(seg => ({
      ...seg,
      sfx: seg.role === 'narrator' ? (sfxList[sfxIdx++] || null) : null
    }));

    return script;
  } catch(e) {
    console.warn('Agent script generation failed, using fallback:', e.message);
    return SCRIPTS[mood.name] || SCRIPTS['Balanced'];
  }
}

// ── ElevenLabs API Calls ──────────────────────────────────────────────────────
const EL_KEY = 'your_elevenlabs_api_key_here'; // ← REPLACE WITH YOUR KEY

async function tts(text, voiceId) {
  const r = await fetch(`/api/elevenlabs/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': EL_KEY },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', output_format: 'mp3_44100_128' })
  });
  if (!r.ok) { const e = await r.text(); throw new Error(`ElevenLabs ${r.status}: ${e.substring(0,100)}`); }
  return r.blob();
}

async function generateMusic(moodName, durationSeconds) {
  const prompt = MUSIC_PROMPTS[moodName] || MUSIC_PROMPTS['Balanced'];
  const r = await fetch('/api/elevenlabs/v1/sound-generation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': EL_KEY },
    body: JSON.stringify({ text: prompt, duration_seconds: Math.min(durationSeconds, 30), prompt_influence: 0.4, model_id: 'eleven_text_to_sound_v2' })
  });
  if (!r.ok) { const e = await r.text(); throw new Error(`Music ${r.status}: ${e.substring(0,100)}`); }
  return r.blob();
}

async function generateSfx(prompt, duration = 4) {
  const r = await fetch('/api/elevenlabs/v1/sound-generation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': EL_KEY },
    body: JSON.stringify({ text: prompt, duration_seconds: duration, prompt_influence: 0.5, model_id: 'eleven_text_to_sound_v2' })
  });
  if (!r.ok) { const e = await r.text(); throw new Error(`SFX ${r.status}: ${e.substring(0,80)}`); }
  return r.blob();
}

// ── Audio Utilities ───────────────────────────────────────────────────────────
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate  = buffer.sampleRate;
  const bitDepth    = 16;
  const blockAlign  = numChannels * (bitDepth / 8);
  const numFrames   = buffer.length;
  const dataSize    = numFrames * blockAlign;
  const ab          = new ArrayBuffer(44 + dataSize);
  const view        = new DataView(ab);

  const ws = (off, s) => { for (let i=0; i<s.length; i++) view.setUint8(off+i, s.charCodeAt(i)); };
  const wu32 = (off, v) => view.setUint32(off, v, true);
  const wu16 = (off, v) => view.setUint16(off, v, true);

  ws(0,'RIFF'); wu32(4, 36+dataSize); ws(8,'WAVE'); ws(12,'fmt ');
  wu32(16,16); wu16(20,1); wu16(22,numChannels); wu32(24,sampleRate);
  wu32(28, sampleRate*blockAlign); wu16(32,blockAlign); wu16(34,bitDepth);
  ws(36,'data'); wu32(40,dataSize);

  let offset = 44;
  for (let i=0; i<numFrames; i++) {
    for (let ch=0; ch<numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, s < 0 ? s*0x8000 : s*0x7FFF, true);
      offset += 2;
    }
  }
  return ab;
}

async function mergeBlobs(blobs) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded  = await Promise.all(blobs.map(async b => {
    const ab = await b.arrayBuffer();
    return audioCtx.decodeAudioData(ab);
  }));
  audioCtx.close();

  const sampleRate  = decoded[0].sampleRate;
  const numChannels = decoded[0].numberOfChannels;
  const totalFrames = decoded.reduce((n,b) => n+b.length, 0);
  const offline     = new OfflineAudioContext(numChannels, totalFrames, sampleRate);

  let offset = 0;
  for (const buf of decoded) {
    const src = offline.createBufferSource();
    src.buffer = buf; src.connect(offline.destination); src.start(offset/sampleRate);
    offset += buf.length;
  }
  const rendered = await offline.startRendering();
  return new Blob([audioBufferToWav(rendered)], { type: 'audio/wav' });
}

// ── Player ────────────────────────────────────────────────────────────────────
let currentAudio = null;

function setupPlayer(blob) {
  if (currentAudio) { currentAudio.pause(); URL.revokeObjectURL(currentAudio._url); }
  const url     = URL.createObjectURL(blob);
  currentAudio  = new Audio(url);
  currentAudio._url = url;

  const playBtn   = document.getElementById('play-btn');
  const replayBtn = document.getElementById('replay-btn');
  const fill      = document.getElementById('progress-fill');
  const track     = document.getElementById('progress-track');
  const timeEl    = document.getElementById('time-display');

  const fmt = s => { const m=Math.floor(s/60), sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; };

  currentAudio.addEventListener('timeupdate', () => {
    const pct = currentAudio.duration ? (currentAudio.currentTime/currentAudio.duration)*100 : 0;
    fill.style.width = pct+'%';
    timeEl.textContent = fmt(currentAudio.currentTime)+' / '+fmt(currentAudio.duration||0);
  });
  currentAudio.addEventListener('ended', () => {
    playBtn.textContent = '▶ Play';
    document.getElementById('dot').classList.remove('live');
  });
  track.addEventListener('click', e => {
    if (!currentAudio.duration) return;
    currentAudio.currentTime = (e.offsetX/track.offsetWidth)*currentAudio.duration;
  });
  playBtn.onclick = () => {
    if (currentAudio.paused) { currentAudio.play(); playBtn.textContent='⏸ Pause'; document.getElementById('dot').classList.add('live'); }
    else { currentAudio.pause(); playBtn.textContent='▶ Play'; document.getElementById('dot').classList.remove('live'); }
  };
  replayBtn.onclick = () => {
    currentAudio.currentTime=0; currentAudio.play();
    playBtn.textContent='⏸ Pause'; document.getElementById('dot').classList.add('live');
  };

  document.getElementById('audio-controls').classList.add('show');
  currentAudio.play();
  playBtn.textContent = '⏸ Pause';
  document.getElementById('dot').classList.add('live');
}

// ── Main Generate Flow ────────────────────────────────────────────────────────
async function generate() {
  const mood = getMood();
  const btn  = document.getElementById('gen-btn');
  btn.disabled = true;

  setStat('Loading episode script...');
  const script = await genScript(mood);

  epCount++;
  document.getElementById('player').classList.add('show');
  document.getElementById('ep-num').textContent   = `Episode #${String(epCount).padStart(3,'0')}`;
  document.getElementById('ep-title').textContent = script.title;
  document.getElementById('ep-tag').textContent   = mood.name + ' · ' + mood.genre;

  const scBox = document.getElementById('script-box');
  scBox.style.display = 'block';
  scBox.textContent = script.segments.map(s => `[${s.role.toUpperCase()}]\n${s.text}`).join('\n\n');

  document.getElementById('audio-controls').classList.remove('show');
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('time-display').textContent  = '0:00 / 0:00';
  document.getElementById('play-btn').textContent      = '▶ Play';

  const segList = document.getElementById('segments');
  segList.innerHTML = '';
  const segEls = script.segments.map((seg, i) => {
    const el = document.createElement('div');
    el.className = 'seg';
    el.innerHTML = `<div class="seg-icon">${seg.role==='host'?'🎙':'📖'}</div><div class="seg-info"><div class="seg-role">${seg.role}</div><div class="seg-text">${seg.text.substring(0,75)}${seg.text.length>75?'...':''}</div></div><div class="bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div><div class="seg-st" id="sst-${i}">queued</div>`;
    segList.appendChild(el);
    return el;
  });

  const hv = document.getElementById('host-voice').value;
  const nv = document.getElementById('narr-voice').value;
  const orderedBlobs = [];

  for (let i = 0; i < script.segments.length; i++) {
    const seg = script.segments[i];
    setStat(`Generating audio ${i+1} of ${script.segments.length}...`);
    segEls[i].classList.add('generating');
    document.getElementById(`sst-${i}`).textContent = 'generating...';

    const ttsPromise = tts(seg.text, seg.role==='host' ? hv : nv);
    const sfxPromise = seg.sfx ? generateSfx(seg.sfx, 3).catch(() => null) : Promise.resolve(null);

    let speechBlob, sfxBlob;
    try {
      [speechBlob, sfxBlob] = await Promise.all([ttsPromise, sfxPromise]);
    } catch(e) {
      document.getElementById(`sst-${i}`).textContent = 'error';
      segEls[i].classList.remove('generating'); segEls[i].classList.add('done');
      setStat('TTS error: ' + e.message);
      continue;
    }

    if (sfxBlob && seg.role === 'narrator') orderedBlobs.push({ blob: sfxBlob, role: 'sfx' });
    orderedBlobs.push({ blob: speechBlob, role: seg.role });

    segEls[i].classList.remove('generating'); segEls[i].classList.add('done');
    document.getElementById(`sst-${i}`).textContent = 'ready ✓';
  }

  if (orderedBlobs.length === 0) { hideStat(); btn.disabled=false; return; }

  setStat('Generating background music...');
  let musicBuf = null;
  try {
    const musicBlob = await generateMusic(mood.name, 30);
    const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicBuf = await tmpCtx.decodeAudioData(await musicBlob.arrayBuffer());
    tmpCtx.close();
  } catch(e) { console.warn('Music generation failed:', e.message); }

  setStat('Mixing and stitching episode...');

  const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decodedSegments = await Promise.all(orderedBlobs.map(async item => {
    const buf = await decodeCtx.decodeAudioData(await item.blob.arrayBuffer());
    return { role: item.role, buf };
  }));
  decodeCtx.close();

  const sampleRate  = decodedSegments[0].buf.sampleRate;
  const totalFrames = decodedSegments.reduce((n,s) => n+s.buf.length, 0);
  const offline     = new OfflineAudioContext(2, totalFrames, sampleRate);
  const firstHostIdx = decodedSegments.findIndex(s => s.role === 'host');

  let timeOffset = 0;
  for (let si = 0; si < decodedSegments.length; si++) {
    const seg = decodedSegments[si];
    const segDuration = seg.buf.length / sampleRate;

    const src = offline.createBufferSource();
    src.buffer = seg.buf; src.connect(offline.destination); src.start(timeOffset);

    if (si === firstHostIdx && musicBuf) {
      const musicGain = offline.createGain();
      musicGain.gain.setValueAtTime(0.22, timeOffset);
      musicGain.gain.linearRampToValueAtTime(0.22, timeOffset + Math.min(0.3, segDuration*0.1));
      musicGain.gain.setValueAtTime(0.22, timeOffset + segDuration - Math.min(0.5, segDuration*0.15));
      musicGain.gain.linearRampToValueAtTime(0, timeOffset + segDuration);
      musicGain.connect(offline.destination);

      const musicSrc = offline.createBufferSource();
      musicSrc.buffer = musicBuf; musicSrc.loop = true;
      musicSrc.connect(musicGain);
      musicSrc.start(timeOffset); musicSrc.stop(timeOffset + segDuration);
    }
    timeOffset += segDuration;
  }

  const rendered  = await offline.startRendering();
  const finalBlob = new Blob([audioBufferToWav(rendered)], { type: 'audio/wav' });

  hideStat();
  setupPlayer(finalBlob);
  btn.disabled = false;
}
