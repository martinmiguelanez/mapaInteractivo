document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Evitar el envío normal del formulario

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Hacer una petición AJAX para verificar el usuario
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Almacenar el user_id en localStorage
            localStorage.setItem('user_id', data.user_id);
            window.location.href = 'main.html'; // Redirigir a main.html si la autenticación es exitosa
        } else {
            showAlert(data.message, 'danger'); // Mostrar alerta si hay error
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error en el servidor. Por favor, inténtalo más tarde.', 'danger');
    });
});

// Función para mostrar mensajes de alerta
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerText = message;
    const container = document.getElementById('alertContainer'); // Usar el contenedor de alertas
    container.appendChild(alertDiv);

    // Remover la alerta después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Lógica para mostrar/ocultar la contraseña
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
});
