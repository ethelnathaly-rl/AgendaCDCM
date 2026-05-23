window.CDCM = window.CDCM || {};

window.CDCM.Utils = {
    // Generate a UUID v4
    generateId: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Get current date string in YYYY-MM-DD
    getTodayStr: function() {
        const d = new Date();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    },

    // Format date from YYYY-MM-DD to DD/MM/YYYY
    formatDate: function(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    },

    // Get color for Priority
    getPriorityColor: function(priority) {
        switch (priority) {
            case 'high': return 'var(--accent-red)';
            case 'medium': return 'var(--accent-orange)';
            case 'low': return 'var(--accent-green)';
            default: return 'var(--text-muted)';
        }
    },

    // Get badge text/color for Status
    getStatusConfig: function(status) {
        switch (status) {
            case 'pending': return { text: 'Pendiente', color: '#64748b' }; // Gris
            case 'in_progress': return { text: 'En Progreso', color: '#3b82f6' }; // Azul
            case 'on_hold': return { text: 'En Espera', color: '#f59e0b' }; // Ámbar
            case 'completed': return { text: 'Completado', color: '#10b981' }; // Verde
            case 'cancelled': return { text: 'Cancelado', color: '#ef4444' }; // Rojo
            default: return { text: 'Desconocido', color: '#64748b' };
        }
    },

    // Show a simple toast message
    showToast: function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;
        document.body.appendChild(toast);
        
        // Trigger reflow for animation
        toast.offsetHeight; 
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Reproducir sonido de alarma (requiere interacción previa del usuario)
    playAlarm: function() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            const beep = (freq, duration, time) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(1, time + 0.05);
                gain.gain.setValueAtTime(1, time + duration - 0.05);
                gain.gain.linearRampToValueAtTime(0, time + duration);
                
                osc.start(time);
                osc.stop(time + duration);
            };

            const now = ctx.currentTime;
            // Patrón de alarma de 3 pitidos
            beep(880, 0.1, now);
            beep(880, 0.1, now + 0.2);
            beep(1046, 0.4, now + 0.4);
        } catch(e) {
            console.warn("No se pudo reproducir la alarma sonora", e);
        }
    }
};
