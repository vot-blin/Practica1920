// VAPID ключи (замените на свои)
const VAPID_PUBLIC_KEY = 'BOl7MgNC_qjc62TPl7kEPNF8UoxNf79K8TIZoBX4LoWgpilmBLQY5BSNYtEzxqpUqiKCiun6Dxre9AmCDHjcsMY';
const VAPID_PRIVATE_KEY = 'LttI0ZTENmjLwZNMxzU9Anb669Zeb4ut2m8G_woPZPc';

// Запрос разрешения на уведомления
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            await subscribeToPushNotifications();
            updateNotificationButton(true);
            
            // Запускаем напоминания о невыполненных задачах
            startReminderNotifications();
        } else {
            console.log('Notification permission denied.');
            updateNotificationButton(false);
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

// Подписка на push-уведомления
async function subscribeToPushNotifications() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            console.log('Already subscribed:', subscription);
            return subscription;
        }
        
        const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        console.log('New subscription:', newSubscription);
        return newSubscription;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        throw error;
    }
}

// Отписка от push-уведомлений
async function unsubscribeNotifications() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            await subscription.unsubscribe();
            console.log('Unsubscribed from push notifications');
            updateNotificationButton(false);
            
            // Останавливаем напоминания
            stopReminderNotifications();
        }
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
    }
}

// Показ локального уведомления
function showNotification(title, options) {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications.');
        return;
    }
    
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    }
}

// Вспомогательная функция для конвертации ключа
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// Обновление кнопки уведомлений
function updateNotificationButton(isSubscribed) {
    const notifyBtn = document.getElementById('notifyBtn');
    if (notifyBtn) {
        notifyBtn.textContent = isSubscribed ? 'Отключить уведомления' : 'Включить уведомления';
    }
}

// Напоминания о невыполненных задачах
let reminderInterval;

async function startReminderNotifications() {
    // Останавливаем предыдущий интервал, если он был
    stopReminderNotifications();
    
    // Проверяем сразу при запуске
    await checkUncompletedTasks();
    
    // Устанавливаем интервал на 2 часа (7200000 мс)
    reminderInterval = setInterval(checkUncompletedTasks, 7200000);
}

function stopReminderNotifications() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
}

async function checkUncompletedTasks() {
    const tasks = await getAllTasks();
    const uncompletedTasks = tasks.filter(task => !task.completed);
    
    if (uncompletedTasks.length > 0) {
        showNotification('Незавершенные задачи', {
            body: `У вас есть ${uncompletedTasks.length} невыполненных задач`,
            icon: '/images/icon-192.png',
            vibrate: [200, 100, 200]
        });
    }
}

// Проверяем статус подписки при загрузке
async function checkNotificationStatus() {
    if ('Notification' in window && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            updateNotificationButton(true);
            startReminderNotifications();
        } else {
            updateNotificationButton(false);
        }
    } else {
        updateNotificationButton(false);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        checkNotificationStatus();
    } else {
        const notifyBtn = document.getElementById('notifyBtn');
        if (notifyBtn) {
            notifyBtn.disabled = true;
            notifyBtn.textContent = 'Уведомления не поддерживаются';
        }
    }
});

export {
    requestNotificationPermission,
    unsubscribeNotifications,
    showNotification,
    checkNotificationStatus
};