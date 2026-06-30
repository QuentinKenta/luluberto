import { COLORS, GAME_SIZE, SCENE_KEYS } from "../constants.js";
import { concertLevel } from "../data/levels/concertLevel.js";
import { concertDialogues } from "../data/dialogues.js";
import { BaseRoomScene } from "./BaseRoomScene.js";

const STAGE_WAIT_TILE = {
  x: 13,
  y: 8,
};
const STAGE_BEER_TILE = {
  x: 13,
  y: 9,
};
const DANCE_DURATION_MS = 20000;
const CONCERT_TO_FUKAI_DELAY_MS = 900;
const HEART_DELAY_MS = 2000;
const LOVE_START_RATIO = 0.05;
const LOVE_END_RATIO = 0.5;

export class ConcertScene extends BaseRoomScene {
  constructor() {
    super(SCENE_KEYS.concert);
  }

  create() {
    this.lockedPlayerIds = new Set();
    this.finalCinematicStarted = false;
    this.levelComplete = false;
    this.carriedBeer = null;
    this.stageBeer = null;
    this.heart = null;
    this.strobe = null;
    this.strobeTween = null;

    this.createRoom(concertLevel, {
      returnScene: SCENE_KEYS.chapters,
    });
  }

  update(time, delta) {
    super.update(time, delta);
    this.updateBeerCarry();

    if (this.levelComplete) {
      this.handleLevelCompleteInput();
    }
  }

  isPlayerMovementLocked(player) {
    return this.lockedPlayerIds?.has(player.id) ?? false;
  }

  handleCustomInteraction(player, interaction) {
    const isStagePlacementInteraction = interaction.id === "stageSpot" || interaction.id === "stageFront";

    if (!isStagePlacementInteraction) {
      return false;
    }

    const step = this.currentObjectiveStep(player.id);

    if (player.id !== "playerA" || step?.targetId !== "stageSpot") {
      return false;
    }

    const isCorrectSpot =
      interaction.id === "stageFront" &&
      player.gridX === STAGE_WAIT_TILE.x &&
      player.gridY === STAGE_WAIT_TILE.y &&
      player.facing === "down";

    if (isCorrectSpot) {
      const objectiveLine = this.advanceObjectiveIfTarget(player, "stageSpot");
      this.showInteractionDialogue(player, objectiveLine ?? concertDialogues.stage.playerA, {
        forceDialog: Boolean(objectiveLine),
      });
      return true;
    }

    this.speechBubbles.show(player, {
      speaker: "Alberto",
      text: "Il faut que je me place sur le spot, face au public.",
    });
    return true;
  }

  advanceObjectiveIfTarget(player, targetId) {
    const state = this.objectiveStates?.[player.id];
    const step = state && !state.completed ? state.objective.steps[state.index] : null;
    const dialogue = super.advanceObjectiveIfTarget(player, targetId);

    if (!dialogue || !step || step.targetId !== targetId) {
      return dialogue;
    }

    if (step.setFlag === "aWaitingOnStage") {
      this.lockPlayerAOnStage(player);
    }

    if (step.setFlag === "lHasBeer") {
      this.giveBeerToPlayerL();
    }

    if (step.setFlag === "lBeerOnStage") {
      this.placeBeerOnStage();
    }

    return dialogue;
  }

  lockPlayerAOnStage(player) {
    player.setFacing("down");
    this.lockedPlayerIds.add(player.id);
  }

  giveBeerToPlayerL() {
    if (this.carriedBeer) {
      return;
    }

    this.carriedBeer = this.createBeerMug(800);
    this.updateBeerCarry();
  }

  updateBeerCarry() {
    if (!this.carriedBeer || !this.players?.length) {
      return;
    }

    const playerL = this.players.find((player) => player.id === "playerL");

    if (!playerL) {
      return;
    }

    this.carriedBeer
      .setPosition(playerL.sprite.x + 18, playerL.sprite.y - 38)
      .setDepth(playerL.sprite.depth + 24);
  }

  placeBeerOnStage() {
    this.carriedBeer?.destroy();
    this.carriedBeer = null;

    if (this.stageBeer) {
      return;
    }

    const world = this.collisionMap.gridToWorld(STAGE_BEER_TILE.x, STAGE_BEER_TILE.y);
    this.stageBeer = this.createBeerMug(world.y + 24);
    this.stageBeer.setPosition(world.x, world.y - 10);
  }

  createBeerMug(depth) {
    const mug = this.add.graphics().setDepth(depth);

    mug.fillStyle(COLORS.ink, 1);
    mug.fillRect(-8, -14, 18, 22);
    mug.fillRect(8, -8, 7, 12);
    mug.fillStyle(COLORS.paper, 1);
    mug.fillRect(-6, -16, 14, 5);
    mug.fillRect(9, -6, 3, 8);
    mug.fillStyle(COLORS.amber, 1);
    mug.fillRect(-5, -10, 12, 16);
    mug.fillStyle(0xffffff, 0.34);
    mug.fillRect(-2, -8, 2, 12);

    return mug;
  }

  handleObjectivesCompleteIfNeeded() {
    if (this.roomCompleteHandled || !this.areAllObjectivesComplete()) {
      return;
    }

    this.roomCompleteHandled = true;
    this.waitForOpenDialogueThenStartFinale();
  }

  waitForOpenDialogueThenStartFinale() {
    if (this.dialogSystem?.active) {
      this.time.delayedCall(250, () => this.waitForOpenDialogueThenStartFinale());
      return;
    }

    this.startFinalCinematic();
  }

  startFinalCinematic() {
    if (this.finalCinematicStarted) {
      return;
    }

    this.finalCinematicStarted = true;
    this.controlsLocked = true;
    this.hideObjectiveUi();
    this.hideAllSpeechBubbles();
    this.music?.stop({ fadeOutMs: 360 });

    this.showFinalDialogue(concertDialogues.objectives.finaleBeer, () => {
      this.stageBeer?.destroy();
      this.stageBeer = null;

      this.time.delayedCall(300, () => {
        this.showFinalDialogue(concertDialogues.objectives.finaleJoke, () => this.startDanceClimax());
      });
    });
  }

  showFinalDialogue(lines, onComplete) {
    this.showDialogue(lines, onComplete, {
      canAdvance: false,
      lineDurationMs: (line) => Phaser.Math.Clamp(1500 + line.text.length * 44, 2200, 5800),
    });
  }

  startDanceClimax() {
    this.playMusicLoop("wallsClimax", {
      volume: 0.74,
      fadeOutMs: 0,
    });
    this.startStrobeEffect();
    this.startAudienceDance();
    this.time.delayedCall(HEART_DELAY_MS, () => this.showHeartAbovePlayerL());

    this.time.delayedCall(DANCE_DURATION_MS, () => this.showEndScreen());
  }

  startStrobeEffect() {
    if (this.strobe) {
      return;
    }

    this.strobe = this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, GAME_SIZE.width, GAME_SIZE.height, COLORS.paper, 1)
      .setScrollFactor(0)
      .setDepth(880)
      .setAlpha(0);

    this.strobeTween = this.tweens.add({
      targets: this.strobe,
      alpha: 0.14,
      duration: 90,
      yoyo: true,
      repeat: -1,
      repeatDelay: 135,
      ease: "Sine.easeInOut",
    });
  }

  stopStrobeEffect() {
    this.strobeTween?.stop();
    this.strobeTween = null;
    this.strobe?.destroy();
    this.strobe = null;
  }

  startAudienceDance() {
    this.danceFrameIsAlt = true;
    this.setAudienceDanceFrame(this.danceFrameIsAlt);

    this.danceTimer = this.time.addEvent({
      delay: 320,
      loop: true,
      callback: () => {
        this.danceFrameIsAlt = !this.danceFrameIsAlt;
        this.setAudienceDanceFrame(this.danceFrameIsAlt);
      },
    });
  }

  setAudienceDanceFrame(useDanceFrame) {
    for (const npc of this.npcs ?? []) {
      if (!npc.danceTexture) {
        continue;
      }

      npc.sprite.setTexture(useDanceFrame ? npc.danceTexture : npc.texture);
    }
  }

  showHeartAbovePlayerL() {
    if (this.heart) {
      return;
    }

    const playerL = this.players.find((player) => player.id === "playerL");

    if (!playerL) {
      return;
    }

    this.heart = this.add.graphics().setDepth(900);
    this.heart.fillStyle(COLORS.ink, 1);
    this.heart.fillRect(-12, -8, 24, 18);
    this.heart.fillStyle(COLORS.neonPink, 1);
    this.heart.fillRect(-10, -6, 8, 8);
    this.heart.fillRect(2, -6, 8, 8);
    this.heart.fillRect(-12, -2, 24, 8);
    this.heart.fillRect(-8, 6, 16, 8);
    this.heart.fillRect(-4, 14, 8, 6);
    this.heart.setPosition(playerL.sprite.x, playerL.sprite.y - 72);

    this.tweens.add({
      targets: this.heart,
      y: this.heart.y - 7,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  showEndScreen() {
    if (this.levelComplete) {
      return;
    }

    this.levelComplete = true;
    this.danceTimer?.remove(false);
    this.danceTimer = null;
    this.setAudienceDanceFrame(false);
    this.stopStrobeEffect();
    this.music?.stop({ fadeOutMs: 900 });

    const fade = this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, GAME_SIZE.width, GAME_SIZE.height, COLORS.ink, 1)
      .setScrollFactor(0)
      .setDepth(1300)
      .setAlpha(0);
    const endText = this.add
      .text(GAME_SIZE.width / 2, 205, "FIN", {
        fontFamily: "monospace",
        fontSize: "44px",
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
          targets: [endText, ...loveGauge.elements],
          alpha: 1,
          duration: 420,
          ease: "Sine.easeInOut",
          onComplete: () => {
            this.tweens.add({
              targets: loveGauge.fill,
              displayWidth: loveGauge.width * LOVE_END_RATIO,
              duration: 900,
              ease: "Sine.easeOut",
              onComplete: () => {
                this.time.delayedCall(CONCERT_TO_FUKAI_DELAY_MS, () => {
                  this.scene.start(SCENE_KEYS.fukai);
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
      .rectangle(gauge.x, y, gauge.width * LOVE_START_RATIO, gauge.height, COLORS.neonPink, 1)
      .setOrigin(0, 0.5)
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

  hideObjectiveUi() {
    for (const highlight of Object.values(this.objectiveHighlights ?? {})) {
      highlight.setVisible(false);
    }

    for (const highlight of this.commonObjectiveHighlights ?? []) {
      highlight.setVisible(false);
    }

    for (const text of Object.values(this.objectiveTexts ?? {})) {
      text.setVisible(false);
    }

    this.commonObjectiveText?.setVisible(false);
  }

  hideAllSpeechBubbles() {
    for (const player of this.players ?? []) {
      this.speechBubbles.hide(player);
    }
  }

  handleLevelCompleteInput() {
    // The concert ending now chains automatically into La Fukai.
  }
}
