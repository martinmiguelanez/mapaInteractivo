window.onload = function() {
    const userId = localStorage.getItem('user_id');  // Obtenemos el ID del usuario

    // Si no hay ID de usuario, redirigimos al login
    if (!userId) {
        window.location.href = '/login';
        return;
    }

    loadVisitedCountries(userId);  // Cargar los países visitados
    initCountryEventHandlers();    // Inicializar los eventos de los países
};

const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const modalCountry = document.getElementById("modal-country");
const switchButton = document.getElementById("country-switch");
const qualificationInput = document.getElementById("qualification");
const visitDateInput = document.getElementById("visitDate");
const noteInput = document.getElementById("note");
const saveChangesButton = document.getElementById("saveChanges");
let currentCountry;  // Variable para almacenar el país actual

// Cargar los países visitados desde la base de datos
function loadVisitedCountries(userId) {
    fetch(`/visited-countries/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const visitedCountries = data.visitedCountries;
                visitedCountries.forEach(country => {
                    const countryElements = document.querySelectorAll(`.allPaths[id='${country}']`);
                    countryElements.forEach(element => {
                        // Guardamos el color original y cambiamos a morado si está visitado
                        if (!element.dataset.originalColor) {
                            element.dataset.originalColor = element.style.fill || "#ececec";
                        }
                        element.style.fill = '#8470FF'; // Color morado para visitados
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

// Inicializar los eventos para los países del mapa
function initCountryEventHandlers() {
    document.querySelectorAll(".allPaths").forEach(function (path) {
        path.addEventListener("click", function () {
            currentCountry = this.id;  // Guardamos el país seleccionado
            modalCountry.innerText = currentCountry;  // Mostrar el país en el modal
            modal.style.display = "block";  // Mostrar modal
            loadCountryData(currentCountry);  // Cargar datos del país
        });

        // Efecto de mouseover: cambia el color a azul claro
        path.addEventListener("mouseover", function () {
            this.dataset.originalColor = this.style.fill;
            this.style.fill = "#B0C4DE";  // Azul claro
        });

        // Efecto de mouseleave: restaurar el color original
        path.addEventListener("mouseleave", function () {
            this.style.fill = this.dataset.originalColor || "#ececec";  // Volver al color original
        });
    });
}

// Cargar los datos del país
function loadCountryData(countryName) {
    fetch(`/get-country-data?user_id=${localStorage.getItem('user_id')}&country=${countryName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Actualizar el estado del switch y cargar los datos
                switchButton.checked = data.visited;
                qualificationInput.value = data.qualification || '';  // Si no hay calificación, dejamos vacío
                visitDateInput.value = data.visitDate ? formatDateToInput(data.visitDate) : '';  // Formateamos la fecha
                noteInput.value = data.note || '';  // Si no hay nota, dejamos vacío

                // Deshabilitar los campos si no está visitado
                qualificationInput.disabled = !data.visited;
                visitDateInput.disabled = !data.visited;
                noteInput.disabled = !data.visited;

                // Actualizar el color del país según si está visitado
                updateCountryColor(countryName, data.visited);
            } else {
                console.error('Error al obtener los datos del país:', data.message);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
        });
}

// Formatear la fecha para input de tipo date (yyyy-mm-dd)
function formatDateToInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');  // Mes con 2 dígitos
    const day = String(d.getDate()).padStart(2, '0');  // Día con 2 dígitos
    return `${year}-${month}-${day}`;
}

// Actualizar el color del país en el mapa
function updateCountryColor(countryName, visited) {
    const countryElements = document.querySelectorAll(`.allPaths[id='${countryName}']`);
    countryElements.forEach(element => {
        // Si está visitado, lo ponemos morado, si no, blanco
        element.style.fill = visited ? "#8470FF" : "#ececec";
    });
}

// Cerrar el modal cuando se hace click en la X
span.onclick = function () {
    modal.style.display = "none";
};

// Cerrar el modal si se hace click fuera de él
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Cambiar el estado del país al activar o desactivar el switch
switchButton.addEventListener("change", function () {
    const visited = this.checked;

    // Habilitar o deshabilitar los campos dependiendo del estado del switch
    qualificationInput.disabled = !visited;
    visitDateInput.disabled = !visited;
    noteInput.disabled = !visited;

    // Actualizar color del país en el mapa
    updateCountryColor(currentCountry, visited);

    // Guardar el cambio en la base de datos
    updateCountryStatus(currentCountry, visited);
});

// Guardar los cambios del país cuando se presiona el botón de guardar
saveChangesButton.addEventListener("click", function () {
    const visited = switchButton.checked;
    const qualification = qualificationInput.value;
    const visitDate = visitDateInput.value;
    const note = noteInput.value;

    updateCountryStatus(currentCountry, visited, qualification, visitDate, note);
});

// Actualizar el estado del país en la base de datos
function updateCountryStatus(countryName, visited, qualification, visitDate, note) {
    const visitedValue = visited ? 1 : 0;  // Convertimos a 1 o 0

    fetch('/update-country', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: localStorage.getItem('user_id'),
            country: countryName,
            visited: visitedValue,
            qualification: qualification,
            visitDate: visitDate,
            note: note
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('País actualizado correctamente');
            updateCountryColor(countryName, visited);  // Actualizar color del país
        } else {
            console.error('Error al actualizar el país:', data.message);
        }
    })
    .catch(error => {
        console.error('Error en la solicitud:', error);
    });

    // Cerrar el modal después de guardar
    modal.style.display = "none";
}

// Obtén los elementos del DOM
const avatar = document.getElementById('avatar');
const sidebar = document.getElementById('sidebar');

// Evento de clic en el avatar para abrir/cerrar el menú lateral
avatar.addEventListener('click', () => {
    if (sidebar.style.left === '-250px') {
        sidebar.style.left = '0';  // Muestra el menú lateral
    } else {
        sidebar.style.left = '-250px';  // Oculta el menú lateral
    }
});

// Obtén el enlace de logout
const logoutLink = document.getElementById('logoutLink');

// Evento de clic para cerrar sesión
logoutLink.addEventListener('click', (event) => {
    event.preventDefault(); // Evitar que el enlace redirija de inmediato

    // Elimina la sesión del usuario (esto depende de cómo manejas la sesión)
    sessionStorage.removeItem('user');  // Si usas sessionStorage
    localStorage.removeItem('user');   // Si usas localStorage
    // Si tienes otras formas de manejar la sesión (por ejemplo, cookies), también las puedes borrar aquí

    // Redirige a la página de login
    window.location.href = '/login';  // Cambia '/login' a la URL de tu página de login
});

