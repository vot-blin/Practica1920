import { 
    initDB, 
    addTaskToDB, 
    updateTaskInDB, 
    deleteTaskFromDB, 
    getAllTasks 
} from './db.js';
import { 
    requestNotificationPermission,
    unsubscribeNotifications,
    showNotification
} from './notification.js';
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const installBtn = document.getElementById('installBtn');
    const notifyBtn = document.getElementById('notifyBtn');
    
    let currentFilter = 'all';
    let tasks = [];
    
    // Инициализация приложения
    async function init() {
        await initDB();
        loadTasks();
        setupEventListeners();
        checkInstallPrompt();
    }
    
    // Загрузка задач из IndexedDB
    async function loadTasks() {
        tasks = await getAllTasks();
        renderTasks();
    }
    
    // Рендеринг задач с учетом фильтра
    function renderTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });
        
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Нет задач';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.color = '#757575';
            taskList.appendChild(emptyMessage);
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                <button class="delete-btn">Удалить</button>
            `;
            
            taskList.appendChild(taskItem);
        });
    }
    
    // Добавление новой задачи
    async function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;
        
        const newTask = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        await addTaskToDB(newTask);
        tasks.push(newTask);
        taskInput.value = '';
        renderTasks();
        
        // Показываем уведомление
        if (Notification.permission === 'granted') {
            showNotification('Новая задача добавлена', {
                body: text,
                icon: '/icon-192x192.png'
            });
        }
    }
    
    // Обновление статуса задачи
    async function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.completed = !task.completed;
        await updateTaskInDB(task);
        renderTasks();
    }
    
    // Удаление задачи
    async function deleteTask(taskId) {
        tasks = tasks.filter(t => t.id !== taskId);
        await deleteTaskFromDB(taskId);
        renderTasks();
    }
    
    // Установка обработчиков событий
    function setupEventListeners() {
        // Добавление задачи
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        
        // Фильтрация задач
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
        
        // Обработка кликов по задачам (делегирование событий)
        taskList.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            
            const taskId = taskItem.dataset.id;
            
            if (e.target.classList.contains('delete-btn')) {
                deleteTask(taskId);
            } else if (e.target.classList.contains('task-checkbox')) {
                toggleTaskComplete(taskId);
            }
        });
        
        // Кнопка установки PWA
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    const { outcome } = await window.deferredPrompt.userChoice;
                    console.log(`User response to the install prompt: ${outcome}`);
                    window.deferredPrompt = null;
                    installBtn.classList.add('hidden');
                }
            });
        }
        
        // Кнопка уведомлений
        notifyBtn.addEventListener('click', () => {
            if (Notification.permission === 'granted') {
                unsubscribeNotifications();
            } else {
                requestNotificationPermission();
            }
        });
    }
    
    // Проверка возможности установки PWA
    function checkInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            if (installBtn) installBtn.classList.remove('hidden');
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            if (installBtn) installBtn.classList.add('hidden');
            window.deferredPrompt = null;
        });
    }
    
    // Запуск приложения
    init();
    
    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful');
            }).catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});