# Hábitos

Aplicación web para organizar la vida diaria: hábitos, tareas, peso corporal y entrenamientos de gimnasio, todo en un único panel pensado para usarse cada día.

### 🔗 [Probar la aplicación →](https://habitosproductivos.vercel.app)

[![CI](https://github.com/AndresChili/Habitos/actions/workflows/ci.yml/badge.svg)](https://github.com/AndresChili/Habitos/actions/workflows/ci.yml)

---

## 📖 Qué es

Hábitos nació como una herramienta personal para dejar de depender de notas sueltas y hojas de cálculo. Reúne en una sola app lo que normalmente se gestiona con varias: seguimiento de hábitos (con rachas y estadísticas reales, no solo una casilla que marcar), tareas del día, peso corporal con gráfica de evolución, y un módulo completo de gimnasio con rutinas, registro de series en vivo y detección automática de récords personales.

Es multiusuario: cualquiera puede registrarse y usarla con sus propios datos, completamente aislados de los de cualquier otra cuenta. Funciona como PWA instalable, tanto en escritorio como en móvil.

## ✨ Funcionalidades

### Hoy
Vista central del día, con navegación entre fechas. Combina en una pantalla los hábitos programados para hoy, las tareas pendientes, un acceso rápido al peso y al estado del entrenamiento del día, con un anillo de progreso general.

### Hábitos
- Hábitos de **días fijos** (ej. lunes/miércoles/viernes) con racha activa y mapa de calor del historial.
- Hábitos por **cuota** (N veces por semana o por mes) sin día fijo.
- Pausar y reanudar un hábito sin que cuente como fallado ni rompa la racha.
- Archivar hábitos sin perder su historial, y restaurarlos.
- Comparativa de cumplimiento frente al periodo anterior.

### Tareas
Lista de tareas del día, con hora opcional, edición inline y marcado como completada.

### Peso
Registro diario de peso con gráfica de evolución (1 mes, 3 meses, 6 meses o todo el histórico), sugerencia automática a partir del último valor registrado e histórico completo.

### Gimnasio
- **Rutinas**: creación de rutinas con ejercicios, orden, rango de repeticiones objetivo y día de la semana asignado.
- **Entrenamiento en vivo**: registro de series (peso, repeticiones, tipo de serie) con sugerencias automáticas basadas en la sesión anterior y guardado explícito por ejercicio.
- **Récords personales (PR)**: cada serie se compara automáticamente contra todo el historial del ejercicio, no solo la última sesión, y se marca visualmente en el momento en que se supera un máximo.
- **Temporizador de descanso** compartido entre ejercicios, que sigue corriendo aunque se navegue a otra pantalla de la app.
- **Biblioteca de ejercicios** por grupo muscular, con ficha individual: peso máximo, mejor volumen, 1RM estimado e historial completo.
- **Calendario** mensual de entrenamientos realizados.

### Cuenta
Registro y login propios, cambio de contraseña, cierre de sesión, tema claro/oscuro/sistema, y un panel de estadísticas agregadas de todos los hábitos.

## 🛠️ Tecnologías

- **Next.js 16** (App Router, Server Actions, Server Components)
- **React 19** + **TypeScript**
- **Prisma 7** sobre **PostgreSQL** ([Neon](https://neon.tech))
- **Tailwind CSS 4**
- Autenticación propia (sesiones firmadas, hashing con bcrypt), sin librerías de terceros
- PWA instalable
- Desplegado en **Vercel**

## Licencia

[MIT](./LICENSE)
