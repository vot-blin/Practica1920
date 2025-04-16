let db;

// Инициализация IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SmartTodoDB', 1);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tasks')) {
                const store = db.createObjectStore('tasks', { keyPath: 'id' });
                store.createIndex('completed', 'completed', { unique: false });
            }
        };
    });
}

// Добавление задачи в БД
async function addTaskToDB(task) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        const request = store.add(task);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Обновление задачи в БД
async function updateTaskInDB(task) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        const request = store.put(task);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Удаление задачи из БД
async function deleteTaskFromDB(taskId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        const request = store.delete(taskId);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Получение всех задач из БД
async function getAllTasks() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event.target.error);
    });
}

export { 
    initDB, 
    addTaskToDB, 
    updateTaskInDB, 
    deleteTaskFromDB, 
    getAllTasks 
};