import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 8000;

// Получаем __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(bodyParser.json());

// Секретный ключ для подписи токенов
const JWT_SECRET = 'your-secret-key-here';

// Логирование всех входящих запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Чтение данных из JSON-файлов
let vehicleStats;
let financialStats;
let fuelStats;

try {
  vehicleStats = JSON.parse(readFileSync('./vehicle-stats.json', 'utf-8'));
  financialStats = JSON.parse(readFileSync('./financial-stats.json', 'utf-8'));
  fuelStats = JSON.parse(readFileSync('./fuel-stats.json', 'utf-8'));
} catch (err) {
  console.error('Ошибка чтения JSON файлов:', err);
  process.exit(1);
}

// Генерация токенов
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '5m' } // 5 минут
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '1d' } // 1 день
  );

  return { accessToken, refreshToken };
};

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация', status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      return res.status(403).json({ message: 'Неверный тип токена', status: 403 });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Неверный или истекший токен', status: 403 });
  }
};

// Эндпоинт для авторизации
app.post('/api/token', (req, res) => {
  const { username, password } = req.body;

  if (username === 'TDG' && password === '123456fgh') {
    const tokens = generateTokens('test-user');
    res.json({
      access: tokens.accessToken,
      refresh: tokens.refreshToken,
    });
  } else {
    res.status(401).json({
      message: 'Неверные учетные данные',
      status: 401,
    });
  }
});

// Эндпоинт для обновления токена
app.post('/api/token/refresh', (req, res) => {
  const { refresh } = req.body;

  if (!refresh) {
    return res.status(400).json({ message: 'Refresh token отсутствует', status: 400 });
  }

  try {
    const decoded = jwt.verify(refresh, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(403).json({ message: 'Неверный тип токена', status: 403 });
    }

    const accessToken = jwt.sign({ userId: decoded.userId, type: 'access' }, JWT_SECRET, { expiresIn: '1m' });

    res.json({ access: accessToken });
  } catch (err) {
    res.status(403).json({ message: 'Неверный или истекший refresh token', status: 403 });
  }
});

// Эндпоинт для получения отчетов (GET остается)
app.get('/api/report', authenticateToken, (req, res) => {
  res.json({
    data: data.mockReports,
    status: 200,
  });
});

// Эндпоинт для получения статистики транспортных средств (переделан на POST)
app.post('/api/vehicle-stats', authenticateToken, (req, res) => {
  try {
    let result = vehicleStats.vehicleStats;

    // Удаляем поле date из всех записей
    result = result.map((vehicle) => {
      const { date, ...rest } = vehicle;
      return rest;
    });

    // Возвращаем ВСЕ данные (без ограничения)
    res.json({
      vehicleStats: result,  
      status: 200,
    });
  } catch (err) {
    console.error('Ошибка при обработке vehicle-stats:', err);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера',
      status: 500,
    });
  }
});

// Эндпоинт для получения финансовой статистики (переделан на POST)
app.post('/api/financial-stats', authenticateToken, (req, res) => {
  try {
    const { start_from, end_to } = req.body;
    let result = financialStats.financialStats;

    if (start_from && end_to) {
      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(start_from) && itemDate <= new Date(end_to);
      });
    }

    res.json({
      financialStats: result,
      status: 200,
    });
  } catch (err) {
    console.error('Ошибка при обработке financial-stats:', err);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера',
      status: 500,
    });
  }
});

// Эндпоинт для получения топливной статистики (переделан на POST)
app.post('/api/fuel-stats', authenticateToken, (req, res) => {
  try {
    const { start_from, end_to } = req.body;
    let result = fuelStats.fuelStats;

    if (start_from && end_to) {
      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(start_from) && itemDate <= new Date(end_to);
      });
    }

    res.json({
      fuelStats: result,
      status: 200,
    });
  } catch (err) {
    console.error('Ошибка при обработке fuel-stats:', err);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера',
      status: 500,
    });
  }
});

// Подключение клиента
const clientPath = path.join(__dirname, '../test-dashboard/dist');
app.use(express.static(clientPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    message: 'Ресурс не найден',
    status: 404,
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту http://localhost:${PORT}`);
  console.log('Тестовые учетные данные: username=TDG, password=123456fgh');
});
