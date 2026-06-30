export class SpeechBubbleSystem {
  constructor(scene) {
    this.scene = scene;
    this.bubbles = new Map();
  }

  isVisible(player) {
    const bubble = this.bubbles.get(player.id);
    return Boolean(bubble?.text.visible);
  }

  toggle(player, line) {
    if (this.isVisible(player)) {
      this.hide(player);
      return;
    }

    this.show(player, line);
  }

  show(player, line) {
    const bubble = this.getBubble(player);
    bubble.text
      .setText(`${line.speaker}: ${line.text}`)
      .setBackgroundColor(player.bubbleColor)
      .setVisible(true);
    this.positionBubble(player, bubble);
  }

  hide(player) {
    const bubble = this.bubbles.get(player.id);

    if (bubble) {
      bubble.text.setVisible(false);
    }
  }

  update(players) {
    for (const player of players) {
      const bubble = this.bubbles.get(player.id);

      if (bubble?.text.visible) {
        this.positionBubble(player, bubble);
      }
    }
  }

  getBubble(player) {
    if (!this.bubbles.has(player.id)) {
      const text = this.scene.add
        .text(0, 0, "", {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#303050",
          lineSpacing: 4,
          padding: { x: 10, y: 7 },
          wordWrap: { width: 184 },
        })
        .setOrigin(0.5, 1)
        .setDepth(500)
        .setVisible(false);

      this.bubbles.set(player.id, { text });
    }

    return this.bubbles.get(player.id);
  }

  positionBubble(player, bubble) {
    bubble.text.setPosition(player.sprite.x, player.sprite.y - 38);
  }
}
