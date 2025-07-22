import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8000;

// Получаем __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Логирование всех входящих запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Чтение данных из JSON-файлов
let data;
let vehicleStats;
let financialStats;
let fuelStats;

try {
  data = JSON.parse(readFileSync('./data.json', 'utf-8'));
  vehicleStats = JSON.parse(readFileSync('./vehicle-stats.json', 'utf-8'));
  financialStats = JSON.parse(readFileSync('./financial-stats.json', 'utf-8'));
  fuelStats = JSON.parse(readFileSync('./fuel-stats.json', 'utf-8'));
} catch (err) {
  console.error('Ошибка чтения JSON файлов:', err);
  process.exit(1);
}

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация', status: 401 });
  }

  // В реальном приложении здесь должна быть проверка токена
  if (token !== data.mockToken.access) {
    return res.status(403).json({ message: 'Неверный токен', status: 403 });
  }

  next();
};

// Эндпоинт для авторизации
app.post('/api/token', (req, res) => {
  const { username, password } = req.body;

  if (username === 'TDG' && password === '123456fgh') {
    res.json(data.mockToken);
  } else {
    res.status(401).json({
      message: 'Неверные учетные данные',
      status: 401,
    });
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
    const { start_from, end_to } = req.body;
    let result = vehicleStats.vehicleStats;

    if (start_from && end_to) {
      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(start_from) && itemDate <= new Date(end_to);
      });
    }

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
});
