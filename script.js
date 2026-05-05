/* ═══════════════════════════════════════════════════════
   BICTS — Barangay Intelligent Case Tracking System
   script.js — All interaction + render logic
═══════════════════════════════════════════════════════ */

/* ── SCREEN TITLES MAP ── */
const SCREEN_TITLES = {
  dashboard:          'Dashboard',
  complaints:         'All Complaints',
  'complaint-detail': 'Complaint Detail',
  priority:           'Priority Queue',
  cases:              'Case Board',
  ai:                 'AI Classification Results',
  reports:            'Reports',
  users:              'User Management',
  notifs:             'Notifications',
  settings:           'Settings',
};

/* ── LOGIN / LOGOUT ── */
function doLogin() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('shell').style.display = 'flex';
}

function doLogout() {
  document.getElementById('shell').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

/* ── SCREEN NAVIGATION ── */
function showScreen(id, navEl) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
  document.getElementById('topbar-title').textContent = SCREEN_TITLES[id] || id;
  if (navEl) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    navEl.classList.add('active');
  }
}

/* ── VIEW COMPLAINT DETAIL ── */
function viewComplaint(id) {
  const c = complaints.find(x => x.id === id);
  if (!c) return;

  /* ── breadcrumb + title ── */
  const bc = document.querySelector('#screen-complaint-detail .breadcrumb');
  if (bc) bc.innerHTML = 'Complaints / <b>' + id + ' – ' + c.category + '</b>';

  const pt = document.querySelector('#screen-complaint-detail .page-title');
  if (pt) pt.textContent = id + ' – ' + c.category;

  /* ── badges row ── */
  const badgeRow = document.querySelector('#screen-complaint-detail .page-title + div');
  if (badgeRow) {
    badgeRow.innerHTML =
      '<span class="badge b-blue">' + c.category + '</span>' +
      '<span class="badge ' + c.pb + '">' + c.priority + ' Priority</span>' +
      '<span class="badge ' + c.sb + '">' + c.status + '</span>';
  }

  /* ── resolve / re-open button in header ── */
  const resolveHeaderBtn = document.getElementById('detail-resolve-btn');
  if (resolveHeaderBtn) {
    if (c.status !== 'Resolved') {
      resolveHeaderBtn.textContent = '✓ Resolve';
      resolveHeaderBtn.style.color = 'var(--green)';
      resolveHeaderBtn.style.borderColor = 'var(--green)';
      resolveHeaderBtn.onclick = function() { resolveComplaint(id); viewComplaint(id); };
    } else {
      resolveHeaderBtn.textContent = '✓ Resolved';
      resolveHeaderBtn.style.color = 'var(--text3)';
      resolveHeaderBtn.style.borderColor = 'var(--border)';
      resolveHeaderBtn.onclick = null;
    }
  }

  /* ── detail fields ── */
  const fieldMap = {
    'detail-date-filed':    c.date       || '—',
    'detail-incident-date': (c.date || '—') + (c.time ? ' ' + c.time : ''),
    'detail-location':      c.location   || '—',
    'detail-affected':      c.affected   || '—',
    'detail-complainant':   c.complainant|| 'Anonymous',
    'detail-officer':       c.officer    || '—',
  };
  Object.entries(fieldMap).forEach(([elId, val]) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = val;
  });

  /* ── description ── */
  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = c.description || 'No description provided.';

  /* ── NLP confidence bars ── */
  const allCats  = ['Noise Disturbance','Theft/Robbery','Property Dispute','Domestic Concern','Environmental'];
  const mainConf = c.confidence || 78;
  const scores   = allCats.map(cat => {
    if (cat === c.category) return mainConf;
    return Math.min(Math.floor(Math.random() * 28) + 4, mainConf - 10);
  });
  const nlpBarsEl = document.getElementById('nlp-conf-bars');
  if (nlpBarsEl) {
    nlpBarsEl.innerHTML = allCats.map((cat, i) =>
      '<div class="conf-bar">' +
      '<span class="conf-label">' + cat + (cat === c.category ? ' ★' : '') + '</span>' +
      '<div class="conf-track"><div class="conf-fill" style="width:' + scores[i] + '%"></div></div>' +
      '<span class="conf-pct">' + scores[i] + '%</span></div>'
    ).join('');
  }

  /* ── NLP predicted label ── */
  const nlpPredEl = document.querySelector('#screen-complaint-detail .nlp-box + div strong');
  if (nlpPredEl) nlpPredEl.textContent = c.category;

  /* ── Fuzzy AHP priority score ── */
  const scoreNum = document.querySelector('#screen-complaint-detail .score-num');
  if (scoreNum) {
    scoreNum.textContent = c.score;
    scoreNum.className   = 'score-num ' + (
      parseFloat(c.score) >= 90 ? 'critical' :
      parseFloat(c.score) >= 75 ? 'high' :
      parseFloat(c.score) >= 50 ? 'medium' : 'low'
    );
  }
  const priorityBadge = document.querySelector('#screen-complaint-detail .priority-score .badge');
  if (priorityBadge) {
    priorityBadge.textContent = c.priority;
    priorityBadge.className   = 'badge ' + c.pb + ' ' + priorityBadge.className.split(' ').slice(1).join(' ');
  }

  /* ── AHP criteria (static weights, dynamic values) ── */
  const ahpEl = document.getElementById('ahp-criteria');
  if (ahpEl) {
    const score = parseFloat(c.score);
    const sev  = Math.min(Math.round(score * 0.35 / 0.35), 9);
    const urg  = Math.min(Math.round(score * 0.30 / 0.30), 9);
    const freq = Math.min(Math.round(score * 0.20 / 0.20), 9);
    const aff  = Math.min(parseInt(c.affected) || 1, 9);
    const rows = [['Severity', sev + '/9','35%'],['Urgency', urg + '/9','30%'],['Frequency', freq + '/9','20%'],['Affected', aff + '/9','15%']];
    ahpEl.innerHTML = rows.map(r =>
      '<div style="display:flex;justify-content:space-between;font-size:11px;padding:5px 0;border-bottom:1px solid var(--border);">' +
      '<span style="color:var(--text3)">' + r[0] + '</span>' +
      '<span style="color:var(--text);font-weight:500">' + r[1] + '</span>' +
      '<span style="color:var(--text3);font-family:var(--mono)">w=' + r[2] + '</span></div>'
    ).join('');
  }

  /* ── Case Timeline ── */
  const timelineEl = document.querySelector('#screen-complaint-detail .card:last-child .card-body');
  if (timelineEl) {
    const events = [
      { dot: 'done', label: 'Complaint Filed',      meta: c.date + (c.time ? ' · ' + c.time : '') },
      { dot: 'done', label: 'AI Classification',    meta: c.category + ' · ' + (c.confidence || 78) + '% confidence' },
      { dot: c.status !== 'Open' ? 'done' : 'pend', label: 'Officer Assigned', meta: c.officer !== '—' ? c.officer : 'Pending assignment' },
      { dot: c.status === 'Resolved' ? 'done' : 'pend', label: 'Case Resolved', meta: c.resolvedAt ? 'Resolved at ' + c.resolvedAt : 'Pending resolution' },
    ];
    timelineEl.innerHTML = '<ul class="tl">' + events.map(e =>
      '<li><div class="tl-dot ' + e.dot + '"></div>' +
      '<div><div class="tl-act">' + e.label + '</div>' +
      '<div class="tl-meta">' + e.meta + '</div></div></li>'
    ).join('') + '</ul>';
  }

  /* ── navigate to screen ── */
  showScreen('complaint-detail', null);
  /* update topbar title */
  document.getElementById('topbar-title').textContent = id + ' – ' + c.category;
}

/* ── MODALS ── */
function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
  if (id === 'submitModal') resetWizard();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function initModalBackdropClose() {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('open');
    });
  });
}

/* ════════════════════════════════════════════════════════
   COMPLAINTS DATA STORE
════════════════════════════════════════════════════════ */
let complaints = [];
let nextId = 1;

/* STATUS FLOW: Open → In Progress → For Hearing → Resolved */
const STATUS_FLOW = ['Open', 'In Progress', 'For Hearing', 'Resolved'];

function statusBadge(status) {
  if (status === 'Resolved')    return 'b-green';
  if (status === 'In Progress') return 'b-blue';
  if (status === 'For Hearing') return 'b-amber';
  return 'b-gray';
}

function addComplaint(data) {
  const id   = '#' + String(nextId).padStart(3, '0');
  const now  = new Date();
  const date = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const entry = { id, date, ...data };
  complaints.unshift(entry);
  nextId++;
  renderAll();
  return entry;
}

/* Resolve a complaint by index — sets status to Resolved everywhere */
function resolveComplaint(id) {
  const c = complaints.find(x => x.id === id);
  if (!c) return;
  if (c.status === 'Resolved') return;
  c.status     = 'Resolved';
  c.sb         = 'b-green';
  c.resolvedAt = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  pushNotif('Complaint ' + id + ' (' + c.category + ') has been marked as Resolved.', 'success');
  renderAll();
}

/* Advance complaint to next status column */
function advanceStatus(id) {
  const c = complaints.find(x => x.id === id);
  if (!c) return;
  const idx = STATUS_FLOW.indexOf(c.status);
  if (idx < STATUS_FLOW.length - 1) {
    c.status = STATUS_FLOW[idx + 1];
    c.sb     = statusBadge(c.status);
    if (c.status === 'Resolved') {
      c.resolvedAt = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      pushNotif('Complaint ' + id + ' (' + c.category + ') has been marked as Resolved.', 'success');
    }
    renderAll();
  }
}

/* Re-render every section that shows complaint data */
function renderAll() {
  renderDashboardStats();
  renderCriticalCases();
  renderComplaints();
  renderPriorityQueue();
  renderKanban();
}

/* ── Notifications store ── */
let notifStore = [];

function pushNotif(msg, type) {
  notifStore.unshift({
    msg,
    type,
    time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  });
  renderNotifs();
  /* flash the bell */
  const bell = document.querySelector('.topbar-action');
  if (bell) {
    bell.style.background = 'var(--sky-light)';
    setTimeout(() => { bell.style.background = ''; }, 1200);
  }
}

/* ════════════════════════════════════════════════════════
   SUBMIT COMPLAINT — 4-STEP WIZARD
════════════════════════════════════════════════════════ */
let wizardStep = 1;
const TOTAL_STEPS = 4;
let _lastAiCat  = 'Noise Disturbance';
let _lastAiConf = 94;

function resetWizard() {
  wizardStep = 1;
  renderWizardStep();
  ['w-date','w-time','w-location','w-description','w-complainant','w-affected'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function wizardNext() {
  if (wizardStep === 1) {
    const loc  = (document.getElementById('w-location')?.value || '').trim();
    const desc = (document.getElementById('w-description')?.value || '').trim();
    if (!loc || !desc) {
      alert('Please fill in Location and Description before proceeding.');
      return;
    }
  }
  if (wizardStep < TOTAL_STEPS) {
    wizardStep++;
    renderWizardStep();
    if (wizardStep === 3) runAiClassification();
  }
}

function wizardBack() {
  if (wizardStep > 1) { wizardStep--; renderWizardStep(); }
}

function wizardSubmit() {
  const date        = document.getElementById('w-date')?.value        || '';
  const time        = document.getElementById('w-time')?.value        || '';
  const location    = document.getElementById('w-location')?.value    || '';
  const description = document.getElementById('w-description')?.value || '';
  const complainant = document.getElementById('w-complainant')?.value || 'Anonymous';
  const affected    = document.getElementById('w-affected')?.value    || '1';

  const affNum = parseInt(affected) || 1;
  let score = 50;
  if      (_lastAiCat === 'Theft/Robbery')      score = 85 + Math.min(affNum, 10);
  else if (_lastAiCat === 'Domestic Concern')   score = 80 + Math.min(affNum, 10);
  else if (_lastAiCat === 'Noise Disturbance')  score = 55 + Math.min(affNum * 2, 20);
  else if (_lastAiCat === 'Property Dispute')   score = 40 + Math.min(affNum, 10);
  else                                          score = 45 + Math.min(affNum, 10);
  score = Math.min(score, 99);

  const priority = score >= 90 ? 'Critical' : score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  const pb       = score >= 90 ? 'b-red'    : score >= 75 ? 'b-amber' : score >= 50 ? 'b-blue' : 'b-green';

  addComplaint({
    description, location, date, time,
    complainant: complainant || 'Anonymous',
    affected,
    category:   _lastAiCat,
    confidence: _lastAiConf,
    score:      score.toFixed(1),
    priority, pb,
    officer: '—',
    status:  'Open',
    sb:      'b-gray',
  });

  pushNotif('New complaint submitted — ' + _lastAiCat + ' (Priority: ' + priority + ')', 'info');
  wizardStep = 5;
  renderWizardStep();
}

function renderWizardStep() {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const numEl = document.getElementById('ws-n-' + i);
    const lblEl = document.getElementById('ws-l-' + i);
    if (!numEl) continue;
    const state = i < wizardStep ? 'done' : i === wizardStep ? 'cur' : 'todo';
    numEl.className = 'wizard-step-n ' + state;
    if (lblEl) lblEl.className = 'wizard-step-label ' + state;
    numEl.textContent = i < wizardStep ? '✓' : String(i);
  }

  document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
  const panelId = wizardStep <= TOTAL_STEPS ? 'wp-' + wizardStep : 'wp-success';
  const panel   = document.getElementById(panelId);
  if (panel) panel.classList.add('active');

  const backBtn   = document.getElementById('wizard-back');
  const nextBtn   = document.getElementById('wizard-next');
  const submitBtn = document.getElementById('wizard-submit');
  const cancelBtn = document.getElementById('wizard-cancel');
  const doneBtn   = document.getElementById('wizard-done');
  if (!backBtn) return;

  if (wizardStep === 5) {
    backBtn.style.display   = 'none';
    nextBtn.style.display   = 'none';
    submitBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (doneBtn)   doneBtn.style.display   = 'inline-flex';
    return;
  }

  if (cancelBtn) cancelBtn.style.display = 'inline-flex';
  if (doneBtn)   doneBtn.style.display   = 'none';

  backBtn.style.display   = wizardStep > 1            ? 'inline-flex' : 'none';
  nextBtn.style.display   = wizardStep < TOTAL_STEPS  ? 'inline-flex' : 'none';
  submitBtn.style.display = wizardStep === TOTAL_STEPS ? 'inline-flex' : 'none';

  if (wizardStep === 2) nextBtn.textContent = 'Next: AI Classify →';
  else if (wizardStep === 3) nextBtn.textContent = 'Next: Confirm →';
  else nextBtn.textContent = 'Next →';
}

/* Hard coded Database */
function runAiClassification() {
  const desc = (document.getElementById('w-description')?.value || '').toLowerCase();

  let cat = 'Noise Disturbance', conf = 78;
  const theftWords    = [
    'nakaw', 'nanakaw', 'ninakaw', 'magnanakaw', 'pagnanakaw', 'nakawan', 'tinangay', 'tinakas', 'tinakbo', 'sinilo',
    'kinuha', 'kinupit', 'dinukot', 'dinambong', 'nadukutan', 'naagawan', 'inagaw', 'holdap', 'hinoldap', 'panghoholdap',
    'robbery', 'theft', 'steal', 'stole', 'stolen', 'thief', 'criminal', 'suspect', 'crime', 'illegal',
    'burglary', 'breakin', 'trespass', 'intrusion', 'looting', 'heist', 'snatching', 'pickpocket', 'shoplifting', 'pilfering',
    'wallet', 'cellphone', 'laptop', 'bag', 'pera', 'cash', 'salapi', 'gamit', 'ari-arian', 'valuable',
    'alahas', 'sasakyan', 'motor', 'bisikleta', 'kotse', 'phone', 'device', 'package', 'parcel', 'mail',
    'missing', 'lost', 'disappeared', 'wala', 'nawala', 'biglangwala', 'di_mahanap', 'unknown', 'unidentified', 'suspicious',
    'hacking', 'fraud', 'scam', 'phishing', 'identitytheft', 'cybercrime', 'online_theft', 'digital_theft', 'unauthorized',
    'access', 'entry', 'forced_entry', 'lockpick', 'sirang_pinto', 'basag_bintana', 'damage', 'vandal', 'breakdoor', 'breakwindow',
    'stolen_items', 'missing_items', 'lost_items', 'stolen_phone', 'stolen_wallet', 'stolen_money', 'stolen_bag', 'stolen_vehicle', 'carjacking', 'vehicle_theft',
    'crime_report', 'police_report', 'incident', 'complaint', 'case', 'filed', 'report', 'investigation', 'ongoing', 'caught',
    'arrested', 'nahuli', 'nahuling', 'nahuli_ang_suspek', 'tumakas', 'nagtago', 'tinago', 'itinago', 'concealed', 'hidden',
    'illegal_entry', 'unlawful', 'without_permission', 'walang_pahintulot', 'pinilit', 'sapilitan', 'force', 'grabbed', 'snatched', 'runaway',
    'escape', 'evade', 'fugitive', 'wanted', 'alert', 'crime_alert', 'security', 'breach', 'incident_report', 'evidence_found',
    'witness', 'testigo', 'nakakita', 'nakasaksi', 'statement', 'reporting', 'complainant', 'biktima', 'victim', 'owner',
    'property', 'asset', 'resources', 'inventory', 'record', 'documents', 'credentials', 'account', 'compromised', 'unauthorized_access',
    'transaction', 'illegal_transfer', 'stolen_funds', 'bank_fraud', 'financial_fraud', 'fraudulent', 'impersonation', 'identity', 'fake', 'pretend',
    'deception', 'panlilinlang', 'panloloko', 'loko', 'modus', 'scheme', 'organized_crime', 'syndicate', 'gang', 'network',
    'blackmarket', 'illegal_trade', 'smuggling', 'contraband', 'illegal_goods', 'stolen_goods', 'recovered', 'nabawi', 'retrieved', 'returned',
    'investigated', 'under_investigation', 'casefile', 'evidence_log', 'suspect_description', 'profile', 'tracking', 'monitoring', 'surveillance', 'camera',
    'cctv', 'footage', 'recorded', 'identified', 'unknown_person', 'stranger', 'intruder', 'trespasser', 'unauthorized_person', 'illegal_presence',
    'crime_scene', 'location', 'area', 'barangay', 'community', 'neighborhood', 'street', 'residence', 'house', 'building',
    'store', 'shop', 'office', 'warehouse', 'facility', 'entry_point', 'exit_point', 'security_guard', 'guard', 'alarm',
    'alerted', 'notified', 'reported', 'complaint_filed', 'case_filed', 'incident_logged', 'data_record', 'analysis', 'pattern', 'trend',
    'repeat_offender', 'recidivist', 'history', 'background', 'criminal_record', 'database', 'system', 'tracking_system', 'security_system', 'alarm_system',
    'lock', 'unlock', 'security_lock', 'padlock', 'key', 'duplicate_key', 'lost_key', 'forced_lock', 'broken_lock', 'tampered',
    'entry', 'exit', 'movement', 'suspicious_activity', 'behavior', 'pattern_detected', 'risk', 'threat', 'danger', 'warning',
    'alert_system', 'notification', 'report_system', 'complaint_system', 'incident_system', 'monitoring_system', 'tracking_system', 'security_protocol', 'procedure', 'response',
    'action_taken', 'follow_up', 'resolution', 'closed_case', 'open_case', 'pending', 'processing', 'handled', 'resolved', 'unresolved'
  ];
  const domesticWords = [
    'domestic', 'family', 'pamilya', 'household', 'bahay', 'home', 'residence', 'relationship', 'relasyon', 'mag_asawa',
    'asawa', 'partner', 'live_in', 'anak', 'child', 'children', 'magulang', 'parent', 'tatay', 'nanay',
    'away', 'alitan', 'sigawan', 'argument', 'fight', 'quarrel', 'conflict', 'dispute', 'hindi_pagkakaunawaan', 'misunderstanding',
    'violence', 'abuse', 'domestic_violence', 'physical_abuse', 'verbal_abuse', 'emotional_abuse', 'psychological', 'harm', 'saktan', 'sinaktan',
    'nanakit', 'pananakit', 'threat', 'banta', 'intimidation', 'takot', 'fear', 'unsafe', 'danger', 'risk',
    'complaint', 'reklamo', 'report', 'incident', 'case', 'filed', 'reported', 'victim', 'biktima', 'suspect',
    'suspek', 'offender', 'salarin', 'police', 'authority', 'barangay', 'blotter', 'reporting', 'statement', 'salaysay',
    'protection_order', 'restraining_order', 'barangay_protection_order', 'legal_action', 'kaso', 'court', 'hearing', 'desisyon', 'resolution', 'settlement',
    'counseling', 'therapy', 'support', 'assistance', 'help', 'tulong', 'intervention', 'social_worker', 'dswd', 'ngo',
    'financial_issue', 'pera', 'money', 'budget', 'utang', 'debt', 'gastusin', 'expenses', 'support', 'child_support',
    'neglect', 'napabayaan', 'abandonment', 'iniwan', 'left', 'separation', 'hiwalayan', 'annulment', 'divorce', 'legal_separation',
    'custody', 'alaga', 'child_custody', 'visitation', 'access', 'parental_rights', 'responsibility', 'obligation', 'duty', 'care',
    'house_problem', 'home_issue', 'daily_conflict', 'routine', 'stress', 'pagod', 'tension', 'pressure', 'mental_health', 'emotional',
    'communication', 'usap', 'paguusap', 'lack_of_communication', 'miscommunication', 'trust', 'tiwala', 'betrayal', 'cheating', 'infidelity',
    'selos', 'jealousy', 'issue', 'problem', 'concern', 'complaint_record', 'case_record', 'tracking', 'monitoring', 'system',
    'domestic_issue', 'family_problem', 'home_conflict', 'relationship_problem', 'abuse_case', 'violence_case', 'support_system', 'resolution_process'
  ];
  const propertyWords = [
    'property', 'ari-arian', 'lupa', 'land', 'lot', 'title', 'titulo', 'ownership', 'mayari', 'owner',
    'pagmamayari', 'ownership_issue', 'dispute', 'alitan', 'sigalot', 'conflict', 'boundary', 'hangganan', 'bakuran', 'fence',
    'boundary_dispute', 'agawan_lupa', 'encroachment', 'trespass', 'pagpasok', 'illegal_entry', 'right_of_way', 'daan', 'access', 'road_access',
    'easement', 'rightofway_issue', 'harang', 'blocked_path', 'saradong_daan', 'obstruction', 'nakaharang', 'barrier', 'gate', 'locked_gate',
    'tenant', 'upa', 'renter', 'lessee', 'lessor', 'landlord', 'upa_issue', 'rent_dispute', 'eviction', 'paalisin',
    'paalis', 'forced_eviction', 'illegal_evict', 'contract', 'kontrata', 'agreement', 'kasunduan', 'breach', 'violation', 'nilabag',
    'terms', 'conditions', 'kasunduan_issue', 'document', 'papeles', 'deed', 'tax_declaration', 'amelyar', 'tax', 'real_property_tax',
    'inheritance', 'mana', 'heir', 'tagapagmana', 'will', 'testamento', 'estate', 'arian_ng_namatay', 'partition', 'hati',
    'co_owner', 'shared_property', 'joint_ownership', 'coownership', 'subdivision', 'hati_lupa', 'survey', 'surveying', 'geodetic', 'engineer',
    'lot_plan', 'technical_description', 'registry', 'registry_of_deeds', 'rehistro', 'transfer', 'lipat_titulo', 'title_transfer', 'processing', 'pending',
    'case', 'kaso', 'legal', 'batas', 'law', 'court', 'hukuman', 'complaint', 'reklamo', 'filed',
    'affidavit', 'salaysay', 'evidence', 'ebidensya', 'testigo', 'witness', 'hearing', 'pagdinig', 'decision', 'desisyon',
    'resolution', 'settlement', 'areglo', 'mediation', 'conciliation', 'barangay_case', 'lupon', 'barangay_hearing', 'amicable', 'kasunduan',
    'disagreement', 'hindi_pagkakasundo', 'claim', 'habol', 'counterclaim', 'pagtatalo', 'argument', 'sigawan', 'debate', 'negotiation',
    'rights', 'karapatan', 'violation_of_rights', 'ownership_claim', 'false_claim', 'fake_documents', 'peke', 'fraudulent_title', 'double_sale', 'overlap',
    'overlapping_title', 'duplicate_title', 'encroached_area', 'occupied', 'inaangkin', 'occupied_land', 'illegal_occupant', 'squatter', 'informal_settler', 'relocation',
    'demolition', 'gibain', 'structure', 'bahay', 'building', 'construction', 'illegal_construction', 'permit', 'building_permit', 'walang_permit',
    'zoning', 'land_use', 'classification', 'residential', 'commercial', 'industrial', 'agricultural', 'conversion', 'rezoning', 'approval',
    'denied', 'rejected', 'application', 'request', 'processing_delay', 'issue', 'problem', 'concern', 'complaint_record', 'case_record',
    'tracking', 'monitoring', 'system', 'complaint_system', 'property_issue', 'land_issue', 'ownership_problem', 'boundary_problem', 'access_issue', 'legal_issue'
  ];
  const envWords      = [
    'kapaligiran', 'environment', 'environmental', 'pollution', 'polusyon', 'air_pollution', 'water_pollution', 'noise_pollution', 'soil_pollution', 'contamination',
    'dumi', 'basura', 'waste', 'garbage', 'trash', 'litter', 'littering', 'improper_disposal', 'waste_management', 'segregation',
    'recycling', 'recyclable', 'biodegradable', 'non_biodegradable', 'plastic', 'single_use_plastic', 'bottle', 'can', 'packaging', 'styrofoam',
    'drainage', 'kanal', 'baradong_kanal', 'clogged', 'flood', 'baha', 'flooding', 'water_level', 'overflow', 'leak',
    'sewage', 'septic', 'wastewater', 'dirty_water', 'malinis_na_tubig', 'water_supply', 'shortage', 'kakulangan', 'illegal_dumping', 'open_dump',
    'burning', 'pagsusunog', 'smoke', 'usok', 'fumes', 'amoy', 'odor', 'masangsang', 'toxic', 'hazardous',
    'chemical', 'kemikal', 'spill', 'tagas', 'leakage', 'industrial_waste', 'factory', 'pabrika', 'emission', 'carbon',
    'climate', 'climate_change', 'global_warming', 'init', 'heat', 'temperature', 'weather', 'ulan', 'storm', 'bagyo',
    'tree', 'puno', 'deforestation', 'illegal_logging', 'pagputol', 'reforestation', 'greening', 'planting', 'forest', 'gubat',
    'wildlife', 'hayop', 'animal', 'habitat', 'tirahan', 'ecosystem', 'biodiversity', 'protected_area', 'sanctuary', 'conservation',
    'river', 'ilog', 'lake', 'lawa', 'sea', 'dagat', 'coast', 'baybayin', 'shore', 'beach',
    'erosion', 'landslide', 'pagguho', 'soil', 'lupa', 'fertility', 'dry', 'tuyo', 'drought', 'tagtuyot',
    'complaint', 'reklamo', 'environmental_complaint', 'report', 'incident', 'case', 'filed', 'reported', 'monitoring', 'inspection',
    'enforcement', 'authority', 'denr', 'local_government', 'barangay', 'community', 'violation', 'lumalabag', 'penalty', 'fine',
    'ordinance', 'batas', 'regulation', 'policy', 'compliance', 'non_compliance', 'inspection_report', 'assessment', 'evaluation', 'analysis',
    'public_health', 'kalusugan', 'risk', 'hazard', 'danger', 'unsafe', 'exposure', 'contaminated', 'clean_up', 'rehabilitation',
    'sustainability', 'sustainable', 'green', 'eco_friendly', 'renewable', 'energy', 'solar', 'wind', 'water_resource', 'protection'
  ];
  const noiseWords    = [
    'loud','noisy','noise','ingay','maingay','sobrang ingay','malakas','malakas na tugtog','loud music','music',
    'videoke','karaoke','party','party noise','sigawan','shouting','yelling','screaming','banging','kalabog',
    'thumping','pounding','stomping','dragging','scraping','construction','construction noise','drilling',
    'hammering','jackhammer','machinery','machine','generator','engine','revving','tambutso','exhaust','open muffler',
    'busina','honking','alarm','car alarm','siren','whistle','shouting match','argument noise','away','sigaw',
    'tawanan','laughter','cheering','chanting','singing','malakas na kanta','blasting','sound system','speaker',
    'subwoofer','bass','malakas na bass','vibration','vibrating','echo','reverb','distortion','feedback','microphone',
    'amplifier','radio','television','tv','malakas na tv','loud tv','volume','max volume','full volume','noise complaint',
    'disturbance','istorbo','istorbo sa tulog','di makatulog','insomnia','sleepless','napuyat','napupuyat','late night',
    'midnight','madaling araw','gabi','overnight','early morning','umaga','dawn','kapitbahay','neighbor','neighbour',
    'kapitbahay na maingay','street','kalsada','road','traffic','traffic noise','vehicle','car','truck','bus','motorcycle',
    'motor','racing','drag race','speeding','engine rev','loud engine','horn','beeping','construction site','site work',
    'renovation','remodeling','tools','power tools','electric drill','grinder','saw','chainsaw','cutting','metal cutting',
    'wood cutting','factory','industrial','factory noise','plant','warehouse','loading','unloading','dropping','crashing',
    'falling objects','objects dropping','slamming','door slam','window slam','gate slam','metal gate','rolling gate',
    'gate noise','closing gate','opening gate','dog','dog barking','bark','tahol','tahol ng aso','howling','animals',
    'animal noise','rooster','cockcrow','manok','tilaok','crowing','birds','bird noise','chirping','tweeting','squawking',
    'kids','children','children playing','playing','running','jumping','ball','basketball','dribbling','bouncing',
    'bouncing ball','sports','game','shouting kids','school','school noise','classroom','bell','school bell',
    'crowd','crowd noise','public','market','palengke','vendors','tindero','tindera','selling','hawking',
    'megaphone','announcement','public address','pa system','rally','protest','chant','chanting crowd','event',
    'concert','festival','fiesta','celebration','celebrating','fireworks','paputok','explosion','boom','blast',
    'gunshot','putok','thunder','kulog','lightning','kidlat','rain','ulan','heavy rain','wind','hangin','storm',
    'bagyo','aircon','air conditioner','fan','electric fan','hum','humming','buzz','buzzing','ringing','phone ringing',
    'notification','alarm clock','beeping sound','clicking','ticking','clock','tick tock'
  ];

  if      (theftWords   .some(w => desc.includes(w))) { cat = 'Theft/Robbery';    conf = 91; }
  else if (domesticWords.some(w => desc.includes(w))) { cat = 'Domestic Concern'; conf = 89; }
  else if (propertyWords.some(w => desc.includes(w))) { cat = 'Property Dispute'; conf = 86; }
  else if (envWords     .some(w => desc.includes(w))) { cat = 'Environmental';    conf = 83; }
  else if (noiseWords   .some(w => desc.includes(w))) { cat = 'Noise Disturbance';conf = 88; }
  else                                                 { cat = 'Noise Disturbance';conf = 62; }

  _lastAiCat  = cat;
  _lastAiConf = conf;

  const catEl  = document.getElementById('ai-cat');
  const confEl = document.getElementById('ai-conf');
  const barsEl = document.getElementById('ai-conf-bars');
  if (catEl)  catEl.textContent  = cat;
  if (confEl) confEl.textContent = conf + '% confidence · BiLSTM';

  const allCats = ['Noise Disturbance','Theft/Robbery','Property Dispute','Domestic Concern','Environmental'];
  const scores  = allCats.map(c => {
    if (c === cat) return conf;
    return Math.min(Math.floor(Math.random() * 30) + 5, conf - 15);
  });
  if (barsEl) {
    barsEl.innerHTML = allCats.map((c, i) => `
      <div class="conf-bar">
        <span class="conf-label">${c}</span>
        <div class="conf-track"><div class="conf-fill" style="width:${scores[i]}%"></div></div>
        <span class="conf-pct">${scores[i]}%</span>
      </div>`).join('');
  }
  renderConfirmPanel(cat, conf);
}

function renderConfirmPanel(cat, conf) {
  const el = document.getElementById('confirm-rows');
  if (!el) return;
  const date = document.getElementById('w-date')?.value        || '—';
  const time = document.getElementById('w-time')?.value        || '—';
  const loc  = document.getElementById('w-location')?.value    || '—';
  const desc = document.getElementById('w-description')?.value || '—';
  const name = document.getElementById('w-complainant')?.value || 'Anonymous';
  const aff  = document.getElementById('w-affected')?.value    || '—';
  el.innerHTML = [
    ['Date of Incident', date],
    ['Time',             time],
    ['Location',         loc],
    ['Description',      desc.length > 80 ? desc.slice(0,80) + '…' : desc],
    ['Complainant',      name || 'Anonymous'],
    ['Affected Persons', aff],
    ['AI Category',      cat + ' (' + conf + '% confidence)'],
    ['Priority',         'To be computed by Fuzzy AHP'],
  ].map(function(row) {
    return '<div class="confirm-row"><span class="confirm-key">' + row[0] + '</span><span class="confirm-val">' + row[1] + '</span></div>';
  }).join('');
}

/* ── FILTER CHIPS ── */
function initChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function () {
      const row = this.closest('.filter-row');
      if (row) row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/* ── TABS ── */
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
      this.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/* ── TOGGLES ── */
function initToggles() {
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', function () {
      this.classList.toggle('on');
      this.classList.toggle('off');
    });
  });
}

/* ════════════════════════════════════════════════════════
   RENDER — Dashboard
════════════════════════════════════════════════════════ */
function renderAccuracyBars() {
  const data = [['BiLSTM',93],['SVM',89],['Naive Bayes',74]];
  const el = document.getElementById('accuracy-bars');
  if (!el) return;
  el.innerHTML = data.map(function(row) {
    const n = row[0], v = row[1];
    return '<div style="margin-bottom:10px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">' +
      '<span style="color:var(--text2);font-weight:500">' + n + '</span>' +
      '<span style="color:var(--blue);font-family:var(--mono);font-weight:600">' + v + '%</span>' +
      '</div><div class="progress"><div class="progress-fill" style="width:' + v + '%"></div></div></div>';
  }).join('');
}

function renderCriticalCases() {
  const container = document.getElementById('critical-cases');
  if (!container) return;
  const critical = complaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved');
  if (critical.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No critical cases</div><div class="empty-desc">No complaints require immediate attention.</div></div>';
    return;
  }
  container.innerHTML =
    '<div class="alert alert-danger">🚨 <strong>' + critical.length + ' critical</strong> complaint' + (critical.length !== 1 ? 's' : '') + ' need immediate attention.</div>' +
    critical.map(c =>
      '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">' +
      '<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">' + c.id + '</span>' +
      '<span class="badge b-red">' + c.category + '</span>' +
      '<span style="margin-left:auto;font-family:var(--mono);font-size:11px;font-weight:700;color:var(--red)">' + c.score + '</span>' +
      '</div>'
    ).join('');
}

function renderDashboardStats() {
  const total    = complaints.length;
  const pending  = complaints.filter(c => c.status === 'Open').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  const tEl = document.getElementById('stat-total');
  const pEl = document.getElementById('stat-pending');
  const rEl = document.getElementById('stat-resolved');
  if (tEl) tEl.textContent = total;
  if (pEl) pEl.textContent = pending;
  if (rEl) rEl.textContent = resolved;

  const recentBox = document.getElementById('dashboard-recent');
  if (!recentBox) return;
  if (complaints.length === 0) {
    recentBox.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No complaints yet</div><div class="empty-desc">Submitted complaints will appear here.</div></div>';
    return;
  }
  let rows = complaints.slice(0, 5).map(c => {
    const resolveBtn = c.status !== 'Resolved'
      ? '<button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;white-space:nowrap;" onclick="resolveComplaint(\'' + c.id + '\')">✓ Resolve</button>'
      : '<span style="font-size:11px;color:var(--green);font-weight:600;">✓ Resolved</span>';
    return '<tr>' +
      '<td class="mono">' + c.id + '</td>' +
      '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + c.description + '</td>' +
      '<td><span class="badge b-blue">' + c.category + '</span></td>' +
      '<td><span class="badge ' + c.pb + '">' + c.priority + '</span></td>' +
      '<td><span class="badge ' + c.sb + '">' + c.status + '</span></td>' +
      '<td>' + resolveBtn + '</td>' +
      '</tr>';
  }).join('');
  recentBox.innerHTML = '<table class="tbl"><thead><tr><th>ID</th><th>Description</th><th>Category</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
}

/* ════════════════════════════════════════════════════════
   RENDER — Complaints Table (with Resolve button per row)
════════════════════════════════════════════════════════ */
function renderComplaints() {
  const tbody = document.getElementById('complaints-tbody');
  if (!tbody) return;

  const sub = document.querySelector('#screen-complaints .page-sub');
  if (sub) sub.textContent = complaints.length + ' total record' + (complaints.length !== 1 ? 's' : '');

  if (complaints.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text3);font-size:12px;">No complaints filed yet.</td></tr>';
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const resolveBtn = c.status !== 'Resolved'
      ? '<button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;white-space:nowrap;" onclick="resolveComplaint(\'' + c.id + '\')">✓ Resolve</button>'
      : '<span style="font-size:11px;color:var(--green);font-weight:600;">✓ Resolved</span>';
    return '<tr>' +
      '<td class="mono">' + c.id + '</td>' +
      '<td style="font-size:10px;color:var(--text3)">' + c.date + '</td>' +
      '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + c.description + '</td>' +
      '<td><span class="badge b-blue">' + c.category + '</span></td>' +
      '<td><span class="badge ' + c.pb + '" style="font-family:var(--mono)">' + c.score + ' – ' + c.priority + '</span></td>' +
      '<td style="font-size:11px">' + c.officer + '</td>' +
      '<td><span class="badge ' + c.sb + '">' + c.status + '</span></td>' +
      '<td>' + resolveBtn + '</td>' +
      '<td><button class="btn btn-ghost btn-sm" onclick="viewComplaint(\'' + c.id + '\')">View →</button></td>' +
      '</tr>';
  }).join('');
}

/* ════════════════════════════════════════════════════════
   RENDER — Complaint Detail (static)
════════════════════════════════════════════════════════ */
function renderNlpBars() {
  const data = [['Noise Disturbance',94],['Public Order Concern',72],['Domestic Concern',38],['Property Dispute',12]];
  const el = document.getElementById('nlp-conf-bars');
  if (el) el.innerHTML = data.map(row =>
    '<div class="conf-bar"><span class="conf-label">' + row[0] + '</span>' +
    '<div class="conf-track"><div class="conf-fill" style="width:' + row[1] + '%"></div></div>' +
    '<span class="conf-pct">' + row[1] + '%</span></div>'
  ).join('');
}

function renderCaseNotes() {
  const el = document.getElementById('case-notes');
  if (el) el.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">No notes yet</div><div class="empty-desc">Add a note to begin tracking case progress.</div></div>';
}

function renderAhpCriteria() {
  const data = [['Severity','—','35%'],['Urgency','—','30%'],['Frequency','—','20%'],['Affected','—','15%']];
  const el = document.getElementById('ahp-criteria');
  if (el) el.innerHTML = data.map(row =>
    '<div style="display:flex;justify-content:space-between;font-size:11px;padding:5px 0;border-bottom:1px solid var(--border);">' +
    '<span style="color:var(--text3)">' + row[0] + '</span>' +
    '<span style="color:var(--text);font-weight:500">' + row[1] + '</span>' +
    '<span style="color:var(--text3);font-family:var(--mono)">w=' + row[2] + '</span></div>'
  ).join('');
}

/* ════════════════════════════════════════════════════════
   RENDER — Priority Queue (with Resolve button per row)
════════════════════════════════════════════════════════ */
function renderPriorityQueue() {
  const tbody = document.getElementById('priority-tbody');
  if (!tbody) return;

  if (complaints.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--text3);font-size:12px;">No complaints in queue.</td></tr>';
    return;
  }

  const sorted = [...complaints].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
  tbody.innerHTML = sorted.map((c, i) => {
    const scoreColor = parseFloat(c.score) >= 90 ? 'var(--red)' : parseFloat(c.score) >= 75 ? 'var(--amber)' : 'var(--blue)';
    const resolveBtn = c.status !== 'Resolved'
      ? '<button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;white-space:nowrap;" onclick="resolveComplaint(\'' + c.id + '\')">✓ Resolve</button>'
      : '<span style="font-size:11px;color:var(--green);font-weight:600;">✓ Done</span>';
    return '<tr>' +
      '<td style="font-weight:700;font-family:var(--mono);color:var(--text3)">#' + (i+1) + '</td>' +
      '<td class="mono">' + c.id + '</td>' +
      '<td><span class="badge b-blue">' + c.category + '</span></td>' +
      '<td style="font-family:var(--mono);font-weight:700;color:' + scoreColor + '">' + c.score + '</td>' +
      '<td><span class="badge ' + c.pb + '">' + c.priority + '</span></td>' +
      '<td style="font-size:11px;color:var(--text2)">—</td>' +
      '<td style="font-size:11px;color:var(--text2)">—</td>' +
      '<td style="font-family:var(--mono);text-align:center">' + c.affected + '</td>' +
      '<td style="font-size:11px">' + c.officer + '</td>' +
      '<td><span class="badge ' + c.sb + '">' + c.status + '</span></td>' +
      '<td>' + resolveBtn + '</td>' +
      '</tr>';
  }).join('');
}

function renderAhpWeights() {
  const data = [['Severity','0.35'],['Urgency','0.30'],['Frequency','0.20'],['No. of Affected','0.15']];
  const container = document.getElementById('ahp-weights');
  if (!container) return;
  container.innerHTML = data.map(row =>
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
    '<span style="font-size:12px;color:var(--text2);width:140px">' + row[0] + '</span>' +
    '<div class="progress" style="flex:1"><div class="progress-fill" style="width:' + (parseFloat(row[1])*100) + '%"></div></div>' +
    '<span style="font-size:11px;font-family:var(--mono);color:var(--blue);font-weight:600;min-width:30px">w=' + row[1] + '</span></div>'
  ).join('') +
  '<div style="font-size:11px;color:var(--text3);margin-top:8px;">Criteria values determined through: keyword extraction from complaint text · cross-reference of historical records · category-based default weights</div>';
}

/* ════════════════════════════════════════════════════════
   RENDER — Case Kanban (LIVE — connected to complaints data)
════════════════════════════════════════════════════════ */
function renderKanban() {
  const el = document.getElementById('kanban-board');
  if (!el) return;

  const COLS = [
    { status: 'Open',        label: 'Open',        color: '#8A9BB0', badge: 'b-gray'  },
    { status: 'In Progress', label: 'In Progress',  color: '#1E5FA8', badge: 'b-blue'  },
    { status: 'For Hearing', label: 'For Hearing',  color: '#B06000', badge: 'b-amber' },
    { status: 'Resolved',    label: 'Resolved',     color: '#1B7A4A', badge: 'b-green' },
  ];

  el.innerHTML = COLS.map(col => {
    const cards = complaints.filter(c => c.status === col.status);

    let cardHTML;
    if (cards.length === 0) {
      cardHTML = '<div style="text-align:center;padding:22px 12px;color:var(--text3);font-size:11px;background:var(--bg);border-radius:var(--r);border:1px dashed var(--border);">No cases</div>';
    } else {
      cardHTML = cards.map(c => {
        const shortDesc = c.description.length > 60 ? c.description.slice(0, 60) + '…' : c.description;
        const curIdx    = STATUS_FLOW.indexOf(col.status);
        const nextLabel = curIdx < STATUS_FLOW.length - 2 ? STATUS_FLOW[curIdx + 1] : null;

        let actions = '';
        if (col.status !== 'Resolved') {
          actions += '<button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;font-size:10px;padding:3px 8px;" onclick="resolveComplaint(\'' + c.id + '\')">✓ Resolve</button>';
          if (nextLabel && nextLabel !== 'Resolved') {
            actions += '<button class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px;" onclick="advanceStatus(\'' + c.id + '\')">→ ' + nextLabel + '</button>';
          }
          actions = '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' + actions + '</div>';
        } else {
          actions = '<div style="margin-top:6px;font-size:10px;color:var(--green);">✓ Resolved' + (c.resolvedAt ? ' · ' + c.resolvedAt : '') + '</div>';
        }

        return '<div class="kanban-card" style="border-left:3px solid ' + col.color + ';">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span class="kanban-id">' + c.id + '</span>' +
          '<span class="badge ' + c.pb + '" style="font-size:9px;">' + c.priority + '</span>' +
          '</div>' +
          '<div class="kanban-desc">' + shortDesc + '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span class="badge b-blue" style="font-size:9px;">' + c.category + '</span>' +
          '<span style="font-size:9px;color:var(--text3);margin-left:auto;">' + c.date + '</span>' +
          '</div>' +
          actions +
          '</div>';
      }).join('');
    }

    return '<div class="kanban-col">' +
      '<div class="kanban-col-header">' +
      '<div class="kanban-col-dot" style="background:' + col.color + '"></div>' +
      '<span class="kanban-col-title">' + col.label + '</span>' +
      '<span class="badge ' + col.badge + ' kanban-col-count">' + cards.length + '</span>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:0;">' + cardHTML + '</div>' +
      '</div>';
  }).join('');
}

/* ════════════════════════════════════════════════════════
   RENDER — AI Results
════════════════════════════════════════════════════════ */
function renderModelComparison() {
  const rows = [['Accuracy','74.2%','89.1%','93.2%'],['Precision','72.8%','88.4%','92.6%'],['Recall','71.5%','87.9%','91.8%'],['F1-Score','72.1%','88.1%','92.2%'],['Predict Time','0.01s','0.08s','0.42s']];
  const el = document.getElementById('model-comparison-tbody');
  if (el) el.innerHTML = rows.map(r =>
    '<tr><td style="font-weight:500;font-size:12px">' + r[0] + '</td>' +
    '<td style="font-family:var(--mono);color:var(--text3)">' + r[1] + '</td>' +
    '<td style="font-family:var(--mono)">' + r[2] + '</td>' +
    '<td style="font-family:var(--mono);font-weight:700;color:var(--blue);background:var(--sky-light)">' + r[3] + '</td></tr>'
  ).join('');
}

function renderF1Table() {
  const rows = [['Noise Disturbance','0.95','0.94','0.94'],['Theft/Robbery','0.91','0.89','0.90'],['Property Dispute','0.88','0.90','0.89'],['Domestic Concern','0.93','0.91','0.92'],['Environmental','0.86','0.84','0.85']];
  const el = document.getElementById('f1-tbody');
  if (el) el.innerHTML = rows.map(r =>
    '<tr><td style="font-size:12px">' + r[0] + '</td>' +
    '<td style="font-family:var(--mono);color:var(--green)">' + r[1] + '</td>' +
    '<td style="font-family:var(--mono);color:var(--green)">' + r[2] + '</td>' +
    '<td style="font-family:var(--mono);font-weight:700;color:var(--blue)">' + r[3] + '</td></tr>'
  ).join('');
}

function renderNlpPipeline() {
  const steps = ['Raw free-text complaint','Tokenization','Stop-word removal (Filipino/English)','TF-IDF Feature Extraction','Model Classification (NB/SVM/BiLSTM)','Predicted Category + Confidence'];
  const el = document.getElementById('nlp-pipeline');
  if (el) el.innerHTML = steps.map((s, i) =>
    '<div style="display:flex;align-items:center;gap:8px;">' +
    (i > 0 ? '<span style="color:var(--text3);font-size:12px">→</span>' : '') +
    '<div style="background:var(--sky-light);border:1px solid #B5D0EE;border-radius:var(--r);padding:7px 10px;font-size:11px;color:var(--blue);font-weight:500;">' + s + '</div></div>'
  ).join('');
}

/* ════════════════════════════════════════════════════════
   RENDER — Reports
════════════════════════════════════════════════════════ */
function renderReports() {
  const items = [
    ['📊','Classification Accuracy Report','Model performance metrics per category'],
    ['📈','Complaint Volume Report','Complaints filed over time by category'],
    ['⏱️','Response Time Report','Avg handling and resolution times'],
    ['📋','Case Outcome Report','Breakdown of resolutions and escalations'],
  ];
  const el = document.getElementById('report-list');
  if (el) el.innerHTML = items.map(row =>
    '<div class="card" style="margin-bottom:10px;"><div class="card-body" style="display:flex;align-items:center;gap:14px;padding:14px 16px;">' +
    '<div style="width:38px;height:38px;border-radius:var(--r);background:var(--sky-light);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + row[0] + '</div>' +
    '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--text)">' + row[1] + '</div><div style="font-size:11px;color:var(--text3);margin-top:2px">' + row[2] + '</div></div>' +
    '<button class="btn btn-ghost btn-sm">View</button><button class="btn btn-secondary btn-sm">Export</button>' +
    '</div></div>'
  ).join('');
}

function renderWeeklyBars() {
  const data = [0,0,0,0,0,0,0,0];
  const el = document.getElementById('weekly-bars');
  if (el) el.innerHTML = data.map((h,i) =>
    '<div class="bar-wrap"><div class="bar-val">' + h + '</div>' +
    '<div class="bar" style="height:4px"></div>' +
    '<div class="bar-lbl">W' + (i+1) + '</div></div>'
  ).join('');
}

function renderIsoEval() {
  const data = [['Usability','—','Pending'],['Functional Suitability','—','Pending'],['Reliability','—','Pending']];
  const el = document.getElementById('iso-eval');
  if (el) el.innerHTML = data.map(r =>
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);">' +
    '<span style="font-size:12px;font-weight:500;color:var(--text)">' + r[0] + '</span>' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<span style="font-size:12px;font-family:var(--mono);color:var(--blue);font-weight:700">' + r[1] + '</span>' +
    '<span class="badge b-gray">' + r[2] + '</span></div></div>'
  ).join('');
}

/* ════════════════════════════════════════════════════════
   RENDER — Users
════════════════════════════════════════════════════════ */
function renderUsers() {
  const el = document.getElementById('users-tbody');
  if (el) el.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text3);font-size:12px;">No users added yet.</td></tr>';
}

/* ════════════════════════════════════════════════════════
   RENDER — Notifications
════════════════════════════════════════════════════════ */
function renderNotifs() {
  const el = document.getElementById('notifs-list');
  if (!el) return;
  if (notifStore.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">No notifications</div><div class="empty-desc">You\'re all caught up.</div></div>';
    return;
  }
  el.innerHTML = notifStore.map(n =>
    '<div class="notif-item">' +
    '<div class="notif-ico">' + (n.type === 'success' ? '✅' : '📋') + '</div>' +
    '<div style="flex:1;">' +
    '<div class="notif-txt">' + n.msg + '</div>' +
    '<div class="notif-time">' + n.time + '</div>' +
    '</div><div class="notif-dot2"></div></div>'
  ).join('');
}

/* ════════════════════════════════════════════════════════
   RENDER — Settings
════════════════════════════════════════════════════════ */
function renderSettings() {
  const fields = [
    ['System Name','BICTS – Barangay Intelligent Case Tracking System'],
    ['Barangay Name',''],
    ['Municipality',''],
    ['Admin Email',''],
  ];
  const fEl = document.getElementById('settings-fields');
  if (fEl) fEl.innerHTML = fields.map(row =>
    '<div class="field" style="margin-bottom:12px;"><div class="label">' + row[0] + '</div>' +
    '<input class="inp filled" value="' + row[1] + '" placeholder="' + (row[1] ? '' : 'Not set') + '"></div>'
  ).join('');

  const toggles = [
    ['Auto-classify complaints on submission','Use BiLSTM to automatically classify when submitted',true],
    ['Allow anonymous complaint filing','Residents can submit without personal information',true],
    ['Confidence threshold flag','Flag complaints below 70% confidence for manual review',true],
    ['Human-in-the-loop validation','Officers must validate AI classification before finalizing',false],
  ];
  const tEl = document.getElementById('settings-toggles');
  if (tEl) tEl.innerHTML = toggles.map(row =>
    '<div class="setting-row"><div class="setting-info">' +
    '<div class="setting-name">' + row[0] + '</div>' +
    '<div class="setting-desc">' + row[1] + '</div>' +
    '</div><div class="toggle ' + (row[2] ? 'on' : 'off') + '"></div></div>'
  ).join('');
}

/* ════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderAccuracyBars();
  renderCriticalCases();
  renderComplaints();
  renderNlpBars();
  renderCaseNotes();
  renderAhpCriteria();
  renderPriorityQueue();
  renderAhpWeights();
  renderKanban();
  renderModelComparison();
  renderF1Table();
  renderNlpPipeline();
  renderReports();
  renderWeeklyBars();
  renderIsoEval();
  renderUsers();
  renderNotifs();
  renderSettings();

  initModalBackdropClose();
  initChips();
  initTabs();
  initToggles();
});