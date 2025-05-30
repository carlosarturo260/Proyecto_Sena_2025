// -------------------------------------------------------------
//  app.js  –  Lógica Frontend Tu Cancha App
// -------------------------------------------------------------
console.log('Frontend inicializado');

////////////////////////////////////////////////////////////////
// 1 ·  Referencias a elementos de la barra de reserva
////////////////////////////////////////////////////////////////
// ids que EXISTEN en la barra
   //  <button>

document.addEventListener('DOMContentLoaded', () => {
  const selCiudad  = document.getElementById('selCiudad');
  const selCancha  = document.getElementById('selCancha');
  const selFecha   = document.getElementById('selFecha');
  const selHora    = document.getElementById('selHora');
  const btnBuscar  = document.getElementById('btnBuscar');

 
 // Inicializar Flatpickr para fecha
flatpickr("#selFecha", {
  locale: "es",
  altInput: true,
  altFormat: "d M. Y",
  dateFormat: "Y-m-d",
  showMonths: 1,
  defaultDate: new Date(),
  disableMobile: "true",
  static: true,
  animate: false,
  monthSelectorType: "dropdown"
});
// ... existing code ...



  
  // Selector de Hora personalizado
  const timeInput = document.getElementById('selHora');
  const modalOverlay = document.getElementById('modalOverlay');
  const hourColumn = document.getElementById('hourColumn');
  const minuteColumn = document.getElementById('minuteColumn');
  const nowButton = document.getElementById('nowButton');
  const acceptButton = document.getElementById('acceptButton');
  
  if (timeInput && modalOverlay && hourColumn && minuteColumn) {
    let selectedHour = 16;
    let selectedMinute = 0;
    
    // Generar opciones de horas (de 6 a 23)
    for (let i = 1; i <= 24; i++) {
  const hourItem = document.createElement('div');
  hourItem.classList.add('picker-item');
  hourItem.textContent = i.toString().padStart(2, '0');  // ← con 0 delante
  hourItem.dataset.value = i;
  hourColumn.appendChild(hourItem);
      
      if (i === selectedHour) {
        hourItem.classList.add('selected');
        // Hacer scroll a la hora seleccionada
        setTimeout(() => {
          hourItem.scrollIntoView({ block: 'center' });
        }, 100);
      }
    }
    
    // Generar opciones de minutos (0 y 30)
    const minutes = [0, 30];
minutes.forEach(min => {
  const minuteItem = document.createElement('div');
  minuteItem.classList.add('picker-item');
  minuteItem.textContent = min === 0 ? '00' : '30';
  minuteItem.dataset.value = min;
  minuteColumn.appendChild(minuteItem);
      
      if (min === selectedMinute) {
        minuteItem.classList.add('selected');
      }
    });
    
    // Abrir modal al hacer clic en el input
    // Abrir modal al hacer clic en el input
timeInput.addEventListener('click', function (e) {
  e.stopPropagation(); // Evitar que el clic se propague
  const rect = timeInput.getBoundingClientRect();
  const picker = document.getElementById('timePickerPopup');
  const overlay = document.getElementById('modalOverlay');

  // Asegurarse de que el overlay esté visible
  overlay.style.display = 'block';
  
  // Posicionar el picker
  picker.style.top = `${rect.bottom + 5}px`;
  picker.style.left = `${rect.left}px`;
  picker.style.display = 'block'; // Asegurarse de que el picker esté visible
});
    
    // Cerrar modal al hacer clic fuera
    // Cerrar modal al hacer clic fuera
modalOverlay.addEventListener('click', function(e) {
  const picker = document.getElementById('timePickerPopup');
  if (picker && !picker.contains(e.target)) {
    modalOverlay.style.display = 'none';
    // No ocultar el picker aquí, solo el overlay
  }
});
    
    // Seleccionar hora
    hourColumn.addEventListener('click', function(e) {
      if (e.target.classList.contains('picker-item')) {
        // Quitar selección anterior
        hourColumn.querySelectorAll('.picker-item').forEach(item => {
          item.classList.remove('selected');
        });
        
        // Añadir selección nueva
        e.target.classList.add('selected');
        selectedHour = parseInt(e.target.dataset.value);
        updateTimeInput();
      }
    });
    
    // Seleccionar minuto
    minuteColumn.addEventListener('click', function(e) {
      if (e.target.classList.contains('picker-item')) {
        // Quitar selección anterior
        minuteColumn.querySelectorAll('.picker-item').forEach(item => {
          item.classList.remove('selected');
        });
        
        // Añadir selección nueva
        e.target.classList.add('selected');
        selectedMinute = parseInt(e.target.dataset.value);
        updateTimeInput();
      }
    });
    
    // Función para actualizar el input
    function updateTimeInput() {
      const formattedHour = selectedHour.toString().padStart(2, '0');
      const formattedMinute = selectedMinute.toString().padStart(2, '0');
      timeInput.value = `${formattedHour}:${formattedMinute}`;
    }
    
    // Botones
    if (nowButton) {
      nowButton.addEventListener('click', function() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = Math.ceil(now.getMinutes() / 30) * 30;
        
        if (minutes === 60) {
          minutes = 0;
          hours++;
        }
        
        // Actualizar selección visual
        hourColumn.querySelectorAll('.picker-item').forEach(item => {
          item.classList.toggle('selected', parseInt(item.dataset.value) === hours);
          if (parseInt(item.dataset.value) === hours) {
            item.scrollIntoView({ block: 'center' });
          }
        });
        
        minuteColumn.querySelectorAll('.picker-item').forEach(item => {
          item.classList.toggle('selected', parseInt(item.dataset.value) === minutes);
        });
        
        selectedHour = hours;
        selectedMinute = minutes;
        updateTimeInput();
      });
    }
    
    if (acceptButton) {
      acceptButton.addEventListener('click', function() {
        modalOverlay.style.display = 'none';
        // Disparar evento change para actualizar disponibilidad
        const event = new Event('change');
        timeInput.dispatchEvent(event);
      });
    }
  }
  
  

// Asignar eventos para los selectores
  if (selCiudad) selCiudad.addEventListener('change', () => poblarCanchas(selCiudad.value));
  if (selCancha) selCancha.addEventListener('change', cargarHorasLibres);
  if (selFecha) selFecha.addEventListener('change', cargarHorasLibres);
  if (btnBuscar) btnBuscar.addEventListener('click', buscarCanchas);
  
  // Cargar ciudades al inicio
  cargarCiudades();
  
  // Cargar reservas del usuario si está logueado
  cargarMisReservas();
  
  // Actualizar visibilidad de enlaces de navegación
  toggleNavLinks();

window.addEventListener('scroll', () => {
    if (modalOverlay.style.display === 'flex') {
      modalOverlay.style.display = 'none';
    }
  });

});



// Poblar el selector de canchas según la ciudad elegida
async function poblarCanchas (ciudad) {
  if (!ciudad) { 
    selCancha.innerHTML = '<option value="">Cancha</option>'; 
    return; 
  }

  try {
    const res     = await fetch('http://localhost:3000/api/canchas');
    const canchas = await res.json();

    // Cambiamos la opción inicial a "Todas las canchas" con valor "todas"
    selCancha.innerHTML = '<option value="todas">Todas las canchas</option>';
    
    canchas
      .filter(c => c.ciudad === ciudad)
      .forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;           // ← ID real de la BD
        opt.textContent = c.nombre;
        selCancha.appendChild(opt);
      });
  } catch (err) {
    console.error(err);
    alert('Error al cargar canchas');
  }
}

////////////////////////////////////////////////////////////////
// 3 ·  Consultar y mostrar horas libr es
////////////////////////////////////////////////////////////////
async function cargarHorasLibres() {
  const cancha_id = selCancha.value;
  const fecha     = selFecha.value;
  if (!cancha_id || !fecha) return;

  try {
    const url = `http://localhost:3000/api/disponibilidad?cancha_id=${cancha_id}&fecha=${fecha}`;
    const res = await fetch(url);
    const data = await res.json();

    selHora.innerHTML = '<option value=\"\">Hora</option>';
    data.free.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;               // "12:00:00"
      opt.textContent = h.slice(0, 5); // "12:00"
      selHora.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    alert('Error al consultar disponibilidad');
  }
}

////////////////////////////////////////////////////////////////
// 4 ·  Crear reserva (usuario logueado)
////////////////////////////////////////////////////////////////
async function reservar () {
  // 1. Validaciones de campos
  const cancha_id = selCancha.value;
  const fecha     = selFecha.value;
  const hora      = selHora.value;

  if (!cancha_id || !fecha || !hora) {
    alert('Debes elegir ciudad, cancha, fecha y hora');
    return;
  }

  // 2. Verificar login
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Debes iniciar sesión o registrarte para reservar');
    // Aquí puedes abrir tu modal de login
    return;
  }

  // 3. Enviar reserva
  try {
    const res = await fetch('http://localhost:3000/api/reservas', {
      method  : 'POST',
      headers : {
        'Content-Type' : 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body    : JSON.stringify({ cancha_id, fecha, hora })
    });
    const data = await res.json();

    if (!res.ok) {                    // 400 / 409…
      alert(data.error || 'Error al reservar');
      return;
    }

    alert('¡Reserva creada!');
    cargarMisReservas();              // refrescar lista
    cargarHorasLibres();              // refrescar huecos
  } catch (err) {
    console.error(err);
    alert('Error de conexión');
  }
}


////////////////////////////////////////////////////////////////
// 5 ·  Login
////////////////////////////////////////////////////////////////
async function login(event) {
  event.preventDefault();
  const email    = document.getElementById('usuarioEmail').value;
  const password = document.getElementById('usuarioPass').value;

  try {
    const res  = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('isAdmin', data.user.isAdmin);
    location.href = data.user.isAdmin ? 'admin.html' : 'index.html';
  } catch (err) {
    console.error(err);
    alert('Error de conexión');
  }
}

////////////////////////////////////////////////////////////////
// 6 ·  Cargar tabla de reservas en admin.html
////////////////////////////////////////////////////////////////
async function cargarReservasGlobales () {
  if (localStorage.getItem('isAdmin') !== 'true') return;

  try {
    const res      = await fetch('http://localhost:3000/api/reservas/todas', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const reservas = await res.json();

    const tbody = document.querySelector('#tablaReservas tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    reservas.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.usuario}</td>
        <td>${r.cancha}</td>
        <td>${r.ciudad}</td>
        <td>${r.fecha.split('T')[0]}</td>
        <td>${r.hora}</td>
        <td>${r.estado}</td>
        <td>
          <button class="btn btn-sm btn-success me-1" onclick="confirmarReserva(${r.id})">✓</button>
          <button class="btn btn-sm btn-danger"  onclick="cancelarReserva(${r.id})">✕</button>
        </td>`;
      tbody.appendChild(tr);          // ← aquí estaba el fallo
    });
  } catch (err) {
    console.error(err);
    alert('Error al obtener reservas');
  }
}


/* ---------- helpers admin ---------- */
async function confirmarReserva (id) {
  if (!await cambiarEstado(id, 'CONFIRMADA')) return;
  alert('Reserva confirmada');
  cargarReservasGlobales();
}

async function cancelarReserva (id) {
  if (!await cambiarEstado(id, 'CANCELADA')) return;
  alert('Reserva cancelada');
  cargarReservasGlobales();
}

async function cambiarEstado (id, estado) {
  const res = await fetch(`http://localhost:3000/api/reservas/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ estado })
  });
  if (!res.ok) { alert('Error actualizando'); return false; }
  return true;
}

/* -------- canchas -------- */
async function listarCanchas () {
  const res   = await fetch('http://localhost:3000/api/canchas');
  const data  = await res.json();
  const cont  = document.getElementById('listaCanchas');
  if (!cont) return;
  cont.innerHTML = '';

  data.forEach(c => {
    cont.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.nombre}</td>
        <td>${c.ciudad}</td>
        <td>
          <input id="precio-${c.id}" type="number" value="${c.precio}" class="form-control form-control-sm" style="width:110px;display:inline-block">
          <button class="btn btn-sm btn-primary ms-1" onclick="actualizarPrecio(${c.id})">Actualizar</button>
        </td>
      </tr>`;
  });
}

async function agregarCancha () {
  const nombre = document.getElementById('canchaNombre').value.trim();
  const ciudad = document.getElementById('canchaCiudad').value.trim();
  const precio = document.getElementById('canchaPrecio').value;
  if (!nombre || !ciudad || !precio) return alert('Completa los tres campos');
  
  

  const res = await fetch('http://localhost:3000/api/canchas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ nombre, ciudad, precio })
  });
  if (!res.ok) return alert('La cancha ya existe');
  document.getElementById('formCancha').reset();
  listarCanchas();
}

async function actualizarPrecio (id) {
  const val = document.getElementById(`precio-${id}`).value;
  const res = await fetch(`http://localhost:3000/api/canchas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ precio: val })
  });
  if (!res.ok) return alert('Error actualizando precio');
alert('Precio actualizado');
}

/* ----- enganchar formulario ----- */
document.getElementById('formCancha')?.addEventListener('submit', e => {
  e.preventDefault();
  agregarCancha();
});





////////////////////////////////////////////////////////////////
// 7 ·  Logout simple
////////////////////////////////////////////////////////////////
function logout() {
  localStorage.clear();
  location.href = 'index.html';
}

////////////////////////////////////////////////////////////////
// 8 ·  Asignar listeners si existen los elementos
////////////////////////////////////////////////////////////////
/* ----- enganchar listeners y 1ª carga ----- */
if (selCiudad)  selCiudad.addEventListener('change', () => poblarCanchas(selCiudad.value));
if (selCancha)  selCancha.addEventListener('change', cargarHorasLibres);
if (selFecha)   selFecha .addEventListener('change', cargarHorasLibres);
if (btnBuscar)  btnBuscar.addEventListener('click', buscarCanchas);

// primera carga de ciudades + canchas
if (typeof cargarCiudades === 'function') cargarCiudades();


const formLogin = document.getElementById('formLogin');
if (formLogin) formLogin.addEventListener('submit', login);

//  Cargar reservas cuando estamos en admin.html
if (location.pathname.endsWith('admin.html')) cargarReservasGlobales(); listarCanchas();
////////////////////////////////////////////////////////////////



/* ---------- valor inicial = HOY + siguiente tramo de 30 min ---------- */
const ahora      = new Date();
const yyyy_mm_dd = ahora.toISOString().split('T')[0];

let horas   = ahora.getHours();
let minutos = Math.ceil(ahora.getMinutes() / 30) * 30;
if (minutos === 60) { minutos = 0; horas++; }
const hh = horas.toString().padStart(2,'0');
const mm = minutos.toString().padStart(2,'0');

selFecha.value = yyyy_mm_dd;        // p.e. 2025-05-01
selHora.value  = `${hh}:${mm}`;     // p.e. 11:30








/* ============================================================
   ❶  Mis reservas (usuario)  –  sección #mis-reservas
   ============================================================ */

/**
 * Trae las reservas del usuario logueado y las pinta en la tabla.
 *  – Oculta completamente la sección si el usuario no tiene reservas.
 *  – Muestra botón “Cancelar” sólo si el estado todavía es PENDIENTE.
 */
async function cargarMisReservas () {
  // No tiene sentido si el visitante no está autenticado
  const token = localStorage.getItem('token');
  if (!token) return;                                // <──  early-return

  try {
    // El endpoint estándar que hicimos en el backend                      (GET /api/reservas)
    const res      = await fetch('http://localhost:3000/api/reservas', {
      headers : { 'Authorization' : 'Bearer ' + token }
    });
    const reservas = await res.json();

    const sec   = document.getElementById('mis-reservas');
    const tbody = document.getElementById('tbMisReservas');

    if (!reservas.length) {                         // 0 reservas → ocultar
      sec.style.display = 'none';
      return;
    }

    // Hay contenido: mostramos la sección y vaciamos la tabla
    sec.style.display = 'block';
    tbody.innerHTML   = '';

    reservas.forEach(r => {
      tbody.innerHTML += `
        <tr>
          <td>${r.id}</td>
          <td>${r.cancha}</td>
          <td>${r.ciudad}</td>
          <td>${r.fecha.split('T')[0]}</td>     <!-- sólo YYYY-MM-DD -->
          <td>${r.hora}</td>
          <td>${r.estado}</td>
          <td>
            ${r.estado === 'PENDIENTE'
              ? `<button class="btn btn-sm btn-danger"
                        onclick="cancelarMiReserva(${r.id})">
                   Cancelar
                 </button>`
              : ''}
          </td>
        </tr>`;
    });
  } catch (err) {
    console.error('Error cargando reservas del usuario', err);
  }
}

/**
 * PATCH /api/reservas/:id   –   cambia el estado a “CANCELADA”
 */
async function cancelarMiReserva (id) {
  if (!confirm('¿Cancelar realmente la reserva?')) return;

  const res = await fetch(`http://localhost:3000/api/reservas/${id}`, {
    method  : 'PATCH',
    headers : {
      'Content-Type' : 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body    : JSON.stringify({ estado : 'CANCELADA' })
  });

  if (res.ok) {
    alert('Reserva cancelada');
    cargarMisReservas();          // refrescar tabla
  } else {
    alert('No se pudo cancelar');
  }
}

/* -----------------------------------------------------------------
   ❷  Enganche automático: cada vez que se abra index.html
   ----------------------------------------------------------------- */
if (location.pathname.endsWith('index.html')) {
  cargarMisReservas();            // se dispara al cargar la página
}

/*****************************************************************
  VISIBILIDAD de enlaces de navegación
*****************************************************************/

function toggleNavLinks () {
  const isLogged = !!localStorage.getItem('token');
  const isAdmin  = localStorage.getItem('isAdmin') === 'true';

  // Elementos de navegación desktop
  const navMis = document.getElementById('navMis');
  const navAdmin = document.getElementById('navAdmin');
  const navLogin = document.getElementById('navLogin');
  
  // Elementos de navegación mobile
  const navMisMobile = document.getElementById('navMisMobile');
  const navAdminMobile = document.getElementById('navAdminMobile');
  const navLoginMobile = document.getElementById('navLoginMobile');
  
  // Mostrar/ocultar elementos según estado de login
  if (navMis) navMis.classList.toggle('d-none', !isLogged);
  if (navAdmin) navAdmin.classList.toggle('d-none', !isAdmin);
  if (navLogin) navLogin.classList.toggle('d-none', isLogged);
  
  // Elementos móviles
  if (navMisMobile) navMisMobile.classList.toggle('d-none', !isLogged);
  if (navAdminMobile) navAdminMobile.parentElement.classList.toggle('d-none', !isAdmin);
  if (navLoginMobile) navLoginMobile.parentElement.classList.toggle('d-none', isLogged);
  
  // Añadir enlace al perfil de usuario en la navegación
  const navDesktop = document.querySelector('nav.d-none.d-md-block');
  const navMobile = document.querySelector('#navbarMobile .navbar-nav');
  // Eliminar enlaces de perfil existentes para evitar duplicados
  document.querySelectorAll('.nav-profile-link').forEach(el => el.remove());
  if (isLogged && isAdmin) {
    // Añadir enlace al perfil en navegación desktop
    if (navDesktop) {
      const profileLink = document.createElement('a');
      profileLink.href = 'profile.html';
      profileLink.className = 'text-white mx-2 nav-profile-link';
      profileLink.innerHTML = '<i class="fas fa-user-circle me-1"></i>Mi Perfil';
      navDesktop.appendChild(profileLink);
    }
    // Añadir enlace al perfil en navegación mobile
    if (navMobile) {
      const profileLi = document.createElement('li');
      profileLi.className = 'nav-item nav-profile-link';
      profileLi.innerHTML = '<a href="profile.html" class="nav-link text-white"><i class="fas fa-user-circle me-1"></i>Mi Perfil</a>';
      navMobile.appendChild(profileLi);
    }
  }
}

// ▶️ 1) Nada más cargar la página
document.addEventListener('DOMContentLoaded', toggleNavLinks);

// ▶️ 2) Después de un login (pega estas 2 líneas justo antes del redirect)
function manejarLogin (data) {
  localStorage.setItem('token',   data.token);
  localStorage.setItem('isAdmin', data.user.isAdmin);
  toggleNavLinks();                         // <── aquí
  location.href = data.user.isAdmin ? 'admin.html' : 'index.html';
}

// ▶️ 3) Logout
function logout () {
  localStorage.clear();
  toggleNavLinks();          // oculta enlaces
  location.href = 'index.html';
}



/* =========================================================
   Buscador de canchas  – abre results.html con los filtros
   ========================================================= */
function buscarCanchas () {
  const ciudad = document.getElementById('selCiudad').value;
  const cancha = document.getElementById('selCancha').value; // opcional
  const fecha  = document.getElementById('selFecha').value;  // opcional
  const hora   = document.getElementById('selHora').value;   // opcional

  if (!ciudad) return alert('Debes elegir primero la ciudad');
  
  // Ya no necesitamos validar si se seleccionó una cancha, porque la opción predeterminada es válida
  
  // construimos query-string
  const params = new URLSearchParams({ city: ciudad });
  
  // Si seleccionó una cancha específica (no "todas"), añadimos el parámetro
  if (cancha && cancha !== 'todas') {
    params.append('nombre', cancha);
  }
  
  if (fecha) params.append('date', fecha);
  if (hora) params.append('time', hora);
  
  // redirigimos a la nueva página
  location.href = `results.html?${params.toString()}`;
}

// Enganche del botón
document.getElementById('btnBuscar')
        ?.addEventListener('click', buscarCanchas);


/* 1. Cargar la lista de ciudades al arrancar la página */

async function cargarCiudades () {
  if (!selCiudad) return;               // <-- el guard vale, pero
                                        // mantén el cuerpo BUENO:
  try {
    const res     = await fetch('http://localhost:3000/api/canchas');
    const canchas = await res.json();
    const ciudades = [...new Set(canchas.map(c => c.ciudad))].sort();

    selCiudad.innerHTML =
      '<option value="">Ciudad</option>' +
      ciudades.map(c => `<option value="${c}">${c}</option>`).join('');
  } catch (err) {
    console.error('[cargarCiudades]', err);
    alert('No se pudo cargar la lista de ciudades');
  }
}


/*********************************************************************/
/*  3. Llamada al arrancar (después de declarar listeners)           */
/*********************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  if (selCiudad) cargarCiudades();
});

/*****************************************************************
   NUEVO SELECTOR DE HORA (scroll + botones Ahora / Aceptar)
*****************************************************************/



/* =============================================================
   VALORES PREDETERMINADOS  (Hoy + siguiente tramo de 30 min)
   ============================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  const ahora      = new Date();
  selFecha.value   = ahora.toISOString().split('T')[0];

  let h = ahora.getHours();
  let m = Math.ceil(ahora.getMinutes()/30)*30 % 60;
  selHora.value = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
});


/* =============================================================
   ENGANCHES – listeners principales
   ============================================================= */
if (selCiudad) selCiudad.addEventListener('change', ()=> poblarCanchas(selCiudad.value));
if (selCancha) selCancha.addEventListener('change', cargarHorasLibres);
if (selFecha)  selFecha .addEventListener('change', cargarHorasLibres);
if (btnBuscar) btnBuscar.addEventListener('click', buscarCanchas);

/* Cargar lista ciudades de inicio */
document.addEventListener('DOMContentLoaded', ()=> { if (selCiudad) cargarCiudades(); });

// Llamar siempre que cambie el login / logout
toggleNavLinks();

/* Al entrar en index.html, si estoy logueado → cargo mis reservas */
if (location.pathname.endsWith('index.html')) cargarMisReservas();

// Añade este código a tu archivo app.js
// Cerrar el selector de hora al hacer scroll
// Añadir este evento para cerrar el selector al hacer scroll
// Colocarlo FUERA del DOMContentLoaded para asegurar que se ejecute globalmente
window.addEventListener('scroll', function() {
  const modalOverlay = document.querySelector('.tucancha-modal-overlay');
  if (modalOverlay && (modalOverlay.style.display === 'flex' || modalOverlay.style.display === 'block')) {
    modalOverlay.style.display = 'none';
    
    // También ocultar el popup del selector si existe
    const timePickerPopup = document.getElementById('timePickerPopup');
    if (timePickerPopup) {
      timePickerPopup.style.display = 'none';
    }
  }
});




