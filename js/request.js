const API = 'http://localhost:5000/api';
let selectedUrgency = 'normal';

// Urgency selector
function selectUrgency(level) {
  selectedUrgency = level;
  document.querySelectorAll('.urgency-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.getElementById('urgency-' + level).classList.add('selected');
}

// Submit the request
async function submitRequest() {
  const patientName  = document.getElementById('patientName').value.trim();
  const bloodGroup   = document.getElementById('bloodGroup').value;
  const city         = document.getElementById('city').value.trim();
  const hospital     = document.getElementById('hospital').value.trim();
  const contactPhone = document.getElementById('contactPhone').value.trim();
  const unitsNeeded  = document.getElementById('unitsNeeded').value;

  // Basic validation
  if (!patientName || !bloodGroup || !city || !hospital || !contactPhone) {
    alert('Please fill in all required fields.');
    return;
  }

  if (contactPhone.length < 10) {
    alert('Please enter a valid phone number.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Posting request...';

  try {
    const res = await fetch(`${API}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName,
        bloodGroup,
        city,
        hospital,
        contactPhone,
        urgency: selectedUrgency,
        unitsNeeded: parseInt(unitsNeeded),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    // Show success
    document.getElementById('formCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'block';
    document.getElementById('requestIdDisplay').textContent = data.requestId;

    // Save request ID to localStorage so track page can use it
    localStorage.setItem('lastRequestId', data.requestId);

  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Post Emergency Request';
  }
}

// Track button
function goToTrack() {
  window.location.href = 'track.html';
}

// Set normal urgency selected by default on load
window.addEventListener('DOMContentLoaded', () => {
  selectUrgency('normal');
});