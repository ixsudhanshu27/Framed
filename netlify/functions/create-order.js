const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  connectLambda(event); // lets Netlify Blobs work inside this function
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { customerName, email, frameStyle, frameSize, notes, photoBase64 } = data;

    if (!customerName || !email || !photoBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const store = getStore('orders');
    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();

    const order = {
      id: orderId,
      customerName,
      email: email.toLowerCase(),
      frameStyle: frameStyle || 'classic-wood',
      frameSize: frameSize || '8x10',
      notes: notes || '',
      // MVP: photo stored inline as base64. Swap for a real object store
      // (S3, Cloudinary, Netlify Large Media) once volume grows.
      photoBase64,
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    await store.setJSON(orderId, order);

    // Per-customer index, so the dashboard can look up "my orders" by email.
    const customerIndexKey = `index:${order.email}`;
    const customerIds = (await store.get(customerIndexKey, { type: 'json' })) || [];
    customerIds.push(orderId);
    await store.setJSON(customerIndexKey, customerIds);

    // Global index, so the admin dashboard can list everything.
    const allIds = (await store.get('index:all', { type: 'json' })) || [];
    allIds.push(orderId);
    await store.setJSON('index:all', allIds);

    return { statusCode: 200, body: JSON.stringify({ success: true, orderId }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
