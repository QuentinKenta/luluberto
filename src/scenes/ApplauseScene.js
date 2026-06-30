import { AUDIO_KEYS, COLORS, GAME_SIZE, SCENE_KEYS } from "../constants.js";
import { InputController } from "../core/InputController.js";

const CALIBRATION_MS = 20000;
const COOLDOWN_MS = 4000;
const APPLAUSE_STEPS = 5;
const START_LOVE_RATIO = 0.75;
const FINALE_MOVE_MS = 5000;
const FINALE_FLASH_MS = 60000;
const SOUND_METER_INITIAL_CEILING = 0.05;
const SOUND_METER_MIN_CEILING = 0.02;
const SOUND_METER_MAX_CEILING = 0.32;

export class ApplauseScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.applause);
  }

  create() {
    this.inputController = new InputController(this, {
      keysOnly: {
        cancel: "ESC",
        confirm: "ENTER",
        advance: "SPACE",
        forceApplause: "V",
      },
    });
    this.phase = "waiting";
    this.phaseStartedAt = this.time.now;
    this.audioLevel = 0;
    this.displayLevel = 0;
    this.peakLevel = 0;
    this.threshold = 0.14;
    this.meterCeiling = SOUND_METER_INITIAL_CEILING;
    this.calibrationSamples = [];
    this.stepCount = 0;
    this.lastStepAt = -COOLDOWN_MS;
    this.finishStarted = false;
    this.currentLoveRatio = START_LOVE_RATIO;

    this.drawScene();
    this.bindWakeAudioGestures();
    this.startAudioCapture();

    this.events.once("shutdown", this.shutdownAudio, this);
  }

  update(time) {
    if (this.inputController.isCancelPressed()) {
      this.scene.start(SCENE_KEYS.chapters);
      return;
    }

    if (this.inputController.isKeyboardActionJustDown("forceApplause")) {
      this.forceAddStep(time);
    } else if (this.phase === "fallback" && this.inputController.isAdvancePressed()) {
      this.tryAddStep(time);
    }

    this.updateAudioLevel();
    this.updatePhase(time);
    this.updateVisuals(time);
  }

  drawScene() {
    this.cameras.main.setBackgroundColor("#000000");
    this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height / 2, GAME_SIZE.width, GAME_SIZE.height, 0x000000, 1)
      .setDepth(0);

    this.createBackgroundFill();
    this.createLoveGauge();
    this.createSoundMeter();
    this.createPlayers();
    this.createStatusText();
  }

  createBackgroundFill() {
    const bandHeight = GAME_SIZE.height / APPLAUSE_STEPS;
    this.backgroundBands = [];

    for (let index = 0; index < APPLAUSE_STEPS; index += 1) {
      const bandBottomY = GAME_SIZE.height - index * bandHeight;
      const band = this.add
        .rectangle(GAME_SIZE.width / 2, bandBottomY, GAME_SIZE.width, bandHeight, COLORS.neonPink, 0.9)
        .setOrigin(0.5, 1)
        .setScale(1, 0)
        .setDepth(1);

      this.backgroundBands.push(band);
    }

    for (let index = 1; index < APPLAUSE_STEPS; index += 1) {
      const y = GAME_SIZE.height - index * bandHeight;
      this.add.rectangle(GAME_SIZE.width / 2, y, GAME_SIZE.width, 2, COLORS.paper, 0.08).setDepth(2);
    }
  }

  createLoveGauge() {
    const x = GAME_SIZE.width / 2;
    const y = 68;
    const width = 520;
    const height = 24;

    this.loveLabel = this.add.text(x, y - 32, "LOVE", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#fff0a8",
    }).setOrigin(0.5).setDepth(20);

    this.loveBack = this.add
      .rectangle(x, y, width, height, 0x000000, 1)
      .setStrokeStyle(2, COLORS.paper, 0.88)
      .setDepth(20);

    this.loveGauge = {
      x: x - width / 2 + 4,
      y,
      width: width - 8,
      height: height - 8,
    };
    this.loveFill = this.add
      .rectangle(this.loveGauge.x, y, this.loveGauge.width * START_LOVE_RATIO, this.loveGauge.height, COLORS.neonPink, 1)
      .setOrigin(0, 0.5)
      .setDepth(21);

    this.loveTicks = [];
    for (let index = 1; index < 4; index += 1) {
      this.loveTicks.push(
        this.add
          .rectangle(x - width / 2 + (width * index) / 4, y, 2, height - 4, COLORS.paper, 0.34)
          .setDepth(22),
      );
    }
  }

  createSoundMeter() {
    const x = GAME_SIZE.width / 2;
    const y = 122;
    const width = 360;
    const height = 10;

    this.soundMeter = {
      x: x - width / 2,
      y,
      width,
      height,
    };

    this.add.text(x - width / 2 - 48, y - 8, "son", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fff0a8",
    }).setDepth(20);

    this.soundMeterBack = this.add
      .rectangle(x, y, width, height, 0x000000, 0.82)
      .setStrokeStyle(1, COLORS.paper, 0.62)
      .setDepth(20);

    this.soundLevelFill = this.add.graphics().setDepth(21);
    this.soundPeakMarker = this.add
      .rectangle(this.soundMeter.x + 2, y, 2, 18, COLORS.paper, 0.72)
      .setDepth(22);

    this.thresholdMarker = this.add
      .rectangle(this.soundMeter.x + width * 0.24, y, 3, 22, COLORS.neonPink, 1)
      .setDepth(23);

    this.add.text(x + width / 2 + 12, y - 8, "seuil", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#f04ac8",
    }).setDepth(20);
  }

  createPlayers() {
    const floorY = 386;

    this.add.rectangle(GAME_SIZE.width / 2, floorY + 50, 520, 2, COLORS.floor, 0.2).setDepth(3);
    this.leftShadow = this.add.ellipse(318, floorY + 10, 116, 18, COLORS.ink, 0.48).setDepth(4);
    this.rightShadow = this.add.ellipse(642, floorY + 10, 116, 18, COLORS.ink, 0.48).setDepth(4);

    this.leftPlayer = this.add.sprite(318, floorY, "player-a-right-0").setScale(3).setOrigin(0.5, 1).setDepth(5);
    this.rightPlayer = this.add.sprite(642, floorY, "player-l-left-0").setScale(3).setOrigin(0.5, 1).setDepth(5);
  }

  createStatusText() {
    this.statusText = this.add.text(GAME_SIZE.width / 2, GAME_SIZE.height - 50, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#fff0a8",
      align: "center",
    }).setOrigin(0.5).setDepth(30);

    this.cooldownText = this.add.text(GAME_SIZE.width / 2, GAME_SIZE.height - 28, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#d8a038",
      align: "center",
    }).setOrigin(0.5).setDepth(30);
  }

  bindWakeAudioGestures() {
    this.wakeAudioHandler = () => this.resumeAudioContext();

    this.input.on("pointerdown", this.wakeAudioHandler);
    this.input.keyboard.on("keydown", this.wakeAudioHandler);
  }

  resumeAudioContext() {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  async startAudioCapture() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.enterFallback("Micro indisponible");
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      if (!this.scene.isActive(SCENE_KEYS.applause)) {
        this.shutdownAudio();
        return;
      }

      if (this.phase !== "waiting") {
        this.stopMicrophoneCapture();
        return;
      }

      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.64;
      this.audioBuffer = new Uint8Array(this.analyser.fftSize);
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioSource.connect(this.analyser);
      this.resumeAudioContext();
      this.phase = "calibrating";
      this.phaseStartedAt = this.time.now;
    } catch (error) {
      if (this.scene.isActive(SCENE_KEYS.applause) && this.phase === "waiting") {
        this.enterFallback("Micro refuse");
      }
    }
  }

  enterFallback(message) {
    this.fallbackMessage = message;
    this.phase = "fallback";
    this.phaseStartedAt = this.time.now;
    this.threshold = 0.18;
  }

  updateAudioLevel() {
    if (!this.analyser || !this.audioBuffer) {
      this.audioLevel = this.phase === "fallback" ? Math.max(0, this.audioLevel * 0.88) : 0;
      this.displayLevel = Phaser.Math.Linear(this.displayLevel, this.audioLevel, 0.26);
      this.peakLevel = Math.max(this.peakLevel * 0.9, this.audioLevel);
      return;
    }

    if (this.audioContext?.state === "suspended") {
      this.audioLevel = 0;
      this.displayLevel = Phaser.Math.Linear(this.displayLevel, 0, 0.26);
      this.peakLevel *= 0.9;
      return;
    }

    this.analyser.getByteTimeDomainData(this.audioBuffer);

    let sum = 0;
    for (const sample of this.audioBuffer) {
      const centered = (sample - 128) / 128;
      sum += centered * centered;
    }

    this.audioLevel = Math.sqrt(sum / this.audioBuffer.length);
    this.displayLevel = Phaser.Math.Linear(this.displayLevel, this.audioLevel, 0.34);
    this.peakLevel = Math.max(this.peakLevel * 0.92, this.audioLevel);
  }

  updatePhase(time) {
    if (this.phase === "waiting") {
      this.statusText.setText("Activation du micro");
      this.cooldownText.setText("");
      return;
    }

    if (this.phase === "calibrating") {
      if (this.audioContext?.state === "suspended") {
        this.phaseStartedAt = time;
        this.statusText.setText("Clique ou appuie pour activer le micro");
        this.cooldownText.setText("");
        return;
      }

      this.calibrationSamples.push(this.audioLevel);
      const elapsed = time - this.phaseStartedAt;
      const remaining = Math.max(0, Math.ceil((CALIBRATION_MS - elapsed) / 1000));

      this.statusText.setText(`Calibrage ${remaining}s`);
      this.cooldownText.setText("");

      if (elapsed >= CALIBRATION_MS) {
        this.finishCalibration(time);
      }
      return;
    }

    if (this.phase === "active") {
      if (this.audioContext?.state === "suspended") {
        this.statusText.setText("Clique ou appuie pour activer le micro");
        this.cooldownText.setText("");
        return;
      }

      this.statusText.setText("");
      this.cooldownText.setText("");

      if (this.audioLevel >= this.threshold) {
        this.tryAddStep(time);
      }
      return;
    }

    if (this.phase === "fallback") {
      this.statusText.setText(this.fallbackMessage);
      this.updateFallbackText(time);
      return;
    }

    if (this.phase === "endingMove" || this.phase === "finalFlash") {
      this.statusText.setText("");
      this.cooldownText.setText("");
    }
  }

  finishCalibration(time) {
    const samples = this.calibrationSamples.filter((value) => Number.isFinite(value));
    const average = samples.reduce((total, value) => total + value, 0) / Math.max(1, samples.length);
    const sorted = [...samples].sort((a, b) => a - b);
    const percentile90 = sorted[Math.floor(sorted.length * 0.9)] ?? average;

    this.threshold = Phaser.Math.Clamp(Math.max(0.055, average * 2.8, percentile90 * 1.65, average + 0.035), 0.055, 0.58);
    this.meterCeiling = Phaser.Math.Clamp(this.threshold * 1.8, SOUND_METER_MIN_CEILING, SOUND_METER_MAX_CEILING);
    this.phase = "active";
    this.phaseStartedAt = time;
    this.lastStepAt = time - COOLDOWN_MS;
  }

  updateFallbackText(time) {
    const remaining = Math.max(0, COOLDOWN_MS - (time - this.lastStepAt));
    const text = remaining > 0 ? `Espace dans ${Math.ceil(remaining / 1000)}s` : "Espace pour tester";

    this.cooldownText.setText(text);
  }

  forceAddStep(time) {
    if (this.phase === "waiting") {
      this.enterFallback("");
    }

    this.tryAddStep(time, { bypassCooldown: true });
  }

  tryAddStep(time, options = {}) {
    if (
      this.phase === "waiting" ||
      this.phase === "endingMove" ||
      this.phase === "finalFlash" ||
      this.stepCount >= APPLAUSE_STEPS
    ) {
      return;
    }

    if (!options.bypassCooldown && time - this.lastStepAt < COOLDOWN_MS) {
      return;
    }

    this.lastStepAt = time;
    this.stepCount += 1;
    this.audioLevel = Math.max(this.audioLevel, this.threshold + 0.08);
    this.fillStep(this.stepCount - 1);

    if (this.stepCount >= APPLAUSE_STEPS) {
      this.completePhase();
    }
  }

  fillStep(index) {
    this.fillLoveGauge(index + 1);
    this.fillBackgroundBand(index);
    this.flashLoveGauge();
  }

  fillLoveGauge(stepCount) {
    this.currentLoveRatio = Phaser.Math.Clamp(
      START_LOVE_RATIO + (1 - START_LOVE_RATIO) * (stepCount / APPLAUSE_STEPS),
      START_LOVE_RATIO,
      1,
    );

    this.tweens.add({
      targets: this.loveFill,
      displayWidth: this.loveGauge.width * this.currentLoveRatio,
      duration: 340,
      ease: "Sine.easeOut",
    });
  }

  fillBackgroundBand(index) {
    const band = this.backgroundBands[index];

    if (!band) {
      return;
    }

    this.tweens.add({
      targets: band,
      scaleY: 1,
      duration: 480,
      ease: "Sine.easeOut",
    });
  }

  flashLoveGauge() {
    const targets = [this.loveFill, this.loveBack, this.loveLabel, ...this.loveTicks];

    this.tweens.add({
      targets,
      alpha: 0.25,
      duration: 85,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        for (const target of targets) {
          target.setAlpha(1);
        }
      },
    });
  }

  completePhase() {
    if (this.finishStarted) {
      return;
    }

    this.finishStarted = true;
    this.phase = "endingMove";
    this.stopMicrophoneCapture();

    this.tweens.add({
      targets: this.leftPlayer,
      x: 430,
      duration: FINALE_MOVE_MS,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: this.rightPlayer,
      x: 530,
      duration: FINALE_MOVE_MS,
      ease: "Sine.easeInOut",
      onComplete: () => this.startFinalFlash(),
    });
    this.tweens.add({
      targets: this.leftShadow,
      x: 430,
      duration: FINALE_MOVE_MS,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: this.rightShadow,
      x: 530,
      duration: FINALE_MOVE_MS,
      ease: "Sine.easeInOut",
    });
  }

  startFinalFlash() {
    if (!this.scene.isActive(SCENE_KEYS.applause)) {
      return;
    }

    this.phase = "finalFlash";
    this.playFinaleMusic();

    for (const band of this.backgroundBands) {
      band.setScale(1, 1).setAlpha(1);
    }

    this.finalFlashTween = this.tweens.add({
      targets: this.backgroundBands,
      alpha: 0.16,
      duration: 75,
      yoyo: true,
      repeat: -1,
    });

    this.time.delayedCall(FINALE_FLASH_MS, () => {
      if (this.scene.isActive(SCENE_KEYS.applause)) {
        this.scene.start(SCENE_KEYS.chapters);
      }
    });
  }

  playFinaleMusic() {
    if (this.finaleMusic) {
      return;
    }

    this.finaleMusic = this.sound.add(AUDIO_KEYS.concertWallsClimax, {
      loop: true,
      volume: 0.72,
    });

    if (this.sound.locked) {
      this.sound.once("unlocked", () => this.finaleMusic?.play());
      return;
    }

    this.finaleMusic.play();
  }

  updateVisuals(time) {
    const breath = Math.sin(time / 320) * 0.04;
    this.leftPlayer.setScale(3 + breath);
    this.rightPlayer.setScale(3 - breath);
    this.updateSoundMeter();
  }

  updateSoundMeter() {
    if (!this.soundMeter) {
      return;
    }

    this.meterCeiling = Phaser.Math.Clamp(
      Math.max(this.meterCeiling * 0.985, this.displayLevel * 4, this.peakLevel * 2.2, this.threshold * 1.25),
      SOUND_METER_MIN_CEILING,
      SOUND_METER_MAX_CEILING,
    );

    const levelRatio = Phaser.Math.Clamp(this.displayLevel / this.meterCeiling, 0, 1);
    const peakRatio = Phaser.Math.Clamp(this.peakLevel / this.meterCeiling, 0, 1);
    const thresholdRatio = Phaser.Math.Clamp(this.threshold / this.meterCeiling, 0, 1);
    const meterWidth = this.soundMeter.width - 4;
    const levelWidth = meterWidth * levelRatio;
    const peakX = this.soundMeter.x + meterWidth * peakRatio + 2;
    const thresholdX = this.soundMeter.x + meterWidth * thresholdRatio + 2;

    const isOverThreshold = this.audioLevel >= this.threshold;
    const fillColor = isOverThreshold ? COLORS.neonPink : COLORS.paper;
    const visibleWidth = levelWidth > 0.5 ? Math.max(3, levelWidth) : 0;

    this.soundLevelFill.clear();
    if (visibleWidth > 0) {
      this.soundLevelFill.fillStyle(fillColor, 0.92);
      this.soundLevelFill.fillRect(
        this.soundMeter.x + 2,
        this.soundMeter.y - (this.soundMeter.height - 4) / 2,
        visibleWidth,
        this.soundMeter.height - 4,
      );
    }

    this.soundPeakMarker.setX(peakX).setFillStyle(fillColor, 0.72);
    this.thresholdMarker.setX(thresholdX);
  }

  stopMicrophoneCapture() {
    for (const track of this.mediaStream?.getTracks?.() ?? []) {
      track.stop();
    }

    this.mediaStream = null;
    this.audioSource?.disconnect?.();
    this.audioSource = null;
    this.analyser = null;
    this.audioBuffer = null;

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }

    this.audioContext = null;
  }

  shutdownAudio() {
    if (this.wakeAudioHandler) {
      this.input?.off("pointerdown", this.wakeAudioHandler);
      this.input?.keyboard?.off("keydown", this.wakeAudioHandler);
      this.wakeAudioHandler = null;
    }

    this.stopMicrophoneCapture();
    this.finaleMusic?.destroy();
    this.finaleMusic = null;
  }
}
