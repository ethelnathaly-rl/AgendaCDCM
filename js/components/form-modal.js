window.CDCM = window.CDCM || {};

window.CDCM.FormModal = {
    init: function() {
        this.modal = document.getElementById('taskModal');
        this.form = document.getElementById('taskForm');
        this.title = document.getElementById('modalTitle');
        this.currentAttachments = [];
        
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

        // Manejo de adjuntos locales
        const attachInput = document.getElementById('taskAttachmentInput');
        if (attachInput) {
            attachInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 800;
                            const MAX_HEIGHT = 800;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress
                            
                            this.currentAttachments.push(dataUrl);
                            this.renderAttachments();
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    },

    renderAttachments: function() {
        const gallery = document.getElementById('taskAttachmentsGallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        this.currentAttachments.forEach((dataUrl, index) => {
            const wrap = document.createElement('div');
            wrap.style.position = 'relative';
            wrap.style.width = '60px';
            wrap.style.height = '60px';
            wrap.style.borderRadius = 'var(--radius-sm)';
            wrap.style.overflow = 'hidden';
            wrap.style.border = '1px solid var(--border-color)';
            wrap.style.boxShadow = 'var(--shadow-sm)';

            const img = document.createElement('img');
            img.src = dataUrl;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.cursor = 'pointer';
            img.title = 'Clic para ver completa';
            img.onclick = () => {
                const w = window.open('');
                w.document.write('<img src="' + dataUrl + '" style="max-width:100%;">');
            };

            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '2px';
            delBtn.style.right = '2px';
            delBtn.style.background = 'rgba(239, 68, 68, 0.9)';
            delBtn.style.color = 'white';
            delBtn.style.border = 'none';
            delBtn.style.borderRadius = '50%';
            delBtn.style.width = '20px';
            delBtn.style.height = '20px';
            delBtn.style.fontSize = '10px';
            delBtn.style.cursor = 'pointer';
            delBtn.style.display = 'flex';
            delBtn.style.alignItems = 'center';
            delBtn.style.justifyContent = 'center';
            delBtn.onclick = (e) => {
                e.preventDefault();
                this.currentAttachments.splice(index, 1);
                this.renderAttachments();
            };

            wrap.appendChild(img);
            wrap.appendChild(delBtn);
            gallery.appendChild(wrap);
        });
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

        this.currentAttachments = [];
        this.renderAttachments();

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

        this.currentAttachments = [...(task.attachments || [])];
        this.renderAttachments();

        this.modal.classList.add('active');
        window.CDCM.Utils.showToast("Edita los detalles y guarda para confirmar la copia", "info");
    },

    openEdit: function(taskId) {
        const task = window.CDCM.StateManager.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentTaskId = taskId;
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

        this.currentAttachments = [...(task.attachments || [])];
        this.renderAttachments();

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
            attachments: this.currentAttachments,
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
