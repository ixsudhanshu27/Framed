exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { password } = JSON.parse(event.body || '{}');

    if (!process.env.ADMIN_PASSWORD) {
      return { statusCode: 500, body: JSON.stringify({ error: 'ADMIN_PASSWORD not set on the server' }) };
    }

    if (password === process.env.ADMIN_PASSWORD) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }
    return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Incorrect password' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
