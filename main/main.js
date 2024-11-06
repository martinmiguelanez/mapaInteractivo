// Importar las librerías necesarias
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Importar bcrypt para el cifrado de contraseñas

const app = express();
const port = 3000;

// Crear conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'usuarios',
    port: 3306
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

// Middleware para análisis de cuerpo de la solicitud
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para manejar el registro de usuarios
app.post('/register', async (req, res) => {
    let { username, email, password, telefono } = req.body;

    // Convertir username y email a minúsculas
    username = username.toLowerCase();
    email = email.toLowerCase();

    // Verificar si el usuario ya existe
    const checkQuery = 'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR telefono = ?';
    connection.query(checkQuery, [username, email, telefono || null], async (err, results) => {
        if (err) {
            console.error('Error al verificar la existencia del usuario:', err);
            return res.status(500).send({ error: 'Error al verificar la existencia del usuario' });
        }

        if (results.length > 0) {
            const duplicateField = results.find(user => user.username.toLowerCase() === username)
                ? 'El nombre de usuario ya está en uso'
                : results.find(user => user.email.toLowerCase() === email)
                    ? 'El correo electrónico ya está en uso'
                    : 'El número de teléfono ya está en uso';

            return res.status(409).send({ error: duplicateField });
        }

        // Cifrar la contraseña antes de guardarla
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar el nuevo usuario con la contraseña cifrada
        const insertQuery = 'INSERT INTO users (username, email, password, telefono) VALUES (?, ?, ?, ?)';
        connection.query(insertQuery, [username, email, hashedPassword, telefono || null], (err, results) => {
            if (err) {
                console.error('Error al registrar el usuario:', err);
                return res.status(500).send({ error: 'Error al registrar el usuario' });
            }

            res.status(200).send({ success: true, user_id: results.insertId });
        });
    });
});


// Ruta para manejar el inicio de sesión
app.post('/login', async (req, res) => {
    let { username, password } = req.body;
    username = username.toLowerCase();

    // Consulta el usuario en la base de datos
    const query = 'SELECT * FROM users WHERE username = ?';
    connection.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error al consultar el usuario:', err);
            return res.status(500).send({ success: false, message: 'Error en el servidor.' });
        }

        if (results.length === 0) {
            // Usuario no encontrado
            return res.status(401).send({ success: false, message: 'Usuario no existe.' });
        }

        const user = results[0];

        // Imprimir la contraseña y el hash para depuración
        console.log('Contraseña ingresada:', password);
        console.log('Hash almacenado:', user.password);

        // Comparar la contraseña cifrada usando bcrypt.compare
        try {
            const passwordMatch = await bcrypt.compare(password, user.password);
            console.log('Resultado de bcrypt.compare:', passwordMatch);

            if (!passwordMatch) {
                // Contraseña incorrecta
                return res.status(401).send({ success: false, message: 'Contraseña incorrecta.' });
            }

            // Si todo es correcto
            res.status(200).send({ success: true, user_id: user.id });
        } catch (compareError) {
            console.error('Error al comparar las contraseñas:', compareError);
            return res.status(500).send({ success: false, message: 'Error al verificar la contraseña.' });
        }
    });
});



// Ruta para actualizar el estado del país visitado y opcionalmente otros campos
app.post('/update-country', (req, res) => {
    const { user_id, country, visited, qualification, visitDate, note } = req.body;

    // Verifica si el usuario existe
    connection.query('SELECT * FROM users WHERE id = ?', [user_id], (err, results) => {
        if (err) {
            console.error('Error al consultar el usuario:', err);
            return res.status(500).send({ success: false, message: 'Error en el servidor.' });
        }

        if (results.length === 0) {
            return res.status(404).send({ success: false, message: 'Usuario no encontrado.' });
        }

        // Actualizar el estado del país en la base de datos
        const query = `
            UPDATE user_countries
            SET visited = ?,
                qualification = COALESCE(?, qualification),
                visitDate = COALESCE(?, visitDate),
                note = COALESCE(?, note)
            WHERE user_id = ? AND country = ?`;

        connection.query(query, [visited, qualification, visitDate, note, user_id, country], (err, results) => {
            if (err) {
                console.error('Error al actualizar el estado del país en la base de datos:', err);
                return res.status(500).send({ success: false, message: 'Error al actualizar el estado del país.' });
            }

            // La actualización se realizó correctamente
            res.status(200).send({ success: true });
        });
    });
});




// Ruta para comprobar el estado del país visitado
app.get('/check-country-status', (req, res) => {
    const { user_id, country } = req.query;

    connection.query('SELECT visited FROM user_countries WHERE user_id = ? AND country = ?', [user_id, country], (err, results) => {
        if (err) {
            console.error('Error al consultar el estado del país:', err);
            return res.status(500).send({ success: false, message: 'Error en el servidor.' });
        }

        if (results.length > 0) {
            // El país está en la base de datos
            res.status(200).send({ success: true, visited: results[0].visited });
        } else {
            // El país no está en la base de datos
            res.status(200).send({ success: true, visited: false });
        }
    });
});

// Ruta para obtener los países visitados por un usuario
app.get('/visited-countries/:user_id', (req, res) => {
    const user_id = req.params.user_id;

    const query = 'SELECT country FROM user_countries WHERE user_id = ? AND visited = true';
    connection.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error al obtener los países visitados:', err);
            return res.status(500).send({ success: false, message: 'Error al obtener los países visitados.' });
        }

        const visitedCountries = results.map(row => row.country);
        res.status(200).send({ success: true, visitedCountries });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

// Ruta para obtener los datos de un país
app.get('/get-country-data', (req, res) => {
    const { user_id, country } = req.query;

    connection.query('SELECT visited, qualification, visitDate, note FROM user_countries WHERE user_id = ? AND country = ?', [user_id, country], (err, results) => {
        if (err) {
            console.error('Error al consultar los datos del país:', err);
            return res.status(500).send({ success: false, message: 'Error en el servidor.' });
        }

        if (results.length > 0) {
            const data = results[0];
            res.status(200).send({ success: true, visited: data.visited, qualification: data.qualification, visitDate: data.visitDate, note: data.note });
        } else {
            res.status(200).send({ success: true, visited: false, qualification: '', visitDate: '', note: '' });
        }
    });
});


// route.js
app.post('/logout', (req, res) => {
    req.session.destroy(err => { // O elimina el token de autenticación
        if (err) {
            return res.redirect('/'); // Maneja el error y redirige
        }
        res.redirect('/login'); // Redirige al inicio de sesión
    });
});


