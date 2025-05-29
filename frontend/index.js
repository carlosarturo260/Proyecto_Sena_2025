// Función para actualizar la UI según el estado de autenticación
function actualizarUI() {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const btnIniciarSesion = document.getElementById('btnIniciarSesion');
    const userDropdown = document.getElementById('userDropdown');
    const nombreUsuario = document.getElementById('nombreUsuario');
    const adminLink = document.querySelector('.admin-link');

    if (token) {
        // Usuario autenticado
        btnIniciarSesion.style.display = 'none';
        userDropdown.style.display = 'block';
        nombreUsuario.textContent = userData.nombre || 'Usuario';

        // Mostrar/ocultar enlace de administración según isAdmin
        if (userData.isAdmin) {
            adminLink.classList.remove('d-none');
        } else {
            adminLink.classList.add('d-none');
        }
    } else {
        // Usuario no autenticado
        btnIniciarSesion.style.display = 'block';
        userDropdown.style.display = 'none';
        adminLink.classList.add('d-none');
    }
}

// Función para mostrar el modal de login
function mostrarModalLogin() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    actualizarUI();
    window.location.reload();
}

// Función para manejar el inicio de sesión
async function iniciarSesion(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Error en la autenticación');
        }

        const data = await response.json();
        
        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify({
            nombre: data.user.nombre,
            email: data.user.email,
            isAdmin: data.user.isAdmin
        }));

        // Cerrar modal y actualizar UI
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        actualizarUI();

        // Redirigir a panel de administración si es admin
        if (data.user.isAdmin) {
            window.location.href = 'admin-panel.html';
        }

        // Disparar evento de login exitoso
        document.dispatchEvent(new Event('loginSuccess'));

    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
}

// Inicializar la UI cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    actualizarUI();

    // Agregar listener para el formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', iniciarSesion);
    }
});