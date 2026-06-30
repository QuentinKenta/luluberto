import { COLORS, GAME_SIZE, SCENE_KEYS } from "../constants.js";
import { InputController } from "../core/InputController.js";

export class ChapterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.chapters);
  }

  create() {
    this.inputController = new InputController(this);
    this.cards = [
      { title: "Bureau", note: "coop local", scene: SCENE_KEYS.office, color: COLORS.mint },
      { title: "Concert", note: "coop local", scene: SCENE_KEYS.concert, color: COLORS.brass },
      { title: "Public", note: "phase collective", scene: SCENE_KEYS.applause, color: COLORS.neonPink },
      { title: "Fukai", note: "combat emotionnel", scene: SCENE_KEYS.fukai, color: COLORS.coral },
    ];

    this.selectedIndex = 0;
    this.draw();
  }

  update() {
    if (this.inputController.isCancelPressed()) {
      this.scene.start(SCENE_KEYS.title);
    }

    if (this.inputController.isConfirmPressed()) {
      this.scene.start(this.cards[this.selectedIndex].scene);
    }

    if (this.inputController.isDirectionJustDown("right")) {
      this.select((this.selectedIndex + 1) % this.cards.length);
    }

    if (this.inputController.isDirectionJustDown("left")) {
      this.select((this.selectedIndex + this.cards.length - 1) % this.cards.length);
    }
  }

  draw() {
    this.cameras.main.setBackgroundColor(COLORS.ink);
    this.add.rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 850, 428, COLORS.paper, 1);
    this.add.rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 824, 402, COLORS.floor, 1);
    this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, 824, 402, 0x000000, 0)
      .setStrokeStyle(4, COLORS.ink);

    this.add.text(70, 56, "Niveaux", {
      fontFamily: "monospace",
      fontSize: "34px",
      color: "#fff0a8",
    });
    this.add.text(72, 96, "selection directe", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#d8a038",
    });

    this.cardViews = this.cards.map((card, index) => {
      const spacing = 176;
      const x = GAME_SIZE.width / 2 - ((this.cards.length - 1) * spacing) / 2 + index * spacing;
      const group = this.add.group();
      const panel = this.add
        .rectangle(x, 238, 176, 204, COLORS.ink, 1)
        .setStrokeStyle(2, COLORS.paper);
      const inset = this.add.rectangle(x, 238, 150, 176, COLORS.floor, 1).setStrokeStyle(2, card.color);
      const dot = this.add.rectangle(x - 48, 172, 28, 28, card.color, 1).setStrokeStyle(2, COLORS.ink);
      const slot = this.add.rectangle(x + 28, 172, 62, 12, COLORS.paper, 1);
      const notch = this.add.rectangle(x + 60, 172, 10, 12, COLORS.ink, 1);
      const title = this.add.text(x - 62, 196, card.title, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fff0a8",
      });
      const note = this.add.text(x - 62, 232, card.note, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#d8a038",
        wordWrap: { width: 124 },
      });
      const indexText = this.add.text(x - 58, 306, `0${index + 1}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#fff0a8",
      });

      panel.setInteractive({ useHandCursor: true });
      panel.on("pointerdown", () => this.scene.start(card.scene));
      panel.on("pointerover", () => this.select(index));
      group.addMultiple([panel, inset, dot, slot, notch, title, note, indexText]);

      return { panel, inset, dot, title, note, indexText, color: card.color };
    });

    this.add.text(64, GAME_SIZE.height - 74, "Retour", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#d8a038",
    });

    this.select(0);
  }

  select(index) {
    this.selectedIndex = index;
    this.cardViews.forEach((view, viewIndex) => {
      const selected = viewIndex === index;
      view.panel.setStrokeStyle(selected ? 5 : 2, selected ? view.color : COLORS.paper);
      view.inset.setFillStyle(selected ? COLORS.mint : COLORS.floor, 1);
      view.title.setColor(selected ? "#303050" : "#fff0a8");
      view.note.setColor(selected ? "#303050" : "#d8a038");
      view.indexText.setColor(selected ? "#303050" : "#fff0a8");
    });
  }
}
