const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  connectLambda(event); // lets Netlify Blobs work inside this function
  const store = getStore('orders');
  const { email, admin } = event.queryStringParameters || {};

  try {
    if (admin === 'true') {
      const password = event.headers['x-admin-password'];
      if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
      const allIds = (await store.get('index:all', { type: 'json' })) || [];
      const orders = await Promise.all(allIds.map((id) => store.get(id, { type: 'json' })));
      return { statusCode: 200, body: JSON.stringify({ orders: orders.filter(Boolean).reverse() }) };
    }

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) };
    }

    const ids = (await store.get(`index:${email.toLowerCase()}`, { type: 'json' })) || [];
    const orders = await Promise.all(ids.map((id) => store.get(id, { type: 'json' })));
    return { statusCode: 200, body: JSON.stringify({ orders: orders.filter(Boolean).reverse() }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
