# CDCM Agenda - Contexto del Proyecto

Este archivo documenta el estado actual del proyecto para facilitar la reanudación del desarrollo sin pérdida de contexto.

## Estado Actual
La aplicación es una herramienta de gestión de proyectos y agenda ("CDCM Agenda V2"). Ha sido refactorizada hacia una arquitectura modular usando Vanilla JavaScript, HTML5 y CSS3, sin requerir frameworks externos (solo carga FontAwesome y Google Fonts desde CDNs). No requiere proceso de build (Node.js/Webpack), funciona directamente en el navegador.

## Arquitectura de Archivos
- `index.html`: Punto de entrada principal. Contiene la estructura base (Sidebar, Topbar, Contenedor de Vistas) y todos los modales (formularios) ocultos listos para instanciarse.
- `style.css`: Estilos de la aplicación. Utiliza variables CSS (`:root`) para temas claro/oscuro y diseño responsivo.
- `app.js`: Controlador principal (Entry Point). Inicializa la app, configura eventos de navegación globales, inicializa el estado y mantiene el loop (setInterval) que chequea las alarmas.
- **`js/`**: Directorio de scripts divididos por dominio:
  - `utils.js`: Utilidades compartidas (generación de IDs, formateo de fechas, sonidos de alarma, notificaciones toast).
  - `data-model.js`: Define la estructura de datos (factory `createTask`) y lógica de migración de formato antiguo a V2.
  - `storage-service.js`: Capa de persistencia. Maneja `localStorage` (llave `cdcm_v2_data`) e importación/exportación/borrado de JSON.
  - `state-manager.js`: Gestor de estado reactivo (patrón Observer/PubSub). Almacena las tareas filtradas, categorías, responsables, filtros activos y la vista actual.
  - **`views/`**: Controladores de renderizado (`dashboard.js`, `calendar.js`, `kanban.js`, `list.js`). Inyectan HTML dinámico en `#viewContainer`.
  - **`components/`**: Controladores de comportamiento de los modales (`form-modal.js`, `category-modal.js`, `assignee-modal.js`, `catalog-modal.js`).

## Modelo de Datos Principal
Cada entidad (tarea o proyecto) se crea basándose en la estructura de `data-model.js`:
- Identificación: `id`, `title`, `type` ('project' | 'task'), `category` (ID)
- Flujo: `status` ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')
- Prioridad: `priority` ('low', 'medium', 'high')
- Tiempos: `startDate`, `startTime`, `endDate`
- Contenido: `details`, `observations`
- Responsables: `assignees` (Array de IDs de responsables en lugar de string simple)
- Recordatorios: `hasAlarm`, `alarmTriggered`, `alarmOffset` (minutos previos)
- Metadata: `createdAt`, `updatedAt`, `completedAt`

## Funcionalidades Clave Implementadas
1. **Múltiples Vistas:** 
   - Dashboard (Métricas y resumen general)
   - Calendario (Soporte para Mes, Semana y Día)
   - Tablero Kanban (Organización visual por estados `status`)
   - Lista (Vista de tabla detallada)
2. **Gestión de Estado Reactiva:** Cuando ocurre una mutación (`StateManager.addTask`, `updateTask`, etc.), se notifica a la UI y se vuelve a renderizar la vista actual automáticamente.
3. **Catálogos Dinámicos:** Categorías (con color) y Responsables son entidades propias, que pueden ser creadas 'al vuelo' desde el modal de tareas, o administradas globalmente.
4. **Tema Oscuro/Claro:** Persiste la preferencia en `localStorage` bajo `cdcm_theme`.
5. **Sistema de Alarmas:** Monitoreo en background vía `setInterval` (cada 10s) comprobando si la hora actual coincide con `startTime - alarmOffset`.

## Cómo Retomar el Desarrollo (Próximos Pasos Comunes)
1. **Agregar campos al formulario:**
   - Modificar el HTML en `index.html` (dentro de `#taskForm`).
   - Modificar `data-model.js` para asegurar que el nuevo campo tenga un valor por defecto.
   - Modificar `js/components/form-modal.js` para leer (en `saveTask()`) y popular (en `openEdit()`) el nuevo campo.
2. **Agregar una nueva vista:** 
   - Crear `js/views/nueva-vista.js` con método `render(container, tasks)`.
   - Registrar la pestaña en el Sidebar de `index.html` (`data-view="nueva-vista"`).
   - Agregar caso en el `switch` de `renderCurrentView()` en `app.js`.
   - Incluir el script `<script>` en `index.html`.
3. **Depuración Local:** 
   - Simplemente abre `index.html` en el navegador. Para asegurar el funcionamiento correcto de exportaciones o iconos web, usar una extensión como Live Server. Todo el estado está en `localStorage.getItem('cdcm_v2_data')`.
