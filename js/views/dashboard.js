window.CDCM = window.CDCM || {};

window.CDCM.DashboardView = {
    render: function(container, tasks) {
        const today = window.CDCM.Utils.getTodayStr();
        
        const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const tasksForToday = activeTasks.filter(t => t.startDate <= today && (!t.endDate || t.endDate >= today));
        const overdueTasks = activeTasks.filter(t => t.endDate ? t.endDate < today : t.startDate < today);

        const html = `
            <h2>Resumen (Dashboard)</h2>
            <p class="text-muted" style="margin-bottom: 20px;">Vista general de tus proyectos y tareas.</p>
            
            <div class="dashboard-grid">
                <div class="stat-card">
                    <span class="stat-title">Proyectos Activos</span>
                    <span class="stat-value" style="color: var(--primary)">${activeTasks.length}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Tareas para Hoy</span>
                    <span class="stat-value" style="color: var(--status-progress)">${tasksForToday.length}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Tareas Vencidas</span>
                    <span class="stat-value" style="color: var(--status-cancelled)">${overdueTasks.length}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Completadas Total</span>
                    <span class="stat-value" style="color: var(--status-completed)">${completedTasks.length}</span>
                </div>
            </div>

            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <!-- Aquí se podrían agregar gráficos o listas resumidas en el futuro -->
                <div style="flex: 1; min-width: 300px; background: var(--card-bg); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 15px;">Atención Requerida (Alta Prioridad)</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${activeTasks.filter(t => t.priority === 'high').slice(0, 5).map(t => `
                            <li style="padding: 10px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; cursor: pointer;" onclick="window.CDCM.FormModal.openEdit('${t.id}')">
                                <span><i class="fa-solid fa-circle-exclamation" style="color: var(--priority-high)"></i> ${t.title}</span>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">${window.CDCM.Utils.formatDate(t.startDate)}</span>
                            </li>
                        `).join('') || '<li style="color: var(--text-muted)">No hay tareas de alta prioridad.</li>'}
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
};
