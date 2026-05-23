window.CDCM = window.CDCM || {};

window.CDCM.CategoryModal = {
    init: function() {
        this.modal = document.getElementById('categoryModal');
        this.form = document.getElementById('categoryForm');
        
        // Open modal
        const btnNewCat = document.getElementById('btnNewCategory');
        if (btnNewCat) {
            btnNewCat.addEventListener('click', () => {
                this.open();
            });
        }

        // Close buttons
        const closeBtns = this.modal.querySelectorAll('.close-category-modal');
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
        // Generar color aleatorio de base para que sea más fácil
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        document.getElementById('catColor').value = randomColor;
        this.modal.classList.add('active');
    },

    close: function() {
        this.modal.classList.remove('active');
        this.form.reset();
    },

    save: function() {
        const name = document.getElementById('catName').value.trim();
        const color = document.getElementById('catColor').value;
        
        if (!name) {
            window.CDCM.Utils.showToast("El nombre no puede estar vacío");
            return;
        }

        // Verificar duplicados
        const exists = window.CDCM.StateManager.state.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            window.CDCM.Utils.showToast("Ya existe una categoría con ese nombre");
            return;
        }

        // Crear ID simple
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
        
        const newCategory = { id, name, color };
        
        window.CDCM.StateManager.addCategory(newCategory);
        
        window.CDCM.Utils.showToast("Categoría creada");
        this.close();
    }
};

// Auto inicializar después de cargar
document.addEventListener('DOMContentLoaded', () => {
    // Usamos timeout para asegurar que el DOM principal de UI ya procesó si es necesario, aunque defer también sirve.
    setTimeout(() => {
        if(window.CDCM.CategoryModal && window.CDCM.CategoryModal.init) {
            window.CDCM.CategoryModal.init();
        }
    }, 100);
});
