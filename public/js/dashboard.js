const emailInput = document.getElementById('email');
const lookupBtn = document.getElementById('lookup-btn');
const results = document.getElementById('results');

const STATUS_LABEL = {
  received: 'Received',
  enhancing: 'AI enhancing',
  printing: 'Printing & framing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function loadOrders() {
  const email = emailInput.value.trim();
  if (!email) return;

  results.innerHTML = '<p>Loading…</p>';

  try {
    const res = await fetch(`/.netlify/functions/get-orders?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Could not load orders');

    if (!data.orders.length) {
      results.innerHTML = '<div class="msg msg-error">No orders found for that email.</div>';
      return;
    }

    results.innerHTML = data.orders.map((o) => `
      <div class="card order-card">
        <img class="thumb" src="${esc(o.photoBase64)}" alt="Order photo">
        <div class="order-meta">
          <h3>${esc(o.frameStyle.replace(/-/g, ' '))} · ${esc(o.frameSize)}</h3>
          <p>Order ${esc(o.id)} · placed ${new Date(o.createdAt).toLocaleDateString()}</p>
          ${o.trackingNumber ? `<p>Tracking: <strong style="color:var(--white)">${esc(o.trackingNumber)}</strong></p>` : ''}
          ${o.adminNote ? `<p style="margin-top:6px;color:var(--lime)">“${esc(o.adminNote)}”</p>` : ''}
        </div>
        <span class="status-pill status-${esc(o.status)}">${esc(STATUS_LABEL[o.status] || o.status)}</span>
      </div>
    `).join('');
  } catch (err) {
    results.innerHTML = `<div class="msg msg-error">${esc(err.message)}</div>`;
  }
}

lookupBtn.addEventListener('click', loadOrders);
emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadOrders(); });
