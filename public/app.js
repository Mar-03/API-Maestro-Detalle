const state = { students: [] };

const stats = document.querySelector('#stats');
const studentsContainer = document.querySelector('#students');
const status = document.querySelector('#status');
const apiStatus = document.querySelector('#apiStatus');
const catalogStatus = document.querySelector('#catalogStatus');
const searchInput = document.querySelector('#searchInput');
const refreshButton = document.querySelector('#refreshButton');
const template = document.querySelector('#studentTemplate');

function renderStats(students) {
  const registered = students.length;
  const completed = students.reduce((sum, student) => sum + student.completadas, 0);
  const total = students.reduce((sum, student) => sum + student.total, 0);
  const global = total === 0 ? 0 : Math.round((completed / total) * 100);

  stats.innerHTML = `
    <article><span>Estudiantes registrados</span><strong>${registered}</strong></article>
    <article><span>Misiones completadas</span><strong>${completed}/${total}</strong></article>
    <article><span>Avance global</span><strong>${global}%</strong></article>
  `;
}

function renderStudents(students) {
  studentsContainer.innerHTML = '';

  if (students.length === 0) {
    studentsContainer.innerHTML = '<p class="empty">No hay estudiantes que coincidan con la búsqueda.</p>';
    return;
  }

  for (const student of students) {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('[data-name]').textContent = student.nombre;
    fragment.querySelector('[data-carnet]').textContent = student.carnet;
    fragment.querySelector('[data-email]').textContent = student.correo;
    fragment.querySelector('[data-percent]').textContent = `${student.porcentaje}%`;
    fragment.querySelector('[data-bar]').style.width = `${student.porcentaje}%`;
    fragment.querySelector('[data-completed]').textContent = student.completadas;
    fragment.querySelector('[data-total]').textContent = student.total;

    const missions = fragment.querySelector('[data-missions]');
    for (const mission of student.misiones) {
      const item = document.createElement('div');
      item.className = `mission ${mission.estado ? 'done' : 'pending'}`;
      item.innerHTML = `
        <span class="mission-mark" aria-hidden="true">${mission.estado ? '✓' : '○'}</span>
        <span>
          <strong>Misión ${mission.misionId}: ${escapeHtml(mission.nombre || '')}</strong>
          <small>${mission.estado ? 'Completada' : 'Pendiente'}</small>
        </span>
      `;
      missions.appendChild(item);
    }

    studentsContainer.appendChild(fragment);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function filterStudents() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = state.students.filter((student) =>
    [student.carnet, student.nombre, student.correo]
      .some((value) => String(value).toLowerCase().includes(term))
  );
  renderStudents(filtered);
}

async function loadDashboard() {
  status.textContent = 'Cargando información…';
  refreshButton.disabled = true;

  try {
    const studentsResponse = await fetch('/api/estudiantes');
    const missionsResponse = await fetch('/api/misiones');

    if (!studentsResponse.ok) {
      throw new Error(`Estudiantes HTTP ${studentsResponse.status}`);
      }

    if (!missionsResponse.ok) {
      throw new Error(`Misiones HTTP ${missionsResponse.status}`);
      }

    state.students = await studentsResponse.json();
    const missions = await missionsResponse.json();
    apiStatus.textContent = '● API conectada';
    apiStatus.className = 'status-badge connected';

    catalogStatus.textContent = `Catálogo: ${missions.length} misiones`;

    renderStats(state.students);
    filterStudents();
    status.textContent = `Última actualización: ${new Date().toLocaleString()}`;
  } catch (error) {
  status.textContent =
    'No fue posible cargar el tablero. Revisa que la API y la base de datos estén disponibles.';

  apiStatus.textContent = '● API desconectada';
  apiStatus.className = 'status-badge disconnected';

  catalogStatus.textContent = 'Catálogo no disponible';

  console.error(error);

  } finally {
    refreshButton.disabled = false;
  }
}

searchInput.addEventListener('input', filterStudents);
refreshButton.addEventListener('click', loadDashboard);
loadDashboard();
