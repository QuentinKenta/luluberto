import { COLORS, GAME_SIZE, SCENE_KEYS, TILE_SIZE } from "../constants.js";
import { officeLevel } from "../data/levels/officeLevel.js";
import { BaseRoomScene } from "./BaseRoomScene.js";

const OFFICE_LOVE_END_RATIO = 0.25;
const OFFICE_TO_CONCERT_DELAY_MS = 900;

export class OfficeScene extends BaseRoomScene {
  constructor() {
    super(SCENE_KEYS.office);
  }

  create() {
    this.aFoundArchiveLocation = false;
    this.lHasOldRoomKey = false;
    this.oldRoomEntered = false;
    this.finalCinematicStarted = false;

    this.createRoom(officeLevel, {
      returnScene: SCENE_KEYS.chapters,
    });
  }

  update(time, delta) {
    super.update(time, delta);

    if (this.levelComplete) {
      this.handleLevelCompleteInput();
      return;
    }

    if (!this.level || this.controlsLocked || this.dialogSystem?.active || this.finalCinematicStarted) {
      return;
    }

    this.checkOldRoomEntry();
  }

  checkOldRoomEntry() {
    if (this.oldRoomEntered || !this.aFoundArchiveLocation || !this.lHasOldRoomKey) {
      return;
    }

    const bothInsideOldRoom = this.players.every(
      (player) => player.gridX >= 16 && player.gridX <= 21 && player.gridY >= 2 && player.gridY <= 8,
    );

    if (!bothInsideOldRoom) {
      return;
    }

    this.oldRoomEntered = true;
    this.setCommonObjective("Examiner l'armoire ensemble.", "oldArchiveCabinet", {
      markerOffsets: [
        { x: -TILE_SIZE, y: 0 },
        { x: 0, y: 0 },
      ],
    });
  }

  handleCustomInteraction(player, interaction) {
    if (interaction.id !== "oldArchiveCabinet") {
      return false;
    }

    if (!this.oldRoomEntered) {
      this.speechBubbles.show(player, {
        speaker: player.name,
        text: "Il faut d'abord entrer ensemble dans l'ancienne salle.",
      });
      return true;
    }

    if (!this.areBothPlayersCloseTo(interaction)) {
      this.speechBubbles.show(player, interaction.dialogues[player.id]);
      return true;
    }

    this.startFinalCinematic();
    return true;
  }

  areBothPlayersCloseTo(interaction) {
    const world = this.collisionMap.gridToWorld(interaction.gridX, interaction.gridY);

    return this.players.every((player) => {
      const distance = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, world.x, world.y);
      return distance <= TILE_SIZE * 1.75;
    });
  }

  startFinalCinematic() {
    if (this.finalCinematicStarted) {
      return;
    }

    this.finalCinematicStarted = true;
    this.controlsLocked = true;
    this.hideCommonObjectiveHighlights?.();

    this.showFinalDialogue(
      [
        {
          speaker: "Narration",
          text: "Alberto récupère les archives du projet hospitalité.",
        },
        {
          speaker: "Narration",
          text: "Lucie récupère les croquis originaux.",
        },
      ],
      () => {
        this.time.delayedCall(650, () => this.showFinalDialogueStart());
      },
    );
  }

  showFinalDialogueStart() {
    this.showFinalDialogue(
      [
        {
          speaker: "Lucie",
          text: "C'est drôle, je travaille ici depuis des années et je ne savais même pas que cette salle existait.",
        },
        {
          speaker: "Alberto",
          text: "Moi non plus.",
        },
      ],
      () => {
        this.time.delayedCall(850, () => this.showFinalDialogueEnd());
      },
    );
  }

  showFinalDialogueEnd() {
    this.showFinalDialogue(
      [
        {
          speaker: "Alberto",
          text: "Finalement ça valait le coup de chercher.",
        },
        {
          speaker: "Lucie",
          text: "Oui.",
        },
        {
          speaker: "Alberto",
          text: "Dis euh tu sais je vais jouer à un concert samedi pro, ça te dirait de venir ?",
        },
      ],
      () => {
        this.time.delayedCall(850, () => this.showLevelComplete());
      },
    );
  }

  showFinalDialogue(lines, onComplete) {
    this.showDialogue(lines, onComplete, {
      canAdvance: false,
      lineDurationMs: (line) => this.finalDialogueLineDuration(line),
    });
  }

  finalDialogueLineDuration(line) {
    return Phaser.Math.Clamp(1800 + line.text.length * 48, 2600, 6200);
  }

  showLevelComplete() {
    if (this.levelComplete) {
      return;
    }

    this.levelComplete = true;
    this.controlsLocked = true;
    this.music?.stop({ fadeOutMs: 900 });

    const fade = this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, GAME_SIZE.width, GAME_SIZE.height, COLORS.ink, 1)
      .setScrollFactor(0)
      .setDepth(1300)
      .setAlpha(0);
    const completeText = this.add
      .text(GAME_SIZE.width / 2, 210, "Niveau terminé", {
        fontFamily: "monospace",
        fontSize: "34px",
        color: "#fff0a8",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1301)
      .setAlpha(0);
    const loveGauge = this.createEndLoveGauge(304);

    this.tweens.add({
      targets: fade,
      alpha: 1,
      duration: 900,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tweens.add({
          targets: [completeText, ...loveGauge.elements],
          alpha: 1,
          duration: 420,
          ease: "Sine.easeInOut",
          onComplete: () => {
            this.tweens.add({
              targets: loveGauge.fill,
              displayWidth: loveGauge.width * OFFICE_LOVE_END_RATIO,
              duration: 900,
              ease: "Sine.easeOut",
              onComplete: () => {
                this.time.delayedCall(OFFICE_TO_CONCERT_DELAY_MS, () => {
                  this.scene.start(SCENE_KEYS.concert);
                });
              },
            });
          },
        });
      },
    });
  }

  createEndLoveGauge(y) {
    const x = GAME_SIZE.width / 2;
    const width = 520;
    const height = 24;
    const label = this.add
      .text(x, y - 32, "LOVE", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff0a8",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1301)
      .setAlpha(0);
    const back = this.add
      .rectangle(x, y, width, height, 0x000000, 1)
      .setStrokeStyle(2, COLORS.paper, 0.88)
      .setScrollFactor(0)
      .setDepth(1301)
      .setAlpha(0);
    const gauge = {
      x: x - width / 2 + 4,
      y,
      width: width - 8,
      height: height - 8,
    };
    const fill = this.add
      .rectangle(gauge.x, y, gauge.width, gauge.height, COLORS.neonPink, 1)
      .setOrigin(0, 0.5)
      .setDisplaySize(0, gauge.height)
      .setScrollFactor(0)
      .setDepth(1302)
      .setAlpha(0);
    const ticks = [];

    for (let index = 1; index < 4; index += 1) {
      ticks.push(
        this.add
          .rectangle(x - width / 2 + (width * index) / 4, y, 2, height - 4, COLORS.paper, 0.34)
          .setScrollFactor(0)
          .setDepth(1303)
          .setAlpha(0),
      );
    }

    return {
      fill,
      width: gauge.width,
      elements: [label, back, fill, ...ticks],
    };
  }

  handleLevelCompleteInput() {
    // The office ending now chains automatically into the concert.
  }
}
