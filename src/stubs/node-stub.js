// Stub universal para modulos de Node.js que no existen en React Native
// tau-prolog los requiere en ramas de codigo que nunca se ejecutan
// gracias a process.browser = true en patchProcess.ts
module.exports = new Proxy(
  {},
  {
    get: () => () => {},
    set: () => true,
  },
);
