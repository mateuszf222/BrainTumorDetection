import fs from 'fs';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import expressSession from 'express-session';
import passport from 'passport';
import expressWs from 'express-ws';
import passportJson from 'passport-json'

// Import własnych modułów
import auth from './auth.js';
import * as websocket from './websocket.js';
import * as control from './control.js'; // Import the entire control module
import photo from './photo.js'
import chat from './chat.js';



interface Config {
    port: number;
    frontend: string;
    dbUrl: string;
}

let config: Config = {
    port: 8000,
    frontend: './brain-tumor-vue/dist',
    dbUrl: 'mongodb://localhost:27017/pai2024'
};

const app: Application = express();


app.use(morgan('tiny'));
app.use(cors({  credentials: true, // 👈 This is critical to allow cookies/sessions
}));
app.use(bodyParser.json());
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(400).json({ error: err.message });
});

app.use(express.static(config.frontend));

// Inicjalizacja mechanizmów sesji i autoryzacji
const session = expressSession({ secret: config.dbUrl, resave: false, saveUninitialized: true });
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportJson.Strategy(auth.checkCredentials))
passport.serializeUser(auth.serialize);
passport.deserializeUser(auth.deserialize);

// Endpoint websocketu
const wsEndpoint = '/ws';
const { app: wsApp } = expressWs(app);
wsApp.ws(wsEndpoint, (_ws, req, next) => session(req as Request, {} as Response, next), websocket.websocketHandler.handle);

// Endpointy autoryzacji
const authEndpoint = '/api/auth';
app.get(authEndpoint, auth.whoami);
app.post(authEndpoint, passport.authenticate('json', { failWithError: true }), auth.login, auth.errorHandler);
app.post(`${authEndpoint}/register`, (req, res, next) => {
    auth.register(req, res).catch(next);
});
app.delete(authEndpoint, auth.logout);

// Endpointy stanu systemu
const whoEndpoint = '/api/control';
app.get(`${whoEndpoint}/who`, auth.checkIfInRole([0, 1]), control.whoGet);

app.post(`${photo.endpoint}/save`,auth.checkIfInRole([0, 1]), photo.save)

app.get(photo.endpoint, auth.checkIfInRole([0, 1]), photo.get)
app.post(photo.endpoint, auth.checkIfInRole([0]), photo.post)
app.put(photo.endpoint, auth.checkIfInRole([0]), photo.put)
app.delete(photo.endpoint, auth.checkIfInRole([0]), photo.delete)

app.get('/api/chat', auth.checkIfInRole([0, 1]), chat.get);
app.post('/api/chat', auth.checkIfInRole([0, 1]), chat.post);



try {
    const configData = fs.readFileSync('config.json', 'utf-8');
    config = JSON.parse(configData);
    console.log('Konfiguracja z config.json');
} catch (err) {
    console.log('Konfiguracja domyślna');
}

console.log('Łączę się z bazą danych...');
mongoose.connect(config.dbUrl)
    .then((conn) => {
        console.log('Połączenie z bazą danych nawiązane');

        auth.init(conn);
        photo.init(conn.connection);
        chat.init(conn.connection);

        app.listen(config.port, () => {
            console.log('Backend słucha na porcie', config.port);
        });
    })
    .catch(err => {
        console.error('Połączenie z bazą danych nieudane:', err.message);
        process.exit(0);
    });
