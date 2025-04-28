import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Логирование всех входящих запросов (добавьте это сразу после создания app)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Читаем данные из JSON-файла с обработкой ошибок
let data;
try {
  data = JSON.parse(readFileSync('./data.json', 'utf-8'));
} catch (err) {
  console.error('Ошибка чтения data.json:', err);
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
