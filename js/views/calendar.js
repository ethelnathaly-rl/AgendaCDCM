window.CDCM = window.CDCM || {};

window.CDCM.CalendarView = {
    currentView: 'monthly', // 'monthly' | 'weekly' | 'daily'

    render: function(container, tasks) {
        const v = this.currentView;
        if (v === 'weekly') {
            this.renderWeekly(container, tasks);
        } else if (v === 'daily') {
            this.renderDaily(container, tasks);
        } else {
            this.renderMonthly(container, tasks);
        }
    },

    // ---------- VISTA MENSUAL ----------
    renderMonthly: function(container, tasks) {
        const currentDate = window.CDCM.StateManager.state.currentMonth;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const categories = window.CDCM.StateManager.state.categories;
        const getCatColor = (catId) => { const c = categories.find(x => x.id === catId); return c ? c.color : 'var(--primary)'; };
        const todayStr = window.CDCM.Utils.getTodayStr();

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="btn-icon" onclick="window.CDCM.App.prevMonth()"><i class="fa-solid fa-chevron-left"></i></button>
                        <h2 style="min-width:200px; text-align:center;">${monthNames[month]} ${year}</h2>
                        <button class="btn-icon" onclick="window.CDCM.App.nextMonth()"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
                        <button class="btn-secondary" onclick="window.CDCM.App.todayMonth()">Hoy</button>
                        <button class="cal-view-btn ${this.currentView==='monthly'?'active':''}" onclick="window.CDCM.CalendarView.switchView('monthly')"><i class="fa-solid fa-calendar"></i> Mes</button>
                        <button class="cal-view-btn ${this.currentView==='weekly'?'active':''}" onclick="window.CDCM.CalendarView.switchView('weekly')"><i class="fa-solid fa-calendar-week"></i> Semana</button>
                        <button class="cal-view-btn ${this.currentView==='daily'?'active':''}" onclick="window.CDCM.CalendarView.switchView('daily')"><i class="fa-solid fa-calendar-day"></i> Día</button>
                    </div>
                </div>
                <div class="calendar-grid">
                    <div class="day-name">Lun</div><div class="day-name">Mar</div><div class="day-name">Mié</div>
                    <div class="day-name">Jue</div><div class="day-name">Vie</div><div class="day-name">Sáb</div><div class="day-name">Dom</div>
                </div>
                <div class="calendar-days">
        `;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startingDay = firstDay.getDay() - 1;
        if (startingDay === -1) startingDay = 6;
        const totalDays = lastDay.getDate();

        for (let i = 0; i < startingDay; i++) html += `<div class="calendar-day empty"></div>`;

        for (let i = 1; i <= totalDays; i++) {
            const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const isToday = dayStr === todayStr;
            const isOverdue = dayStr < todayStr;

            html += `<div class="calendar-day ${isToday?'today':''}" 
                        onclick="window.CDCM.FormModal.openNew('${dayStr}')"
                        ondragover="event.preventDefault(); this.classList.add('drag-date-over')"
                        ondragleave="this.classList.remove('drag-date-over')"
                        ondrop="window.CDCM.CalendarView.handleCalDrop(event,'${dayStr}'); this.classList.remove('drag-date-over')"
                        oncontextmenu="window.CDCM.CalendarView.handlePaste(event,'${dayStr}')">
                <div class="day-number">${i}</div>
                <div class="day-events">`;

            const dayTasks = tasks.filter(t => {
                if (!t.endDate) return t.startDate === dayStr;
                return dayStr >= t.startDate && dayStr <= t.endDate;
            });

            dayTasks.slice(0, 4).forEach(task => {
                const bg = getCatColor(task.category);
                const opacity = task.status === 'completed' ? '0.55' : '1';
                const isVencida = !task.endDate ? task.startDate < todayStr : task.endDate < todayStr;
                const overdueRing = (isVencida && task.status !== 'completed' && task.status !== 'cancelled') ? 'outline: 2px solid #ef4444;' : '';

                let classes = 'event-pill';
                if (task.endDate && task.startDate !== task.endDate) {
                    if (dayStr === task.startDate) classes += ' multi-day-start';
                    else if (dayStr === task.endDate) classes += ' multi-day-end';
                    else classes += ' multi-day-middle';
                }

                html += `<div class="${classes}" 
                     style="background-color:${bg}; opacity:${opacity}; ${overdueRing}"
                     draggable="true"
                     ondragstart="window.CDCM.CalendarView.handleCalDragStart(event,'${task.id}','${dayStr}')"
                     ondragend="window.CDCM.CalendarView.handleCalDragEnd(event)"
                     onclick="event.stopPropagation(); window.CDCM.FormModal.openEdit('${task.id}')"
                     oncontextmenu="window.CDCM.CalendarView.handleCopy(event,'${task.id}')">
                    ${task.attachments && task.attachments.length > 0 ? '<i class="fa-solid fa-paperclip"></i> ' : ''}${task.title}
                </div>`;
            });

            if (dayTasks.length > 4) {
                html += `<div class="event-pill" style="background:var(--text-muted); cursor:default;" onclick="event.stopPropagation()">+${dayTasks.length-4} más</div>`;
            }

            html += `</div></div>`;
        }

        html += `</div></div>`;
        container.innerHTML = html;
    },

    // ---------- VISTA SEMANAL ----------
    renderWeekly: function(container, tasks) {
        const state = window.CDCM.StateManager.state;
        const base = state.currentMonth;
        const dayOfWeek = base.getDay(); // 0=Dom..6=Sab
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(base);
        monday.setDate(base.getDate() + diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }

        const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
        const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const todayStr = window.CDCM.Utils.getTodayStr();
        const categories = window.CDCM.StateManager.state.categories;
        const getCatColor = (catId) => { const c = categories.find(x => x.id === catId); return c ? c.color : 'var(--primary)'; };
        const dayNames = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
        const rangeStr = `${fmt(days[0])} - ${fmt(days[6])}`;

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="btn-icon" onclick="window.CDCM.App.prevWeek()"><i class="fa-solid fa-chevron-left"></i></button>
                        <h2 style="min-width:200px; text-align:center; font-size:1.1rem;">${rangeStr}</h2>
                        <button class="btn-icon" onclick="window.CDCM.App.nextWeek()"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-secondary" onclick="window.CDCM.App.todayMonth()">Hoy</button>
                        <button class="cal-view-btn" onclick="window.CDCM.CalendarView.switchView('monthly')"><i class="fa-solid fa-calendar"></i> Mes</button>
                        <button class="cal-view-btn active" onclick="window.CDCM.CalendarView.switchView('weekly')"><i class="fa-solid fa-calendar-week"></i> Semana</button>
                        <button class="cal-view-btn" onclick="window.CDCM.CalendarView.switchView('daily')"><i class="fa-solid fa-calendar-day"></i> Día</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: repeat(7, 1fr); border-bottom:1px solid var(--border-color);">
        `;

        days.forEach((d, i) => {
            const ds = toStr(d);
            const isT = ds === todayStr;
            html += `<div style="padding:10px; text-align:center; font-weight:600; font-size:0.8rem; color:${isT?'var(--primary)':'var(--text-secondary)'}; border-right:1px solid var(--border-color);">
                ${dayNames[i]} ${fmt(d)}
            </div>`;
        });

        html += `</div><div style="display:grid; grid-template-columns: repeat(7, 1fr);">`;

        days.forEach(d => {
            const ds = toStr(d);
            const isT = ds === todayStr;
            const dayTasks = tasks.filter(t => !t.endDate ? t.startDate === ds : ds >= t.startDate && ds <= t.endDate);
            html += `<div class="calendar-day ${isT?'today':''}" style="min-height:160px;"
                onclick="window.CDCM.FormModal.openNew('${ds}')"
                ondragover="event.preventDefault(); this.classList.add('drag-date-over')"
                ondragleave="this.classList.remove('drag-date-over')"
                ondrop="window.CDCM.CalendarView.handleCalDrop(event,'${ds}'); this.classList.remove('drag-date-over')"
                oncontextmenu="window.CDCM.CalendarView.handlePaste(event,'${ds}')">
                <div class="day-events">`;

            dayTasks.forEach(t => {
                const bg = getCatColor(t.category);
                html += `<div class="event-pill" style="background-color:${bg};"
                    draggable="true"
                    ondragstart="window.CDCM.CalendarView.handleCalDragStart(event,'${t.id}','${ds}')"
                    ondragend="window.CDCM.CalendarView.handleCalDragEnd(event)"
                    onclick="event.stopPropagation(); window.CDCM.FormModal.openEdit('${t.id}')"
                    oncontextmenu="window.CDCM.CalendarView.handleCopy(event,'${t.id}')">
                    ${t.attachments && t.attachments.length > 0 ? '<i class="fa-solid fa-paperclip"></i> ' : ''}${t.title}
                </div>`;
            });

            html += `</div></div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    },

    // ---------- VISTA DIARIA ----------
    renderDaily: function(container, tasks) {
        const d = window.CDCM.StateManager.state.currentMonth;
        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const todayStr = window.CDCM.Utils.getTodayStr();
        const categories = window.CDCM.StateManager.state.categories;
        const getCatColor = (catId) => { const c = categories.find(x => x.id === catId); return c ? c.color : 'var(--primary)'; };
        const dayTasks = tasks.filter(t => !t.endDate ? t.startDate === ds : ds >= t.startDate && ds <= t.endDate);
        const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="btn-icon" onclick="window.CDCM.App.prevDay()"><i class="fa-solid fa-chevron-left"></i></button>
                        <h2 style="min-width:260px; text-align:center; font-size:1.1rem;">${dayNames[d.getDay()]} ${d.getDate()} de ${monthNames[d.getMonth()]} ${d.getFullYear()}</h2>
                        <button class="btn-icon" onclick="window.CDCM.App.nextDay()"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-secondary" onclick="window.CDCM.App.todayMonth()">Hoy</button>
                        <button class="cal-view-btn" onclick="window.CDCM.CalendarView.switchView('monthly')"><i class="fa-solid fa-calendar"></i> Mes</button>
                        <button class="cal-view-btn" onclick="window.CDCM.CalendarView.switchView('weekly')"><i class="fa-solid fa-calendar-week"></i> Semana</button>
                        <button class="cal-view-btn active" onclick="window.CDCM.CalendarView.switchView('daily')"><i class="fa-solid fa-calendar-day"></i> Día</button>
                    </div>
                </div>
                <div style="padding:20px;">
                    <button class="btn-primary" onclick="window.CDCM.FormModal.openNew('${ds}')" style="margin-bottom:16px;">
                        <i class="fa-solid fa-plus"></i> Nueva Actividad
                    </button>`;

        if (dayTasks.length === 0) {
            html += `<div style="text-align:center; color:var(--text-muted); padding:40px;">
                <i class="fa-solid fa-calendar-xmark" style="font-size:2.5rem; margin-bottom:10px;"></i>
                <p>Sin actividades para este día.</p>
            </div>`;
        } else {
            html += `<div style="display:flex; flex-direction:column; gap:12px;">`;
            dayTasks.sort((a,b) => (a.startTime||'00:00').localeCompare(b.startTime||'00:00')).forEach(task => {
                const bg = getCatColor(task.category);
                const sc = window.CDCM.Utils.getStatusConfig(task.status);
                const assignees = window.CDCM.StateManager.state.assignees;
                const assHtml = task.assignees && task.assignees.length > 0
                    ? task.assignees.map(aid => {
                        const a = assignees.find(x => x.id === aid);
                        return a ? `<span style="background:${a.color}22; color:${a.color}; padding:2px 8px; border-radius:12px; font-size:0.75rem; border:1px solid ${a.color}44;">● ${a.name}</span>` : '';
                    }).join(' ') : '<span style="color:var(--text-muted); font-size:0.8rem;">Sin asignar</span>';
                const isVencida = ds < todayStr && task.status !== 'completed';
                html += `<div style="border-left:4px solid ${bg}; background:var(--card-bg); border-radius:var(--radius-sm); padding:14px; box-shadow:var(--shadow-sm); ${isVencida?'outline:2px solid #ef444466;':''}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <strong style="font-size:1rem;">${task.attachments && task.attachments.length > 0 ? '<i class="fa-solid fa-paperclip" style="color:var(--text-muted); margin-right:4px;"></i>' : ''}${task.title}</strong>
                            ${task.startTime ? `<span style="color:var(--text-muted); font-size:0.85rem; margin-left:8px;">🕐 ${task.startTime}</span>` : ''}
                        </div>
                        <div style="display:flex; gap:6px;">
                            <span class="badge" style="background:${sc.color}20; color:${sc.color};">${sc.text}</span>
                            <button class="btn-icon" style="color:var(--primary);" onclick="window.CDCM.FormModal.openEdit('${task.id}')"><i class="fa-solid fa-pen"></i></button>
                        </div>
                    </div>
                    <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">${assHtml}</div>
                    ${task.details ? `<div style="margin-top:8px; font-size:0.85rem; color:var(--text-secondary);">${task.details}</div>` : ''}
                </div>`;
            });
            html += `</div>`;
        }

        html += `</div></div>`;
        container.innerHTML = html;
    },

    switchView: function(v) {
        this.currentView = v;
        window.CDCM.StateManager.notify();
    },

    // ---------- DRAG & DROP EN CALENDARIO ----------
    _draggedTaskId: null,
    _dragOriginDate: null,

    handleCalDragStart: function(e, taskId, originDate) {
        e.stopPropagation();
        this._draggedTaskId = taskId;
        this._dragOriginDate = originDate;
        e.dataTransfer.setData('calTaskId', taskId);
        e.dataTransfer.setData('calOriginDate', originDate);
        setTimeout(() => { if (e.target) e.target.style.opacity = '0.4'; }, 0);
    },

    handleCalDragEnd: function(e) {
        if (e.target) e.target.style.opacity = '';
        this._draggedTaskId = null;
        this._dragOriginDate = null;
        document.querySelectorAll('.drag-date-over').forEach(el => el.classList.remove('drag-date-over'));
    },

    handleCalDrop: function(e, targetDateStr) {
        e.preventDefault();
        e.stopPropagation();
        const taskId = e.dataTransfer.getData('calTaskId') || this._draggedTaskId;
        const originDate = e.dataTransfer.getData('calOriginDate') || this._dragOriginDate;
        if (!taskId || !originDate || originDate === targetDateStr) return;

        const task = window.CDCM.StateManager.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Calcular desplazamiento en días
        const origD = new Date(originDate + 'T00:00:00');
        const targD = new Date(targetDateStr + 'T00:00:00');
        const diffDays = Math.round((targD - origD) / 86400000);

        const newStart = new Date(task.startDate + 'T00:00:00');
        newStart.setDate(newStart.getDate() + diffDays);
        const newStartStr = newStart.toISOString().split('T')[0];

        let newEndStr = task.endDate;
        if (task.endDate) {
            const newEnd = new Date(task.endDate + 'T00:00:00');
            newEnd.setDate(newEnd.getDate() + diffDays);
            newEndStr = newEnd.toISOString().split('T')[0];
        }

        window.CDCM.StateManager.updateTask(taskId, { startDate: newStartStr, endDate: newEndStr });
        window.CDCM.Utils.showToast(`"${task.title}" movida al ${targetDateStr}`, 'success');
    },

    // ---------- COPIAR / PEGAR ----------
    handleCopy: function(e, taskId) {
        e.preventDefault();
        e.stopPropagation();
        const task = window.CDCM.StateManager.state.tasks.find(t => t.id === taskId);
        if (task) {
            window.CDCM.Clipboard = JSON.parse(JSON.stringify(task));
            window.CDCM.Utils.showToast('Actividad copiada. Clic derecho en otro día para pegar.');
        }
    },

    handlePaste: function(e, targetDateStr) {
        e.preventDefault();
        if (!window.CDCM.Clipboard) return;

        const clipboardTask = window.CDCM.Clipboard;
        let newEndDate = null;
        if (clipboardTask.endDate) {
            const startD = new Date(clipboardTask.startDate + 'T00:00:00');
            const endD   = new Date(clipboardTask.endDate   + 'T00:00:00');
            const durationMs = endD - startD;
            const targetStartD = new Date(targetDateStr + 'T00:00:00');
            const targetEndD   = new Date(targetStartD.getTime() + durationMs);
            newEndDate = targetEndD.toISOString().split('T')[0];
        }

        window.CDCM.FormModal.openCopy(clipboardTask, targetDateStr, newEndDate);
    }
};
