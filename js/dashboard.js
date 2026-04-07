const API = 'http://localhost:5000/api';

// ── Auth check ───────────────────────────────────────────────
const token  = localStorage.getItem('instToken');
const instId = localStorage.getItem('instId');

if (!token || !instId) {
  window.location.href = 'institution-login.html';
}

// ── Fill sidebar info ────────────────────────────────────────
const instName = localStorage.getItem('instName') || 'Institution';
const instCity = localStorage.getItem('instCity') || '';
const instType = localStorage.getItem('instType') || '';

document.getElementById('sidebarName').textContent = instName;
document.getElementById('sidebarType').textContent = instType;
document.getElementById('sidebarCity').textContent = capitalize(instCity);
document.getElementById('dashTitle').innerHTML = `Welcome, <strong style="color:var(--red-bright)">${instName}</strong>`;

// ── Tab switching ────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');

  if (name === 'requests')  loadRequests();
  if (name === 'analytics') loadAnalytics();
  if (name === 'overview')  loadOverview();
  if (name === 'inventory') loadInventory();
}

// ── Logout ───────────────────────────────────────────────────
function logout() {
  ['instToken','instId','instName','instType','instCity'].forEach(k => localStorage.removeItem(k));
  window.location.href = 'institution-login.html';
}

// ── Overview ─────────────────────────────────────────────────
async function loadOverview() {
  try {
    const instRes = await fetch(`${API}/institutions/${instId}`);
    const inst    = await instRes.json();
    const inv     = inst.inventory || {};
    const groups  = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

    const totalUnits = groups.reduce((sum, g) => sum + (Number(inv[g]) || 0), 0);
    document.getElementById('statTotalUnits').textContent = totalUnits;

    const inStock = groups.filter(g => (Number(inv[g]) || 0) > 0).length;
    document.getElementById('statInStock').textContent = inStock + '/8';

  } catch (err) {
    console.error('Overview error:', err);
    document.getElementById('statTotalUnits').textContent = '0';
    document.getElementById('statInStock').textContent    = '0/8';
  }

  try {
    const reqRes  = await fetch(`${API}/requests?city=${instCity}`);
    const reqData = await reqRes.json();
    document.getElementById('statOpenRequests').textContent = reqData.count || 0;
  } catch (err) {
    document.getElementById('statOpenRequests').textContent = '0';
  }
}

// ── Inventory ─────────────────────────────────────────────────
async function loadInventory() {
  try {
    const res  = await fetch(`${API}/institutions/${instId}`);
    const inst = await res.json();
    const inv  = inst.inventory || {};

    const groups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
    groups.forEach(g => {
      const key   = 'inv-' + g.replace('+','plus').replace('-','minus');
      const input = document.getElementById(key);
      if (input) input.value = Number(inv[g]) || 0;
    });

  } catch (err) {
    console.error('Inventory load error:', err);
  }
}

async function saveInventory() {
  const groups    = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  const inventory = {};

  groups.forEach(g => {
    const key   = 'inv-' + g.replace('+','plus').replace('-','minus');
    const input = document.getElementById(key);
    inventory[g] = parseInt(input?.value || 0);
  });

  try {
    const res = await fetch(`${API}/institutions/${instId}/inventory`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ inventory }),
    });

    if (res.ok) {
      showToast('✓ Inventory saved successfully!');
      loadOverview();
    } else {
      showToast('Failed to save inventory.');
    }

  } catch (err) {
    showToast('Connection error.');
  }
}

// ── Requests ──────────────────────────────────────────────────
async function loadRequests() {
  try {
    const res  = await fetch(`${API}/requests?city=${instCity}`);
    const data = await res.json();
    renderRequestsTable(data.requests || []);
  } catch (err) {
    console.error('Requests load error:', err);
    document.getElementById('requestsTbody').innerHTML =
      '<tr class="empty-row"><td colspan="7">Could not load requests. Check backend.</td></tr>';
  }
}

function renderRequestsTable(requests) {
  const tbody = document.getElementById('requestsTbody');

  if (requests.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="7">No open requests in your city right now</td></tr>';
    return;
  }

  tbody.innerHTML = requests.map(r => `
    <tr>
      <td><span class="blood-pill">${r.bloodGroup}</span></td>
      <td>${r.patientName}</td>
      <td>${capitalize(r.city)}</td>
      <td>${r.hospital}</td>
      <td>${r.unitsNeeded}</td>
      <td>
        <span class="urgency-pill ${r.urgency}">
          ${r.urgency === 'critical' ? '🚨 Critical' : 'Normal'}
        </span>
      </td>
      <td>
        ${r.status === 'open'
          ? `<button class="accept-btn" onclick="acceptRequest('${r._id}')">Accept</button>`
          : `<span class="accepted-tag">Accepted</span>`
        }
      </td>
    </tr>
  `).join('');
}

async function acceptRequest(requestId) {
  try {
    const res = await fetch(`${API}/requests/${requestId}/accept`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ institutionId: instId }),
    });

    if (res.ok) {
      showToast('✓ Request accepted! Patient will be notified.');
      loadRequests();
      loadOverview();
    } else {
      const data = await res.json();
      showToast(data.message || 'Could not accept request.');
    }

  } catch (err) {
    showToast('Connection error.');
  }
}

// ── Analytics ─────────────────────────────────────────────────
let chartInstances = {};

async function loadAnalytics() {
  try {
    const res    = await fetch(`${API}/institutions/${instId}`);
    const inst   = await res.json();
    const inv    = inst.inventory || {};
    const groups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
    const values = groups.map(g => Number(inv[g]) || 0);

    // Destroy old charts first
    if (chartInstances.bar)      chartInstances.bar.destroy();
    if (chartInstances.doughnut) chartInstances.doughnut.destroy();

    // Bar chart
    const barCtx = document.getElementById('chartInventory').getContext('2d');
    chartInstances.bar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: groups,
        datasets: [{
          label: 'Units available',
          data:  values,
          backgroundColor: values.map(v => v > 0 ? 'rgba(192,57,43,0.7)' : 'rgba(136,135,128,0.2)'),
          borderColor:     values.map(v => v > 0 ? '#C0392B' : 'rgba(136,135,128,0.3)'),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: {
            ticks: { color: '#888', stepSize: 1 },
            grid:  { color: 'rgba(255,255,255,0.04)' },
            beginAtZero: true,
          }
        }
      }
    });

    // Doughnut chart
    const nonZeroGroups = groups.filter((g, i) => values[i] > 0);
    const nonZeroValues = values.filter(v => v > 0);

    const doughCtx = document.getElementById('chartDistribution').getContext('2d');
    chartInstances.doughnut = new Chart(doughCtx, {
      type: 'doughnut',
      data: {
        labels: nonZeroGroups,
        datasets: [{
          data: nonZeroValues,
          backgroundColor: [
            '#C0392B','#E74C3C','#922B21','#F1948A',
            '#A93226','#CD6155','#7B241C','#F5B7B1'
          ],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#888', font: { size: 12 }, padding: 12 }
          }
        }
      }
    });

    // Show message if no inventory set yet
    if (nonZeroGroups.length === 0) {
      document.getElementById('chartDistribution').style.display = 'none';
      const parent = document.getElementById('chartDistribution').parentElement;
      parent.innerHTML += '<p style="color:var(--muted);text-align:center;padding-top:80px;font-size:14px">No inventory data yet.<br>Go to Inventory and add units first.</p>';
    }

  } catch (err) {
    console.error('Analytics load error:', err);
  }
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent   = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ── Helpers ───────────────────────────────────────────────────
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadOverview();
  loadInventory();
});