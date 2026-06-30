import { COLORS, GAME_SIZE } from "../constants.js";

export class DialogSystem {
  constructor(scene) {
    this.scene = scene;
    this.lines = [];
    this.index = 0;
    this.active = false;
    this.onComplete = null;
    this.canAdvance = true;
    this.lineDurationMs = null;
    this.autoAdvanceTimer = null;

    this.group = scene.add.group();
    this.backdrop = scene.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height - 92, GAME_SIZE.width - 96, 132, COLORS.ink, 0.94)
      .setStrokeStyle(3, COLORS.paper)
      .setScrollFactor(0)
      .setDepth(1200)
      .setVisible(false);
    this.speakerText = scene.add
      .text(76, GAME_SIZE.height - 144, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#d8a038",
      })
      .setScrollFactor(0)
      .setDepth(1201)
      .setVisible(false);
    this.bodyText = scene.add
      .text(76, GAME_SIZE.height - 116, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff0a8",
        lineSpacing: 8,
        wordWrap: { width: GAME_SIZE.width - 152 },
      })
      .setScrollFactor(0)
      .setDepth(1201)
      .setVisible(false);
    this.promptText = scene.add
      .text(GAME_SIZE.width - 78, GAME_SIZE.height - 48, "P / E", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#d8a038",
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(1201)
      .setVisible(false);

    this.group.addMultiple([this.backdrop, this.speakerText, this.bodyText, this.promptText]);
  }

  show(lines, onComplete, options = {}) {
    this.clearAutoAdvanceTimer();
    this.lines = lines;
    this.index = 0;
    this.active = true;
    this.onComplete = onComplete ?? null;
    this.canAdvance = options.canAdvance ?? true;
    this.lineDurationMs = options.lineDurationMs ?? null;

    this.backdrop.setVisible(true);
    this.speakerText.setVisible(true);
    this.bodyText.setVisible(true);
    this.promptText.setVisible(this.canAdvance);
    this.renderLine();
    this.scheduleAutoAdvance();
  }

  advance() {
    if (!this.active || !this.canAdvance) {
      return;
    }

    this.showNextLine();
  }

  showNextLine() {
    this.clearAutoAdvanceTimer();

    this.index += 1;

    if (this.index >= this.lines.length) {
      this.hide();
      return;
    }

    this.renderLine();
    this.scheduleAutoAdvance();
  }

  hide() {
    this.clearAutoAdvanceTimer();
    this.active = false;
    this.backdrop.setVisible(false);
    this.speakerText.setVisible(false);
    this.bodyText.setVisible(false);
    this.promptText.setVisible(false);

    if (this.onComplete) {
      this.onComplete();
    }
  }

  renderLine() {
    const line = this.lines[this.index];
    this.speakerText.setText(line.speaker);
    this.bodyText.setText(line.text);
  }

  scheduleAutoAdvance() {
    if (!this.active || !this.lineDurationMs) {
      return;
    }

    const line = this.lines[this.index];
    const duration =
      typeof this.lineDurationMs === "function"
        ? this.lineDurationMs(line, this.index)
        : this.lineDurationMs;

    this.autoAdvanceTimer = this.scene.time.delayedCall(duration, () => this.showNextLine());
  }

  clearAutoAdvanceTimer() {
    if (!this.autoAdvanceTimer) {
      return;
    }

    this.autoAdvanceTimer.remove(false);
    this.autoAdvanceTimer = null;
  }
}
