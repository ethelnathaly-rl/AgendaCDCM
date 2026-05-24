window.CDCM = window.CDCM || {};

window.CDCM.ListView = {
    _sortField: 'startDate',
    _sortDir: 'asc',

    render: function(container, tasks) {
        const sortField = this._sortField;
        const sortDir = this._sortDir;
        const assignees = window.CDCM.StateManager.state.assignees;
        const categories = window.CDCM.StateManager.state.categories;

        // Clonar y ordenar
        let sorted = [...tasks];
        sorted.sort((a, b) => {
            let va = '', vb = '';
            if (sortField === 'title') { va = a.title||''; vb = b.title||''; }
            else if (sortField === 'category') {
                const ca = categories.find(c => c.id === a.category); va = ca ? ca.name : '';
                const cb = categories.find(c => c.id === b.category); vb = cb ? cb.name : '';
            }
            else if (sortField === 'status') { va = a.status||''; vb = b.status||''; }
            else if (sortField === 'priority') {
                const pmap = { high: 0, medium: 1, low: 2 };
                va = pmap[a.priority] ?? 1; vb = pmap[b.priority] ?? 1;
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            else if (sortField === 'startDate') { va = a.startDate||''; vb = b.startDate||''; }
            else if (sortField === 'assignee') {
                const aa = a.assignees && a.assignees[0] ? assignees.find(x => x.id === a.assignees[0]) : null;
                const ab = b.assignees && b.assignees[0] ? assignees.find(x => x.id === b.assignees[0]) : null;
                va = aa ? aa.name : ''; vb = ab ? ab.name : '';
            }
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return sortDir === 'asc' ? cmp : -cmp;
        });

        const todayStr = window.CDCM.Utils.getTodayStr();

        const arrowIcon = (field) => {
            if (sortField !== field) return `<i class="fa-solid fa-sort" style="opacity:0.3; font-size:0.7rem;"></i>`;
            return sortDir === 'asc'
                ? `<i class="fa-solid fa-sort-up" style="color:var(--primary); font-size:0.7rem;"></i>`
                : `<i class="fa-solid fa-sort-down" style="color:var(--primary); font-size:0.7rem;"></i>`;
        };

        const thStyle = `cursor:pointer; user-select:none; white-space:nowrap;`;

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <h2>Vista de Lista</h2>
                    <span class="badge" style="background:var(--bg-color); color:var(--text-secondary); border:1px solid var(--border-color);">${sorted.length} resultados</span>
                </div>
                <button class="btn-secondary" onclick="window.CDCM.ListView.exportCSV()" title="Exportar a CSV">
                    <i class="fa-solid fa-file-csv"></i> Exportar CSV
                </button>
            </div>
            <div style="overflow-x:auto;">
                <table class="list-view-table">
                    <thead>
                        <tr>
                            <th style="${thStyle}" onclick="window.CDCM.ListView.sortBy('title')">Título ${arrowIcon('title')}</th>
                            <th style="${thStyle}" onclick="window.CDCM.ListView.sortBy('category')">Categoría ${arrowIcon('category')}</th>
                            <th style="${thStyle}" onclick="window.CDCM.ListView.sortBy('assignee')">Responsables ${arrowIcon('assignee')}</th>
                            <th style="${thStyle}" onclick="window.CDCM.ListView.sortBy('status')">Estado ${arrowIcon('status')}</th>
                            <th style="${thStyle}" onclick="window.CDCM.ListView.sortBy('priority')">Prioridad ${arrowIcon('priority')}</th>
                            <th style="${thStyle}" onclick="window.CDCM.ListView.sortBy('startDate')">Fechas ${arrowIcon('startDate')}</th>
                            <th style="text-align:right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (sorted.length === 0) {
            html += `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size:2.5rem; margin-bottom:8px; display:block;"></i>
                No hay proyectos que coincidan con los filtros.
            </td></tr>`;
        }

        sorted.forEach(task => {
            const statusConfig = window.CDCM.Utils.getStatusConfig(task.status);
            const priorityColor = window.CDCM.Utils.getPriorityColor(task.priority);
            const catObj = categories.find(c => c.id === task.category);
            const catName = catObj ? catObj.name : (task.category || '—');
            const catColor = catObj ? catObj.color : 'var(--text-muted)';

            let dateStr = window.CDCM.Utils.formatDate(task.startDate);
            if (task.startTime) dateStr += ` ${task.startTime}`;
            if (task.endDate) dateStr += ` → ${window.CDCM.Utils.formatDate(task.endDate)}`;

            const effEnd = task.endDate || task.startDate;
            const isOverdue = effEnd < todayStr && task.status !== 'completed' && task.status !== 'cancelled';
            const hasObs = task.observations ? `<i class="fa-solid fa-comment-dots" style="color:var(--primary); margin-left:6px;" title="Tiene observaciones"></i>` : '';
            const priorityLabel = task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja';

            const assHtml = task.assignees && task.assignees.length > 0
                ? `<div style="display:flex; flex-wrap:wrap; gap:4px;">${task.assignees.map(aid => {
                    const a = assignees.find(x => x.id === aid);
                    const nm = a ? a.name : aid; const cl = a ? (a.color||'#ccc') : '#ccc';
                    return `<span style="display:flex;align-items:center;gap:4px;font-size:0.75rem;background:${cl}18;color:${cl};border:1px solid ${cl}44;padding:2px 6px;border-radius:12px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:${cl};flex-shrink:0;"></span>${nm}
                    </span>`;
                }).join('')}</div>`
                : '<span style="color:var(--text-muted); font-style:italic; font-size:0.85rem;">Sin asignar</span>';

            html += `<tr style="${isOverdue ? 'background:rgba(239,68,68,0.04);' : ''}">
                <td>
                    <div style="font-weight:500; color:var(--text-primary); cursor:pointer;" onclick="window.CDCM.FormModal.openEdit('${task.id}')">
                        ${task.priority === 'high' ? '<i class="fa-solid fa-flag" style="color:var(--priority-high); font-size:0.75rem;"></i> ' : ''}
                        ${task.attachments && task.attachments.length > 0 ? '<i class="fa-solid fa-paperclip" style="color:var(--text-muted); font-size: 0.8rem; margin-right:4px;" title="Tiene adjuntos"></i>' : ''}
                        ${task.title} ${hasObs}
                    </div>
                </td>
                <td>
                    <span style="display:inline-flex; align-items:center; gap:5px; font-size:0.8rem;">
                        <span style="width:8px;height:8px;border-radius:50%;background:${catColor};flex-shrink:0;"></span>${catName}
                    </span>
                </td>
                <td>${assHtml}</td>
                <td>
                    <span class="badge" style="background:${statusConfig.color}20; color:${statusConfig.color}; border:1px solid ${statusConfig.color}40;">
                        ${statusConfig.text}
                    </span>
                </td>
                <td>
                    <span style="color:${priorityColor}; font-size:0.85rem; font-weight:600;">
                        <i class="fa-solid fa-flag"></i> ${priorityLabel}
                    </span>
                </td>
                <td>
                    <span style="font-size:0.82rem; ${isOverdue ? 'color:var(--status-cancelled); font-weight:600;' : 'color:var(--text-secondary);'}">${dateStr}</span>
                    ${isOverdue ? '<br><span style="font-size:0.7rem; color:var(--status-cancelled); font-weight:600;">⚠ Vencida</span>' : ''}
                </td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-icon" title="Editar" onclick="window.CDCM.FormModal.openEdit('${task.id}')">
                        <i class="fa-solid fa-pen" style="color:var(--primary);"></i>
                    </button>
                    <button class="btn-icon" title="Eliminar" onclick="window.CDCM.App.handleDelete('${task.id}')">
                        <i class="fa-solid fa-trash-can" style="color:var(--status-cancelled);"></i>
                    </button>
                </td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    },

    sortBy: function(field) {
        if (this._sortField === field) {
            this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this._sortField = field;
            this._sortDir = 'asc';
        }
        window.CDCM.StateManager.notify();
    },

    exportCSV: function() {
        const tasks = window.CDCM.StateManager.getFilteredTasks();
        const assignees = window.CDCM.StateManager.state.assignees;
        const categories = window.CDCM.StateManager.state.categories;

        const rows = [['Título','Categoría','Estado','Prioridad','Responsables','Fecha Inicio','Fecha Fin','Detalles','Observaciones']];
        tasks.forEach(t => {
            const cat = categories.find(c => c.id === t.category);
            const assNames = (t.assignees||[]).map(id => { const a = assignees.find(x => x.id === id); return a ? a.name : id; }).join(' | ');
            const prioMap = { high:'Alta', medium:'Media', low:'Baja' };
            const statusConfig = window.CDCM.Utils.getStatusConfig(t.status);
            rows.push([
                `"${(t.title||'').replace(/"/g,'""')}"`,
                `"${cat ? cat.name : t.category}"`,
                `"${statusConfig.text}"`,
                `"${prioMap[t.priority]||t.priority}"`,
                `"${assNames}"`,
                t.startDate||'',
                t.endDate||'',
                `"${(t.details||'').replace(/"/g,'""').replace(/\n/g,' ')}"`,
                `"${(t.observations||'').replace(/"/g,'""').replace(/\n/g,' ')}"`
            ]);
        });

        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cdcm_lista_${window.CDCM.Utils.getTodayStr()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        window.CDCM.Utils.showToast('Lista exportada a CSV', 'success');
    }
};
