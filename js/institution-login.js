const API = 'https://bloodbridge-backend-7qtv.onrender.com/api';

// If already logged in, go straight to dashboard
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('instToken');
  if (token) {
    window.location.href = 'institution-dashboard.html';
  }
});

async function loginInstitution() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Please enter your email and password.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled    = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch(`${API}/institutions/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed');

    // Save everything to localStorage
    localStorage.setItem('instToken', data.token);
    localStorage.setItem('instId',    data.institution.id);
    localStorage.setItem('instName',  data.institution.name);
    localStorage.setItem('instType',  data.institution.type);
    localStorage.setItem('instCity',  data.institution.city);

    // Go to dashboard
    window.location.href = 'institution-dashboard.html';

  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled    = false;
    btn.textContent = 'Login';
  }
}

// Allow Enter key
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') loginInstitution();
});