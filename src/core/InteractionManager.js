import { COLORS } from "../constants.js";

export class InteractionManager {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.activeItem = null;
    this.prompt = scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#303050",
        backgroundColor: "#d8a038",
        padding: { x: 8, y: 4 },
      })
      .setDepth(50)
      .setVisible(false);
  }

  register(options) {
    const item = {
      x: options.x,
      y: options.y,
      radius: options.radius ?? 56,
      label: options.label,
      onInteract: options.onInteract,
      marker: this.scene.add.image(options.x, options.y, "interaction-marker").setDepth(5),
    };

    item.marker.setTint(options.tint ?? COLORS.brass);
    this.items.push(item);
    return item;
  }

  update(playerSprite) {
    let closest = null;
    let closestDistance = Infinity;

    for (const item of this.items) {
      const distance = Phaser.Math.Distance.Between(
        playerSprite.x,
        playerSprite.y,
        item.x,
        item.y,
      );

      item.marker.setAlpha(distance <= item.radius ? 1 : 0.45);

      if (distance <= item.radius && distance < closestDistance) {
        closest = item;
        closestDistance = distance;
      }
    }

    this.activeItem = closest;
    this.renderPrompt();
  }

  tryInteract() {
    if (!this.activeItem) {
      return false;
    }

    this.activeItem.onInteract();
    return true;
  }

  renderPrompt() {
    if (!this.activeItem) {
      this.prompt.setVisible(false);
      return;
    }

    this.prompt
      .setText(this.activeItem.label)
      .setPosition(this.activeItem.x - 32, this.activeItem.y - 46)
      .setVisible(true);
  }
}
