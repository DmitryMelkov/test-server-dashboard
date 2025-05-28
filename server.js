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

// Читаем данные из JSON-файлов с обработкой ошибок
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
  process.exit(1); // Завершаем процесс с ошибкой
}

// Эндпоинт для авторизации
app.post('/api/token', (req, res) => {
  const { username, password } = req.body;

  if (username === 'TDG' && password === '123456fgh') {
    res.json(data.mockToken);
  } else {
    res.status(401).json({ error: 'Неверные учетные данные' });
  }
});

// Эндпоинт для получения отчетов
app.get('/api/report', (req, res) => {
  res.json(data.mockReports);
});

// Эндпоинт для получения статистики транспортных средств
app.get('/api/vehicle-stats', (req, res) => {
  res.json(vehicleStats.vehicleStats);
});

// Эндпоинт для получения финансовой статистики транспортных средств
app.get('/api/financial-stats', (req, res) => {
  res.json(financialStats.financialStats);
});

// Эндпоинт для получения топливной статистики транспортных средств
app.get('/api/fuel-stats', (req, res) => {
  res.json(fuelStats.fuelStats);
});

// Подключение клиента из соседней папки test-dashboard
const clientPath = path.join(__dirname, '../test-dashboard/dist');

// Служба статических файлов для клиента
app.use(express.static(clientPath));

// Обработка всех остальных маршрутов (например, для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту http://localhost:${PORT}`);
});
