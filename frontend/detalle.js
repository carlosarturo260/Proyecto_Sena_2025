// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const canchaId = params.get('id');
const fechaParam = params.get('fecha') || new Date().toISOString().split('T')[0];

// Actualizar UI cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  actualizarUIComentarios();
  // Cargar comentarios al iniciar la página
  if (canchaId) {
    cargarComentarios(canchaId);
  }
});

// Actualizar UI cuando cambia el estado de autenticación
window.addEventListener('storage', function(e) {
  if (e.key === 'token') {
    actualizarUIComentarios();
    // Recargar comentarios cuando cambia el estado de autenticación
    if (canchaId) {
      cargarComentarios(canchaId);
    }
  }
});

// Referencias a elementos del DOM
const canchaDetalle = document.getElementById('cancha-detalle');
const tipoCancha = document.getElementById('tipo-cancha');
const nombreCancha = document.getElementById('nombre-cancha');
const fechaReserva = document.getElementById('fechaReserva');
const btnReservar = document.getElementById('btnReservar');
const horariosManana = document.querySelector('.horarios-manana');
const horariosTarde = document.querySelector('.horarios-tarde');
const horariosNoche = document.querySelector('.horarios-noche');

// Variable para almacenar el horario seleccionado
let horarioSeleccionado = null;

// Inicializar el selector de fecha con Flatpickr
if (fechaReserva) {
  flatpickr(fechaReserva, {
    locale: 'es',
    dateFormat: 'Y-m-d',
    minDate: 'today',
    defaultDate: fechaParam,
    onChange: function(selectedDates) {
      const fecha = selectedDates[0].toISOString().split('T')[0];
      cargarHorariosDisponibles(canchaId, fecha);
      // Resetear el botón de reserva cuando cambia la fecha
      if (btnReservar) {
        btnReservar.disabled = true;
        horarioSeleccionado = null;
      }
    }
  });
}

// Función para actualizar la UI de comentarios según el estado de autenticación
function actualizarUIComentarios() {
  const token = localStorage.getItem('token');
  const mensajeLogin = document.getElementById('mensaje-login-comentario');
  const seccionNuevoComentario = document.getElementById('seccion-nuevo-comentario');
  
  if (token) {
    if (mensajeLogin) mensajeLogin.style.display = 'none';
    if (seccionNuevoComentario) seccionNuevoComentario.style.display = 'block';
  } else {
    if (mensajeLogin) mensajeLogin.style.display = 'block';
    if (seccionNuevoComentario) seccionNuevoComentario.style.display = 'none';
  }
}

// Función para cargar la información de la cancha
async function cargarInfoCancha(id) {
  try {
    // Mostrar un indicador de carga
    if (canchaDetalle) {
      canchaDetalle.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-2">Cargando información de la cancha...</p></div>';
    }
    
    // Verificar si el ID es válido
    if (!id) throw new Error('ID de cancha no válido');
    
    // SOLUCIÓN: Usar la URL correcta para obtener una cancha específica
    console.log(`Solicitando información de la cancha con ID: ${id}`);
    
    // Opción 1: Intentar obtener la cancha específica
    let response;
    let cancha;
    
    try {
      response = await fetch(`http://localhost:3000/api/canchas/${id}`);
      
      if (!response.ok) {
        console.log('No se pudo obtener la cancha específica, intentando obtener todas las canchas');
        // Opción 2: Si falla, intentar obtener todas las canchas y filtrar
        const allResponse = await fetch('http://localhost:3000/api/canchas');
        if (!allResponse.ok) throw new Error('No se pudo cargar la lista de canchas');
        
        const canchas = await allResponse.json();
        console.log('Canchas obtenidas:', canchas);
        
        // Buscar la cancha por ID
        cancha = Array.isArray(canchas) ? 
                 canchas.find(c => c.id == id) : 
                 (canchas.id == id ? canchas : null);
        
        if (!cancha) throw new Error('Cancha no encontrada en la lista');
      } else {
        // Si la primera solicitud fue exitosa, usar esos datos
        cancha = await response.json();
      }
    } catch (error) {
      console.error('Error al obtener datos de la API:', error);
      
      // Usar datos de prueba como último recurso
      console.log('Usando datos de prueba para la cancha');
      cancha = {
        id: id,
        nombre: 'Cancha Pascualito',
        tipo: 'Fútbol 5',
        ciudad: 'Cali',
        direccion: 'Sin dirección',
        precio: 75000,
        imagen: 'images/cancha1.jpg',
        atributos: ['Césped Sintético', 'Iluminación', 'Vestuarios', 'Marcador Digital'],
        lat: 3.4516,
        lng: -76.5320
      };
    }
    
    console.log('Datos de cancha a utilizar:', cancha);
    
    // Actualizar breadcrumb
    if (tipoCancha) tipoCancha.textContent = cancha.tipo || 'Cancha';
    if (nombreCancha) nombreCancha.textContent = cancha.nombre || 'Cancha';
    
    // Actualizar la información de la cancha
    if (canchaDetalle) {
      canchaDetalle.innerHTML = `
        <h2 class="mb-2">${cancha.nombre || 'Cancha sin nombre'}</h2>
        <h3 class="h5 text-muted mb-3">${cancha.tipo || 'Cancha de fútbol'}</h3>
        <p class="mb-2"><i class="fas fa-map-marker-alt text-danger me-2"></i>${cancha.direccion || 'Dirección no disponible'}</p>
        
        <div class="cancha-imagen-container mb-3">
          <img src="${cancha.imagen || cancha.foto || 'images/cancha1.jpg'}" class="cancha-imagen" alt="${cancha.nombre}" onerror="this.src='images/cancha-default.jpg'">
        </div>
        
        <div class="precio-container mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <span class="text-muted">Valor Reserva</span>
            <span class="precio-reserva">$ ${cancha.precio?.toLocaleString() || '0'}</span>
          </div>
        </div>
        
        <div class="atributos-container mb-4">
          <h4 class="seccion-titulo">Atributos de la Cancha</h4>
          <div>
            ${generarAtributos(cancha.atributos, cancha)}
          </div>
        </div>
        
        <div class="mapa-container">
          <h4 class="seccion-titulo">Ubicación</h4>
          <div id="mapaCancha" style="height: 200px; border-radius: 8px;"></div>
        </div>
      `;
    }
    else {
      console.error('No se encontró el elemento con ID "cancha-detalle"');
    }
    
    // Inicializar mapa si hay coordenadas
    if (cancha.lat && cancha.lng) {
      setTimeout(() => {
        inicializarMapa(cancha.lat, cancha.lng, cancha.nombre);
      }, 500); // Pequeño retraso para asegurar que el DOM esté listo
    } else {
      console.warn('No hay coordenadas disponibles para mostrar el mapa');
      // Usar coordenadas predeterminadas para Cali
      setTimeout(() => {
        inicializarMapa(3.4516, -76.5320, cancha.nombre || 'Ubicación aproximada');
      }, 500);
    }
    
  } catch (error) {
    console.error('Error al cargar la información de la cancha:', error);
    if (canchaDetalle) {
      canchaDetalle.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          No se pudo cargar la información de la cancha
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-success" onclick="cargarInfoCancha('${id}')">
            <i class="fas fa-sync-alt me-2"></i> Intentar nuevamente
          </button>
        </div>
      `;
    }
  }
}

// Función para generar los atributos de la cancha
function generarAtributos(atributosArray, cancha) {
  let atributos = [];
  
  // Verificar si tenemos el objeto cancha
  if (cancha) {
    // Añadir número de cancha (como identificación principal)
    if (cancha.numero) {
      atributos.push(`<i class="fas fa-hashtag"></i> Cancha #${cancha.numero}`);
    }
    
    // Añadir tipo de césped
    if (cancha.cesped) {
      atributos.push(`<i class="fas fa-leaf"></i> Césped ${cancha.cesped}`);
    }
    
    // Verificar si es techada
    if (cancha.techada === 1) {
      atributos.push(`<i class="fas fa-home"></i> Techada`);
    } else if (cancha.techada === 0) {
      atributos.push(`<i class="fas fa-cloud-sun"></i> Al aire libre`);
    }
    
    // Verificar iluminación
    if (cancha.iluminacion === 1) {
      atributos.push(`<i class="fas fa-lightbulb"></i> Iluminación`);
    }
    
    // Verificar camerinos
    if (cancha.camerinos === 1) {
      atributos.push(`<i class="fas fa-tshirt"></i> Camerinos`);
    }
    
    // Verificar kiosco
    if (cancha.kiosco === 1) {
      atributos.push(`<i class="fas fa-store"></i> Kiosco`);
    }
    
    // Verificar parqueadero
    if (cancha.parqueadero === 1) {
      atributos.push(`<i class="fas fa-parking"></i> Parqueadero`);
    }
  }
  
  // Añadir atributos del array si existe y no tenemos suficientes atributos
  if (atributosArray && Array.isArray(atributosArray) && atributosArray.length > 0) {
    atributos = [...atributos, ...atributosArray.map(attr => `<i class="fas fa-check-circle"></i> ${attr}`)];
  }
  
  // Si no hay atributos, mostrar algunos por defecto
  if (atributos.length === 0) {
    atributos = [
      '<i class="fas fa-leaf"></i> Césped Sintético', 
      '<i class="fas fa-lightbulb"></i> Iluminación', 
      '<i class="fas fa-tshirt"></i> Vestuarios'
    ];
  }
  
  // Generar HTML para los atributos
  return atributos.map(atributo => `<span class="atributo-tag">${atributo}</span>`).join('');
}

// Función para cargar los horarios disponibles
async function cargarHorariosDisponibles(id, fecha) {
  try {
    console.log('Cargando horarios disponibles para fecha:', fecha);
    
    // Asegurarse de que tenemos referencia al botón de reserva
    if (!btnReservar) {
      btnReservar = document.getElementById('btnReservar');
      if (btnReservar) {
        btnReservar.addEventListener('click', realizarReserva);
      }
    }
    
    // Limpiar selección previa
    horarioSeleccionado = null;
    if (btnReservar) {
      btnReservar.disabled = true;
      console.log('Botón de reserva deshabilitado');
    } else {
      console.error('No se encontró el botón de reserva');
    }
    
    // Limpiar contenedores de horarios
    horariosManana.innerHTML = '';
    horariosTarde.innerHTML = '';
    horariosNoche.innerHTML = '';
    
    const response = await fetch(`http://localhost:3000/api/disponibilidad?cancha_id=${id}&fecha=${fecha}`);
    if (!response.ok) throw new Error('No se pudo cargar la disponibilidad');
    
    const data = await response.json();
    console.log('Datos de disponibilidad recibidos:', data);
    
    // Organizar horarios por franjas
    const horariosDisponibles = data.free || [];
    console.log('Horarios disponibles:', horariosDisponibles);
    
    // Crear botones para cada franja horaria
    for (let hora = 8; hora <= 22; hora++) {
      const horaNum = hora;
      const horaFormateada = formatearHora(hora);
      const horaFinFormateada = formatearHora(hora + 1);
      
      const boton = document.createElement('button');
      boton.className = 'horario-btn disponible';
      boton.textContent = `${horaFormateada} - ${horaFinFormateada}`;
      boton.dataset.hora = `${hora.toString().padStart(2, '0')}:00`;
      
      // Verificar si está disponible
      const estaDisponible = horariosDisponibles.some(h => h.startsWith(`${hora.toString().padStart(2, '0')}:`));
      
      if (!estaDisponible) {
        boton.disabled = true;
        boton.classList.remove('disponible');
        boton.classList.add('text-muted');
      } else {
        boton.addEventListener('click', function() {
          console.log('Horario seleccionado:', this.dataset.hora);
          
          // Quitar selección previa
          document.querySelectorAll('.horario-btn.seleccionado').forEach(btn => {
            btn.classList.remove('seleccionado');
            btn.classList.add('disponible');
          });
          
          // Marcar como seleccionado
          this.classList.remove('disponible');
          this.classList.add('seleccionado');
          
          // Guardar hora seleccionada
          horarioSeleccionado = this.dataset.hora;
          
          // Habilitar botón de reserva
          if (btnReservar) {
            btnReservar.disabled = false;
            console.log('Botón de reserva habilitado');
          } else {
            console.error('No se encontró el botón de reserva');
            btnReservar = document.getElementById('btnReservar');
            if (btnReservar) {
              btnReservar.disabled = false;
              btnReservar.addEventListener('click', realizarReserva);
              console.log('Botón de reserva encontrado y habilitado');
            }
          }
        });
      }
      
      // Añadir al contenedor correspondiente
      if (hora >= 8 && hora < 12) {
        horariosManana.appendChild(boton);
      } else if (hora >= 12 && hora < 18) {
        horariosTarde.appendChild(boton);
      } else {
        horariosNoche.appendChild(boton);
      }
    }
    
    // Mostrar mensaje si no hay horarios disponibles en alguna franja
    if (horariosManana.children.length === 0) {
      horariosManana.innerHTML = '<p class="text-center text-muted">No hay horarios disponibles</p>';
    }
    if (horariosTarde.children.length === 0) {
      horariosTarde.innerHTML = '<p class="text-center text-muted">No hay horarios disponibles</p>';
    }
    if (horariosNoche.children.length === 0) {
      horariosNoche.innerHTML = '<p class="text-center text-muted">No hay horarios disponibles</p>';
    }
    
  } catch (error) {
    console.error('Error al cargar los horarios disponibles:', error);
    const mensaje = '<div class="alert alert-danger">No se pudo cargar la disponibilidad</div>';
    horariosManana.innerHTML = mensaje;
    horariosTarde.innerHTML = mensaje;
    horariosNoche.innerHTML = mensaje;
  }
}

// Función para formatear la hora en formato 12h
function formatearHora(hora) {
  if (hora === 0) return '12:00 AM';
  if (hora === 12) return '12:00 PM';
  
  if (hora < 12) {
    return `${hora}:00 AM`;
  } else {
    return `${hora - 12}:00 PM`;
  }
}

// Función para inicializar el mapa
function inicializarMapa(lat, lng, nombre) {
  const mapaDiv = document.getElementById('mapaCancha');
  if (!mapaDiv) {
    console.error('No se encontró el elemento del mapa');
    return;
  }

  try {
    // Asegurarse de que el contenedor del mapa sea visible
    mapaDiv.style.height = '300px';
    mapaDiv.style.width = '100%';
    mapaDiv.style.display = 'block';

    // Verificar si ya existe un mapa
    if (window.mapa) {
      window.mapa.remove();
    }

    // Crear nuevo mapa
    window.mapa = L.map(mapaDiv).setView([lat, lng], 15);

    // Añadir capa de mapa con https
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.mapa);

    // Añadir marcador
    L.marker([lat, lng]).addTo(window.mapa)
      .bindPopup(nombre || 'Ubicación de la cancha')
      .openPopup();

    // Invalidar el tamaño del mapa después de que esté visible
    setTimeout(() => {
      window.mapa.invalidateSize();
    }, 100);

  } catch (error) {
    console.error('Error al inicializar el mapa:', error);
    mapaDiv.innerHTML = '<div class="alert alert-warning">No se pudo cargar el mapa</div>';
  }
}

// Función para realizar la reserva
function realizarReserva() {
  console.log('Función realizarReserva ejecutada');
  
  // Verificar si hay un horario seleccionado
  if (!horarioSeleccionado) {
    console.log('No hay horario seleccionado');
    mostrarMensaje('Por favor selecciona un horario disponible', 'warning');
    return;
  }
  
  console.log('Horario seleccionado para reserva:', horarioSeleccionado);
  
  // Verificar si el usuario está logueado
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('Usuario no logueado, mostrando modal de login');
    // En lugar de redirigir, mostrar un modal de login
    mostrarModalLogin();
    // Actualizar UI de comentarios después del login
    document.addEventListener('loginSuccess', function() {
      actualizarUIComentarios();
      cargarComentarios(canchaId);
    });
    return;
  }
  
  console.log('Usuario logueado, mostrando modal de confirmación');
  // Mostrar modal de confirmación en lugar de usar confirm()
  mostrarModalConfirmacion();
}

// Función para mostrar el modal de confirmación de reserva
function mostrarModalConfirmacion() {
  console.log('Mostrando modal de confirmación');
  
  // Crear el modal si no existe
  if (!document.getElementById('modalConfirmacion')) {
    console.log('Creando modal de confirmación');
    const modalHTML = `
      <div class="modal fade" id="modalConfirmacion" tabindex="-1" aria-labelledby="modalConfirmacionLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="modalConfirmacionLabel">Confirmar Reserva</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Estás a punto de reservar:</p>
              <ul class="list-group mb-3">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Cancha:</span>
                  <span id="confirmCancha" class="fw-bold"></span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Fecha:</span>
                  <span id="confirmFecha" class="fw-bold"></span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Hora:</span>
                  <span id="confirmHora" class="fw-bold"></span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Precio:</span>
                  <span id="confirmPrecio" class="fw-bold text-success"></span>
                </li>
              </ul>
              <p>¿Deseas confirmar esta reserva?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-success" id="btnConfirmarReserva">Confirmar Reserva</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Añadir el modal al body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Añadir evento al botón de confirmar
    document.getElementById('btnConfirmarReserva').addEventListener('click', function() {
      console.log('Botón confirmar reserva clickeado');
      procesarReserva();
    });
  }
  
  // Rellenar datos del modal
  document.getElementById('confirmCancha').textContent = document.querySelector('#cancha-detalle h2').textContent;
  document.getElementById('confirmFecha').textContent = fechaReserva.value;
  document.getElementById('confirmHora').textContent = horarioSeleccionado;
  document.getElementById('confirmPrecio').textContent = document.querySelector('.precio-reserva').textContent;
  
  console.log('Datos de confirmación actualizados:', fechaReserva.value, horarioSeleccionado);
  
  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
  modal.show();
  console.log('Modal de confirmación mostrado');
}

// Función para procesar la reserva después de la confirmación
async function procesarReserva() {
  console.log('Procesando reserva...');
  try {
    // Obtener la fecha seleccionada
    const fecha = fechaReserva.value;
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No hay token de usuario');
      mostrarMensaje('Debes iniciar sesión para reservar', 'warning');
      return;
    }
    
    // Mostrar indicador de carga
    document.getElementById('btnConfirmarReserva').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
    document.getElementById('btnConfirmarReserva').disabled = true;
    
    console.log('Datos de reserva a enviar:', { cancha_id: canchaId, fecha, hora: horarioSeleccionado });
    
    // Realizar la petición para crear la reserva
    console.log('Enviando solicitud al servidor...');
    const response = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cancha_id: canchaId,
        fecha: fecha,
        hora: horarioSeleccionado
      })
    });
    
    const data = await response.json();
    console.log('Respuesta del servidor:', data);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al realizar la reserva');
    }
    
    // Cerrar el modal de confirmación
    const modalElement = document.getElementById('modalConfirmacion');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    
    // Mostrar mensaje de éxito
    mostrarMensaje('¡Reserva realizada con éxito!', 'success');
    
    // Recargar los horarios disponibles
    cargarHorariosDisponibles(canchaId, fechaReserva.value);
  } catch (error) {
    console.error('Error al procesar la reserva:', error);
    
    // Cerrar el modal de confirmación
    const modalElement = document.getElementById('modalConfirmacion');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    
    // Mostrar mensaje de error
    mostrarMensaje(error.message || 'Error al conectar con el servidor', 'danger');
    
    // Restaurar el botón de confirmación
    const btnConfirmar = document.getElementById('btnConfirmarReserva');
    if (btnConfirmar) {
      btnConfirmar.innerHTML = 'Confirmar Reserva';
      btnConfirmar.disabled = false;
    }
  }
}

// Añadir evento al botón de reserva
if (btnReservar) {
  btnReservar.addEventListener('click', realizarReserva);
  // Asegurarse de que el botón esté deshabilitado inicialmente
  btnReservar.disabled = true;
}

// Verificar el estado del botón de reserva al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si hay un botón de reserva
  if (btnReservar) {
    console.log('Botón de reserva encontrado:', btnReservar);
    // Deshabilitar inicialmente hasta que se seleccione un horario
    btnReservar.disabled = true;
  } else {
    console.error('No se encontró el botón de reserva en el DOM');
  }
});


// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo) {
  // Crear el contenedor de mensajes si no existe
  let mensajeContainer = document.getElementById('mensaje-container');
  if (!mensajeContainer) {
    mensajeContainer = document.createElement('div');
    mensajeContainer.id = 'mensaje-container';
    mensajeContainer.style.position = 'fixed';
    mensajeContainer.style.top = '20px';
    mensajeContainer.style.left = '50%';
    mensajeContainer.style.transform = 'translateX(-50%)';
    mensajeContainer.style.zIndex = '9999';
    mensajeContainer.style.width = '80%';
    mensajeContainer.style.maxWidth = '500px';
    document.body.appendChild(mensajeContainer);
  }
  
  // Crear el elemento de alerta
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${tipo} alert-dismissible fade show`;
  alertElement.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Añadir al contenedor
  mensajeContainer.appendChild(alertElement);
  
  // Crear instancia de alerta Bootstrap
  const bsAlert = new bootstrap.Alert(alertElement);
  
  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    bsAlert.close();
    // Eliminar del DOM después de la animación
    setTimeout(() => {
      if (alertElement.parentNode === mensajeContainer) {
        mensajeContainer.removeChild(alertElement);
      }
    }, 500);
  }, 5000);
}

// Función para mostrar el modal de login
function mostrarModalLogin() {
  // Agregar evento para actualizar UI después de login exitoso
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleLoginSubmit(e).then(() => {
        actualizarUIComentarios();
      });
    });
  }

  // Crear el modal si no existe
  if (!document.getElementById('modalLogin')) {
    const modalHTML = `
      <div class="modal fade" id="modalLogin" tabindex="-1" aria-labelledby="modalLoginLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="modalLoginLabel">Iniciar Sesión</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <!-- Formulario de Login -->
              <div id="loginFormContainer">
                <p class="mb-3">Para reservar una cancha, necesitas iniciar sesión:</p>
                
                <form id="loginForm" class="mb-3">
                  <div class="mb-3">
                    <label for="loginEmail" class="form-label">Correo Electrónico</label>
                    <input type="email" class="form-control" id="loginEmail" required>
                  </div>
                  <div class="mb-3">
                    <label for="loginPassword" class="form-label">Contraseña</label>
                    <input type="password" class="form-control" id="loginPassword" required>
                  </div>
                  <div class="d-grid">
                    <button type="submit" class="btn btn-success">Iniciar Sesión</button>
                  </div>
                </form>
                
                <div class="text-center">
                  <p>¿No tienes una cuenta?</p>
                  <button type="button" class="btn btn-outline-success" onclick="toggleAuthForms()">Registrarse</button>
                </div>
              </div>

              <!-- Formulario de Registro -->
              <div id="registerFormContainer" style="display: none;">
                <p class="mb-3">Crea tu cuenta para empezar a reservar:</p>
                
                <form id="registerForm" class="mb-3">
                  <div class="mb-3">
                    <label for="registerNombre" class="form-label">Nombre Completo</label>
                    <input type="text" class="form-control" id="registerNombre" required>
                  </div>
                  <div class="mb-3">
                    <label for="registerEmail" class="form-label">Correo Electrónico</label>
                    <input type="email" class="form-control" id="registerEmail" required>
                  </div>
                  <div class="mb-3">
                    <label for="registerTelefono" class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" id="registerTelefono" required>
                  </div>
                  <div class="mb-3">
                    <label for="registerPassword" class="form-label">Contraseña</label>
                    <input type="password" class="form-control" id="registerPassword" required>
                  </div>
                  <div class="d-grid">
                    <button type="submit" class="btn btn-success">Crear Cuenta</button>
                  </div>
                </form>
                
                <div class="text-center">
                  <p>¿Ya tienes una cuenta?</p>
                  <button type="button" class="btn btn-outline-success" onclick="toggleAuthForms()">Iniciar Sesión</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Añadir el modal al body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Función para alternar entre formularios
    window.toggleAuthForms = function() {
      const loginContainer = document.getElementById('loginFormContainer');
      const registerContainer = document.getElementById('registerFormContainer');
      const modalTitle = document.getElementById('modalLoginLabel');
      
      if (loginContainer.style.display !== 'none') {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
        modalTitle.textContent = 'Crear Cuenta';
      } else {
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
        modalTitle.textContent = 'Iniciar Sesión';
      }
    };

    // Añadir evento al formulario de login
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

    // Añadir evento al formulario de registro
    document.getElementById('registerForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const nombre = document.getElementById('registerNombre').value;
      const email = document.getElementById('registerEmail').value;
      const telefono = document.getElementById('registerTelefono').value;
      const password = document.getElementById('registerPassword').value;
      
      // Mostrar indicador de carga
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
      submitBtn.disabled = true;
      
      // Realizar la petición de registro
      fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, email, telefono, password })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Error al registrar usuario');
          });
        }
        return response.json();
      })
      .then(data => {
        // Mostrar mensaje de éxito
        mostrarMensaje('¡Cuenta creada exitosamente! Por favor, inicia sesión.', 'success');
        
        // Limpiar formulario
        this.reset();
        
        // Cambiar al formulario de login
        toggleAuthForms();
      })
      .catch(error => {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Mostrar error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = error.message;
        this.appendChild(errorDiv);
        
        // Eliminar mensaje de error después de 3 segundos
        setTimeout(() => {
          if (errorDiv.parentNode === this) {
            this.removeChild(errorDiv);
          }
        }, 3000);
      });
    });
      
      // Mostrar indicador de carga
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
      submitBtn.disabled = true;
      
      // Realizar la petición de login
      fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Error al iniciar sesión');
          });
        }
        return response.json();
      })
      .then(data => {
        // Guardar token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Cerrar el modal
        bootstrap.Modal.getInstance(document.getElementById('modalLogin')).hide();
        
        // Mostrar mensaje de éxito
        mostrarMensaje('¡Has iniciado sesión correctamente!', 'success');
        
        // Actualizar la UI para usuario logueado
        actualizarUIUsuarioLogueado();
        
        // Evitar redirección a index.html
        if (window.location.pathname.includes('detalle.html')) {
          // Permanecer en la página actual
          console.log('Permaneciendo en la página de detalles después del login');
          // Mostrar modal de confirmación de reserva
          setTimeout(() => {
            mostrarModalConfirmacion();
          }, 500);
        } else {
          // Si no estamos en detalle.html, redirigir a una página específica según el rol
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user.rol === 'admin') {
            window.location.href = 'admin-panel.html';
          } else {
            window.location.href = 'perfil.html';
          }
        }
      })
      .catch(error => {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Mostrar error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = error.message;
        this.appendChild(errorDiv);
        
        // Eliminar mensaje de error después de 3 segundos
        setTimeout(() => {
          if (errorDiv.parentNode === this) {
            this.removeChild(errorDiv);
          }
        }, 3000);
      });
    });
  }
  
  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modalLogin'));
  modal.show();
}

// Función para actualizar la UI cuando el usuario está logueado
function actualizarUIUsuarioLogueado() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Elementos de la UI
  const userMenu = document.getElementById('userMenu');
  const loginBtn = document.getElementById('loginBtn');
  const userName = document.getElementById('userName');
  
  if (token) {
    // Usuario logueado: mostrar menú de usuario y ocultar botón de login
    if (userMenu) userMenu.style.display = 'block';
    if (loginBtn) loginBtn.style.display = 'none';
    if (userName) userName.textContent = user.nombre || 'Usuario';
    
    // Añadir evento de logout si no existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && !logoutBtn.hasAttribute('data-event-attached')) {
      logoutBtn.setAttribute('data-event-attached', 'true');
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Actualizar UI
        actualizarUIUsuarioLogueado();
        // Mostrar mensaje
        mostrarMensaje('Has cerrado sesión correctamente', 'info');
      });
    }
  } else {
    // Usuario no logueado: ocultar menú de usuario y mostrar botón de login
    if (userMenu) userMenu.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'block';
  }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
  cargarInfoCancha(canchaId);
  cargarHorariosDisponibles(canchaId, fechaParam);
  
  // Cargar canchas cercanas
  cargarCanchasCercanas();
  
  // Actualizar UI si el usuario está logueado
  actualizarUIUsuarioLogueado();
  
  // Verificar que se encontraron los elementos
  if (!btnReservar) {
    console.error('No se encontró el botón de reserva');
    // Intentar obtenerlo después de un breve retraso
    setTimeout(() => {
      btnReservar = document.getElementById('btnReservar');
      if (btnReservar) {
        console.log('Botón de reserva encontrado después del retraso');
        btnReservar.addEventListener('click', realizarReserva);
        btnReservar.disabled = true; // Inicialmente deshabilitado
      }
    }, 500);
  } else {
    console.log('Botón de reserva encontrado');
    btnReservar.addEventListener('click', realizarReserva);
    btnReservar.disabled = true; // Inicialmente deshabilitado
  }
});

// Cargar canchas cercanas
async function cargarCanchasCercanas() {
  try {
    // Primero obtenemos la información de la cancha actual para conocer su ciudad
    let ciudadActual = 'Cali'; // Ciudad por defecto
    
    try {
      // Intentar obtener la cancha actual para conocer su ciudad
      const canchaResponse = await fetch(`http://localhost:3000/api/canchas/${canchaId}`);
      if (canchaResponse.ok) {
        const canchaActual = await canchaResponse.json();
        ciudadActual = canchaActual.ciudad || ciudadActual;
        console.log(`Ciudad de la cancha actual: ${ciudadActual}`);
      }
    } catch (err) {
      console.warn('No se pudo obtener la ciudad de la cancha actual:', err);
    }
    
    // Llamada a la API para obtener canchas de la misma ciudad
    console.log(`Buscando canchas cercanas en: ${ciudadActual}`);
    const response = await fetch(`http://localhost:3000/api/canchas?ciudad=${encodeURIComponent(ciudadActual)}`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener canchas: ${response.status}`);
    }
    
    const canchas = await response.json();
    console.log(`Canchas encontradas en ${ciudadActual}:`, canchas);
    
    // Filtrar para no mostrar la cancha actual y limitar a 2 canchas
    const canchasCercanas = canchas
      .filter(c => c.id != canchaId)
      .slice(0, 2);
    
    if (canchasCercanas.length > 0) {
      console.log('Mostrando canchas cercanas:', canchasCercanas);
      actualizarCanchasCercanas(canchasCercanas);
    } else {
      console.log('No se encontraron canchas cercanas en la misma ciudad');
    }
  } catch (error) {
    console.error('Error al cargar canchas cercanas:', error);
    // Si falla, dejamos las canchas de ejemplo que ya pusimos en el HTML
  }
}

// Actualizar la sección de canchas cercanas
function actualizarCanchasCercanas(canchas) {
  const contenedor = document.getElementById('canchasCercanas');
  
  // Si no hay contenedor, salimos
  if (!contenedor) {
    console.error('No se encontró el contenedor de canchas cercanas');
    return;
  }
  
  // Ocultar el indicador de carga
  const cargandoElement = document.getElementById('cargando-canchas');
  if (cargandoElement) {
    cargandoElement.style.display = 'none';
  }
  
  // Si no hay canchas, mostrar mensaje
  if (!canchas || canchas.length === 0) {
    contenedor.innerHTML = `
      <div class="col-12 text-center py-3">
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          No se encontraron otras canchas en esta ciudad.
        </div>
      </div>
    `;
    return;
  }
  
  // Limpiar contenedor (excepto el elemento de carga)
  if (cargandoElement) {
    // Si existe el elemento de carga, solo ocultarlo y añadir las canchas
    contenedor.innerHTML = '';
  }
  
  // Añadir cada cancha
  canchas.forEach(cancha => {
    const distancia = Math.round((Math.random() * 3 + 0.5) * 10) / 10; // Distancia aleatoria entre 0.5 y 3.5 km
    
    const html = `
      <div class="col-md-6 mb-3">
        <div class="card h-100">
          <img src="${cancha.imagen || cancha.foto || 'images/cancha-default.jpg'}" class="card-img-top" alt="${cancha.nombre}" style="height: 150px; object-fit: cover;" onerror="this.src='images/cancha1.jpg'">
          <div class="card-body">
            <h5 class="card-title">${cancha.nombre}</h5>
            <p class="card-text small">
              <i class="fas fa-map-marker-alt text-danger me-1"></i> A ${distancia} km
            </p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-success fw-bold">$${cancha.precio?.toLocaleString() || '85,000'}</span>
              <a href="detalle.html?id=${cancha.id}" class="btn btn-sm btn-outline-success">Ver detalles</a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    contenedor.innerHTML += html;
  });
  
  console.log(`Se mostraron ${canchas.length} canchas cercanas`);
}