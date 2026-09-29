const { getStore, connectLambda } = require('@netlify/blobs');

// Admin only. Permanently removes an order and its index entries.
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
    const { orderId } = JSON.parse(event.body);
    const store = getStore('orders');
    const order = await store.get(orderId, { type: 'json' });
    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    await store.delete(orderId);

    for (const key of ['index:all', `index:${order.email}`]) {
      const ids = (await store.get(key, { type: 'json' })) || [];
      await store.setJSON(key, ids.filter((id) => id !== orderId));
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
