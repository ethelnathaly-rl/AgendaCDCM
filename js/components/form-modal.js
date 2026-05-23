window.CDCM = window.CDCM || {};

window.CDCM.FormModal = {
    init: function() {
        this.modal = document.getElementById('taskModal');
        this.form = document.getElementById('taskForm');
        this.title = document.getElementById('modalTitle');
        
        // Botones de cierre
        const closeBtns = this.modal.querySelectorAll('.close-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // Click fuera del modal para cerrar
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Submit del formulario
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });

        // Eliminar desde el modal
        const btnDelete = document.getElementById('btnDeleteTask');
        if (btnDelete) {
            btnDelete.addEventListener('click', () => {
                if (this.currentTaskId) {
                    window.CDCM.App.handleDelete(this.currentTaskId);
                    this.close();
                }
            });
        }
    },

    openNew: function(dateStr) {
        this.currentTaskId = null;
        this.form.reset();
        document.getElementById('taskId').value = '';
        document.getElementById('modalTitle').textContent = 'Nueva Tarea';
        
        // Reset checkboxes
        const assigneesList = document.getElementById('taskAssigneesList');
        if (assigneesList) {
            assigneesList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        }

        // Set default dates
        const today = window.CDCM.Utils.getTodayStr();
        document.getElementById('taskStartDate').value = dateStr || today;
        document.getElementById('taskStartTime').value = '';
        document.getElementById('taskObservations').value = '';
        const alarmEl = document.getElementById('taskAlarmOffset');
        if (alarmEl) alarmEl.value = '';

        const searchEl = document.getElementById('assigneeSearch');
        if (searchEl) { searchEl.value = ''; window.CDCM.App.filterAssigneeList && window.CDCM.App.filterAssigneeList(''); }
        
        const btnDelete = document.getElementById('btnDeleteTask');
        if (btnDelete) btnDelete.style.display = 'none';

        this.modal.classList.add('active');
    },

    openCopy: function(task, targetDateStr, newEndDate) {
        this.currentTaskId = null;
        this.form.reset();
        document.getElementById('taskId').value = '';
        document.getElementById('modalTitle').textContent = 'Pegar Tarea (Copia)';
        
        // Poblar campos con los datos de la tarea copiada
        document.getElementById('taskTitle').value = task.title + ' (Copia)';
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskType').value = task.type || 'task';
        document.getElementById('taskStatus').value = task.status || 'pending';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        
        document.getElementById('taskStartDate').value = targetDateStr;
        document.getElementById('taskStartTime').value = task.startTime || '';
        document.getElementById('taskEndDate').value = newEndDate || '';
        
        // Poblar assignees
        const assigneesList = document.getElementById('taskAssigneesList');
        const checkboxes = assigneesList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        if (task.assignees && task.assignees.length > 0) {
            task.assignees.forEach(assId => {
                let cb = assigneesList.querySelector(`input[type="checkbox"][value="${assId}"]`);
                if (cb) {
                    cb.checked = true;
                } else {
                    const html = `
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 4px; padding: 4px; border-radius: var(--radius-sm);">
                            <input type="checkbox" value="${assId}" class="assignee-checkbox" checked>
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ccc;"></div>
                            ${assId} (Descontinuado)
                        </label>
                    `;
                    assigneesList.insertAdjacentHTML('beforeend', html);
                }
            });
        }
        
        document.getElementById('taskObservations').value = task.observations || '';
        document.getElementById('taskDetails').value = task.details || '';
        const alarmOffsetEl = document.getElementById('taskAlarmOffset');
        if (alarmOffsetEl) alarmOffsetEl.value = (task.alarmOffset !== undefined && task.alarmOffset !== null) ? String(task.alarmOffset) : '';

        const searchEl = document.getElementById('assigneeSearch');
        if (searchEl) { searchEl.value = ''; window.CDCM.App.filterAssigneeList && window.CDCM.App.filterAssigneeList(''); }

        const btnDelete = document.getElementById('btnDeleteTask');
        if (btnDelete) btnDelete.style.display = 'none';

        this.modal.classList.add('active');
        window.CDCM.Utils.showToast("Edita los detalles y guarda para confirmar la copia", "info");
    },

    openEdit: function(taskId) {
        const task = window.CDCM.StateManager.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.title.textContent = 'Editar Proyecto / Tarea';
        
        // Llenar campos
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskType').value = task.type || 'task';
        document.getElementById('taskStatus').value = task.status || 'pending';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskStartDate').value = task.startDate;
        document.getElementById('taskStartTime').value = task.startTime || '';
        document.getElementById('taskEndDate').value = task.endDate || '';
        const assigneesList = document.getElementById('taskAssigneesList');
        const checkboxes = assigneesList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        if (task.assignees && task.assignees.length > 0) {
            task.assignees.forEach(assId => {
                let cb = assigneesList.querySelector(`input[type="checkbox"][value="${assId}"]`);
                if (cb) {
                    cb.checked = true;
                } else {
                    // Si el responsable no existe en el catálogo, agregar un checkbox legacy temporalmente
                    const html = `
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 4px; padding: 4px; border-radius: var(--radius-sm);">
                            <input type="checkbox" value="${assId}" class="assignee-checkbox" checked>
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ccc;"></div>
                            ${assId} (Descontinuado)
                        </label>
                    `;
                    assigneesList.insertAdjacentHTML('beforeend', html);
                }
            });
        }
        
        document.getElementById('taskObservations').value = task.observations || '';
        document.getElementById('taskDetails').value = task.details || '';
        const alarmOffEl = document.getElementById('taskAlarmOffset');
        if (alarmOffEl) alarmOffEl.value = (task.alarmOffset !== undefined && task.alarmOffset !== null) ? String(task.alarmOffset) : '';

        const searchEl = document.getElementById('assigneeSearch');
        if (searchEl) { searchEl.value = ''; window.CDCM.App.filterAssigneeList && window.CDCM.App.filterAssigneeList(''); }

        const btnDelete = document.getElementById('btnDeleteTask');
        if (btnDelete) btnDelete.style.display = 'inline-flex';

        this.modal.classList.add('active');
    },

    close: function() {
        this.modal.classList.remove('active');
        this.form.reset();
    },

    save: function() {
        const id = document.getElementById('taskId').value;
        const startDate = document.getElementById('taskStartDate').value;
        const endDate = document.getElementById('taskEndDate').value;

        // Validación extra de fechas
        if (endDate && endDate < startDate) {
            window.CDCM.Utils.showToast("La fecha de fin no puede ser anterior a la de inicio", "error");
            return;
        }

        const taskData = {
            title: document.getElementById('taskTitle').value,
            category: document.getElementById('taskCategory').value,
            type: document.getElementById('taskType').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            startDate: startDate,
            startTime: document.getElementById('taskStartTime').value,
            endDate: document.getElementById('taskEndDate').value,
            assignees: Array.from(document.getElementById('taskAssigneesList').querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value),
            observations: document.getElementById('taskObservations').value,
            details: document.getElementById('taskDetails').value,
            alarmOffset: (function() { const v = document.getElementById('taskAlarmOffset').value; return v !== '' ? parseInt(v, 10) : null; })(),
            hasAlarm: document.getElementById('taskAlarmOffset').value !== '',
            alarmTriggered: false // Resetear si se edita
        };

        if (id) {
            // Edit
            window.CDCM.StateManager.updateTask(id, taskData);
        } else {
            // New
            window.CDCM.StateManager.addTask(taskData);
        }

        this.close();
    }
};
