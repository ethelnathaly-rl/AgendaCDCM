window.CDCM = window.CDCM || {};

window.CDCM.KanbanView = {
    render: function(container, tasks) {
        let html = `
            <div style="margin-bottom: 20px;">
                <h2>Tablero Kanban</h2>
            </div>
            <div class="kanban-board">
        `;

        // Agrupar por categoría leyendo dinámicamente del estado
        const tasksByCategory = {};
        const categories = window.CDCM.StateManager.state.categories;
        
        categories.forEach(cat => {
            tasksByCategory[cat.id] = tasks.filter(t => t.category === cat.id);
        });

        categories.forEach(cat => {
            const catTasks = tasksByCategory[cat.id] || [];
            if (catTasks.length === 0) return; // No mostrar columnas vacías por ahora

            const catColor = cat.color || 'var(--primary)';

            html += `
                <div class="kanban-column">
                    <div class="kanban-header" onclick="this.parentElement.classList.toggle('collapsed')" style="cursor: pointer; user-select: none;" title="Haz clic para expandir/contraer columna">
                        <h3 style="display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-chevron-down column-toggle-icon" style="font-size: 0.8rem; color: var(--text-muted); transition: transform 0.3s;"></i>
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${catColor};"></div>
                            ${cat.name}
                        </h3>
                        <span class="badge" style="background: var(--bg-color); color: var(--text-secondary); border: 1px solid var(--border-color);">${catTasks.length}</span>
                    </div>
                    <div class="task-cards" 
                         ondragover="window.CDCM.KanbanView.handleDragOver(event)" 
                         ondragleave="window.CDCM.KanbanView.handleDragLeave(event)" 
                         ondrop="window.CDCM.KanbanView.handleDrop(event, '${cat.id}')">
            `;

            catTasks.forEach(task => {
                const statusConfig = window.CDCM.Utils.getStatusConfig(task.status);
                let dateStr = window.CDCM.Utils.formatDate(task.startDate);
                if (task.startTime) dateStr += ` ${task.startTime}`;
                if (task.endDate) dateStr += ` - ${window.CDCM.Utils.formatDate(task.endDate)}`;
                
                const alarmIcon = task.hasAlarm ? '<i class="fa-solid fa-bell" style="color: var(--accent-orange); margin-left: 4px;" title="Alarma Activa"></i>' : '';
                const obsIcon = task.observations ? `<i class="fa-solid fa-comment-dots" style="color: var(--primary); margin-left: 4px;" title="Tiene observaciones"></i>` : '';
                const assigneeHtml = task.assignee ? `<div style="margin-top: 6px; font-size: 0.75rem; color: var(--primary); font-weight: 500; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-user"></i> ${task.assignee}</div>` : '';

                html += `
                    <div class="task-card" 
                         style="border-left-color: ${catColor};" 
                         draggable="true"
                         ondragstart="window.CDCM.KanbanView.handleDragStart(event, '${task.id}')"
                         ondragend="window.CDCM.KanbanView.handleDragEnd(event)"
                         onclick="this.classList.toggle('expanded')" 
                         title="Haz clic para expandir/contraer detalles (Arrastra para mover)">
                        <div class="task-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6px;">
                            <div class="task-card-title" style="margin-bottom:0; flex: 1;">
                                ${task.priority === 'high' ? `<i class="fa-solid fa-flag" style="color: var(--priority-high); font-size: 0.8rem;"></i> ` : ''}
                                ${task.attachments && task.attachments.length > 0 ? '<i class="fa-solid fa-paperclip" style="color:var(--text-muted); font-size: 0.8rem; margin-right:4px;" title="Tiene adjuntos"></i>' : ''}
                                ${task.title} ${obsIcon}
                            </div>
                            <div style="display: flex; gap: 4px; margin-left: 8px;">
                                <button class="btn-icon" title="Editar Tarea" style="padding:0; width: 24px; height: 24px; color:var(--primary); font-size: 0.8rem;" onclick="event.stopPropagation(); window.CDCM.FormModal.openEdit('${task.id}')">
                                    <i class="fa-solid fa-pen" style="pointer-events:none;"></i>
                                </button>
                                <button class="btn-icon delete-btn" title="Eliminar" style="padding:0; width: 24px; height: 24px; color:var(--text-muted); font-size: 0.8rem;" onclick="event.stopPropagation(); window.CDCM.App.handleDelete('${task.id}')">
                                    <i class="fa-solid fa-trash-can" style="pointer-events:none;"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="badge" style="background-color: ${statusConfig.color}15; color: ${statusConfig.color}; font-size: 0.7rem;">
                                ${statusConfig.text}
                            </span>
                            <i class="fa-solid fa-chevron-down toggle-icon" style="color: var(--text-muted); font-size: 0.8rem; transition: transform 0.3s;"></i>
                        </div>
                        
                        <div class="task-card-details">
                            <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                                ${task.assignees && task.assignees.length > 0 ? 
                                    `<div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                        ${task.assignees.map(assId => {
                                            const assObj = window.CDCM.StateManager.state.assignees.find(a => a.id === assId);
                                            const assName = assObj ? assObj.name : assId;
                                            const assColor = assObj ? (assObj.color || '#ccc') : '#ccc';
                                            return `<div style="display:flex; align-items:center; gap:4px; font-size:0.7rem; background:var(--bg-color); padding:2px 4px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                                                        <div style="width:6px; height:6px; border-radius:50%; background-color:${assColor}"></div>
                                                        ${assName}
                                                    </div>`;
                                        }).join('')}
                                    </div>` 
                                    : '<span style="font-style: italic;">Sin asignar</span>'
                                }
                                <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                                    <i class="fa-regular fa-calendar"></i> ${dateStr} ${alarmIcon}
                                </div>
                            </div>
                            
                            ${task.details ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${task.details}</div>` : ''}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        if (Object.values(tasksByCategory).every(arr => arr.length === 0)) {
            html += `
                <div style="width: 100%; padding: 40px; text-align: center; color: var(--text-muted);">
                    <p>No hay proyectos en el tablero.</p>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    handleDragStart: function(e, taskId) {
        e.dataTransfer.setData('taskId', taskId);
        e.currentTarget.classList.add('dragging');
        // Efecto visual suave para el arrastre
        setTimeout(() => {
            if (e.target && e.target.classList) {
                e.target.classList.add('dragging');
            }
        }, 0);
    },

    handleDragEnd: function(e) {
        e.currentTarget.classList.remove('dragging');
        // Limpiar todas las columnas por si acaso
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drag-over');
        });
    },

    handleDragOver: function(e) {
        e.preventDefault();
        const column = e.currentTarget.closest('.kanban-column');
        if (column) {
            column.classList.add('drag-over');
        }
    },

    handleDragLeave: function(e) {
        const column = e.currentTarget.closest('.kanban-column');
        if (column) {
            column.classList.remove('drag-over');
        }
    },

    handleDrop: function(e, categoryId) {
        e.preventDefault();
        const column = e.currentTarget.closest('.kanban-column');
        if (column) {
            column.classList.remove('drag-over');
        }

        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            // Actualizar el estado
            window.CDCM.StateManager.updateTask(taskId, { category: categoryId });
            window.CDCM.Utils.showToast("Categoría actualizada correctamente", "success");
        }
    }
};
