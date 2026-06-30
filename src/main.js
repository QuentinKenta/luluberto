import { GAME_SIZE } from "./constants.js";
import { BootScene } from "./scenes/BootScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { ChapterSelectScene } from "./scenes/ChapterSelectScene.js";
import { OfficeScene } from "./scenes/OfficeScene.js";
import { ConcertScene } from "./scenes/ConcertScene.js";
import { ApplauseScene } from "./scenes/ApplauseScene.js";
import { FukaiScene } from "./scenes/FukaiScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: GAME_SIZE.width,
  height: GAME_SIZE.height,
  backgroundColor: "#303050",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    TitleScene,
    ChapterSelectScene,
    OfficeScene,
    ConcertScene,
    ApplauseScene,
    FukaiScene,
  ],
};

window.addEventListener("load", () => {
  if (!window.Phaser) {
    throw new Error("Phaser 3 n'a pas ete charge.");
  }

  window.game = new Phaser.Game(config);
});
