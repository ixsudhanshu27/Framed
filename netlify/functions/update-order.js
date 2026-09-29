const { getStore, connectLambda } = require('@netlify/blobs');

const VALID_STATUSES = ['received', 'enhancing', 'printing', 'shipped', 'delivered'];

// Admin only. Send any of: status, trackingNumber, adminNote.
exports.handler = async (event) => {
  connectLambda(event);
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const password = event.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { orderId, status, trackingNumber, adminNote } = JSON.parse(event.body);

    const store = getStore('orders');
    const order = await store.get(orderId, { type: 'json' });
    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid status' }) };
      }
      order.status = status;
    }
    if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber).slice(0, 100);
    if (adminNote !== undefined) order.adminNote = String(adminNote).slice(0, 500);

    order.updatedAt = new Date().toISOString();
    await store.setJSON(orderId, order);

    return { statusCode: 200, body: JSON.stringify({ success: true, order }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
