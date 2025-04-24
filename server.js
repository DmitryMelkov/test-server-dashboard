import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors()); // Разрешаем CORS
app.use(bodyParser.json()); // Парсим JSON-данные

// Читаем данные из JSON-файла
const data = JSON.parse(readFileSync('./data.json', 'utf-8'));

// Эндпоинт для авторизации
app.post('/api/token', (req, res) => {
  const { username, password } = req.body;

  if (username === 'TDG' && password === '123456fgh') {
    res.json(data.mockToken); // Возвращаем токен из JSON
  } else {
    res.status(401).json({ error: 'Неверные учетные данные' });
  }
});

// Эндпоинт для получения отчетов
app.get('/api/report', (req, res) => {
  const { start_from, end_to } = req.query;

  if (!start_from || !end_to) {
    return res.status(400).json({ error: 'Необходимо указать параметры start_from и end_to' });
  }

  // Фильтруем данные по датам (опционально)
  const filteredReports = data.mockReports.filter((report) => {
    return report.date >= start_from && report.date <= end_to;
  });

  res.json(filteredReports);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});