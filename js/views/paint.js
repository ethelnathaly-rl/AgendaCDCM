window.CDCM = window.CDCM || {};

window.CDCM.PaintView = {
    isDrawing: false,
    color: '#000000',
    brushSize: 5,
    ctx: null,
    canvas: null,

    render: function(container) {
        const html = `
            <div class="paint-container" style="display: flex; flex-direction: column; height: 100%;">
                <div class="paint-toolbar" style="display: flex; gap: 15px; align-items: center; padding: 10px 15px; background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 15px; flex-wrap: wrap;">
                    
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <label for="paintColor" style="margin: 0; font-weight: 600;"><i class="fa-solid fa-palette"></i> Color:</label>
                        <input type="color" id="paintColor" value="#000000" style="width: 40px; height: 30px; padding: 0; border: none; cursor: pointer;">
                    </div>

                    <div style="display: flex; align-items: center; gap: 5px;">
                        <label for="paintSize" style="margin: 0; font-weight: 600;"><i class="fa-solid fa-paintbrush"></i> Grosor:</label>
                        <input type="range" id="paintSize" min="1" max="50" value="5" style="width: 100px;">
                    </div>

                    <div style="width: 1px; height: 30px; background: var(--border-color); margin: 0 10px;"></div>

                    <button class="btn-secondary" id="paintClear" title="Limpiar Pizarra"><i class="fa-solid fa-eraser"></i> Limpiar</button>
                    
                    <label class="btn-secondary" style="cursor: pointer; margin: 0;" title="Cargar Imagen">
                        <i class="fa-solid fa-image"></i> Cargar Imagen
                        <input type="file" id="paintLoadImage" accept="image/*" style="display: none;">
                    </label>

                    <button class="btn-primary" id="paintSave" title="Guardar Pizarra"><i class="fa-solid fa-download"></i> Descargar</button>
                </div>

                <div class="paint-canvas-container" style="flex: 1; background: #ffffff; border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow: hidden; position: relative; box-shadow: var(--shadow-sm); cursor: crosshair;">
                    <canvas id="paintCanvas"></canvas>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this.initCanvas();
    },

    initCanvas: function() {
        this.canvas = document.getElementById('paintCanvas');
        this.ctx = this.canvas.getContext('2d');
        const container = this.canvas.parentElement;

        // Ajustar tamaño del canvas al contenedor
        this.resizeCanvas = () => {
            // Guardar imagen actual
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                tempCtx.drawImage(this.canvas, 0, 0);
            }

            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            
            // Si es la primera vez, fondo blanco
            if (tempCanvas.width === 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                // Restaurar fondo blanco y luego la imagen
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(tempCanvas, 0, 0);
            }
        };

        // Resize inicial y al cambiar tamaño de ventana
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas);

        // Bind events para evitar problemas de 'this'
        this.startPosition = this.startPosition.bind(this);
        this.endPosition = this.endPosition.bind(this);
        this.draw = this.draw.bind(this);

        // Eventos del ratón
        this.canvas.addEventListener('mousedown', this.startPosition);
        this.canvas.addEventListener('mouseup', this.endPosition);
        this.canvas.addEventListener('mousemove', this.draw);
        this.canvas.addEventListener('mouseout', this.endPosition);

        // Eventos táctiles
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevenir scroll
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent("mouseup", {});
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        // Controles Toolbar
        document.getElementById('paintColor').addEventListener('input', (e) => this.color = e.target.value);
        document.getElementById('paintSize').addEventListener('input', (e) => this.brushSize = e.target.value);
        
        document.getElementById('paintClear').addEventListener('click', () => {
            if(confirm('¿Seguro que deseas limpiar toda la pizarra?')) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        });

        document.getElementById('paintSave').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'pizarra_cdcm_' + new Date().getTime() + '.png';
            link.href = this.canvas.toDataURL('image/png');
            link.click();
        });

        document.getElementById('paintLoadImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Limpiar y dibujar la imagen centrada y escalada
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                        
                        const hRatio = this.canvas.width / img.width;
                        const vRatio = this.canvas.height / img.height;
                        const ratio  = Math.min( hRatio, vRatio );
                        
                        const centerShift_x = (this.canvas.width - img.width*ratio) / 2;
                        const centerShift_y = (this.canvas.height - img.height*ratio) / 2;
                        
                        this.ctx.drawImage(img, 0,0, img.width, img.height,
                                           centerShift_x, centerShift_y, img.width*ratio, img.height*ratio);
                    }
                    img.src = event.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    },

    getMousePos: function(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    },

    startPosition: function(e) {
        this.isDrawing = true;
        this.draw(e);
    },

    endPosition: function() {
        this.isDrawing = false;
        this.ctx.beginPath(); // Reset path para el siguiente trazo
    },

    draw: function(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.color;

        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }
};
