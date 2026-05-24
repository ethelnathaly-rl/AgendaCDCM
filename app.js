window.CDCM = window.CDCM || {};

// Mock Data Original (Fallback)
const initialTasks = [
    { id: 1, title: 'Convocatoria Etapa 1', category: 'convocatoria', startDate: '2026-04-13', endDate: '2026-04-30', details: 'Publicidad 1-12 Abril' },
    { id: 2, title: 'Convocatoria Etapa 2', category: 'convocatoria', startDate: '2026-05-07', endDate: '2026-05-09', details: 'Jueves 7, Sábado 9' },
    { id: 4, title: 'Nuevo ECOE', category: 'ecoe', startDate: '2026-04-01', endDate: '', details: 'Temas: 12/31\nInstrumentos: 11' }
];

window.CDCM.App = {
    init: function() {
        console.log("Inicializando CDCM Agenda V2...");
        
        // 1. Inicializar Estado
        window.CDCM.StateManager.init();
        
        // Si no hay tareas en absoluto (primera vez o borrado), usar fallback migrado
        if (window.CDCM.StateManager.state.tasks.length === 0) {
            const migratedInitial = window.CDCM.DataModel.migrateLegacyTasks(initialTasks);
            window.CDCM.StateManager.setTasks(migratedInitial);
        }

        // 2. Inicializar Componentes UI
        window.CDCM.FormModal.init();
        if (window.CDCM.VoiceHandler) window.CDCM.VoiceHandler.init();
        this.setupSettingsModal();
        this.setupNavigation();
        this.setupFilters();
        this.setupTheme();

        // 3. Subscribirse a cambios de estado para re-renderizar
        window.CDCM.StateManager.subscribe(() => {
            this.populateCategorySelects();
            this.populateAssigneeSelect();
            this.renderCurrentView();
        });

        // 4. Render inicial
        this.populateCategorySelects();
        this.populateAssigneeSelect();
        this.renderCurrentView();

        // 5. Iniciar verificador de alarmas
        this.startAlarmChecker();
    },

    startAlarmChecker: function() {
        setInterval(() => {
            const now = new Date();
            const todayStr = window.CDCM.Utils.getTodayStr();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            const tasks = window.CDCM.StateManager.state.tasks;
            let alarmsTriggered = false;

            tasks.forEach((task, index) => {
                if (!task.hasAlarm || task.alarmTriggered || task.status === 'completed' || task.status === 'cancelled') return;
                if (!task.startTime) return;

                const [hh, mm] = task.startTime.split(':').map(Number);
                const taskMinutes = hh * 60 + mm;
                const offset = (task.alarmOffset !== undefined && task.alarmOffset !== null) ? task.alarmOffset : 0;
                const targetMinutes = taskMinutes - offset;

                // Calcular fecha de disparo
                let alarmDate = task.startDate;
                if (offset >= 1440) {
                    // 1 día antes
                    const sd = new Date(task.startDate + 'T00:00:00');
                    sd.setDate(sd.getDate() - Math.floor(offset / 1440));
                    alarmDate = sd.toISOString().split('T')[0];
                }

                const alarmMinutesInDay = ((targetMinutes % 1440) + 1440) % 1440;
                const currentMinutesInDay = nowMinutes;

                if (alarmDate === todayStr && Math.abs(currentMinutesInDay - alarmMinutesInDay) <= 0) {
                    window.CDCM.Utils.playAlarm();
                    window.CDCM.Utils.showToast(`🔔 RECORDATORIO: ${task.title}`, 'error');
                    window.CDCM.StateManager.state.tasks[index].alarmTriggered = true;
                    alarmsTriggered = true;
                }
            });

            if (alarmsTriggered) {
                window.CDCM.StorageService.saveTasks(window.CDCM.StateManager.state.tasks);
            }
        }, 10000);
    },

    // Poblar selects de categoría dinámicamente
    populateCategorySelects: function() {
        const categories = window.CDCM.StateManager.state.categories;
        const filterSelect = document.getElementById('filterCategory');
        const taskSelect = document.getElementById('taskCategory');

        // Guardar valores actuales
        const currentFilterVal = filterSelect.value;
        const currentTaskVal = taskSelect.value;

        // Limpiar
        filterSelect.innerHTML = '<option value="all">Todas las Categorías</option>';
        taskSelect.innerHTML = '';

        categories.forEach(cat => {
            const opt1 = document.createElement('option');
            opt1.value = cat.id;
            opt1.textContent = cat.name;
            filterSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = cat.id;
            opt2.textContent = cat.name;
            taskSelect.appendChild(opt2);
        });

        // Restaurar si el valor todavía existe
        if (categories.find(c => c.id === currentFilterVal)) filterSelect.value = currentFilterVal;
        if (categories.find(c => c.id === currentTaskVal)) taskSelect.value = currentTaskVal;
    },

    // Poblar checkboxes de responsable dinámicamente
    populateAssigneeSelect: function() {
        const assignees = window.CDCM.StateManager.state.assignees;
        const listContainer = document.getElementById('taskAssigneesList');
        if (!listContainer) return;

        // Guardar seleccionados actuales
        const currentSelected = Array.from(listContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        
        listContainer.innerHTML = '';
        
        assignees.forEach(ass => {
            const isChecked = currentSelected.includes(ass.id) ? 'checked' : '';
            const html = `
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 4px; padding: 4px; border-radius: var(--radius-sm);">
                    <input type="checkbox" value="${ass.id}" class="assignee-checkbox" ${isChecked}>
                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${ass.color || '#ccc'};"></div>
                    ${ass.name}
                </label>
            `;
            listContainer.insertAdjacentHTML('beforeend', html);
        });

        // Agregar los legacy (descontinuados) que estén seleccionados pero ya no en catálogo
        currentSelected.forEach(val => {
            if (!assignees.find(a => a.id === val)) {
                const html = `
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 4px; padding: 4px; border-radius: var(--radius-sm);">
                        <input type="checkbox" value="${val}" class="assignee-checkbox" checked>
                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ccc;"></div>
                        ${val} (Descontinuado)
                    </label>
                `;
                listContainer.insertAdjacentHTML('beforeend', html);
            }
        });
    },

    filterAssigneeList: function(query) {
        const listContainer = document.getElementById('taskAssigneesList');
        if (!listContainer) return;
        const labels = listContainer.querySelectorAll('label');
        const q = (query || '').toLowerCase().trim();
        labels.forEach(label => {
            const text = label.textContent.toLowerCase();
            label.style.display = q === '' || text.includes(q) ? '' : 'none';
        });
    },

    // Orquestador de renderizado
    renderCurrentView: function() {
        const container = document.getElementById('viewContainer');
        const tasks = window.CDCM.StateManager.getFilteredTasks();
        const view = window.CDCM.StateManager.state.currentView;

        switch(view) {
            case 'dashboard':
                window.CDCM.DashboardView.render(container, tasks);
                break;
            case 'list':
                window.CDCM.ListView.render(container, tasks);
                break;
            case 'kanban':
                window.CDCM.KanbanView.render(container, tasks);
                break;
            case 'calendar':
                window.CDCM.CalendarView.render(container, tasks);
                break;
            case 'paint':
                if(window.CDCM.PaintView) window.CDCM.PaintView.render(container);
                break;
            default:
                window.CDCM.DashboardView.render(container, tasks);
        }
    },

    // UI Setup: Navegación
    setupNavigation: function() {
        // Enlaces del sidebar
        const navLinks = document.querySelectorAll('#navMenu a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const view = link.getAttribute('data-view');
                window.CDCM.StateManager.setView(view);

                // Cerrar sidebar en móvil si está abierto
                document.querySelector('.sidebar').classList.remove('open');
            });
        });

        // Botón nuevo proyecto
        document.getElementById('btnNewTask').addEventListener('click', () => {
            window.CDCM.FormModal.openNew();
        });

        // Toggle móvil
        document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.add('open');
        });
        document.querySelector('.mobile-menu-close').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('open');
        });
    },

    // UI Setup: Filtros y Búsqueda
    setupFilters: function() {
        const searchInput = document.getElementById('searchInput');
        const filterCat = document.getElementById('filterCategory');
        const filterStatus = document.getElementById('filterStatus');

        searchInput.addEventListener('input', (e) => {
            window.CDCM.StateManager.setFilter('search', e.target.value);
        });

        filterCat.addEventListener('change', (e) => {
            window.CDCM.StateManager.setFilter('category', e.target.value);
        });

        filterStatus.addEventListener('change', (e) => {
            window.CDCM.StateManager.setFilter('status', e.target.value);
        });
    },

    // UI Setup: Configuración
    setupSettingsModal: function() {
        const modal = document.getElementById('settingsModal');
        
        document.getElementById('btnSettings').addEventListener('click', () => {
            modal.classList.add('active');
        });

        modal.querySelectorAll('.close-settings').forEach(btn => {
            btn.addEventListener('click', () => modal.classList.remove('active'));
        });

        document.getElementById('btnExport').addEventListener('click', () => {
            window.CDCM.StorageService.exportData();
        });

        document.getElementById('btnImportTrigger').addEventListener('click', () => {
            document.getElementById('fileImport').click();
        });

        document.getElementById('fileImport').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                window.CDCM.StorageService.importData(file, (migratedTasks) => {
                    window.CDCM.StateManager.setTasks(migratedTasks);
                    modal.classList.remove('active');
                });
            }
        });

        document.getElementById('btnClearData').addEventListener('click', () => {
            if (confirm("⚠️ ¡ADVERTENCIA! Esto borrará todos tus datos permanentemente. ¿Estás seguro?")) {
                window.CDCM.StorageService.clearData();
                window.CDCM.StateManager.setTasks([]); // Limpia la vista
                modal.classList.remove('active');
                window.CDCM.Utils.showToast("Todos los datos han sido borrados", "success");
            }
        });
    },

    // UI Setup: Tema
    setupTheme: function() {
        const themeToggle = document.getElementById('themeToggle');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Initialize
        if (prefersDark || localStorage.getItem('cdcm_theme') === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }

        themeToggle.addEventListener('click', () => {
            const body = document.body;
            if (body.getAttribute('data-theme') === 'dark') {
                body.removeAttribute('data-theme');
                themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
                localStorage.setItem('cdcm_theme', 'light');
            } else {
                body.setAttribute('data-theme', 'dark');
                themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
                localStorage.setItem('cdcm_theme', 'dark');
            }
        });
    },

    // Funciones globales expuestas (usadas en onclick en HTML de Vistas)
    _lastDeleted: null,

    handleDelete: function(id) {
        const task = window.CDCM.StateManager.state.tasks.find(t => t.id === id);
        if (!task) return;
        if (confirm(`¿Eliminar "${task.title}" permanentemente?`)) {
            this._lastDeleted = JSON.parse(JSON.stringify(task));
            window.CDCM.StateManager.deleteTask(id);
            window.CDCM.Utils.showToast(`"${task.title}" eliminada — <a href="#" onclick="window.CDCM.App.undoDelete(); return false;" style="color:#fff; font-weight:700; text-decoration:underline;">Deshacer</a>`, 'error');
        }
    },

    undoDelete: function() {
        if (!this._lastDeleted) return;
        const t = this._lastDeleted;
        window.CDCM.StateManager.state.tasks.push(t);
        window.CDCM.StorageService.saveTasks(window.CDCM.StateManager.state.tasks);
        window.CDCM.StateManager.notify();
        window.CDCM.Utils.showToast(`"${t.title}" restaurada`, 'success');
        this._lastDeleted = null;
    },

    prevMonth: function() {
        const d = window.CDCM.StateManager.state.currentMonth;
        d.setMonth(d.getMonth() - 1);
        window.CDCM.StateManager.notify();
    },

    nextMonth: function() {
        const d = window.CDCM.StateManager.state.currentMonth;
        d.setMonth(d.getMonth() + 1);
        window.CDCM.StateManager.notify();
    },

    todayMonth: function() {
        window.CDCM.StateManager.state.currentMonth = new Date();
        window.CDCM.StateManager.notify();
    },

    prevWeek: function() {
        const d = window.CDCM.StateManager.state.currentMonth;
        d.setDate(d.getDate() - 7);
        window.CDCM.StateManager.notify();
    },

    nextWeek: function() {
        const d = window.CDCM.StateManager.state.currentMonth;
        d.setDate(d.getDate() + 7);
        window.CDCM.StateManager.notify();
    },

    prevDay: function() {
        const d = window.CDCM.StateManager.state.currentMonth;
        d.setDate(d.getDate() - 1);
        window.CDCM.StateManager.notify();
    },

    nextDay: function() {
        const d = window.CDCM.StateManager.state.currentMonth;
        d.setDate(d.getDate() + 1);
        window.CDCM.StateManager.notify();
    }
};

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.CDCM.App.init();
});
