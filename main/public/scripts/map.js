window.onload = function() {
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        window.location.href = '/login';
        return;
    }

    loadVisitedCountries(userId);
    initCountryEventHandlers(); // Inicializar los eventos después de cargar los países
};

const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalCountry = document.getElementById("modal-country");
const switchButton = document.getElementById("country-switch");
const qualificationInput = document.getElementById("qualification");
const visitDateInput = document.getElementById("visitDate");
const noteInput = document.getElementById("note");
const saveChangesButton = document.getElementById("saveChanges");
let currentCountry; // Variable para almacenar el país actualmente seleccionado

// Función para cargar los países visitados desde la base de datos
function loadVisitedCountries(userId) {
    fetch(`/visited-countries/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const visitedCountries = data.visitedCountries;
                visitedCountries.forEach(country => {
                    const countryElements = document.querySelectorAll(`.allPaths[id='${country}']`);
                    countryElements.forEach(element => {
                        element.dataset.originalColor = '#8470FF'; // Guardar el color visitado en el dataset
                        element.style.fill = '#8470FF'; // Cambiar a morado si está visitado
                    });
                });
            } else {
                console.error('Error al obtener los países visitados:', data.message);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
        });
}

// Inicializar los eventos de los países
function initCountryEventHandlers() {
    document.querySelectorAll(".allPaths").forEach(function (path) {
        path.addEventListener("click", function () {
            currentCountry = this.id; // Almacena el país seleccionado
            modalCountry.innerText = currentCountry; // Mostrar en el modal
            modal.style.display = "block"; // Mostrar el modal
            loadCountryData(currentCountry); // Cargar datos del país
        });

        // Manejador para el efecto de mouseover
        path.addEventListener("mouseover", function () {
            this.dataset.originalColor = this.style.fill; // Guardar el color original antes de cambiarlo
            this.style.fill = "#B0C4DE"; // Cambiar color a azul claro temporalmente
        });

        // Manejador para el efecto de mouseleave
        path.addEventListener("mouseleave", function () {
            this.style.fill = this.dataset.originalColor || "#ececec"; // Volver al color original
        });

        // Manejador para mostrar el nombre del país junto al ratón
        path.addEventListener("mousemove", function (event) {
            const nameElement = document.getElementById("name");
            nameElement.innerText = this.id; // Mostrar el nombre del país (el id es el nombre)
            nameElement.style.top = (event.clientY - 40) + 'px'; // Ajustar la posición vertical
            nameElement.style.left = (event.clientX + 10) + 'px'; // Ajustar la posición horizontal
            nameElement.style.opacity = 1; // Hacer visible el nombre del país
        });

        // Asegurarse de ocultar el nombre cuando el ratón se salga del país
        path.addEventListener("mouseleave", function () {
            const nameElement = document.getElementById("name");
            nameElement.style.opacity = 0; // Ocultar el nombre al salir del país
        });
    });
}

// Función para formatear la fecha para el input de tipo date
function formatDateForInput(dateString) {
    if (!dateString) return ''; // Si no hay fecha, devuelve cadena vacía
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes en formato MM
    const day = String(date.getDate()).padStart(2, '0'); // Día en formato DD
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
}

// Cargar datos del país seleccionado
function loadCountryData(countryName) {
    fetch(`/get-country-data?user_id=${localStorage.getItem('user_id')}&country=${countryName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                switchButton.checked = data.visited; // Actualizar el estado del switch
                qualificationInput.value = data.qualification || ''; // Cargar calificación
                visitDateInput.value = formatDateForInput(data.visitDate); // Cargar y formatear fecha de visita
                noteInput.value = data.note || ''; // Cargar notas
                qualificationInput.disabled = !data.visited; // Deshabilitar si no está visitado
                visitDateInput.disabled = !data.visited; // Deshabilitar si no está visitado
                noteInput.disabled = !data.visited; // Deshabilitar si no está visitado
            } else {
                console.error('Error al obtener los datos del país:', data.message);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
        });
}

// Cerrar el modal
span.onclick = function () {
    modal.style.display = "none";
};

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Cambiar el estado del switch
switchButton.addEventListener("change", function () {
    const visited = this.checked;

    // Habilitar o deshabilitar los campos según el estado del switch
    if (visited) {
        qualificationInput.disabled = false;
        visitDateInput.disabled = false;
        noteInput.disabled = false;
    } else {
        qualificationInput.disabled = true;
        visitDateInput.disabled = true;
        noteInput.disabled = true;
        // Limpiar los campos si se desmarca
        // No se limpian los campos, solo se deshabilitan
    }
    updateCountryStatus(currentCountry, visited);
});

// Guardar cambios en el país
saveChangesButton.addEventListener("click", function () {
    const visited = switchButton.checked;
    const qualification = qualificationInput.value;
    const visitDate = visitDateInput.value;
    const note = noteInput.value;

    updateCountryStatus(currentCountry, visited, qualification, visitDate, note);
});

// Función para actualizar el estado del país
function updateCountryStatus(countryName, visited, qualification, visitDate, note) {
    fetch('/update-country', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: localStorage.getItem('user_id'), // Usar el ID del usuario correcto
            country: countryName,
            visited: visited,
            qualification: qualification,
            visitDate: visitDate,
            note: note
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('País actualizado correctamente');
            const countryElements = document.querySelectorAll(`.allPaths[id='${countryName}']`);
            countryElements.forEach(element => {
                element.dataset.originalColor = visited ? '#8470FF' : '#ececec'; // Actualizar color en el dataset
                element.style.fill = visited ? '#8470FF' : '#ececec'; // Actualizar color según el estado visitado
            });
            modal.style.display = "none"; // Cerrar el modal después de guardar los cambios
        } else {
            console.error('Error al actualizar el país:', data.message);
        }
    })
    .catch(error => {
        console.error('Error en la solicitud:', error);
    });
}

// Obtener elementos del DOM
const avatar = document.getElementById('avatar');
const sidebar = document.getElementById('sidebar');

// Evento para mostrar/ocultar el menú lateral al hacer clic en el avatar
avatar.addEventListener('click', function() {
    sidebar.style.left = sidebar.style.left === '0px' ? '-250px' : '0px';
});

// Ocultar el menú si se hace clic fuera de él
window.addEventListener('click', function(event) {
    if (!avatar.contains(event.target) && !sidebar.contains(event.target) && sidebar.style.left === '0px') {
        sidebar.style.left = '-250px'; // Oculta el menú
    }
});

function logout() {
    // Aquí puedes realizar cualquier acción para cerrar sesión, como eliminar un token
    // localStorage.removeItem('token'); // Si usas localStorage
    // sessionStorage.removeItem('token'); // Si usas sessionStorage

    // Redirige a la página de inicio de sesión
    window.location.href = '/login';
}

// Asignar la función al evento clic del enlace de logout
document.getElementById('logoutLink').addEventListener('click', function(event) {
    event.preventDefault();
    logout();
});

document.getElementById('menuToggle').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.left === '0px') {
        sidebar.style.left = '-250px'; // Ocultar
    } else {
        sidebar.style.left = '0px'; // Mostrar
    }
});
