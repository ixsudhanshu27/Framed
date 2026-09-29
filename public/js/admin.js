const $ = (id) => document.getElementById(id);
const STATUSES = ['received', 'enhancing', 'printing', 'shipped', 'delivered'];

// Kept in sessionStorage so a page refresh doesn't log you out; it clears when the tab closes.
let adminPassword = sessionStorage.getItem('adminPw') || '';
let allOrders = [];

// Customer-supplied text is escaped before going into HTML, so nobody can inject scripts into your dashboard.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pretty = (s) => String(s || '').replace(/-/g, ' ');

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- Login ---------- */
async function login() {
  $('login-msg').innerHTML = '';
  const password = $('password').value;
  try {
    const res = await fetch('/.netlify/functions/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      $('login-msg').innerHTML = `<div class="msg msg-error">${esc(data.error || 'Incorrect password.')}</div>`;
      return;
    }
    adminPassword = password;
    sessionStorage.setItem('adminPw', password);
    showAdmin();
  } catch (err) {
    $('login-msg').innerHTML = '<div class="msg msg-error">Could not reach the server. Is "netlify dev" running?</div>';
  }
}

function logout() {
  sessionStorage.removeItem('adminPw');
  adminPassword = '';
  $('admin-view').style.display = 'none';
  $('login-view').style.display = 'block';
  $('password').value = '';
}

function showAdmin() {
  $('login-view').style.display = 'none';
  $('admin-view').style.display = 'block';
  loadOrders();
}

/* ---------- Orders list ---------- */
async function loadOrders() {
  $('orders-body').innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
  try {
    const data = await api('/.netlify/functions/get-orders?admin=true');
    allOrders = data.orders;
    renderStats();
    renderTable();
  } catch (err) {
    if (err.status === 401) return logout();
    $('orders-body').innerHTML = `<tr><td colspan="6">${esc(err.message)}</td></tr>`;
  }
}

function renderStats() {
  const count = (s) => allOrders.filter((o) => o.status === s).length;
  $('stats').innerHTML =
    `<div class="stat"><strong>${allOrders.length}</strong><span>Total orders</span></div>` +
    STATUSES.map((s) => `<div class="stat"><strong>${count(s)}</strong><span>${s}</span></div>`).join('');

  const current = $('status-filter').value || 'all';
  $('status-filter').innerHTML =
    '<option value="all">All statuses</option>' +
    STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('');
  $('status-filter').value = current;
}

function filteredOrders() {
  const q = $('search').value.trim().toLowerCase();
  const st = $('status-filter').value;
  return allOrders.filter((o) => {
    if (st !== 'all' && o.status !== st) return false;
    if (!q) return true;
    return [o.id, o.customerName, o.email].some((v) => String(v).toLowerCase().includes(q));
  });
}

function renderTable() {
  const rows = filteredOrders();
  if (!rows.length) {
    $('orders-body').innerHTML = `<tr><td colspan="6">${allOrders.length ? 'No orders match.' : 'No orders yet.'}</td></tr>`;
    return;
  }
  $('orders-body').innerHTML = rows.map((o) => `
    <tr class="row" data-id="${esc(o.id)}">
      <td><img class="thumb" src="${esc(o.photoBase64)}" alt=""></td>
      <td>${esc(o.id)}</td>
      <td>${esc(o.customerName)}<br><span style="color:var(--muted);font-size:13px">${esc(o.email)}</span></td>
      <td>${esc(pretty(o.frameStyle))} · ${esc(o.frameSize)}</td>
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td><span class="status-pill status-${esc(o.status)}">${esc(o.status)}</span></td>
    </tr>`).join('');
  document.querySelectorAll('tr.row').forEach((tr) => tr.addEventListener('click', () => openModal(tr.dataset.id)));
}

/* ---------- Order detail (view + edit + delete) ---------- */
function openModal(id) {
  const o = allOrders.find((x) => x.id === id);
  if (!o) return;
  $('modal').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><div class="kicker" style="margin-bottom:4px">Order</div><h3>${esc(o.id)}</h3></div>
      <button class="btn btn-ghost btn-sm" id="close-modal">Close</button>
    </div>
    <div class="modal-grid">
      <div>
        <img class="big" src="${esc(o.photoBase64)}" alt="Customer photo">
        <div class="modal-actions">
          <a class="btn btn-ghost btn-sm" href="${esc(o.photoBase64)}" download="${esc(o.id)}.jpg">Download photo</a>
        </div>
      </div>
      <div>
        <dl class="kv">
          <dt>Customer</dt><dd>${esc(o.customerName)}</dd>
          <dt>Email</dt><dd><a href="mailto:${esc(o.email)}" style="color:var(--lime)">${esc(o.email)}</a></dd>
          <dt>Frame</dt><dd>${esc(pretty(o.frameStyle))}</dd>
          <dt>Size</dt><dd>${esc(o.frameSize)}</dd>
          <dt>Placed</dt><dd>${new Date(o.createdAt).toLocaleString()}</dd>
          <dt>Customer note</dt><dd>${esc(o.notes) || '<span style="color:var(--muted)">—</span>'}</dd>
        </dl>

        <label for="m-status">Status</label>
        <select id="m-status">${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>

        <label for="m-tracking">Tracking number (customer can see this)</label>
        <input type="text" id="m-tracking" value="${esc(o.trackingNumber || '')}" placeholder="e.g. courier tracking ID">

        <label for="m-note">Message to customer (optional)</label>
        <textarea id="m-note" placeholder="e.g. Your photo has been restored, printing tomorrow.">${esc(o.adminNote || '')}</textarea>

        <div class="modal-actions">
          <button class="btn btn-primary btn-sm" id="save-order">Save changes</button>
          <button class="btn btn-danger btn-sm" id="delete-order">Delete order</button>
        </div>
        <div id="modal-msg"></div>
      </div>
    </div>`;
  $('modal-bg').classList.add('open');

  $('close-modal').onclick = closeModal;
  $('save-order').onclick = () => saveOrder(o.id);
  $('delete-order').onclick = () => deleteOrder(o.id);
}

function closeModal() { $('modal-bg').classList.remove('open'); }

async function saveOrder(id) {
  const btn = $('save-order');
  btn.disabled = true;
  try {
    const data = await api('/.netlify/functions/update-order', {
      method: 'POST',
      body: JSON.stringify({
        orderId: id,
        status: $('m-status').value,
        trackingNumber: $('m-tracking').value,
        adminNote: $('m-note').value,
      }),
    });
    const i = allOrders.findIndex((x) => x.id === id);
    allOrders[i] = data.order;
    renderStats();
    renderTable();
    $('modal-msg').innerHTML = '<div class="msg msg-success">Saved.</div>';
  } catch (err) {
    $('modal-msg').innerHTML = `<div class="msg msg-error">${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false;
  }
}

async function deleteOrder(id) {
  if (!confirm(`Permanently delete ${id}? This cannot be undone.`)) return;
  try {
    await api('/.netlify/functions/delete-order', { method: 'POST', body: JSON.stringify({ orderId: id }) });
    allOrders = allOrders.filter((x) => x.id !== id);
    closeModal();
    renderStats();
    renderTable();
  } catch (err) {
    $('modal-msg').innerHTML = `<div class="msg msg-error">${esc(err.message)}</div>`;
  }
}

/* ---------- Wire up ---------- */
$('login-btn').addEventListener('click', login);
$('password').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
$('logout-btn').addEventListener('click', logout);
$('refresh-btn').addEventListener('click', loadOrders);
$('search').addEventListener('input', renderTable);
$('status-filter').addEventListener('change', renderTable);
$('modal-bg').addEventListener('click', (e) => { if (e.target === $('modal-bg')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

if (adminPassword) showAdmin();
