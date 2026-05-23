window.CDCM = window.CDCM || {};

window.CDCM.StateManager = {
    state: {
        tasks: [],
        categories: [],
        assignees: [],
        currentView: 'dashboard', // dashboard, calendar, kanban, list
        currentMonth: new Date(), // Para el calendario
        filters: {
            search: '',
            category: 'all',
            status: 'all',
            priority: 'all'
        }
    },

    listeners: [],

    // Inicializar estado cargando de Storage
    init: function() {
        let loadedTasks = window.CDCM.StorageService.getTasks();
        if (!loadedTasks) {
            loadedTasks = []; 
        }
        this.state.tasks = loadedTasks;

        let loadedCategories = window.CDCM.StorageService.getCategories();
        if (!loadedCategories || loadedCategories.length === 0) {
            loadedCategories = [
                { id: 'convocatoria', name: '1. Convocatoria', color: '#3b82f6' },
                { id: 'ecoe', name: '2. Nuevo ECOE', color: '#10b981' },
                { id: 'grabaciones', name: '3. Grabaciones', color: '#8b5cf6' },
                { id: 'aplicativos', name: '4. Aplicativos', color: '#ec4899' },
                { id: 'campanas', name: '5. Campañas portafolio', color: '#f59e0b' },
                { id: 'calendario', name: '6. Calendario académico', color: '#06b6d4' },
                { id: 'escuela', name: '7. Escuela de EMG EsSalud', color: '#f43f5e' },
                { id: 'ceremonia', name: '8. Ceremonia', color: '#6366f1' },
                { id: 'serums', name: 'SERUMS / Recertificación', color: '#14b8a6' }
            ];
            window.CDCM.StorageService.saveCategories(loadedCategories);
        }
        this.state.categories = loadedCategories;

        let loadedAssignees = window.CDCM.StorageService.getAssignees();
        if (!loadedAssignees || loadedAssignees.length === 0) {
            loadedAssignees = [
                { id: 'carlos_salcedo', name: 'Dr. Carlos Salcedo', color: '#3b82f6' },
                { id: 'fernando_carballo', name: 'Dr. Fernando Carballo', color: '#10b981' },
                { id: 'pavel', name: 'Dr. Pavel', color: '#8b5cf6' },
                { id: 'fiorella_canevaro', name: 'Dra. Fiorella Canevaro', color: '#f59e0b' },
                { id: 'manuel_nunez', name: 'Dr. Manuel Núñez', color: '#ef4444' },
                { id: 'antonio_lozano', name: 'Dr. Antonio Lozano', color: '#06b6d4' },
                { id: 'segundo_cruz', name: 'Dr. Segundo Cruz', color: '#6366f1' },
                { id: 'max_chahuara', name: 'Dr. Max Chahuara', color: '#f43f5e' },
                { id: 'natalia_pinas', name: 'Dra. Natalia Piñas', color: '#14b8a6' },
                { id: 'ethel_rodriguez', name: 'Dra. Ethel Rodriguez', color: '#84cc16' }
            ];
            window.CDCM.StorageService.saveAssignees(loadedAssignees);
        } else {
            // Asegurar que todos tengan un color si vienen de versión anterior
            let modified = false;
            loadedAssignees.forEach(a => {
                if(!a.color) {
                    a.color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                    modified = true;
                }
            });
            if(modified) window.CDCM.StorageService.saveAssignees(loadedAssignees);
        }
        this.state.assignees = loadedAssignees;
    },

    // Establecer tareas
    setTasks: function(tasks) {
        this.state.tasks = tasks;
        window.CDCM.StorageService.saveTasks(tasks);
        this.notify();
    },

    // Añadir categoría
    addCategory: function(category) {
        this.state.categories.push(category);
        window.CDCM.StorageService.saveCategories(this.state.categories);
        this.notify();
    },

    // Actualizar categoría
    updateCategory: function(id, updatedData) {
        const index = this.state.categories.findIndex(c => c.id === id);
        if (index > -1) {
            this.state.categories[index] = { ...this.state.categories[index], ...updatedData };
            window.CDCM.StorageService.saveCategories(this.state.categories);
            this.notify();
        }
    },

    // Eliminar categoría
    deleteCategory: function(id) {
        this.state.categories = this.state.categories.filter(c => c.id !== id);
        window.CDCM.StorageService.saveCategories(this.state.categories);
        this.notify();
    },

    // Añadir responsable
    addAssignee: function(assignee) {
        this.state.assignees.push(assignee);
        window.CDCM.StorageService.saveAssignees(this.state.assignees);
        this.notify();
    },

    // Actualizar responsable
    updateAssignee: function(id, updatedData) {
        const index = this.state.assignees.findIndex(a => a.id === id);
        if (index > -1) {
            this.state.assignees[index] = { ...this.state.assignees[index], ...updatedData };
            window.CDCM.StorageService.saveAssignees(this.state.assignees);
            this.notify();
        }
    },

    // Eliminar responsable
    deleteAssignee: function(id) {
        this.state.assignees = this.state.assignees.filter(a => a.id !== id);
        window.CDCM.StorageService.saveAssignees(this.state.assignees);
        this.notify();
    },

    // Obtener tareas aplicando filtros actuales
    getFilteredTasks: function() {
        return this.state.tasks.filter(task => {
            // No mostrar archivadas por ahora en vistas normales
            if (task.archived) return false;

            const f = this.state.filters;
            
            // Text search
            if (f.search) {
                const term = f.search.toLowerCase();
                const matchTitle = task.title && task.title.toLowerCase().includes(term);
                const matchDetails = task.details && task.details.toLowerCase().includes(term);
                if (!matchTitle && !matchDetails) return false;
            }

            // Category
            if (f.category !== 'all' && task.category !== f.category) return false;

            // Status
            if (f.status !== 'all' && task.status !== f.status) return false;

            // Priority
            if (f.priority !== 'all' && task.priority !== f.priority) return false;

            return true;
        });
    },

    // Añadir tarea
    addTask: function(taskData) {
        const newTask = window.CDCM.DataModel.createTask(taskData);
        this.state.tasks.push(newTask);
        window.CDCM.StorageService.saveTasks(this.state.tasks);
        window.CDCM.Utils.showToast("Proyecto añadido exitosamente");
        this.notify();
    },

    // Actualizar tarea
    updateTask: function(id, updatedData) {
        const index = this.state.tasks.findIndex(t => t.id === id);
        if (index > -1) {
            const task = this.state.tasks[index];
            this.state.tasks[index] = { 
                ...task, 
                ...updatedData, 
                updatedAt: new Date().toISOString() 
            };
            
            // Regla: si se marca como completada
            if (updatedData.status === 'completed' && task.status !== 'completed') {
                this.state.tasks[index].completedAt = new Date().toISOString();
            } else if (updatedData.status !== 'completed') {
                this.state.tasks[index].completedAt = null;
            }

            window.CDCM.StorageService.saveTasks(this.state.tasks);
            window.CDCM.Utils.showToast("Proyecto actualizado");
            this.notify();
        }
    },

    // Eliminar tarea
    deleteTask: function(id) {
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        window.CDCM.StorageService.saveTasks(this.state.tasks);
        window.CDCM.Utils.showToast("Proyecto eliminado");
        this.notify();
    },

    // Cambiar vista
    setView: function(viewName) {
        this.state.currentView = viewName;
        this.notify();
    },

    // Actualizar filtro
    setFilter: function(key, value) {
        this.state.filters[key] = value;
        this.notify();
    },

    // Subscripción a cambios
    subscribe: function(callback) {
        this.listeners.push(callback);
    },

    notify: function() {
        this.listeners.forEach(callback => callback(this.state));
    }
};
