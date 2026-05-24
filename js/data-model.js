window.CDCM = window.CDCM || {};

window.CDCM.DataModel = {
    // Factory para crear una nueva tarea con la estructura completa
    createTask: function(data) {
        const now = new Date().toISOString();
        return {
            id: window.CDCM.Utils.generateId(),
            title: data.title || 'Nueva Tarea',
            type: data.type || 'task', // 'project' | 'task'
            category: data.category || 'convocatoria',
            status: data.status || 'pending',
            priority: data.priority || 'medium',
            startDate: data.startDate || window.CDCM.Utils.getTodayStr(),
            startTime: data.startTime || '',
            endDate: data.endDate || null,
            details: data.details || '',
            assignees: Array.isArray(data.assignees) ? data.assignees : (data.assignee ? [data.assignee] : []),
            observations: data.observations || '',
            subtasks: data.subtasks || [],
            tags: data.tags || [],
            attachments: data.attachments || [],
            hasAlarm: data.hasAlarm || false,
            alarmTriggered: data.alarmTriggered || false,
            createdAt: now,
            updatedAt: now,
            completedAt: (data.status === 'completed') ? now : null,
            templateId: null,
            archived: false,
            order: data.order || 0
        };
    },

    // Migración de datos antiguos al nuevo modelo
    migrateLegacyTasks: function(legacyTasks) {
        if (!Array.isArray(legacyTasks)) return [];
        
        return legacyTasks.map((oldTask, index) => {
            // Si ya tiene el formato nuevo (tiene createdAt), la devolvemos tal cual
            if (oldTask.createdAt) {
                return oldTask;
            }

            // Si es un formato antiguo, la convertimos
            return {
                id: oldTask.id ? oldTask.id.toString() : window.CDCM.Utils.generateId(),
                title: oldTask.title || 'Tarea Migrada',
                type: 'task',
                category: oldTask.category || 'convocatoria',
                status: 'pending', // Por defecto
                priority: 'medium', // Por defecto
                startDate: oldTask.startDate || window.CDCM.Utils.getTodayStr(),
                startTime: oldTask.startTime || '',
                endDate: oldTask.endDate || null,
                details: oldTask.details || '',
                assignee: oldTask.assignee || '',
                observations: oldTask.observations || '',
                subtasks: [],
                tags: [],
                attachments: [],
                hasAlarm: oldTask.hasAlarm || false,
                alarmTriggered: oldTask.alarmTriggered || false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null,
                templateId: null,
                archived: false,
                order: index
            };
        });
    }
};
