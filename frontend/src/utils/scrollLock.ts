// Bloqueo de scroll del body con contador de referencias:
// varios modales pueden estar abiertos a la vez y el scroll solo se
// restaura cuando se cierra el último.
let lockCount = 0;

export const lockBodyScroll = () => {
  lockCount += 1;
  document.body.style.overflow = "hidden";
};

export const unlockBodyScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
  }
};
