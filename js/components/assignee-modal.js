window.CDCM = window.CDCM || {};

window.CDCM.AssigneeModal = {
    init: function() {
        this.modal = document.getElementById('assigneeModal');
        this.form = document.getElementById('assigneeForm');
        
        // Open modal
        const btnNewAss = document.getElementById('btnNewAssignee');
        if (btnNewAss) {
            btnNewAss.addEventListener('click', () => {
                this.open();
            });
        }

        // Close buttons
        const closeBtns = this.modal.querySelectorAll('.close-assignee-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // Click outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Form Submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
    },

    open: function() {
        this.form.reset();
        this.modal.classList.add('active');
    },

    close: function() {
        this.modal.classList.remove('active');
        this.form.reset();
    },

    save: function() {
        const name = document.getElementById('assigneeName').value.trim();
        
        if (!name) {
            window.CDCM.Utils.showToast("El nombre no puede estar vacío");
            return;
        }

        // Verificar duplicados
        const exists = window.CDCM.StateManager.state.assignees.some(a => a.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            window.CDCM.Utils.showToast("Ya existe un responsable con ese nombre");
            return;
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
        const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        const newAssignee = { id, name, color };
        
        window.CDCM.StateManager.addAssignee(newAssignee);
        window.CDCM.Utils.showToast("Responsable añadido");
        this.close();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(window.CDCM.AssigneeModal && window.CDCM.AssigneeModal.init) {
            window.CDCM.AssigneeModal.init();
        }
    }, 100);
});
