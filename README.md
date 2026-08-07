# NovaSoft — Landing Page

Landing page de una sola página para NovaSoft, soluciones digitales a medida.

## Instalación local

```bash
npm install
npm start
```

El sitio queda disponible en `http://localhost:3000`.

## Estructura

```
server.js            → servidor Express que sirve el sitio estático
public/index.html    → toda la landing (nav, hero, oferta, rubros, qué incluye, CTA final, footer)
public/css/styles.css→ estilos e identidad visual (colores, tipografías, layout)
public/js/app.js     → menú móvil + animaciones de aparición al hacer scroll
public/assets/       → logo de NovaSoft (con fondo transparente) y favicons
```

## Cómo editar contenido

- **Precio y textos de la oferta:** busca la sección `<!-- OFERTA GRANDE -->` en `public/index.html`.
- **Número de WhatsApp:** aparece varias veces como `https://wa.me/56971086563?text=...`. Si cambia el número, hay que reemplazarlo en cada uno de esos links.
- **Rubros mostrados:** sección `<!-- PARA QUÉ RUBROS -->`, cada tarjeta es un bloque `.rubro-card`.
- **Colores:** todos están definidos como variables al principio de `public/css/styles.css`, bajo `:root`. Cambiar ahí actualiza todo el sitio.

## Despliegue en Railway

1. Sube este proyecto a un repositorio de GitHub.
2. En Railway, crea un nuevo proyecto y conéctalo al repositorio.
3. Railway detecta que es Node.js y corre `npm install` y `npm start` automáticamente.
4. No requiere variables de entorno ni base de datos — es un sitio estático servido por Express.
5. Railway te da una URL pública para compartir.

## Notas

- La fuente de títulos (Unbounded) y textos (Plus Jakarta Sans, JetBrains Mono) se cargan desde Google Fonts vía internet. Si el sitio se usa sin conexión a internet no se verán esas fuentes exactas, pero el diseño sigue funcionando con la fuente de reemplazo del sistema.
- El mockup de "agenda tu hora" en el hero es una ilustración estática (no funcional), pensada como pieza visual que representa el producto.
