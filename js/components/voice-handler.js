window.CDCM = window.CDCM || {};

window.CDCM.VoiceHandler = {
    init: function() {
        // Verificar si el navegador soporta Speech Recognition
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!this.SpeechRecognition) {
            console.warn("La API de reconocimiento de voz no está soportada en este navegador.");
            // Ocultar botones si no hay soporte
            const btnQuick = document.getElementById('btnQuickVoiceAdd');
            if (btnQuick) btnQuick.style.display = 'none';
            document.querySelectorAll('.btn-voice-dictate').forEach(btn => btn.style.display = 'none');
            return;
        }

        // Listener para Quick Add (Botón Global)
        const btnQuickAdd = document.getElementById('btnQuickVoiceAdd');
        if (btnQuickAdd) {
            btnQuickAdd.addEventListener('click', () => {
                this.startQuickAdd(btnQuickAdd);
            });
        }

        // Listeners para dictado en campos de formulario
        const dictationBtns = document.querySelectorAll('.btn-voice-dictate');
        dictationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                this.startDictation(btn, targetId);
            });
        });
    },

    createRecognition: function(btnElement, onResult, onEnd) {
        const recognition = new this.SpeechRecognition();
        recognition.lang = 'es-ES'; // Podría ser parametrizable
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            btnElement.classList.add('recording');
            btnElement.style.color = 'var(--accent-red)';
            window.CDCM.Utils.showToast("Escuchando...", "info");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Error en reconocimiento de voz:", event.error);
            window.CDCM.Utils.showToast("Error al escuchar: " + event.error, "error");
        };

        recognition.onend = () => {
            btnElement.classList.remove('recording');
            btnElement.style.color = '';
            if (onEnd) onEnd();
        };

        return recognition;
    },

    startQuickAdd: function(btnElement) {
        if (this.isRecording) return;
        this.isRecording = true;

        const recognition = this.createRecognition(btnElement, 
            (transcript) => {
                // Crear la tarea rápidamente
                const today = window.CDCM.Utils.getTodayStr();
                
                // Intentar buscar una categoría por defecto, sino dejar vacía o tomar la primera
                let categoryId = '';
                const categories = window.CDCM.StateManager.state.categories;
                if (categories && categories.length > 0) {
                    categoryId = categories[0].id;
                }

                const taskData = {
                    title: transcript,
                    category: categoryId,
                    type: 'task',
                    status: 'pending',
                    priority: 'medium',
                    startDate: today,
                    startTime: '',
                    endDate: '',
                    assignees: [],
                    observations: '',
                    details: 'Creado mediante voz.',
                    alarmOffset: null,
                    hasAlarm: false,
                    alarmTriggered: false
                };

                window.CDCM.StateManager.addTask(taskData);
                window.CDCM.Utils.showToast("Tarea creada por voz exitosamente", "success");
            },
            () => {
                this.isRecording = false;
            }
        );

        recognition.start();
    },

    startDictation: function(btnElement, targetId) {
        if (this.isRecording) return;
        this.isRecording = true;

        const inputEl = document.getElementById(targetId);
        if (!inputEl) {
            this.isRecording = false;
            return;
        }

        const recognition = this.createRecognition(btnElement, 
            (transcript) => {
                // Agregar el texto al campo. Si ya tiene texto, añadir espacio
                const currentVal = inputEl.value;
                if (currentVal.trim().length > 0) {
                    inputEl.value = currentVal + ' ' + transcript;
                } else {
                    // Capitalizar primera letra si estaba vacío
                    inputEl.value = transcript.charAt(0).toUpperCase() + transcript.slice(1);
                }
            },
            () => {
                this.isRecording = false;
            }
        );

        recognition.start();
    }
};
