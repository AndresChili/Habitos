# Hábitos

Aplicación web para el seguimiento diario de hábitos, tareas y peso corporal, con cuentas de usuario aisladas y autenticación propia construida desde cero.

**Demo:** [habitosproductivos.vercel.app](https://habitosproductivos.vercel.app)

## Descripción

Nació como una herramienta personal para llevar hábitos (días fijos o cuotas semanales/mensuales), tareas del día y registro de peso con gráfica de evolución. Empezó protegida por un passcode único de un solo usuario; este repo documenta su evolución a una aplicación multiusuario con cuentas reales, pensada para ser revisada como pieza de portfolio: el código es público, los datos de cada persona que la use no lo son.

## Funcionalidades

- **Hábitos de días fijos**: marcados por día de la semana, con racha actual, histórico en mapa de calor y comparativa de cumplimiento frente al periodo anterior.
- **Hábitos por cuota**: objetivo de N veces por semana o mes, sin día fijo.
- **Pausar/reanudar hábitos**: los periodos en pausa no cuentan como fallados ni rompen la racha.
- **Tareas del día**: lista simple con hora opcional, asociada a la fecha.
- **Registro de peso**: una entrada por día, con gráfica de evolución e histórico.
- **Estadísticas agregadas**: cumplimiento medio y mejor racha activa entre todos los hábitos.
- **Cuentas de usuario**: registro, login, cambio de contraseña, cierre de sesión. Los datos de cada cuenta están completamente aislados de los de cualquier otra.
- **PWA instalable** (icono, manifest, prompt de instalación).

## Tecnologías

- **[Next.js 16](https://nextjs.org/)** (App Router, Server Actions, Server Components)
- **React 19** + **TypeScript**
- **[Prisma 7](https://www.prisma.io/)** sobre **PostgreSQL** ([Neon](https://neon.tech), driver adapter serverless)
- **Tailwind CSS 4**
- **bcryptjs** para hashing de contraseñas
- Autenticación propia: sesiones firmadas con HMAC-SHA256, sin librerías de terceros
- Desplegado en **Vercel**

## Arquitectura

Aplicación Next.js App Router monolítica, sin servicios externos aparte de la base de datos:

- `src/app/` — páginas (Server Components) y Server Actions (`actions.ts`) como única superficie de mutación de datos.
- `src/lib/` — capa de acceso a datos: cada función consulta Prisma ya filtrada por el usuario de la sesión actual (ver más abajo). No hay API routes públicas: todo pasa por Server Actions invocadas desde formularios.
- `src/lib/dal.ts` — capa centralizada de autorización (*Data Access Layer*): expone `requireUserId()`, que valida la sesión y devuelve el id del usuario autenticado o redirige a `/login`. Toda función de `src/lib/*.ts` que toca datos la llama antes de construir su query.
- `src/proxy.ts` — comprobación optimista de sesión antes de servir cualquier ruta protegida (el equivalente a middleware en Next 16).
- `prisma/schema.prisma` — cada tabla de datos del usuario (`Habit`, `HabitLog`, `HabitPause`, `Task`, `WeightLog`, `Settings`) tiene su propio `userId`, indexado, y todas las queries filtran por él explícitamente — no solo a través de relaciones anidadas.

## Autenticación y seguridad

- **Contraseñas**: hasheadas con bcrypt (12 rounds), nunca almacenadas ni registradas en texto plano.
- **Sesiones**: cookie firmada con HMAC-SHA256 (`httpOnly`, `secure` en producción, `SameSite=Lax`), sin JWT ni dependencias externas de sesión.
- **Aislamiento de datos**: cada tabla de usuario lleva su propio `userId` y toda lectura/escritura se filtra por él en el servidor — nunca se confía en que el cliente oculte datos que no le pertenecen. Un intento de acceder o modificar el recurso de otra cuenta (manipulando una URL o un id) resuelve como "no encontrado", igual que si el recurso no existiera.
- **Enumeración de usuarios**: el login ejecuta una comparación bcrypt tanto si el email existe como si no, para que el tiempo de respuesta no revele qué cuentas están registradas.
- **Rate limiting**: los intentos fallidos de login/registro se cuentan por email en base de datos (no en memoria, para que funcione igual entre instancias serverless) y se bloquean tras varios intentos en una ventana de tiempo.
- **Cabeceras de seguridad**: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options` y `Permissions-Policy` configuradas en `next.config.ts`.
- **Secretos**: nunca viven en el repositorio — ver `.env.example` y la sección de variables de entorno.

## Instalación local

```bash
git clone https://github.com/<tu-usuario>/habitos.git
cd habitos
npm install
```

### Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

```env
DATABASE_URL=
DATABASE_URL_UNPOOLED=
SESSION_SECRET=
```

- `DATABASE_URL` / `DATABASE_URL_UNPOOLED`: cadena de conexión a una base de datos PostgreSQL. Si usas [Neon](https://neon.tech) con Vercel, `vercel integration add neon` + `vercel env pull .env.local` las rellena automáticamente.
- `SESSION_SECRET`: clave para firmar las cookies de sesión. Genérala con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Desarrollo

```bash
npm run db:push   # aplica el schema de Prisma a tu base de datos
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El primer arranque te lleva a `/register` para crear tu cuenta.

### Build

```bash
npm run build
npm start
```

## Deployment

Pensado para desplegarse en [Vercel](https://vercel.com):

1. Importa el repositorio en Vercel.
2. Añade una base de datos PostgreSQL (recomendado: integración de Neon desde el propio dashboard de Vercel).
3. Define `SESSION_SECRET` en las variables de entorno del proyecto.
4. Despliega. El build ejecuta `prisma generate` automáticamente (`postinstall`); aplica el schema a la base de datos de producción con `vercel env pull && npm run db:push` antes del primer despliegue, o mediante un paso de CI equivalente.

El despliegue no depende de ninguna credencial personal: cualquiera que clone el repo y conecte su propia base de datos puede desplegarlo de forma independiente.

## Estructura del proyecto

```
src/
  app/            # páginas (App Router) y Server Actions
    login/        # inicio de sesión
    register/     # creación de cuenta
    cuenta/       # cambio de contraseña
    habitos/      # gestión y estadísticas de hábitos
    peso/         # histórico de peso
  components/     # componentes de UI compartidos
  lib/            # acceso a datos (scoped por usuario), auth, rate limiting
  generated/      # cliente de Prisma generado (no editar a mano)
  proxy.ts        # protección de rutas a nivel de request
prisma/
  schema.prisma   # modelo de datos
```

## Estado del proyecto

En desarrollo activo. Es un proyecto personal que uso a diario, así que puede cambiar de forma, y algunas áreas (como "Gimnasio") son todavía un placeholder.

## Roadmap

- [x] Multiusuario con cuentas aisladas
- [x] Cambio de contraseña
- [ ] Recuperación de contraseña por email
- [ ] Sección de gimnasio (rutinas, series, repeticiones, peso usado)
- [ ] Exportar datos propios (CSV/JSON)
- [ ] 2FA opcional

## Licencia

[MIT](./LICENSE)
