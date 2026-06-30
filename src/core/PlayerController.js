export class PlayerController {
  constructor(scene, options) {
    this.scene = scene;
    this.speed = options.speed ?? 170;
    this.sprite = scene.physics.add.sprite(options.x, options.y, options.texture);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(22, 24);
    this.sprite.setOffset(9, 18);
  }

  update(input) {
    const movement = input.getMovement();

    this.sprite.setVelocity(movement.x * this.speed, movement.y * this.speed);

    if (movement.x !== 0) {
      this.sprite.setFlipX(movement.x < 0);
    }
  }

  stop() {
    this.sprite.setVelocity(0, 0);
  }
}
