const API = 'https://bloodbridge-backend-7qtv.onrender.com/api';
let selectedType = 'bloodbank';

function selectType(type) {
  selectedType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('type-' + type).classList.add('selected');
}

async function registerInstitution() {
  const name     = document.getElementById('name').value.trim();
  const city     = document.getElementById('city').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirmPassword').value;

  if (!name || !city || !phone || !email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  if (password !== confirm) {
    alert('Passwords do not match.');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled    = true;
  btn.textContent = 'Registering...';

  try {
    const res = await fetch(`${API}/institutions/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: selectedType, city, phone, email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Registration failed');

    // Save token and institution info
    localStorage.setItem('instToken', data.token);
    localStorage.setItem('instId',    data.institution.id);
    localStorage.setItem('instName',  data.institution.name);
    localStorage.setItem('instType',  data.institution.type);
    localStorage.setItem('instCity',  data.institution.city);

    // Show success
    document.getElementById('formCard').style.display    = 'none';
    document.getElementById('successCard').style.display = 'block';

  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled    = false;
    btn.textContent = 'Register Institution';
  }
}

function goToDashboard() {
  window.location.href = 'institution-dashboard.html';
}

window.addEventListener('DOMContentLoaded', () => {
  selectType('bloodbank');
});