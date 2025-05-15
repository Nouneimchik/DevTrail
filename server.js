const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname));
app.use(express.json());

// --- Зчитування користувачів ---
let users = [];
const usersFilePath = path.join(__dirname, 'user.json');

if (fs.existsSync(usersFilePath)) {
    const fileData = fs.readFileSync(usersFilePath, 'utf-8');
    try {
        users = JSON.parse(fileData);
    } catch (err) {
        console.error('Помилка читання JSON:', err);
        users = [];
    }
}

// --- Авторизація по ролі ---
function authorizeRole(role) {
    return (req, res, next) => {
        const userCookie = req.cookies.user;
        if (!userCookie) return res.status(403).send('Немає доступу');

        let userData;
        try {
            userData = JSON.parse(decodeURIComponent(userCookie));
        } catch (err) {
            console.error('Помилка парсингу куки:', err);
            return res.status(400).send('Некоректна кука');
        }

        if (userData.role !== role) {
            return res.status(403).send('Недостатньо прав');
        }

        req.user = userData;
        next();
    };
}

// --- Головна сторінка ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Реєстрація ---
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Будь ласка, заповніть всі поля.');
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).send('Користувач із таким email вже існує.');
    }

    const newUser = { username, email, password, role: 'user' };
    users.push(newUser);

    fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
        if (err) {
            console.error('Помилка запису у файл:', err);
            return res.status(500).send('Сталася помилка під час реєстрації.');
        }

        res.send('Реєстрація успішна!');
    });
});

// --- Вхід ---
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        const userData = {
            username: user.username,
            email: user.email,
            role: user.role
        };

        const encodedUserData = encodeURIComponent(JSON.stringify(userData));
        res.cookie('user', encodedUserData, {
            httpOnly: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        res.json(userData);
    } else {
        res.status(401).json({ message: 'Неправильний email або пароль.' });
    }
});

// --- Створення роадмапу ---
router.post('/create-roadmap', (req, res) => {
    const { filename, category } = req.body;

    if (!filename || !category) {
        return res.status(400).send('Некоректні дані');
    }

    const sanitizedFilename = filename.replace(/[^a-z0-9-_]/gi, '_');
    const htmlPath = path.join(__dirname, 'Roadmaps', `${sanitizedFilename}.html`);
    const jsonPath = path.join(__dirname, 'data/roadmaps.json');

    const htmlContent = `<div class="roadmaps--pages">  
    <div class="roadmaps--navigation">
    </div>

    <div class="roadmaps--body">
    </div>
</div>`;
    fs.writeFile(htmlPath, htmlContent, { flag: 'wx' }, (err) => {
        if (err && err.code !== 'EEXIST') {
            console.error(err);
            return res.status(500).send('Помилка створення файлу');
        }

        fs.readFile(jsonPath, 'utf8', (err, data) => {
            let json = {};
            if (!err && data) {
                try {
                    json = JSON.parse(data);
                } catch (parseErr) {
                    console.error('Помилка JSON:', parseErr);
                }
            }

            if (!json[category]) {
                json[category] = [];
            }

            if (!json[category].includes(sanitizedFilename)) {
                json[category].push(sanitizedFilename);
            }

            fs.writeFile(jsonPath, JSON.stringify(json, null, 2), (err) => {
                if (err) {
                    console.error('Помилка запису JSON:', err);
                    return res.status(500).send('Не вдалося оновити JSON');
                }

                res.status(200).send('OK');
            });
        });
    });
});

// --- Збереження змін у роадмапі ---
app.post('/save-roadmap', (req, res) => {
    const { path: filePath, content } = req.body;

    const rootDir = path.join(__dirname, 'Roadmaps');
    const fullPath = path.join(rootDir, path.basename(filePath));

    if (!fullPath.startsWith(rootDir)) {
        return res.status(400).send('Недопустимий шлях');
    }

    fs.writeFile(fullPath, content, 'utf8', err => {
        if (err) {
            console.error('Помилка при збереженні:', err);
            return res.status(500).send('Не вдалося зберегти файл');
        }
        res.send('OK');
    });
});

// --- Отримати список роадмапів ---
const roadmapsPath = path.join(__dirname, 'data/roadmaps.json');

if (!fs.existsSync(roadmapsPath)) {
    fs.writeFileSync(roadmapsPath, '{}');
}

app.get('/roadmaps.json', (req, res) => {
    if (fs.existsSync(roadmapsPath)) {
        const data = fs.readFileSync(roadmapsPath, 'utf-8');
        try {
            const roadmaps = JSON.parse(data);
            res.json(roadmaps);
        } catch (err) {
            console.error('Помилка читання roadmaps.json:', err);
            res.status(500).send('Помилка на сервері');
        }
    } else {
        res.json({});
    }
});

router.post('/delete-roadmap', authorizeRole('admin'), (req, res) => {
    const { filename, password } = req.body;

    if (!filename || !password) {
        return res.status(400).send('Відсутні дані');
    }

    const user = req.user;
    const actualUser = users.find(u => u.email === user.email);

    if (!actualUser || actualUser.password !== password) {
        return res.status(403).send('Неправильний пароль');
    }

    const sanitizedFilename = filename.replace(/[^a-z0-9-_]/gi, '_');
    const htmlPath = path.join(__dirname, 'Roadmaps', `${sanitizedFilename}.html`);
    const jsonPath = path.join(__dirname, 'data/roadmaps.json');

    fs.unlink(htmlPath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Помилка видалення файлу:', err);
            return res.status(500).send('Помилка видалення файлу');
        }

        fs.readFile(jsonPath, 'utf8', (err, data) => {
            if (err) return res.status(500).send('Помилка читання JSON');

            let json;
            try {
                json = JSON.parse(data);
            } catch (e) {
                return res.status(500).send('JSON пошкоджений');
            }

            for (let category in json) {
                json[category] = json[category].filter(name => name !== sanitizedFilename);
            }

            fs.writeFile(jsonPath, JSON.stringify(json, null, 2), err => {
                if (err) {
                    return res.status(500).send('Не вдалося оновити JSON');
                }

                res.status(200).send('OK');
            });
        });
    });
});

app.post('/save-roadmap', (req, res) => {
    const { path: filePath, content } = req.body;

    const rootDir = path.join(__dirname, 'Roadmaps');
    const safePath = path.join(rootDir, path.basename(filePath));

    if (!safePath.startsWith(rootDir)) {
        return res.status(400).send('Недопустимий шлях');
    }

    fs.readFile(safePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Не вдалося прочитати файл');

        const updated = data.replace(
            /<section class="roadmaps--pages">[\s\S]*?<\/section>/,
            content
        );

        fs.writeFile(safePath, updated, 'utf8', err => {
            if (err) return res.status(500).send('Не вдалося зберегти файл');
            res.send('OK');
        });
    });
});

// --- Підключення маршрутизатора ---
app.use('/', router);

// --- 404 ---
app.use((req, res) => {
    res.status(404).send('Сторінку не знайдено.');
});

// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}/`);
});
