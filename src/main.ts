import Phaser from 'phaser';
import { CartaScene } from './scenes/CartaScene';
import { VisitaScene } from './scenes/VisitaScene';
import { PuertoScene } from './scenes/PuertoScene';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { IslandScene } from './scenes/IslandScene';
import { DetailScene } from './scenes/DetailScene';
import { UIScene } from './scenes/UIScene';
import { TravelMapScene } from './scenes/TravelMapScene';
import { PausaScene } from './scenes/PausaScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#0a1a3a',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, PreloadScene, TitleScene, PuertoScene, CartaScene, VisitaScene, IslandScene, DetailScene, TravelMapScene, UIScene, PausaScene],
});

// Acceso para depuración y tests de integración.
declare global {
  interface Window {
    game: Phaser.Game;
  }
}
window.game = game;

// Menú para saltar entre localizaciones: en desarrollo, o con ?debug=1 en el juego publicado.
if (import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1')
  void import('./dev/menu').then((m) => m.montarMenu(game));
