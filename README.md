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

## 🚀 Instalación local

Requiere Node.js 20+ y una base de datos PostgreSQL (el proyecto usa [Neon](https://neon.tech)).

```bash
git clone https://github.com/AndresChili/Habitos.git
cd Habitos
npm install
```

Copia `.env.example` a `.env.local` y rellena las variables:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` / `DATABASE_URL_UNPOOLED`: cadena de conexión a Postgres. Con la integración de Neon en Vercel, se obtienen con `vercel env pull .env.local`.
- `SESSION_SECRET`: secreto para firmar las cookies de sesión. Genera uno con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Sincroniza el esquema de Prisma con la base de datos y arranca en desarrollo:

```bash
npm run db:push
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## ✅ Tests

```bash
npm run test       # una ejecución
npm run test:watch # modo watch
```

Vitest corre en CI en cada push/PR a `main` (ver el badge arriba). Tests actuales cubren validación y utilidades de autenticación (`src/lib/auth.test.ts`).

## 🔒 Seguridad

Ver [SECURITY.md](./SECURITY.md) para el detalle de las medidas de autenticación (revocación de sesión, rate limiting por email e IP, resistencia a enumeración de usuarios) y limitaciones conocidas.

## Licencia

[MIT](./LICENSE)
