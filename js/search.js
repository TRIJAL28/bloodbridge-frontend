const API = 'https://bloodbridge-backend.onrender.com/api';
let currentDonors = [];
let currentInstitutions = [];

async function doSearch() {
  const bloodGroup = document.getElementById('bloodGroup').value;
  const city = document.getElementById('city').value.trim();

  if (!bloodGroup || !city) {
    alert('Please select a blood group and enter a city.');
    return;
  }

  document.getElementById('initialState').innerHTML = '<span>⏳</span>Searching...';
  document.getElementById('initialState').style.display = 'block';
  document.getElementById('resultsSection').style.display = 'none';

  try {
    const [donorRes, instRes] = await Promise.all([
      fetch(`${API}/donors/search?bloodGroup=${encodeURIComponent(bloodGroup)}&city=${encodeURIComponent(city)}`),
      fetch(`${API}/institutions/search?bloodGroup=${encodeURIComponent(bloodGroup)}&city=${encodeURIComponent(city)}`)
    ]);

    const donorData = await donorRes.json();
    const instData = await instRes.json();

    currentDonors = donorData.donors || [];
    currentInstitutions = instData.institutions || [];

    const total = currentDonors.length + currentInstitutions.length;

    document.getElementById('initialState').style.display = 'none';
    document.getElementById('emergencyBar').style.display = total === 0 ? 'flex' : 'none';

    if (total === 0) {
      document.getElementById('initialState').style.display = 'block';
      document.getElementById('initialState').innerHTML =
        `<span>😔</span>No results found for <strong>${bloodGroup}</strong> in <strong>${city}</strong>.<br><br>Try a nearby city or post an emergency request.`;
      return;
    }

    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsTitle').textContent = `${bloodGroup} in ${city}`;
    document.getElementById('resultsCount').textContent = `${total} found`;

    renderDonors(currentDonors, bloodGroup);
    renderInstitutions(currentInstitutions, bloodGroup);

    if (currentInstitutions.length > 0) {
      switchTab('institutions');
    } else {
      switchTab('donors');
    }

  } catch (err) {
    document.getElementById('initialState').style.display = 'block';
    document.getElementById('initialState').innerHTML =
      '<span>⚠️</span>Could not connect to server. Make sure the backend is running.';
  }
}

function renderDonors(donors, bloodGroup) {
  const grid = document.getElementById('donorsGrid');
  document.getElementById('tabDonors').textContent = `Individual Donors (${donors.length})`;

  if (donors.length === 0) {
    grid.innerHTML = '<div class="state-msg"><span>👤</span>No individual donors found in this city for this blood group.</div>';
    return;
  }

  grid.innerHTML = donors.map((d, i) => `
    <div class="result-card" style="animation-delay:${i * 0.05}s">
      <div class="card-top">
        <div class="avatar">${d.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="card-name">${d.name}</div>
          <div class="card-city">${capitalize(d.city)}</div>
        </div>
      </div>
      <span class="blood-badge">${d.bloodGroup}</span>
      <span class="available-dot" style="margin-left:10px">Available</span>
      <div class="card-phone">
        Contact: <a href="tel:${d.phone}">${d.phone}</a>
      </div>
    </div>
  `).join('');
}

function renderInstitutions(institutions, bloodGroup) {
  const grid = document.getElementById('institutionsGrid');
  document.getElementById('tabInstitutions').textContent = `Blood Banks & Hospitals (${institutions.length})`;

  if (institutions.length === 0) {
    grid.innerHTML = '<div class="state-msg"><span>🏥</span>No institutions found with this blood group in stock.</div>';
    return;
  }

  const bloodGroups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

  grid.innerHTML = institutions.map((inst, i) => {
    const inv = inst.inventory || {};
    const invBadges = bloodGroups
      .filter(g => inv[g] > 0)
      .map(g => `<span class="inv-badge ${g === bloodGroup ? 'highlight' : ''}">${g}: ${inv[g]}</span>`)
      .join('');

    return `
      <div class="inst-card" style="animation-delay:${i * 0.05}s">
        <div class="inst-type">${inst.type === 'bloodbank' ? 'Blood Bank' : 'Hospital'}</div>
        <div class="inst-name">${inst.name}</div>
        <div class="inst-city">${capitalize(inst.city)}</div>
        <div class="inventory-row">${invBadges || '<span style="color:var(--muted);font-size:13px">Inventory not updated</span>'}</div>
        <div class="card-phone">Contact: <a href="tel:${inst.phone}">${inst.phone}</a></div>
      </div>
    `;
  }).join('');
}

function switchTab(tab) {
  document.getElementById('donorsGrid').style.display = tab === 'donors' ? 'grid' : 'none';
  document.getElementById('institutionsGrid').style.display = tab === 'institutions' ? 'grid' : 'none';
  document.getElementById('tabDonors').classList.toggle('active', tab === 'donors');
  document.getElementById('tabInstitutions').classList.toggle('active', tab === 'institutions');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

document.getElementById('city').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});