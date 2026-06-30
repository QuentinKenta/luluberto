import { AUDIO_KEYS, COLORS, GAME_SIZE, SCENE_KEYS } from "../constants.js";
import { fukaiLevel } from "../data/levels/fukaiLevel.js";
import { fukaiDialogues } from "../data/dialogues.js";
import { BaseRoomScene } from "./BaseRoomScene.js";

const A_TABLE_TILE = {
  x: 11,
  y: 18,
  facing: "right",
};
const L_TABLE_TILE = {
  x: 14,
  y: 18,
  facing: "left",
};
const FINAL_LOVE_RATIO = 0.75;
const APPLAUSE_DELAY_MS = 5000;
const BATTLE_MESSAGE_MIN_VISIBLE_MS = 400;
const FUKAI_AUDIO_CUES = {
  intro: AUDIO_KEYS.fukaiBattleIntro,
  battle: AUDIO_KEYS.fukaiBattleLoop,
  victory: AUDIO_KEYS.fukaiVictory,
};

export class FukaiScene extends BaseRoomScene {
  constructor() {
    super(SCENE_KEYS.fukai);
  }

  create() {
    this.lockedPlayerIds = new Set();
    this.carriedBeers = [];
    this.tableBeers = [];
    this.battleActive = false;
    this.battleMode = "idle";
    this.battleSounds = {};
    this.battleMessageReadyAt = 0;
    this.battlePromptTimer = null;

    this.createRoom(fukaiLevel, {
      returnScene: SCENE_KEYS.chapters,
    });
    this.createSmokerEffect();
    this.events.once("shutdown", this.stopFukaiBattleSounds, this);
  }

  update(time, delta) {
    if (this.battleActive) {
      this.updateBattleInput();
      this.updateBattleIdle(time);
      return;
    }

    super.update(time, delta);
    this.updateBeerCarry();
  }

  isPlayerMovementLocked(player) {
    return this.lockedPlayerIds?.has(player.id) ?? false;
  }

  handleCustomInteraction(player, interaction) {
    if (interaction.id !== "aTableSpot" && interaction.id !== "lTableSpot") {
      return false;
    }

    const expectedPlayerId = interaction.id === "aTableSpot" ? "playerA" : "playerL";
    const spot = interaction.id === "aTableSpot" ? A_TABLE_TILE : L_TABLE_TILE;
    const directionLabel = interaction.id === "aTableSpot" ? "gauche" : "droite";

    if (player.id !== expectedPlayerId) {
      this.speechBubbles.show(player, {
        speaker: player.name,
        text: "Ce n'est pas ma place a cette table.",
      });
      return true;
    }

    const step = this.currentObjectiveStep(player.id);

    if (step?.targetId !== interaction.id) {
      const text =
        player.id === "playerA"
          ? "D'abord les deux bieres, sinon cette table va juger."
          : "Je devrais d'abord parler au fumeur dehors.";

      this.speechBubbles.show(player, {
        speaker: player.name,
        text,
      });
      return true;
    }

    const isCorrectSpot =
      player.gridX === spot.x &&
      player.gridY === spot.y &&
      player.facing === spot.facing;

    if (!isCorrectSpot) {
      this.speechBubbles.show(player, {
        speaker: player.name,
        text: `Il faut se mettre a ${directionLabel} de la table et regarder l'autre place.`,
      });
      return true;
    }

    const objectiveLine = this.advanceObjectiveIfTarget(player, interaction.id);
    this.showInteractionDialogue(player, objectiveLine ?? interaction.dialogues[player.id], {
      forceDialog: Boolean(objectiveLine),
    });
    return true;
  }

  advanceObjectiveIfTarget(player, targetId) {
    const state = this.objectiveStates?.[player.id];
    const step = state && !state.completed ? state.objective.steps[state.index] : null;
    const dialogue = super.advanceObjectiveIfTarget(player, targetId);

    if (!step || step.targetId !== targetId) {
      return dialogue;
    }

    if (step.setFlag === "aHasTwoBeers") {
      this.giveTwoBeersToPlayerA();
    }

    if (step.setFlag === "aAtTable") {
      this.lockPlayerAtTable(player, A_TABLE_TILE);
      this.placeBeersOnTable();
    }

    if (step.setFlag === "lAtTable") {
      this.lockPlayerAtTable(player, L_TABLE_TILE);
    }

    return dialogue;
  }

  giveTwoBeersToPlayerA() {
    if (this.carriedBeers.length > 0) {
      return;
    }

    this.carriedBeers = [this.createBeerMug(820), this.createBeerMug(821)];
    this.updateBeerCarry();
  }

  updateBeerCarry() {
    if (!this.carriedBeers.length || !this.players?.length) {
      return;
    }

    const playerA = this.players.find((player) => player.id === "playerA");

    if (!playerA) {
      return;
    }

    const offsets = [
      { x: 14, y: -42 },
      { x: 25, y: -36 },
    ];

    for (const [index, beer] of this.carriedBeers.entries()) {
      const offset = offsets[index] ?? offsets[0];
      beer
        .setPosition(playerA.sprite.x + offset.x, playerA.sprite.y + offset.y)
        .setDepth(playerA.sprite.depth + 24 + index);
    }
  }

  placeBeersOnTable() {
    for (const beer of this.carriedBeers) {
      beer.destroy();
    }

    this.carriedBeers = [];

    if (this.tableBeers.length > 0) {
      return;
    }

    const positions = [
      { x: 12, y: 18, offsetX: -6 },
      { x: 13, y: 18, offsetX: 6 },
    ];

    this.tableBeers = positions.map((position, index) => {
      const world = this.collisionMap.gridToWorld(position.x, position.y);
      const beer = this.createBeerMug(world.y + 36 + index);
      beer.setPosition(world.x + position.offsetX, world.y - 4);
      return beer;
    });
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

  lockPlayerAtTable(player, spot) {
    const world = this.collisionMap.gridToWorld(spot.x, spot.y);

    player.sprite.setPosition(world.x, world.y);
    player.gridX = spot.x;
    player.gridY = spot.y;
    player.targetGridX = spot.x;
    player.targetGridY = spot.y;
    player.isMoving = false;
    player.setFacing(spot.facing);
    this.lockedPlayerIds.add(player.id);
  }

  handleObjectivesCompleteIfNeeded() {
    if (this.roomCompleteHandled || !this.areAllObjectivesComplete()) {
      return;
    }

    this.roomCompleteHandled = true;
    this.waitForOpenDialogueThenStartReunion();
  }

  waitForOpenDialogueThenStartReunion() {
    if (this.dialogSystem?.active) {
      this.time.delayedCall(250, () => this.waitForOpenDialogueThenStartReunion());
      return;
    }

    this.startReunionDialogue();
  }

  startReunionDialogue() {
    this.controlsLocked = true;
    this.hideObjectiveUi();
    this.hideAllSpeechBubbles();

    const playerA = this.players.find((player) => player.id === "playerA");
    const playerL = this.players.find((player) => player.id === "playerL");

    if (playerA) {
      this.lockPlayerAtTable(playerA, A_TABLE_TILE);
    }

    if (playerL) {
      this.lockPlayerAtTable(playerL, L_TABLE_TILE);
    }

    this.showDialogue(fukaiDialogues.objectives.reunion, () => this.startBattleIntro());
  }

  startBattleIntro() {
    this.hideAllSpeechBubbles();
    this.startBattle();
  }

  startBattle() {
    if (this.battleActive) {
      return;
    }

    this.battleActive = true;
    this.playMusicLoop("fukaiBattleLoop", {
      fadeOutMs: 480,
      volume: 0.58,
    });
    this.createBattleUi();
    this.showBattleMessage(
      [
        {
          speaker: "Narrateur",
          text: "Lucie veut lancer la premiere attaque.",
        },
      ],
      () => this.promptLucieOpeningAttack(),
    );
  }

  createSmokerEffect() {
    const smoker = this.npcs?.find((npc) => npc.id === "smoker");

    if (!smoker) {
      return;
    }

    const baseX = smoker.sprite.x + 11;
    const baseY = smoker.sprite.y - 28;
    const cigarette = this.add.rectangle(baseX, baseY + 4, 8, 2, COLORS.paper, 0.9).setDepth(smoker.sprite.depth + 2);

    this.add.rectangle(baseX + 5, baseY + 4, 2, 2, COLORS.coral, 1).setDepth(cigarette.depth + 1);

    for (let index = 0; index < 3; index += 1) {
      const puff = this.add
        .circle(baseX + index * 2, baseY - index * 5, 3 + index, COLORS.wall, 0.34)
        .setDepth(smoker.sprite.depth + 3)
        .setScale(0.65);

      this.tweens.add({
        targets: puff,
        y: puff.y - 28,
        x: puff.x + 6,
        alpha: 0,
        scale: 1.45,
        duration: 1600,
        delay: index * 420,
        repeat: -1,
        onRepeat: () => {
          puff.setPosition(baseX + index * 2, baseY - index * 5);
          puff.setAlpha(0.34);
          puff.setScale(0.65);
        },
      });
    }
  }

  createBattleUi() {
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(1300);

    const background = this.add.rectangle(
      GAME_SIZE.width / 2,
      GAME_SIZE.height / 2,
      GAME_SIZE.width,
      GAME_SIZE.height,
      0xf0f4f8,
      1,
    );
    const topBand = this.add.rectangle(GAME_SIZE.width / 2, 86, GAME_SIZE.width, 172, 0x90d8f8, 1);
    const floor = this.add.rectangle(GAME_SIZE.width / 2, 350, GAME_SIZE.width, 170, 0xd8d8b8, 1);
    const horizon = this.add.rectangle(GAME_SIZE.width / 2, 264, GAME_SIZE.width, 4, COLORS.ink, 0.24);
    const leftPlatform = this.add.ellipse(292, 352, 260, 62, COLORS.clubFloorLine, 0.55);
    const rightPlatform = this.add.ellipse(690, 250, 220, 54, COLORS.clubFloorLine, 0.45);

    const albertoSprite = this.add.sprite(292, 346, "player-a-right-0").setScale(3).setOrigin(0.5, 1);
    const lucieSprite = this.add.sprite(690, 244, "player-l-left-0").setScale(2.55).setOrigin(0.5, 1);

    const albertoName = this.add.text(96, 258, "ALBERTO", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#303050",
    });
    const lucieName = this.add.text(686, 118, "LUCIE", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#303050",
    });
    const messageBack = this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height - 76, GAME_SIZE.width - 70, 126, COLORS.ink, 0.96)
      .setStrokeStyle(3, COLORS.paper, 1);
    const speakerText = this.add.text(62, GAME_SIZE.height - 130, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#d8a038",
    });
    const messageText = this.add.text(62, GAME_SIZE.height - 104, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#fff0a8",
      lineSpacing: 7,
      wordWrap: { width: GAME_SIZE.width - 124 },
    });
    const promptText = this.add
      .text(GAME_SIZE.width - 62, GAME_SIZE.height - 28, "P / E", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#d8a038",
      })
      .setOrigin(1, 0.5);
    const menuTitle = this.add.text(62, GAME_SIZE.height - 136, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#d8a038",
    });
    const menuHint = this.add
      .text(GAME_SIZE.width - 62, GAME_SIZE.height - 28, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#d8a038",
      })
      .setOrigin(1, 0.5);
    const choiceTexts = [0, 1].map((index) =>
      this.add.text(82, GAME_SIZE.height - 104 + index * 34, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff0a8",
        wordWrap: { width: GAME_SIZE.width - 164 },
      }),
    );

    container.add([
      background,
      topBand,
      floor,
      horizon,
      leftPlatform,
      rightPlatform,
      albertoSprite,
      lucieSprite,
      albertoName,
      lucieName,
      messageBack,
      speakerText,
      messageText,
      promptText,
      menuTitle,
      menuHint,
      ...choiceTexts,
    ]);

    this.battleUi = {
      container,
      albertoSprite,
      lucieSprite,
      speakerText,
      messageText,
      promptText,
      menuTitle,
      menuHint,
      choiceTexts,
    };

    this.createBattleLoveGauge(container);
  }

  createBattleLoveGauge(container) {
    const x = GAME_SIZE.width / 2;
    const y = 48;
    const width = 430;
    const height = 20;
    const label = this.add
      .text(x - width / 2, y - 28, "LOVE", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#303050",
      })
      .setOrigin(0, 0.5);
    const back = this.add
      .rectangle(x, y, width, height, 0xffffff, 0.82)
      .setStrokeStyle(2, COLORS.ink, 0.88);
    const fill = this.add
      .rectangle(x - width / 2 + 4, y, 1, height - 8, COLORS.neonPink, 1)
      .setOrigin(0, 0.5)
      .setAlpha(0.95);

    container.add([label, back, fill]);
    this.battleLoveGauge = {
      fill,
      width: width - 8,
    };
  }

  showBattleMessage(lines, onComplete) {
    this.battleMode = "message";
    this.battleMessageLines = Array.isArray(lines) ? lines : [lines];
    this.battleMessageIndex = 0;
    this.battleMessageComplete = onComplete ?? null;
    this.renderBattleMessage();
  }

  renderBattleMessage() {
    const line = this.battleMessageLines[this.battleMessageIndex];

    this.scheduleBattleMessageAdvance();
    this.setBattleMenuVisible(false);
    this.battleUi.speakerText.setVisible(true).setText(line.speaker);
    this.battleUi.messageText.setVisible(true).setText(line.text);
    this.battleUi.promptText.setVisible(false);
  }

  scheduleBattleMessageAdvance() {
    this.clearBattlePromptTimer();
    this.battleMessageReadyAt = this.time.now + BATTLE_MESSAGE_MIN_VISIBLE_MS;

    this.battlePromptTimer = this.time.delayedCall(BATTLE_MESSAGE_MIN_VISIBLE_MS, () => {
      this.battlePromptTimer = null;

      if (this.battleMode === "message") {
        this.battleUi.promptText.setVisible(true);
      }
    });
  }

  clearBattlePromptTimer() {
    if (!this.battlePromptTimer) {
      return;
    }

    this.battlePromptTimer.remove(false);
    this.battlePromptTimer = null;
  }

  canAdvanceBattleMessage() {
    return this.time.now >= this.battleMessageReadyAt;
  }

  advanceBattleMessage() {
    if (this.battleMode !== "message" || !this.canAdvanceBattleMessage()) {
      return;
    }

    this.battleMessageIndex += 1;

    if (this.battleMessageIndex < this.battleMessageLines.length) {
      this.renderBattleMessage();
      return;
    }

    const onComplete = this.battleMessageComplete;
    this.battleMode = "busy";
    this.battleMessageComplete = null;
    this.clearBattlePromptTimer();

    if (onComplete) {
      onComplete();
    }
  }

  showBattleChoice(options) {
    this.clearBattlePromptTimer();
    this.battleMode = "choice";
    this.battleChoice = {
      ...options,
      selectedIndex: 0,
    };
    this.renderBattleChoice();
  }

  renderBattleChoice() {
    const choiceState = this.battleChoice;

    this.battleUi.speakerText.setVisible(false);
    this.battleUi.messageText.setVisible(false);
    this.battleUi.promptText.setVisible(false);
    this.setBattleMenuVisible(true);
    this.battleUi.menuTitle.setText(choiceState.title);
    this.battleUi.menuHint.setText(choiceState.hint);

    for (const [index, text] of this.battleUi.choiceTexts.entries()) {
      const choice = choiceState.choices[index];

      if (!choice) {
        text.setVisible(false);
        continue;
      }

      const marker = index === choiceState.selectedIndex ? "> " : "  ";
      text
        .setVisible(true)
        .setText(`${marker}${choice.label}`)
        .setColor(index === choiceState.selectedIndex ? "#70e040" : "#fff0a8");
    }
  }

  setBattleMenuVisible(isVisible) {
    this.battleUi.menuTitle.setVisible(isVisible);
    this.battleUi.menuHint.setVisible(isVisible);

    for (const text of this.battleUi.choiceTexts) {
      text.setVisible(isVisible);
    }
  }

  updateBattleInput() {
    if (this.battleMode === "message") {
      if (this.playerAInput.isAdvancePressed() || this.playerLInput.isAdvancePressed()) {
        this.advanceBattleMessage();
      }
      return;
    }

    if (this.battleMode !== "choice") {
      return;
    }

    const input = this.battleChoice.playerId === "playerA" ? this.playerAInput : this.playerLInput;

    if (input.isDirectionJustDown("up")) {
      this.changeBattleChoice(-1);
    }

    if (input.isDirectionJustDown("down")) {
      this.changeBattleChoice(1);
    }

    if (input.isInteractPressed() || input.isConfirmPressed()) {
      this.selectBattleChoice();
    }
  }

  updateBattleIdle(time) {
    if (!this.battleUi) {
      return;
    }

    const breath = Math.sin(time / 340) * 0.035;
    this.battleUi.albertoSprite.setScale(3 + breath);
    this.battleUi.lucieSprite.setScale(2.55 - breath);
  }

  changeBattleChoice(offset) {
    const choiceState = this.battleChoice;
    const choiceCount = choiceState.choices.length;

    choiceState.selectedIndex = Phaser.Math.Wrap(choiceState.selectedIndex + offset, 0, choiceCount);
    this.renderBattleChoice();
  }

  selectBattleChoice() {
    const choiceState = this.battleChoice;
    const choice = choiceState.choices[choiceState.selectedIndex];
    const onSelect = choiceState.onSelect;

    this.battleMode = "busy";
    this.setBattleMenuVisible(false);
    onSelect(choice);
  }

  promptLucieOpeningAttack() {
    this.showBattleChoice({
      playerId: "playerL",
      title: "Lucie choisit une attaque",
      hint: "Z/S + E",
      choices: [
        {
          id: "wink",
          label: "Clin d'oeil",
          line: "Lucie lance un clin d'oeil.",
        },
        {
          id: "funFact",
          label: "Fun fact",
          line: "Tu savais qu'en Belgique on a un Ministre des frites ?",
        },
      ],
      onSelect: (choice) => this.resolveLucieOpeningAttack(choice),
    });
  }

  resolveLucieOpeningAttack(choice) {
    if (choice.id === "wink") {
      this.animateWinkFlash();
    }

    this.showBattleMessage(
      [
        {
          speaker: "Lucie",
          text: choice.line,
        },
        {
          speaker: "Narrateur",
          text: "Alberto est impressionne, mais il la joue cool.",
        },
      ],
      () => this.promptAlbertoAttack(),
    );
  }

  promptAlbertoAttack() {
    this.showBattleChoice({
      playerId: "playerA",
      title: "Alberto choisit une attaque",
      hint: "Fleches + P",
      choices: [
        {
          id: "punk",
          label: "Anecdote punk",
          line: "Tu sais, moi je viens du PUNK a la base.",
        },
        {
          id: "cat",
          label: "Mercredi",
          line: "J'ai un chat qui s'appelle Mercredi.",
        },
      ],
      onSelect: (choice) => this.resolveAlbertoAttack(choice),
    });
  }

  resolveAlbertoAttack(choice) {
    if (choice.id === "punk") {
      this.animateCigarettePuff();
    }

    if (choice.id === "cat") {
      this.showCuteCat();
    }

    this.showBattleMessage(
      [
        {
          speaker: "Alberto",
          text: choice.line,
        },
        {
          speaker: "Narrateur",
          text: "Lucie est intriguee.",
        },
      ],
      () => this.promptLucieFoodAttack(),
    );
  }

  promptLucieFoodAttack() {
    this.showBattleChoice({
      playerId: "playerL",
      title: "Lucie choisit une attaque",
      hint: "Z/S + E",
      choices: [
        {
          id: "chicken",
          label: "Poulet roti",
          line: "Lucie balance un poulet roti.",
        },
        {
          id: "steak",
          label: "Americain prepare",
          line: "Lucie balance un americain prepare.",
        },
      ],
      onSelect: (choice) => this.resolveLucieFoodAttack(choice),
    });
  }

  resolveLucieFoodAttack(choice) {
    this.throwFood(choice.id, "lucie");
    this.showBattleMessage(
      [
        {
          speaker: "Lucie",
          text: choice.line,
        },
        {
          speaker: "Narrateur",
          text: "Alberto est repu, il baisse sa garde.",
        },
      ],
      () => this.resolveAlbertoCeviche(),
    );
  }

  resolveAlbertoCeviche() {
    this.throwFood("fish", "alberto");
    this.showBattleMessage(
      [
        {
          speaker: "Alberto",
          text: "Alberto contre-attaque directement avec son ceviche maison.",
        },
        {
          speaker: "Narrateur",
          text: "Lucie est impressionnee.",
        },
      ],
      () => this.resolveLucieUltimate(),
    );
  }

  resolveLucieUltimate() {
    this.animateTwerk();
    this.time.delayedCall(900, () => this.animateDizzyAlberto());
    this.showBattleMessage(
      [
        {
          speaker: "Lucie",
          text: "Attaque ultime : Lucie balance un twerk.",
        },
        {
          speaker: "Narrateur",
          text: "Alberto est tout etourdi.",
        },
      ],
      () => this.finishBattle(),
    );
  }

  finishBattle() {
    this.battleMode = "busy";
    this.stopFukaiBattleSound("battle");
    this.playOptionalFukaiSound("victory", {
      volume: 0.72,
    });

    this.tweens.add({
      targets: this.battleLoveGauge.fill,
      displayWidth: this.battleLoveGauge.width * FINAL_LOVE_RATIO,
      duration: 1300,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.showBattleMessage([
          {
            speaker: "Narrateur",
            text: "Wow y'a un truc qui se passe...",
          },
        ]);
        this.battleMode = "ending";
        this.battleUi.promptText.setVisible(false);
        this.time.delayedCall(APPLAUSE_DELAY_MS, () => this.scene.start(SCENE_KEYS.applause));
      },
    });
  }

  animateWinkFlash() {
    const flash = this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, GAME_SIZE.width, GAME_SIZE.height, 0xffffff, 1)
      .setScrollFactor(0)
      .setDepth(1320)
      .setAlpha(0);

    this.tweens.add({
      targets: flash,
      alpha: 0.86,
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => flash.destroy(),
    });
  }

  animateCigarettePuff() {
    const baseX = this.battleUi.albertoSprite.x + 42;
    const baseY = this.battleUi.albertoSprite.y - 136;

    for (let index = 0; index < 5; index += 1) {
      const puff = this.add
        .circle(baseX + index * 5, baseY - index * 4, 7 + index, COLORS.wall, 0.42)
        .setScrollFactor(0)
        .setDepth(1321);

      this.tweens.add({
        targets: puff,
        x: puff.x + 34,
        y: puff.y - 40,
        alpha: 0,
        scale: 1.8,
        duration: 900,
        delay: index * 90,
        onComplete: () => puff.destroy(),
      });
    }
  }

  showCuteCat() {
    const cat = this.add.graphics().setScrollFactor(0).setDepth(1321);
    const x = this.battleUi.albertoSprite.x + 128;
    const y = this.battleUi.albertoSprite.y - 24;

    cat.setPosition(x, y);
    cat.fillStyle(COLORS.ink, 1);
    cat.fillRect(-21, -18, 42, 26);
    cat.fillRect(-15, -31, 30, 20);
    cat.fillTriangle(-15, -29, -7, -43, 0, -29);
    cat.fillTriangle(15, -29, 7, -43, 0, -29);
    cat.fillStyle(0xc88f5a, 1);
    cat.fillRect(-18, -15, 36, 20);
    cat.fillRect(-12, -28, 24, 16);
    cat.fillTriangle(-12, -28, -7, -39, -2, -28);
    cat.fillTriangle(12, -28, 7, -39, 2, -28);
    cat.fillStyle(COLORS.ink, 1);
    cat.fillRect(-7, -21, 4, 4);
    cat.fillRect(4, -21, 4, 4);
    cat.fillRect(-2, -16, 4, 2);
    cat.fillRect(-14, -12, 4, 20);
    cat.fillRect(10, -12, 4, 20);
    cat.fillStyle(COLORS.paper, 1);
    cat.fillRect(-16, -15, 5, 2);
    cat.fillRect(-3, -14, 5, 2);
    cat.fillRect(8, -15, 5, 2);

    this.tweens.add({
      targets: cat,
      y: y - 12,
      duration: 380,
      yoyo: true,
      repeat: 3,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tweens.add({
          targets: cat,
          alpha: 0,
          duration: 420,
          onComplete: () => cat.destroy(),
        });
      },
    });
  }

  throwFood(kind, attacker) {
    const fromLucie = attacker === "lucie";
    const start = fromLucie
      ? { x: this.battleUi.lucieSprite.x - 32, y: this.battleUi.lucieSprite.y - 128 }
      : { x: this.battleUi.albertoSprite.x + 44, y: this.battleUi.albertoSprite.y - 122 };
    const end = fromLucie
      ? { x: this.battleUi.albertoSprite.x + 22, y: this.battleUi.albertoSprite.y - 122 }
      : { x: this.battleUi.lucieSprite.x - 24, y: this.battleUi.lucieSprite.y - 126 };
    const projectile = this.createFoodProjectile(kind, start.x, start.y);

    this.tweens.add({
      targets: projectile,
      x: end.x,
      y: end.y,
      angle: fromLucie ? -720 : 720,
      duration: 720,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.createImpactBurst(end.x, end.y);
        projectile.destroy();
      },
    });
  }

  createFoodProjectile(kind, x, y) {
    const projectile = this.add.graphics().setScrollFactor(0).setDepth(1321);

    projectile.setPosition(x, y);
    projectile.fillStyle(COLORS.ink, 1);

    if (kind === "chicken") {
      projectile.fillCircle(0, 0, 18);
      projectile.fillRect(12, -5, 18, 10);
      projectile.fillStyle(0xd8943c, 1);
      projectile.fillCircle(0, 0, 14);
      projectile.fillStyle(COLORS.paper, 1);
      projectile.fillRect(18, -3, 13, 6);
    } else if (kind === "steak") {
      projectile.fillEllipse(0, 0, 38, 24);
      projectile.fillStyle(0xa03438, 1);
      projectile.fillEllipse(0, 0, 30, 18);
      projectile.fillStyle(COLORS.paper, 0.72);
      projectile.fillRect(-9, -3, 18, 5);
    } else {
      projectile.fillEllipse(0, 0, 42, 18);
      projectile.fillTriangle(20, 0, 35, -10, 35, 10);
      projectile.fillStyle(0xf0f4f8, 1);
      projectile.fillEllipse(0, 0, 34, 13);
      projectile.fillStyle(COLORS.sky, 0.76);
      projectile.fillRect(-10, -4, 16, 8);
    }

    return projectile;
  }

  createImpactBurst(x, y) {
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const shard = this.add
        .rectangle(x, y, 8, 8, COLORS.paper, 1)
        .setScrollFactor(0)
        .setDepth(1320);

      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 42,
        y: y + Math.sin(angle) * 26,
        alpha: 0,
        duration: 360,
        onComplete: () => shard.destroy(),
      });
    }
  }

  animateTwerk() {
    const lucie = this.battleUi.lucieSprite;

    this.tweens.add({
      targets: lucie,
      y: lucie.y + 18,
      scaleY: 2.28,
      duration: 120,
      yoyo: true,
      repeat: 9,
      ease: "Sine.easeInOut",
      onComplete: () => {
        lucie.setY(244);
        lucie.setScale(2.55);
      },
    });
  }

  animateDizzyAlberto() {
    const swirl = this.add.container(this.battleUi.albertoSprite.x, this.battleUi.albertoSprite.y - 122)
      .setScrollFactor(0)
      .setDepth(1321);

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const star = this.add.text(Math.cos(angle) * 42, Math.sin(angle) * 24, "*", {
        fontFamily: "monospace",
        fontSize: "30px",
        color: index % 2 === 0 ? "#f04ac8" : "#fff0a8",
      }).setOrigin(0.5);
      swirl.add(star);
    }

    this.tweens.add({
      targets: swirl,
      angle: 720,
      alpha: 0,
      duration: 1700,
      ease: "Sine.easeOut",
      onComplete: () => swirl.destroy(),
    });
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

    for (const interaction of this.interactions ?? []) {
      interaction.marker.setVisible(false);
      interaction.text.setVisible(false);
    }

    this.commonObjectiveText?.setVisible(false);
  }

  hideAllSpeechBubbles() {
    for (const player of this.players ?? []) {
      this.speechBubbles.hide(player);
    }
  }

  playOptionalFukaiSound(cue, options = {}) {
    const key = FUKAI_AUDIO_CUES[cue];

    if (!key || !this.hasAudioKey(key)) {
      return null;
    }

    this.stopFukaiBattleSound(cue);

    const sound = this.sound.add(key, {
      loop: options.loop ?? false,
      volume: options.volume ?? 0.7,
    });

    this.battleSounds[cue] = sound;

    if (this.sound.locked) {
      this.sound.once("unlocked", () => {
        if (this.battleSounds[cue] === sound) {
          sound.play();
        }
      });
      return sound;
    }

    sound.play();
    return sound;
  }

  hasAudioKey(key) {
    const audioCache = this.cache?.audio;

    if (typeof audioCache?.exists === "function") {
      return audioCache.exists(key);
    }

    if (typeof audioCache?.has === "function") {
      return audioCache.has(key);
    }

    return false;
  }

  stopFukaiBattleSound(cue) {
    const sound = this.battleSounds?.[cue];

    if (!sound) {
      return;
    }

    sound.destroy();
    this.battleSounds[cue] = null;
  }

  stopFukaiBattleSounds() {
    for (const cue of Object.keys(this.battleSounds ?? {})) {
      this.stopFukaiBattleSound(cue);
    }
  }
}
