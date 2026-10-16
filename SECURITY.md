# Seguridad

Autenticación propia (sin librerías de terceros), implementada en [`src/lib/auth.ts`](./src/lib/auth.ts), [`src/lib/dal.ts`](./src/lib/dal.ts) y [`src/lib/rateLimit.ts`](./src/lib/rateLimit.ts).

## Medidas implementadas

- **Contraseñas**: hash con bcrypt (12 rondas), nunca en texto plano ni en logs.
- **Sesión firmada**: cookie `httpOnly`, `secure` en producción, `sameSite=lax`, firmada con HMAC-SHA256 y comparación en tiempo constante (`crypto.timingSafeEqual`).
- **Revocación de sesión (`sessionVersion`)**: cada sesión lleva un contador que se compara contra el guardado en el usuario. Cerrar sesión o cambiar la contraseña lo incrementa, lo que invalida de inmediato cualquier token emitido antes —incluido uno robado— en vez de esperar a su expiración (30 días).
- **Rate limiting de login/registro**: por email (bloqueo intencionado de una cuenta tras 10 fallos en 15 min) y por IP (30 fallos en 15 min, umbral más alto para no penalizar redes compartidas/NAT). El límite por IP frena a quien prueba una misma contraseña contra muchos emails distintos, cosa que el límite por email no detecta.
- **Resistencia a enumeración de usuarios**: el login siempre ejecuta una comparación bcrypt (contra un hash dummy si el email no existe), para que el tiempo de respuesta no revele si una cuenta está registrada.
- **Aislamiento de datos**: toda consulta de datos pasa por `requireUserId()`, que filtra por el usuario de la sesión — ver [`src/lib/dal.ts`](./src/lib/dal.ts).
- **Open redirect cerrado**: el parámetro `next` del login solo acepta rutas internas relativas (`safeNextPath` en [`src/app/actions.ts`](./src/app/actions.ts)).

## Limitaciones conocidas

- No hay 2FA.
- No hay lista de sesiones activas por dispositivo ni revocación selectiva: cerrar sesión o cambiar contraseña invalida *todas* las sesiones del usuario a la vez, no solo la del dispositivo actual.
- El rate limiting se respalda en la tabla `LoginAttempt` en Postgres (no en memoria), necesario porque las Vercel Functions no comparten estado entre instancias; esto añade una consulta extra por intento de login.

## Reportar un problema

Si encuentras un fallo de seguridad, abre un issue o contacta directamente antes de hacerlo público.
