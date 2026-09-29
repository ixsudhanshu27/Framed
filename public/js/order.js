const photoInput = document.getElementById('photo');
const preview = document.getElementById('preview');
const form = document.getElementById('order-form');
const submitBtn = document.getElementById('submit-btn');
const formMsg = document.getElementById('form-msg');

let photoBase64 = null;

// Shrinks the photo in the browser before upload (max 1600px, JPEG).
// Big phone photos are several MB; Netlify functions reject requests over ~6MB,
// which shows up as "Failed to fetch". After this a photo is usually 200-600KB.
function compressImage(file, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Could not read this image. Try a JPG or PNG.'));
    img.src = url;
  });
}

photoInput.addEventListener('change', async () => {
  const file = photoInput.files[0];
  if (!file) return;
  formMsg.innerHTML = '';

  if (file.size > 25 * 1024 * 1024) {
    formMsg.innerHTML = '<div class="msg msg-error">Please choose an image under 25MB.</div>';
    photoInput.value = '';
    return;
  }

  try {
    photoBase64 = await compressImage(file);
    preview.innerHTML = `<img src="${photoBase64}" alt="Selected photo">`;
  } catch (err) {
    photoBase64 = null;
    formMsg.innerHTML = `<div class="msg msg-error">${err.message}</div>`;
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMsg.innerHTML = '';

  if (!photoBase64) {
    formMsg.innerHTML = '<div class="msg msg-error">Please choose a photo first.</div>';
    return;
  }

  const payload = {
    customerName: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    frameStyle: document.getElementById('frameStyle').value,
    frameSize: document.getElementById('frameSize').value,
    notes: document.getElementById('notes').value.trim(),
    photoBase64,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    let res;
    try {
      res = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (netErr) {
      throw new Error('Could not reach the server. Make sure "netlify dev" is still running and you opened the site at localhost:8888.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);

    formMsg.innerHTML = `<div class="msg msg-success">Order placed! Your order ID is <strong>${data.orderId}</strong>. Track it anytime on the dashboard using your email.</div>`;
    form.reset();
    preview.innerHTML = 'No photo selected yet';
    photoBase64 = null;
  } catch (err) {
    formMsg.innerHTML = `<div class="msg msg-error">${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit order';
  }
});
