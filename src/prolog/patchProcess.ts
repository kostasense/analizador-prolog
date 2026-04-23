// tau-prolog/modules/core.js detecta el entorno con:
//   nodejs_flag = typeof process !== 'undefined' && !process.browser
//
// En Expo Web: process existe pero process.browser es undefined
//   → nodejs_flag = true → tau-prolog intenta usar fs, path, argv
//
// En React Native: window y document no existen
//   → tau-prolog explota al definir tau_user_input
//
// Este archivo parchea todos esos globals ANTES de que core.js se cargue

// 1. Forzar modo browser para que tau-prolog nunca entre a la rama Node.js
if (typeof process !== "undefined") {
  (process as any).browser = true;
  if (!process.argv) (process as any).argv = [];
}

// 2. window es requerido por tau_user_input al momento de cargar core.js
if (typeof window === "undefined") {
  (global as any).window = {
    prompt: () => "", // tau_user_input lo llama si se pide input por consola
    pl: undefined, // tau-prolog escribe aqui su instancia en modo browser
  };
}

// 3. document es requerido para deteccion de <script type="text/prolog">
if (typeof document === "undefined") {
  (global as any).document = {
    getElementById: () => null,
  };
}
