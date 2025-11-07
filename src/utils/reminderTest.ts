/**
 * Test utility for task reminders
 * Available in development mode as window.testReminders()
 */

import { notificationService } from '../services/notificationService';
import { useTodoStore } from '../store/todoStore';
import type { TaskReminder, Todo } from '../types';

export const testReminders = async () => {
    console.log('🧪 Testing Task Reminders...');

    try {
        // Initialize notification service
        await notificationService.initialize();
        const isReady = await notificationService.ensureNotificationReady();

        if (!isReady) {
            console.warn('⚠️ Notification service not ready. Please enable notifications first.');
            return;
        }

        // Create a test task with reminders
        const testTask: Todo = {
            id: 'test-task-' + Date.now(),
            title: 'Test Task with Reminders',
            completed: false,
            createdAt: new Date(),
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            priority: 'high',
            status: 'Not Started',
            userId: 'test-user',
            reminders: [
                {
                    id: 'reminder-1',
                    taskId: 'test-task-' + Date.now(),
                    reminderTime: new Date(Date.now() + 5 * 1000), // 5 seconds from now
                    isActive: true,
                    reminderType: 'custom',
                    message: 'This is a test reminder!',
                    createdAt: new Date()
                },
                {
                    id: 'reminder-2',
                    taskId: 'test-task-' + Date.now(),
                    reminderTime: new Date(Date.now() + 10 * 1000), // 10 seconds from now
                    isActive: true,
                    reminderType: 'due_date',
                    message: 'Task is due soon!',
                    createdAt: new Date()
                }
            ]
        };

        console.log('📋 Created test task:', testTask.title);
        console.log('⏰ Scheduling reminders...');

        // Schedule the reminders
        notificationService.scheduleTaskReminders(testTask);

        console.log('✅ Reminders scheduled! You should see notifications in 5 and 10 seconds.');
        console.log('📱 Check your browser notifications or system notification area.');

        // Test immediate notification
        console.log('🔔 Testing immediate notification...');
        await notificationService.showTaskReminder(
            'Immediate Test Reminder',
            undefined,
            'This is an immediate test notification!'
        );

        console.log('🎉 Test completed! Check for notifications.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Test creating different types of reminders
export const testReminderTypes = async () => {
    console.log('🧪 Testing Different Reminder Types...');

    try {
        await notificationService.initialize();

        const now = new Date();
        const testTask: Todo = {
            id: 'test-task-types',
            title: 'Test Task for Different Reminder Types',
            completed: false,
            createdAt: now,
            dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
            priority: 'medium',
            status: 'Not Started',
            userId: 'test-user'
        };

        // Test due date reminder creation
        const dueDateReminder = notificationService.createDueDateReminder(testTask, 1);
        if (dueDateReminder) {
            console.log('✅ Created due date reminder:', dueDateReminder);
        }

        // Test custom reminder creation
        const customReminder = notificationService.createCustomReminder(
            testTask.id,
            new Date(now.getTime() + 30 * 1000), // 30 seconds from now
            'Custom reminder message'
        );
        console.log('✅ Created custom reminder:', customReminder);

        console.log('🎉 Reminder type tests completed!');

    } catch (error) {
        console.error('❌ Reminder type test failed:', error);
    }
};

// Test default reminder creation
export const testDefaultReminders = async () => {
    console.log('🧪 Testing Default Reminder Creation...');

    try {
        await notificationService.initialize();

        const now = new Date();

        // Create test tasks with different due dates
        const testTasks: Todo[] = [
            {
                id: 'test-task-1',
                title: 'Task Due Tomorrow',
                completed: false,
                createdAt: now,
                dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                priority: 'high',
                status: 'Not Started',
                userId: 'test-user'
            },
            {
                id: 'test-task-2',
                title: 'Task Due in 3 Hours',
                completed: false,
                createdAt: now,
                dueDate: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
                priority: 'medium',
                status: 'Not Started',
                userId: 'test-user'
            },
            {
                id: 'test-task-3',
                title: 'Task Due in 1 Hour',
                completed: false,
                createdAt: now,
                dueDate: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
                priority: 'low',
                status: 'Not Started',
                userId: 'test-user'
            },
            {
                id: 'test-task-4',
                title: 'Completed Task (No Reminders)',
                completed: true,
                createdAt: now,
                dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                priority: 'high',
                status: 'Completed',
                userId: 'test-user'
            },
            {
                id: 'test-task-5',
                title: 'Task Without Due Date (No Reminders)',
                completed: false,
                createdAt: now,
                dueDate: null,
                priority: 'medium',
                status: 'Not Started',
                userId: 'test-user'
            }
        ];

        console.log('📋 Created test tasks:', testTasks.map(t => t.title));

        // Test default reminder creation for each task
        testTasks.forEach(task => {
            const defaultReminders = notificationService.createDefaultReminders(task);
            console.log(`📝 Task "${task.title}":`, {
                hasDueDate: !!task.dueDate,
                isCompleted: task.completed,
                remindersCreated: defaultReminders.length,
                reminderTimes: defaultReminders.map(r => new Date(r.reminderTime).toLocaleString())
            });
        });

        // Test processing all tasks
        const processedTasks = notificationService.processTasksForDefaultReminders(testTasks);
        console.log('🔄 Processed tasks:', processedTasks.map(t => ({
            title: t.title,
            remindersCount: t.reminders?.length || 0
        })));

        console.log('🎉 Default reminder tests completed!');

    } catch (error) {
        console.error('❌ Default reminder test failed:', error);
    }
};

// Test adding default reminders to existing tasks in the store
export const testAddDefaultRemindersToStore = async () => {
    console.log('🧪 Testing Adding Default Reminders to Store Tasks...');

    try {
        const { todos, addDefaultRemindersToAllTasks } = useTodoStore.getState();

        console.log('📊 Current tasks in store:', todos.length);
        console.log('📋 Tasks with due dates:', todos.filter(t => t.dueDate && !t.completed).length);
        console.log('📋 Tasks with existing reminders:', todos.filter(t => t.reminders && t.reminders.length > 0).length);

        // Add default reminders to all tasks
        addDefaultRemindersToAllTasks();

        const updatedTodos = useTodoStore.getState().todos;
        console.log('✅ After adding default reminders:');
        console.log('📋 Tasks with reminders:', updatedTodos.filter(t => t.reminders && t.reminders.length > 0).length);

        // Show details for tasks that got reminders
        updatedTodos.forEach(task => {
            if (task.reminders && task.reminders.length > 0) {
                console.log(`📝 "${task.title}" now has ${task.reminders.length} reminders:`,
                    task.reminders.map(r => new Date(r.reminderTime).toLocaleString())
                );
            }
        });

        console.log('🎉 Store reminder addition test completed!');

    } catch (error) {
        console.error('❌ Store reminder test failed:', error);
    }
};

// Test immediate notification to debug permission issues
export const testImmediateNotification = async () => {
    console.log('🧪 Testing Immediate Notification...');

    try {
        // Initialize notification service
        await notificationService.initialize();

        // Check permission status
        const permission = notificationService.getPermission();
        console.log('📋 Current notification permission:', permission);

        if (permission === 'denied') {
            console.error('❌ Notifications are denied. Please enable them in browser settings.');
            console.log('🔧 How to enable:');
            console.log('1. Click the lock icon in the address bar');
            console.log('2. Select "Allow" for notifications');
            console.log('3. Refresh the page');
            return;
        }

        if (permission === 'default') {
            console.log('⚠️ Permission not granted yet. Requesting permission...');
            const newPermission = await notificationService.requestPermission();
            console.log('📋 New permission status:', newPermission);

            if (newPermission !== 'granted') {
                console.error('❌ Permission denied by user');
                return;
            }
        }

        // Test immediate notification
        console.log('🔔 Sending immediate test notification...');
        await notificationService.showNotification({
            title: '🧪 Test Notification',
            body: 'This is an immediate test notification!',
            tag: 'immediate-test',
            requireInteraction: true,
            actions: [
                { action: 'test-action', title: 'Test Action' }
            ]
        });

        console.log('✅ Immediate notification sent! Check your browser/system notifications.');

        // Test task reminder notification
        console.log('📋 Testing task reminder notification...');
        await notificationService.showTaskReminder(
            'Test Task',
            new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            'This is a test task reminder!'
        );

        console.log('✅ Task reminder notification sent!');
        console.log('🎉 All immediate tests completed!');

    } catch (error) {
        console.error('❌ Immediate notification test failed:', error);
    }
};

// Test notification permission and setup
export const testNotificationSetup = async () => {
    console.log('🧪 Testing Notification Setup...');

    try {
        // Check if notifications are supported
        const isSupported = notificationService.isSupported();
        console.log('📱 Notifications supported:', isSupported);

        if (!isSupported) {
            console.error('❌ Notifications are not supported in this browser');
            return;
        }

        // Check current permission
        const permission = notificationService.getPermission();
        console.log('🔐 Current permission:', permission);

        // Check if service worker is available
        const hasServiceWorker = 'serviceWorker' in navigator;
        console.log('⚙️ Service Worker available:', hasServiceWorker);

        if (hasServiceWorker) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                console.log('📝 Service Worker registered:', !!registration);
                if (registration) {
                    console.log('📝 Service Worker state:', registration.active?.state);
                }
            } catch (error) {
                console.warn('⚠️ Service Worker check failed:', error);
            }
        }

        // Check if running as PWA
        const isPWA = notificationService.isPWA();
        console.log('📱 Running as PWA:', isPWA);

        // Check if mobile
        const isMobile = notificationService.isMobile();
        console.log('📱 Mobile device:', isMobile);

        console.log('🎉 Notification setup test completed!');

    } catch (error) {
        console.error('❌ Notification setup test failed:', error);
    }
};

// Test scheduled reminder with short delay
export const testScheduledReminder = async () => {
    console.log('🧪 Testing Scheduled Reminder (5 seconds)...');

    try {
        // Initialize notification service
        await notificationService.initialize();
        const isReady = await notificationService.ensureNotificationReady();

        if (!isReady) {
            console.warn('⚠️ Notification service not ready. Please enable notifications first.');
            return;
        }

        // Create a test task with a reminder in 5 seconds
        const now = new Date();
        const reminderTime = new Date(now.getTime() + 5 * 1000); // 5 seconds from now

        const testTask: Todo = {
            id: 'test-scheduled-' + Date.now(),
            title: 'Scheduled Test Task',
            completed: false,
            createdAt: now,
            dueDate: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
            priority: 'high',
            status: 'Not Started',
            userId: 'test-user',
            reminders: [
                {
                    id: 'scheduled-reminder-' + Date.now(),
                    taskId: 'test-scheduled-' + Date.now(),
                    reminderTime,
                    isActive: true,
                    reminderType: 'custom',
                    message: 'This is a scheduled test reminder!',
                    createdAt: now
                }
            ]
        };

        console.log('📋 Created test task:', testTask.title);
        console.log('⏰ Scheduling reminder for 5 seconds from now...');
        console.log('🕐 Reminder will trigger at:', reminderTime.toLocaleString());

        // Schedule the reminder
        notificationService.scheduleTaskReminders(testTask);

        console.log('✅ Reminder scheduled! You should see a notification in 5 seconds.');
        console.log('📱 Watch for the notification in your browser/system notification area.');

    } catch (error) {
        console.error('❌ Scheduled reminder test failed:', error);
    }
};

export default testReminders;
