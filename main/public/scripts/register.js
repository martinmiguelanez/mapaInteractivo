document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const telefono = document.getElementById('telefono').value;

    // Validar el nombre de usuario (al menos 3 caracteres)
    if (username.length < 3) {
        showAlert('El nombre de usuario debe tener al menos 3 caracteres', 'danger');
        return;
    }

    // Validar formato de email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showAlert('Introduce un correo electrónico válido', 'danger');
        return;
    }

    // Validar la contraseña (al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial)
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(password)) {
        showAlert('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.', 'danger');
        return;
    }

    // Validar el teléfono (opcional, pero si se ingresa debe tener formato válido)
    const telefonoPattern = /^\d{9,15}$/;
    if (telefono && !telefonoPattern.test(telefono)) {
        showAlert('Introduce un número de teléfono válido (9-15 dígitos)', 'danger');
        return;
    }

    // Enviar los datos usando fetch API
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            username: username,
            email: email,
            password: password,
            telefono: telefono
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // Si hay un error (usuario ya existente), mostrar la alerta
            showAlert(data.error, 'danger');
        } else {
            // Almacenar el user_id en localStorage si el registro fue exitoso
            localStorage.setItem('user_id', data.user_id);

            // Mostrar un mensaje de éxito y redirigir
            showAlert('Registro exitoso. Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = '/main'; // Redirigir a la página principal
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error en la solicitud:', error);
        showAlert('Error al registrar el usuario. Inténtalo de nuevo.', 'danger');
    });

});

// Función para mostrar mensajes de alerta
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerText = message;
    const container = document.getElementById('alertContainer');
    container.appendChild(alertDiv);

    // Remover la alerta después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Función para mostrar/ocultar la contraseña
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});
