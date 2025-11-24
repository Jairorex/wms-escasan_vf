# Componentes Modal

Componentes modales reutilizables para el sistema WMS.

## Componentes Disponibles

### Modal (Base)
Componente base reutilizable para todos los modales.

**Props:**
- `isOpen` (boolean): Controla si el modal está abierto
- `onClose` (function): Función para cerrar el modal
- `title` (string): Título del modal
- `children` (ReactNode): Contenido del modal
- `size` (string): Tamaño del modal ('sm', 'md', 'lg', 'xl', 'full')

**Ejemplo:**
```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Mi Modal"
  size="md"
>
  <p>Contenido del modal</p>
</Modal>
```

### TareaDetailModal
Modal para ver el detalle completo de una tarea.

**Props:**
- `isOpen` (boolean)
- `onClose` (function)
- `tareaId` (number): ID de la tarea a mostrar

**Características:**
- Carga automática de datos de la tarea
- Muestra información completa: estado, fechas, detalles
- Botones de acción según el estado de la tarea

### RecepcionModal
Modal para recibir mercancía.

**Props:**
- `isOpen` (boolean)
- `onClose` (function)
- `ordenId` (number, opcional): ID de orden prellenado

**Características:**
- Formulario completo de recepción
- Validación de campos
- Integración con API
- Limpieza automática al cerrar

### AlertaDetailModal
Modal para ver detalles de una alerta.

**Props:**
- `isOpen` (boolean)
- `onClose` (function)
- `alerta` (object): Objeto con la información de la alerta

**Características:**
- Muestra información completa de la alerta
- Indicadores visuales según nivel de riesgo
- Botón para resolver alerta

## Uso en Páginas

### Ejemplo: Tareas

```jsx
import TareaDetailModal from '../../components/Modal/TareaDetailModal'

const [selectedTareaId, setSelectedTareaId] = useState(null)
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

// Al hacer clic en "Ver Detalles"
<button onClick={() => {
  setSelectedTareaId(tarea.id)
  setIsDetailModalOpen(true)
}}>
  Ver Detalles
</button>

// Modal
<TareaDetailModal
  isOpen={isDetailModalOpen}
  onClose={() => {
    setIsDetailModalOpen(false)
    setSelectedTareaId(null)
  }}
  tareaId={selectedTareaId}
/>
```

## Estilos

Los modales usan Tailwind CSS y están diseñados para ser responsive. El backdrop es semi-transparente y el modal se centra en la pantalla.

## Próximas Mejoras

- [ ] Modal de creación/edición de tareas
- [ ] Modal de creación/edición de productos
- [ ] Modal de creación/edición de ubicaciones
- [ ] Confirmación de acciones críticas
- [ ] Loading states mejorados

