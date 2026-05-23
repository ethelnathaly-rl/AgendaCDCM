window.CDCM = window.CDCM || {};

window.CDCM.CatalogModal = {
    init: function() {
        this.modal = document.getElementById('catalogModal');
        this.catList = document.getElementById('catalogCategoryList');
        this.assList = document.getElementById('catalogAssigneeList');
        
        const btnManage = document.getElementById('btnManageCatalogs');
        if (btnManage) {
            btnManage.addEventListener('click', () => {
                // Cerramos settings modal si está abierto
                document.getElementById('settingsModal').classList.remove('active');
                this.open();
            });
        }

        const closeBtns = this.modal.querySelectorAll('.close-catalog-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Re-renderizar si el estado cambia mientras está abierto
        window.CDCM.StateManager.subscribe(() => {
            if (this.modal.classList.contains('active')) {
                this.renderLists();
            }
        });
    },

    open: function() {
        this.renderLists();
        this.modal.classList.add('active');
    },

    close: function() {
        this.modal.classList.remove('active');
    },

    renderLists: function() {
        const state = window.CDCM.StateManager.state;
        
        // Categorías
        this.catList.innerHTML = state.categories.map(cat => `
            <div style="display:flex; gap:8px; align-items:center; background:var(--bg-color); padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                <input type="color" id="cat_color_${cat.id}" value="${cat.color}" style="width:30px; height:30px; padding:0; border:none; cursor:pointer;" title="Cambiar Color">
                <input type="text" id="cat_name_${cat.id}" value="${cat.name}" style="flex:1; padding:4px 8px;">
                <button class="btn-icon" onclick="window.CDCM.CatalogModal.saveCategory('${cat.id}')" title="Guardar"><i class="fa-solid fa-check" style="color:var(--primary)"></i></button>
                <button class="btn-icon" onclick="window.CDCM.CatalogModal.deleteCategory('${cat.id}')" title="Eliminar"><i class="fa-solid fa-trash-can" style="color:var(--status-cancelled)"></i></button>
            </div>
        `).join('') || '<p class="text-muted">No hay categorías</p>';

        // Responsables
        this.assList.innerHTML = state.assignees.map(ass => `
            <div style="display:flex; gap:8px; align-items:center; background:var(--bg-color); padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                <input type="color" id="ass_color_${ass.id}" value="${ass.color || '#cccccc'}" style="width:30px; height:30px; padding:0; border:none; cursor:pointer;" title="Cambiar Color">
                <input type="text" id="ass_name_${ass.id}" value="${ass.name}" style="flex:1; padding:4px 8px;">
                <button class="btn-icon" onclick="window.CDCM.CatalogModal.saveAssignee('${ass.id}')" title="Guardar"><i class="fa-solid fa-check" style="color:var(--primary)"></i></button>
                <button class="btn-icon" onclick="window.CDCM.CatalogModal.deleteAssignee('${ass.id}')" title="Eliminar"><i class="fa-solid fa-trash-can" style="color:var(--status-cancelled)"></i></button>
            </div>
        `).join('') || '<p class="text-muted">No hay responsables</p>';
    },

    saveCategory: function(id) {
        const name = document.getElementById(`cat_name_${id}`).value.trim();
        const color = document.getElementById(`cat_color_${id}`).value;
        if(!name) {
            window.CDCM.Utils.showToast("El nombre no puede estar vacío");
            return;
        }

        const state = window.CDCM.StateManager.state;
        const exists = state.categories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase());
        if(exists) {
            window.CDCM.Utils.showToast("Ya existe una categoría con ese nombre");
            return;
        }

        window.CDCM.StateManager.updateCategory(id, { name, color });
        window.CDCM.Utils.showToast("Categoría actualizada");
    },

    deleteCategory: function(id) {
        const state = window.CDCM.StateManager.state;
        const usageCount = state.tasks.filter(t => t.category === id).length;
        
        let msg = "¿Seguro que deseas eliminar esta categoría?";
        if(usageCount > 0) {
            msg = `¡ADVERTENCIA! Esta categoría está siendo usada en ${usageCount} tarea(s).\n\n¿Realmente deseas eliminarla y dejar esas tareas sin categoría?`;
        }

        if(confirm(msg)) {
            window.CDCM.StateManager.deleteCategory(id);
            window.CDCM.Utils.showToast("Categoría eliminada");
        }
    },

    saveAssignee: function(id) {
        const name = document.getElementById(`ass_name_${id}`).value.trim();
        const color = document.getElementById(`ass_color_${id}`).value;
        if(!name) {
            window.CDCM.Utils.showToast("El nombre no puede estar vacío");
            return;
        }

        const state = window.CDCM.StateManager.state;
        const exists = state.assignees.some(a => a.id !== id && a.name.toLowerCase() === name.toLowerCase());
        if(exists) {
            window.CDCM.Utils.showToast("Ya existe un responsable con ese nombre");
            return;
        }

        window.CDCM.StateManager.updateAssignee(id, { name, color });
        window.CDCM.Utils.showToast("Responsable actualizado");
    },

    deleteAssignee: function(id) {
        const state = window.CDCM.StateManager.state;
        const usageCount = state.tasks.filter(t => t.assignees && t.assignees.includes(id)).length;
        
        let msg = "¿Seguro que deseas eliminar a este responsable?";
        if(usageCount > 0) {
            msg = `¡ADVERTENCIA! Este responsable está asignado a ${usageCount} tarea(s).\n\n¿Realmente deseas eliminarlo?`;
        }

        if(confirm(msg)) {
            window.CDCM.StateManager.deleteAssignee(id);
            window.CDCM.Utils.showToast("Responsable eliminado");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(window.CDCM.CatalogModal && window.CDCM.CatalogModal.init) {
            window.CDCM.CatalogModal.init();
        }
    }, 100);
});
