"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

// Red de seguridad: reaplica el tema guardado en cada montaje y al volver a
// mostrar la página (bfcache, reabrir la PWA desde el icono). El script
// inline del <head> ya fija el atributo antes del primer pintado, pero no se
// vuelve a ejecutar si el navegador restaura la página desde caché en lugar
// de recargar el documento — sin esto, la app se queda mostrando el tema del
// sistema (a menudo oscuro) aunque el usuario tenga elegido "Claro".
export default function ThemeSync() {
  useEffect(() => {
    applyTheme(getStoredTheme());

    function onPageShow() {
      applyTheme(getStoredTheme());
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}
