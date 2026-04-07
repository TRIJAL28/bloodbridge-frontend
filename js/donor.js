const API = 'http://localhost:5000/api';

async function registerDonor() {
  const name       = document.getElementById('name').value.trim();
  const phone      = document.getElementById('phone').value.trim();
  const bloodGroup = document.getElementById('bloodGroup').value;
  const city       = document.getElementById('city').value.trim();

  // Validation
  if (!name || !phone || !bloodGroup || !city) {
    alert('Please fill in all fields.');
    return;
  }

  if (phone.length < 10) {
    alert('Please enter a valid 10-digit phone number.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled    = true;
  btn.textContent = 'Registering...';

  try {
    const res = await fetch(`${API}/donors/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, bloodGroup, city }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Show success state
    document.getElementById('formCard').style.display    = 'none';
    document.getElementById('successCard').style.display = 'block';
    document.getElementById('donorIdDisplay').textContent = data.donor._id;

    // Save donor ID to localStorage
    localStorage.setItem('donorId', data.donor._id);
    localStorage.setItem('donorName', data.donor.name);

  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled    = false;
    btn.textContent = 'Register as Donor';
  }
}

// Allow Enter to submit
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') registerDonor();
});