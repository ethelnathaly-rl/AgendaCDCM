window.CDCM = window.CDCM || {};

const STORAGE_KEY = 'cdcm_tasks';
const CATEGORIES_KEY = 'cdcm_categories';
const ASSIGNEES_KEY = 'cdcm_assignees';

window.CDCM.StorageService = {
    // Obtener todas las tareas
    getTasks: function() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);
            if (!rawData) return null; // Señal para usar Mock Data si es necesario
            
            const parsedData = JSON.parse(rawData);
            if (!Array.isArray(parsedData)) return null;
            
            // Migrar datos inmediatamente al cargarlos
            return window.CDCM.DataModel.migrateLegacyTasks(parsedData);
        } catch (e) {
            console.error("Error leyendo LocalStorage:", e);
            return null;
        }
    },

    // Obtener categorías
    getCategories: function() {
        try {
            const rawData = localStorage.getItem(CATEGORIES_KEY);
            if (!rawData) return null;
            return JSON.parse(rawData);
        } catch (e) {
            console.error("Error leyendo LocalStorage para categorías:", e);
            return null;
        }
    },

    // Guardar categorías
    saveCategories: function(categories) {
        try {
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
            return true;
        } catch (e) {
            console.error("Error guardando categorías en LocalStorage:", e);
            return false;
        }
    },

    // Obtener responsables
    getAssignees: function() {
        try {
            const rawData = localStorage.getItem(ASSIGNEES_KEY);
            if (!rawData) return null;
            return JSON.parse(rawData);
        } catch (e) {
            console.error("Error leyendo LocalStorage para responsables:", e);
            return null;
        }
    },

    // Guardar responsables
    saveAssignees: function(assignees) {
        try {
            localStorage.setItem(ASSIGNEES_KEY, JSON.stringify(assignees));
            return true;
        } catch (e) {
            console.error("Error guardando responsables en LocalStorage:", e);
            return false;
        }
    },

    // Guardar tareas
    saveTasks: function(tasks) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            return true;
        } catch (e) {
            console.error("Error guardando en LocalStorage:", e);
            window.CDCM.Utils.showToast("Error al guardar datos. Posible límite de memoria.", "error");
            return false;
        }
    },

    // Exportar datos a JSON
    exportData: function() {
        const tasks = this.getTasks() || [];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `cdcm_backup_${window.CDCM.Utils.getTodayStr()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        window.CDCM.Utils.showToast("Datos exportados exitosamente");
    },

    // Importar datos desde JSON
    importData: function(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (!Array.isArray(importedTasks)) throw new Error("El formato no es un array de tareas válido");
                
                // Migrar tareas importadas por seguridad
                const migratedTasks = window.CDCM.DataModel.migrateLegacyTasks(importedTasks);
                window.CDCM.StorageService.saveTasks(migratedTasks);
                window.CDCM.Utils.showToast("Datos importados exitosamente");
                
                if (callback) callback(migratedTasks);
            } catch (err) {
                console.error("Error parseando importación:", err);
                window.CDCM.Utils.showToast("El archivo no tiene un formato válido", "error");
            }
        };
        reader.readAsText(file);
    },

    // Borrar todo
    clearData: function() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
