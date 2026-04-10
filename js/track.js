const API = 'https://bloodbridge-backend-7qtv.onrender.com/api';
let refreshInterval = null;

// On page load — check if we have a saved request ID
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lastRequestId');
  if (saved) {
    document.getElementById('requestIdInput').value = saved;
    trackRequest();
  }
});

async function trackRequest() {
  const id = document.getElementById('requestIdInput').value.trim();

  if (!id) {
    alert('Please enter a Request ID.');
    return;
  }

  showState('loading');

  try {
    const res = await fetch(`${API}/requests/${id}`);

    if (res.status === 404) {
      showState('notfound');
      return;
    }

    if (!res.ok) throw new Error('Server error');

    const request = await res.json();
    renderResult(request);
    startAutoRefresh(id);

  } catch (err) {
    showState('error');
  }
}

function renderResult(r) {
  document.getElementById('stateMsg').style.display   = 'none';
  document.getElementById('resultCard').style.display = 'block';

  // Status badge
  const statusLabels = {
    open:      'Open — awaiting response',
    accepted:  'Accepted',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
  };
  const badge = document.getElementById('statusBadge');
  badge.textContent = statusLabels[r.status] || r.status;
  badge.className = `status-badge ${r.status}`;

  // Posted time
  const posted = new Date(r.createdAt);
  document.getElementById('postedTime').textContent =
    'Posted: ' + posted.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  // Details
  document.getElementById('detailPatient').textContent   = r.patientName;
  document.getElementById('detailBlood').textContent     = r.bloodGroup;
  document.getElementById('detailCity').textContent      = capitalize(r.city);
  document.getElementById('detailHospital').textContent  = r.hospital;
  document.getElementById('detailUnits').textContent     = r.unitsNeeded + ' unit(s)';
  document.getElementById('detailContact').textContent   = r.contactPhone;

  const urgencyEl = document.getElementById('detailUrgency');
  urgencyEl.textContent = r.urgency === 'critical' ? '🚨 Critical' : 'Normal';
  urgencyEl.className   = 'detail-value urgency-' + r.urgency;

  // Accepted by box
  const acceptedBox = document.getElementById('acceptedBox');
  if (r.acceptedBy && (r.status === 'accepted' || r.status === 'fulfilled')) {
    acceptedBox.style.display       = 'block';
    document.getElementById('acceptedName').textContent    = r.acceptedBy.name;
    document.getElementById('acceptedType').textContent    = r.acceptedBy.type === 'bloodbank' ? 'Blood Bank' : 'Hospital';
    document.getElementById('acceptedCity').textContent    = capitalize(r.acceptedBy.city);
    document.getElementById('acceptedPhone').textContent   = r.acceptedBy.phone;
    document.getElementById('acceptedPhone').href          = 'tel:' + r.acceptedBy.phone;
  } else {
    acceptedBox.style.display = 'none';
  }

  // Progress steps
  updateProgress(r.status);
}

function updateProgress(status) {
  const steps = ['open', 'accepted', 'fulfilled'];
  const idx   = steps.indexOf(status);

  steps.forEach((s, i) => {
    const dot  = document.getElementById('step-' + s);
    const line = document.getElementById('line-' + i);

    if (i < idx) {
      dot.className  = 'step-dot done';
      dot.textContent = '✓';
      if (line) line.className = 'step-line done';
    } else if (i === idx) {
      dot.className  = 'step-dot active';
      dot.textContent = (i + 1).toString();
      if (line) line.className = 'step-line';
    } else {
      dot.className  = 'step-dot';
      dot.textContent = (i + 1).toString();
      if (line) line.className = 'step-line';
    }
  });
}

function startAutoRefresh(id) {
  // Clear any existing interval
  if (refreshInterval) clearInterval(refreshInterval);

  // Refresh every 10 seconds automatically
  refreshInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/requests/${id}`);
      if (res.ok) {
        const r = await res.json();
        renderResult(r);
        // Stop polling if request is done
        if (r.status === 'fulfilled' || r.status === 'cancelled') {
          clearInterval(refreshInterval);
          document.getElementById('refreshBadge').style.display = 'none';
        }
      }
    } catch (e) { /* silent fail on auto refresh */ }
  }, 10000);

  document.getElementById('refreshBadge').style.display = 'inline-flex';
}

function showState(type) {
  const el = document.getElementById('stateMsg');
  document.getElementById('resultCard').style.display = 'none';
  el.style.display = 'block';

  const states = {
    loading:  '<span>⏳</span>Looking up your request...',
    notfound: '<span>🔍</span>No request found with this ID.<br>Please check the ID and try again.',
    error:    '<span>⚠️</span>Could not connect to server.<br>Make sure the backend is running.',
  };
  el.innerHTML = states[type] || '';
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// Allow Enter key to trigger tracking
document.getElementById('requestIdInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') trackRequest();
});