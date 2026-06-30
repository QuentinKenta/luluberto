import { COLORS, GAME_SIZE, SCENE_KEYS } from "../constants.js";
import { InputController } from "../core/InputController.js";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.title);
  }

  create() {
    this.inputController = new InputController(this);
    this.selectedIndex = 0;
    this.menuItems = [
      { label: "START", scene: SCENE_KEYS.office },
      { label: "NIVEAUX", scene: SCENE_KEYS.chapters },
    ];
    this.walkElapsedMs = 0;
    this.walkFrameIndex = 0;

    this.drawBackdrop();
    this.createCharacters();
    this.createCat();
    this.createMenu();
  }

  update(_time, delta) {
    this.updateWalkAnimation(delta);
    this.updateCat(delta);

    if (this.inputController.isDirectionJustDown("down")) {
      this.select((this.selectedIndex + 1) % this.menuItems.length);
    }

    if (this.inputController.isDirectionJustDown("up")) {
      this.select((this.selectedIndex + this.menuItems.length - 1) % this.menuItems.length);
    }

    if (this.inputController.isConfirmPressed()) {
      this.scene.start(this.menuItems[this.selectedIndex].scene);
    }
  }

  drawBackdrop() {
    this.cameras.main.setBackgroundColor(0x000000);
    this.add.rectangle(GAME_SIZE.width / 2, 326, 560, 8, 0xffffff, 0.08);
    this.add.ellipse(348, 326, 168, 22, 0xffffff, 0.08);
    this.add.ellipse(612, 326, 168, 22, 0xffffff, 0.08);
    this.add.ellipse(GAME_SIZE.width / 2, 324, 86, 14, 0xffffff, 0.07);
  }

  createCharacters() {
    this.heroActors = [
      {
        sprite: this.add.sprite(350, 318, "player-l-right-0").setOrigin(0.5, 1).setScale(4.1).setDepth(2),
        frames: ["player-l-right-0", "player-l-right-1"],
        baseY: 318,
        phase: 0,
      },
      {
        sprite: this.add.sprite(610, 318, "player-a-left-0").setOrigin(0.5, 1).setScale(4.1).setDepth(2),
        frames: ["player-a-left-0", "player-a-left-1"],
        baseY: 318,
        phase: Math.PI,
      },
    ];
  }

  createCat() {
    const x = GAME_SIZE.width / 2;
    const y = 306;
    const fur = 0x9aa0ad;
    const darkFur = 0x5f6571;

    this.catTail = this.add.rectangle(x - 37, y - 14, 8, 38, fur, 1).setOrigin(0.5, 1).setAngle(-36).setDepth(2);
    this.add.rectangle(x - 8, y - 10, 46, 24, fur, 1).setDepth(3);
    this.add.rectangle(x + 22, y - 18, 26, 24, fur, 1).setDepth(3);
    this.add.triangle(x + 10, y - 34, 0, 14, 8, 0, 16, 14, fur, 1).setDepth(3);
    this.add.triangle(x + 30, y - 34, 0, 14, 8, 0, 16, 14, fur, 1).setDepth(3);
    this.add.rectangle(x - 25, y + 4, 8, 12, darkFur, 1).setDepth(3);
    this.add.rectangle(x + 7, y + 4, 8, 12, darkFur, 1).setDepth(3);
    this.catEyes = [
      this.add.rectangle(x + 16, y - 20, 3, 3, 0x111111, 1).setDepth(4),
      this.add.rectangle(x + 27, y - 20, 3, 3, 0x111111, 1).setDepth(4),
    ];
    this.add.rectangle(x + 21, y - 14, 5, 2, 0x111111, 1).setDepth(4);
    this.add.line(x + 34, y - 15, 0, 0, 18, -5, COLORS.paper, 0.75).setStrokeStyle(2, COLORS.paper, 0.75).setDepth(4);
    this.add.line(x + 34, y - 12, 0, 0, 18, 2, COLORS.paper, 0.75).setStrokeStyle(2, COLORS.paper, 0.75).setDepth(4);
  }

  createMenu() {
    this.menuViews = this.menuItems.map((item, index) => {
      const y = 392 + index * 60;
      const panel = this.add
        .rectangle(GAME_SIZE.width / 2, y, 232, 44, 0x000000, 0.35)
        .setStrokeStyle(2, COLORS.paper, 0.54);
      const text = this.add.text(GAME_SIZE.width / 2, y, item.label, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#fff0a8",
        align: "center",
        fixedWidth: 220,
        fixedHeight: 30,
      });
      text.setOrigin(0.5);

      panel.setInteractive({ useHandCursor: true });
      panel.on("pointerdown", () => this.scene.start(item.scene));
      panel.on("pointerover", () => this.select(index));
      text.setInteractive({ useHandCursor: true });
      text.on("pointerdown", () => this.scene.start(item.scene));
      text.on("pointerover", () => this.select(index));

      return { panel, text };
    });

    this.select(0);
  }

  updateWalkAnimation(delta) {
    if (!this.heroActors) {
      return;
    }

    this.walkElapsedMs += delta;

    while (this.walkElapsedMs >= 230) {
      this.walkElapsedMs -= 230;
      this.walkFrameIndex = (this.walkFrameIndex + 1) % 2;

      for (const actor of this.heroActors) {
        actor.sprite.setTexture(actor.frames[this.walkFrameIndex]);
      }
    }

    const bounce = this.walkFrameIndex === 0 ? 0 : -4;
    for (const actor of this.heroActors) {
      actor.sprite.setY(actor.baseY + bounce + Math.sin(this.time.now / 180 + actor.phase) * 1.5);
    }
  }

  updateCat() {
    if (!this.catTail || !this.catEyes) {
      return;
    }

    this.catTail.setAngle(-36 + Math.sin(this.time.now / 260) * 7);
    const blinking = Math.floor(this.time.now / 2400) % 5 === 4;
    for (const eye of this.catEyes) {
      eye.setScale(1, blinking ? 0.3 : 1);
    }
  }

  select(index) {
    this.selectedIndex = index;

    this.menuViews.forEach((view, viewIndex) => {
      const selected = viewIndex === this.selectedIndex;
      view.panel.setFillStyle(selected ? COLORS.paper : 0x000000, selected ? 1 : 0.35);
      view.panel.setStrokeStyle(selected ? 3 : 2, selected ? COLORS.paper : COLORS.paper, selected ? 1 : 0.54);
      view.text.setColor(selected ? "#000000" : "#fff0a8");
    });
  }
}
