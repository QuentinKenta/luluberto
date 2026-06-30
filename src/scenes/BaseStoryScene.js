import { COLORS, GAME_SIZE, SCENE_KEYS } from "../constants.js";
import { InputController } from "../core/InputController.js";

export class BaseStoryScene extends Phaser.Scene {
  createPlaceholder({ title, subtitle, accent }) {
    this.inputController = new InputController(this);
    this.cameras.main.setBackgroundColor(COLORS.ink);

    this.add.rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 676, 312, COLORS.paper, 1);
    this.add.rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 644, 280, COLORS.ink, 1);
    this.add.rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 612, 248, COLORS.floor, 1);
    this.add.rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 612, 248, accent, 0.16);
    this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 560, 200, 0x000000, 0)
      .setStrokeStyle(2, accent, 0.9);

    for (let x = 192; x < 768; x += 32) {
      this.add.rectangle(x, 150, 12, 12, accent, 0.34);
      this.add.rectangle(x + 16, 390, 8, 8, COLORS.paper, 0.28);
    }

    this.add.text(116, 174, title, {
      fontFamily: "monospace",
      fontSize: "38px",
      color: "#fff0a8",
    });

    this.add.text(118, 232, subtitle, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#d8a038",
      wordWrap: { width: 520 },
    });

    this.add.text(118, 316, "Scene reservee a la prochaine etape.", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#fff0a8",
    });
  }

  update() {
    if (this.inputController?.isCancelPressed()) {
      this.scene.start(SCENE_KEYS.chapters);
    }
  }
}
