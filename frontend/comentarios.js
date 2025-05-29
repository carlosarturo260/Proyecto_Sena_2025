// Funciones para manejar los comentarios de las canchas

// Event listeners para actualizar UI
document.addEventListener('DOMContentLoaded', function() {
  actualizarUIFormularioComentarios();
  
  // Agregar event listener para el formulario de comentarios
  const formularioComentario = document.getElementById('formulario-comentario');
  if (formularioComentario) {
    formularioComentario.addEventListener('submit', function(e) {
      e.preventDefault();
      enviarComentario();
    });
  }
});

// Escuchar cambios en el token
window.addEventListener('storage', function(e) {
  if (e.key === 'token') {
    actualizarUIFormularioComentarios();
  }
});


// Función para actualizar la UI de comentarios según autenticación
function actualizarUIFormularioComentarios() {
  const token = localStorage.getItem('token');
  const seccionNuevoComentario = document.getElementById('seccion-nuevo-comentario');
  const mensajeLoginComentario = document.getElementById('mensaje-login-comentario');

  if (token && seccionNuevoComentario && mensajeLoginComentario) {
    seccionNuevoComentario.style.display = 'block';
    mensajeLoginComentario.style.display = 'none';
  } else if (seccionNuevoComentario && mensajeLoginComentario) {
    seccionNuevoComentario.style.display = 'none';
    mensajeLoginComentario.style.display = 'block';
  }
}

// Función para cargar los comentarios de una cancha específica
async function cargarComentarios(canchaId) {
  // Actualizar el ID de la cancha en el formulario
  const formularioComentario = document.querySelector('#formulario-comentario input[name="cancha_id"]');
  if (formularioComentario) {
    formularioComentario.value = canchaId;
  }

  // Actualizar la UI del formulario
  actualizarUIFormularioComentarios();
  try {
    const comentariosContainer = document.getElementById('comentarios-container');
    if (!comentariosContainer) return;

    // Mostrar indicador de carga
    comentariosContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-success" role="status"></div><p class="mt-2">Cargando comentarios...</p></div>';

    // Obtener los comentarios de la API
    const response = await fetch(`http://localhost:3000/api/comentarios/${canchaId}`);
    if (!response.ok) throw new Error('No se pudieron cargar los comentarios');

    const comentarios = await response.json();

    // Obtener la calificación promedio
    const promedioResponse = await fetch(`http://localhost:3000/api/comentarios/${canchaId}/promedio`);
    const promedioData = await promedioResponse.json();

    // Actualizar la calificación promedio en la UI
    const calificacionPromedio = document.getElementById('calificacion-promedio');
    if (calificacionPromedio) {
      calificacionPromedio.innerHTML = generarEstrellasHTML(promedioData.promedio);
      document.getElementById('total-comentarios').textContent = `(${promedioData.total} opiniones)`;
    }

    // Si no hay comentarios, mostrar mensaje
    if (comentarios.length === 0) {
      comentariosContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Esta cancha aún no tiene comentarios. ¡Sé el primero en opinar!
        </div>
      `;
      return;
    }

    // Generar HTML para los comentarios
    let comentariosHTML = '';
    comentarios.forEach(comentario => {
      const fecha = new Date(comentario.fecha_creacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      comentariosHTML += `
        <div class="comentario-item mb-4" data-id="${comentario.id}">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="mb-1">${comentario.nombre_usuario || 'Usuario'}</h5>
              <div class="estrellas mb-2">${generarEstrellasHTML(comentario.calificacion)}</div>
            </div>
            <small class="text-muted">${fecha}</small>
          </div>
          <p class="comentario-texto">${comentario.comentario}</p>
          ${mostrarBotonesAccion(comentario)}
        </div>
        <hr>
      `;
    });

    comentariosContainer.innerHTML = comentariosHTML;

    // Agregar eventos a los botones de eliminar
    document.querySelectorAll('.btn-eliminar-comentario').forEach(btn => {
      btn.addEventListener('click', function() {
        const comentarioId = this.getAttribute('data-id');
        eliminarComentario(comentarioId);
      });
    });

  } catch (error) {
    console.error('Error al cargar comentarios:', error);
    const comentariosContainer = document.getElementById('comentarios-container');
    if (comentariosContainer) {
      comentariosContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar los comentarios: ${error.message}
        </div>
      `;
    }
  }
}

// Función para generar HTML de estrellas según calificación
function generarEstrellasHTML(calificacion) {
  const estrellaLlena = '<i class="fas fa-star text-warning"></i>';
  const estrellaMedia = '<i class="fas fa-star-half-alt text-warning"></i>';
  const estrellaVacia = '<i class="far fa-star text-warning"></i>';
  
  let html = '';
  const calificacionNum = parseFloat(calificacion) || 0;
  
  // Estrellas completas
  const estrellasCompletas = Math.floor(calificacionNum);
  for (let i = 0; i < estrellasCompletas; i++) {
    html += estrellaLlena;
  }
  
  // Estrella media si corresponde
  if (calificacionNum % 1 >= 0.5) {
    html += estrellaMedia;
  }
  
  // Estrellas vacías
  const estrellasVacias = 5 - Math.ceil(calificacionNum);
  for (let i = 0; i < estrellasVacias; i++) {
    html += estrellaVacia;
  }
  
  return html;
}

// Función para mostrar botones de acción según permisos del usuario
function mostrarBotonesAccion(comentario) {
  // Verificar si el usuario está logueado
  const token = localStorage.getItem('token');
  if (!token) return '';
  
  try {
    // Decodificar el token para obtener el ID del usuario y si es admin
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const usuarioId = tokenData.id;
    const esAdmin = tokenData.isAdmin;
    
    // Mostrar botón de eliminar si es el autor o es admin
    if (comentario.usuario_id === usuarioId || esAdmin) {
      return `
        <div class="mt-2 text-end">
          <button class="btn btn-sm btn-outline-danger btn-eliminar-comentario" data-id="${comentario.id}">
            <i class="fas fa-trash-alt me-1"></i> Eliminar
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al verificar permisos:', error);
  }
  
  return '';
}

// Función para enviar un nuevo comentario
async function enviarComentario() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Debes iniciar sesión para comentar');
    return;
  }

  const formulario = document.getElementById('formulario-comentario');
  const canchaId = formulario.querySelector('input[name="cancha_id"]').value;
  const comentario = formulario.querySelector('textarea[name="comentario"]').value;
  
  // Obtener la calificación seleccionada
  const calificacionInput = formulario.querySelector('input[name="calificacion"]:checked');
  if (!calificacionInput) {
    alert('Por favor selecciona una calificación');
    return;
  }
  const calificacion = calificacionInput.value;

  if (!comentario.trim()) {
    alert('Por favor escribe un comentario');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/comentarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cancha_id: canchaId,
        comentario,
        calificacion
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar el comentario');
    }

    // Limpiar el formulario
    formulario.querySelector('textarea[name="comentario"]').value = '';
    const calificacionInputs = formulario.querySelectorAll('input[name="calificacion"]');
    calificacionInputs.forEach(input => input.checked = false);

    // Recargar los comentarios para mostrar el nuevo
    cargarComentarios(canchaId);

    alert('¡Comentario enviado con éxito!');
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Error al enviar el comentario');
  }
}

// Función para eliminar un comentario
async function eliminarComentario(comentarioId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Debes iniciar sesión para eliminar comentarios');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/comentarios/${comentarioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el comentario');
    }
    
    // Obtener el ID de la cancha actual
    const params = new URLSearchParams(window.location.search);
    const canchaId = params.get('id');
    
    // Recargar los comentarios
    cargarComentarios(canchaId);
    
    // Mostrar mensaje de éxito
    alert('Comentario eliminado con éxito');
    
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    alert(`Error: ${error.message}`);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el ID de la cancha de la URL
  const params = new URLSearchParams(window.location.search);
  const canchaId = params.get('id');
  
  if (canchaId) {
    // Cargar los comentarios
    cargarComentarios(canchaId);
    
    // Configurar el formulario de comentarios
    const formularioComentario = document.getElementById('formulario-comentario');
    if (formularioComentario) {
      // Establecer el ID de la cancha en el formulario
      const inputCanchaId = formularioComentario.querySelector('input[name="cancha_id"]');
      if (inputCanchaId) {
        inputCanchaId.value = canchaId;
      }
      
      // Agregar evento de envío
      formularioComentario.addEventListener('submit', enviarComentario);
    }
    
    // Verificar si el usuario está logueado para mostrar/ocultar el formulario
    const token = localStorage.getItem('token');
    const seccionFormulario = document.getElementById('seccion-nuevo-comentario');
    const mensajeLogin = document.getElementById('mensaje-login-comentario');
    
    if (seccionFormulario && mensajeLogin) {
      if (token) {
        seccionFormulario.style.display = 'block';
        mensajeLogin.style.display = 'none';
      } else {
        seccionFormulario.style.display = 'none';
        mensajeLogin.style.display = 'block';
      }
    }
  }
});