# NovaSoft — Agenda Online (versión definitiva de vitrina)

Aplicación completa: 3 rubros (salud, belleza, turismo), backend real,
abono automático por persona, y panel de administración con gestión de
horarios (bloquear día, agregar hora, quitar hora). Probada y funcionando.

## Sobre el logo

Ya integrado — es el que subiste. Usé el ícono (`public/assets/logo_icon.png`)
en los encabezados de ambas pantallas, recortado y con fondo transparente.
También dejé el lockup completo (`public/assets/logo_full.png`, con el
wordmark y el eslogan) por si lo necesitas para otro material.

## Panel de reservas — planilla semanal

Reemplacé el filtro simple por una planilla tipo horario de curso: los
días de la semana arriba (con su fecha), las horas hacia abajo, y en cada
cuadro el nombre de quien tomó esa hora. Se navega semana por semana con
las flechas, o se salta a cualquier semana con el selector de fecha.
Al hacer clic en una reserva se abre el detalle con la opción de cancelar.
Las horas fuera del horario de atención (o de un día bloqueado) se ven
sombreadas con rayas, para distinguirlas de las horas libres.

## Horarios — fecha libre

El selector de horarios ya no está limitado a los próximos 14 días: ahora
hay un campo de fecha (día/mes/año) para saltar a cualquier fecha, más
flechas para moverse un día a la vez.

## Probarla en tu PC primero

```
node server.js
```
- Vista cliente: `http://localhost:3000`
- Panel admin: `http://localhost:3000/admin.html` (no hay ningún link que
  lleve de una a la otra — a propósito, para que se vea como producto
  terminado, no como demo)

## Subir a Railway (resumen — tú la subes)

1. Crea una cuenta en **railway.app**
2. Sube esta carpeta a un repositorio de GitHub (o usa la opción de subir
   directo si Railway te la ofrece al momento de crear el proyecto)
3. "New Project" → "Deploy from GitHub repo" → selecciona el repositorio
4. Railway detecta Node.js solo y lo levanta
5. En "Settings" agrega un **Volume** apuntando a la carpeta `data/`, para
   que las reservas y los horarios bloqueados no se borren si el servicio
   se reinicia
6. Te da una URL pública — esa es la que muestras en tus reuniones, desde
   cualquier red de datos, sin depender del WiFi

Revisa el precio actual del plan antes de contratar — estas cosas cambian
seguido — pero al momento de armar esto rondaba los USD 5/mes.

## Qué falta para que cobre de verdad

El pago del abono sigue simulado (confirma al tiro). Para cobrar en serio
se conecta a Webpay o Flow, con las credenciales que le den a cada negocio
real — eso se hace cliente por cliente, no en esta versión de vitrina.

## Plan B si la nube falla en una reunión

Guarda también esta carpeta local en tu notebook y ten `node server.js`
listo para correr offline como respaldo si el link de Railway no carga en
el momento — así nunca dependes 100% de que todo esté perfecto ese día.
