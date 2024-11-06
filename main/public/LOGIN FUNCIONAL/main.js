// Importar las librerías necesarias
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

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
app.post('/register', (req, res) => {
    let { username, email, password, telefono } = req.body;

    // Convertir username y email a minúsculas por conflictos por duplicados de mayusculas y minusculas
    username = username.toLowerCase();
    email = email.toLowerCase();

    // Verificar si el usuario ya existe (usando username y email en minúsculas)
    const checkQuery = 'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR telefono = ?';

    connection.query(checkQuery, [username, email, telefono || null], (err, results) => {
        if (err) {
            console.error('Error al verificar la existencia del usuario:', err);
            return res.status(500).send({ error: 'Error al verificar la existencia del usuario' });
        }

        if (results.length > 0) {
            // Si el usuario ya existe, error duplicado
            const duplicateField = results.find(user => user.username.toLowerCase() === username)
                ? 'El nombre de usuario ya está en uso'
                : results.find(user => user.email.toLowerCase() === email)
                    ? 'El correo electrónico ya está en uso'
                    : 'El número de teléfono ya está en uso';

            return res.status(409).send({ error: duplicateField });
        }

        // Insertar el nuevo usuario si no hay duplicados
        const insertQuery = 'INSERT INTO users (username, email, password, telefono) VALUES (?, ?, ?, ?)';

        connection.query(insertQuery, [username, email, password, telefono || null], (err, results) => {
            if (err) {
                console.error('Error al registrar el usuario:', err);
                return res.status(500).send({ error: 'Error al registrar el usuario' });
            }

            // Inserta correctamente
            res.status(200).send({ success: true });
        });
    });
});


//Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
    let { username, password } = req.body;

    // Convertir username y email a minúsculas
    username = username.toLowerCase();
    // Consultar si el usuario existe
    const query = 'SELECT * FROM users WHERE username = ?';
    
    connection.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error al consultar el usuario:', err);
            return res.status(500).send({ success: false, message: 'Error en el servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).send({ success: false, message: 'Usuario no existe.' }); // Usuario no encontrado
        }

        const user = results[0];

        // Validar la contraseña
        if (user.password !== password) {
            return res.status(401).send({ success: false, message: 'Contraseña incorrecta.' }); // Contraseña incorrecta
        }

        // Si todo es correcto
        res.status(200).send({ success: true }); // Usuario correcto
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
