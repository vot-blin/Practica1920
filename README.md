### 1. Клонирование репозитория
```bash
git clone https://github.com/vot-blin/Practica1920.git
cd todowithpush
```

### 2. Запуск сервера
Запустите через Go Live в VS Code:

Откройте проект в VS Code

Установите расширение "Live Server" (если не установлено)

Нажмите "Go Live" в правом нижнем углу VS Code

Приложение откроется в браузере по адресу http://localhost:5500 или http://localhost:5501 

### Структура проекта
```
todowithpush/
├── index.html          # Главная страница
├── manifest.json       # Конфигурация PWA
├── sw.js              # Service Worker
├── app.js         # Основная логика приложения
├── db.js          # Работа с IndexedDB
├── notification.js # Управление уведомлениями
├── style.css      # Стили приложения
├── cat.png
├── icon-192x192.png
├── icon-512x512.png
└── README.md    
```
