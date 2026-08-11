import Phaser from 'phaser';

const CLAVE_MUTE = 'canaryquest-mute';

/**
 * Música de fondo compartida entre escenas: una sola pista sonando,
 * cambio con parada de la anterior, y botón de mute persistente.
 */
export const Musica = {
  reproducir(escena: Phaser.Scene, clave: string): void {
    const sonando = escena.registry.get('musica-actual') as
      | Phaser.Sound.BaseSound
      | undefined;
    if (sonando?.key === clave && sonando.isPlaying) return;
    sonando?.stop();
    escena.game.sound.mute = localStorage.getItem(CLAVE_MUTE) === '1';
    const pista = escena.game.sound.add(clave, { loop: true, volume: 0.5 });
    // Los navegadores bloquean el audio hasta el primer gesto del usuario.
    if (escena.game.sound.locked) {
      escena.game.sound.once(Phaser.Sound.Events.UNLOCKED, () => pista.play());
    } else {
      pista.play();
    }
    escena.registry.set('musica-actual', pista);
  },

  crearBotonMute(escena: Phaser.Scene): void {
    const muted = localStorage.getItem(CLAVE_MUTE) === '1';
    const boton = escena.add
      .text(escena.scale.width - 12, 12, muted ? '🔇' : '🔊', { fontSize: '26px' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });
    boton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      const nuevo = !escena.game.sound.mute;
      escena.game.sound.mute = nuevo;
      localStorage.setItem(CLAVE_MUTE, nuevo ? '1' : '0');
      boton.setText(nuevo ? '🔇' : '🔊');
    });
  },
};
