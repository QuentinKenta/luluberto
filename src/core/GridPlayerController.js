const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const DIRECTION_NAMES = Object.keys(DIRECTIONS);

export class GridPlayerController {
  constructor(scene, options) {
    this.scene = scene;
    this.id = options.id;
    this.name = options.name;
    this.grid = options.grid;
    this.gridX = options.gridX;
    this.gridY = options.gridY;
    this.fromGridX = this.gridX;
    this.fromGridY = this.gridY;
    this.targetGridX = this.gridX;
    this.targetGridY = this.gridY;
    this.speed = options.speed ?? 128;
    this.turnDelayMs = options.turnDelayMs ?? 150;
    this.turnDelayRemaining = 0;
    this.facing = "down";
    this.isMoving = false;
    this.bubbleColor = options.bubbleColor;
    this.texture = options.texture;
    this.directionalTextures = options.directionalTextures ?? createDefaultDirectionalTextures(options.texture);
    this.animationElapsedMs = 0;
    this.animationFrameIndex = 0;
    this.animationIntervalMs = options.animationIntervalMs ?? 320;

    const world = this.grid.gridToWorld(this.gridX, this.gridY);
    this.lookMarker = scene.add
      .rectangle(world.x, world.y + this.grid.tileSize, 18, 18, options.lookColor ?? 0xffffff, 0.14)
      .setStrokeStyle(1, options.lookColor ?? 0xffffff, 0.45)
      .setDepth(10);
    this.sprite = scene.add.sprite(world.x, world.y, options.texture).setDepth(world.y);
    this.sprite.setOrigin(0.5, 0.78);
    this.updateSpriteTexture();
    this.updateLookMarker();
  }

  update(delta, input, collisionMap, players) {
    this.turnDelayRemaining = Math.max(0, this.turnDelayRemaining - delta);
    this.updateAnimation(delta);

    if (this.isMoving) {
      this.updateMovement(delta);
      return;
    }

    const directionName = input.getGridDirection();

    if (!directionName) {
      return;
    }

    if (directionName !== this.facing) {
      this.setFacing(directionName);
      this.turnDelayRemaining = this.turnDelayMs;
      return;
    }

    if (this.turnDelayRemaining > 0) {
      return;
    }

    this.tryMove(directionName, collisionMap, players);
  }

  occupiedTiles() {
    const tiles = [{ x: this.gridX, y: this.gridY }];

    if (this.isMoving) {
      tiles.push({ x: this.targetGridX, y: this.targetGridY });
    }

    return tiles;
  }

  facingTile() {
    const direction = DIRECTIONS[this.facing];

    return {
      x: this.gridX + direction.x,
      y: this.gridY + direction.y,
    };
  }

  tryMove(directionName, collisionMap, players) {
    this.setFacing(directionName);

    const direction = DIRECTIONS[directionName];
    const nextGridX = this.gridX + direction.x;
    const nextGridY = this.gridY + direction.y;

    if (!collisionMap.canEnter(nextGridX, nextGridY, players, this)) {
      return;
    }

    this.fromGridX = this.gridX;
    this.fromGridY = this.gridY;
    this.targetGridX = nextGridX;
    this.targetGridY = nextGridY;
    this.isMoving = true;
  }

  setFacing(directionName) {
    if (this.facing === directionName) {
      this.updateLookMarker();
      return;
    }

    this.facing = directionName;
    this.animationFrameIndex = 0;
    this.animationElapsedMs = 0;
    this.updateSpriteTexture();
    this.updateLookMarker();
  }

  updateAnimation(delta) {
    const frameTextures = this.getFrameTextures();

    if (frameTextures.length <= 1) {
      return;
    }

    this.animationElapsedMs += delta;

    while (this.animationElapsedMs >= this.animationIntervalMs) {
      this.animationElapsedMs -= this.animationIntervalMs;
      this.animationFrameIndex = (this.animationFrameIndex + 1) % frameTextures.length;
      this.updateSpriteTexture();
    }
  }

  updateSpriteTexture() {
    const frameTextures = this.getFrameTextures();
    const texture = frameTextures[this.animationFrameIndex % frameTextures.length] ?? this.texture;

    if (this.scene.textures.exists(texture) && this.sprite.texture.key !== texture) {
      this.sprite.setTexture(texture);
    }

    this.sprite.setFlipX(false);
  }

  getFrameTextures() {
    const textures = this.directionalTextures[this.facing] ?? this.texture;

    return Array.isArray(textures) ? textures : [textures];
  }

  updateMovement(delta) {
    const target = this.grid.gridToWorld(this.targetGridX, this.targetGridY);
    const distanceX = target.x - this.sprite.x;
    const distanceY = target.y - this.sprite.y;
    const distance = Math.hypot(distanceX, distanceY);
    const step = (this.speed * delta) / 1000;

    if (distance <= step) {
      this.sprite.setPosition(target.x, target.y);
      this.gridX = this.targetGridX;
      this.gridY = this.targetGridY;
      this.isMoving = false;
      this.updateLookMarker();
    } else {
      this.sprite.x += (distanceX / distance) * step;
      this.sprite.y += (distanceY / distance) * step;
      this.updateLookMarker();
    }

    this.sprite.setDepth(this.sprite.y);
  }

  updateLookMarker() {
    const facingTile = this.facingTile();
    const world = this.grid.gridToWorld(facingTile.x, facingTile.y);
    this.lookMarker.setPosition(world.x, world.y);
  }
}

function createDefaultDirectionalTextures(texture) {
  return Object.fromEntries(
    DIRECTION_NAMES.map((direction) => [
      direction,
      [`${texture}-${direction}-0`, `${texture}-${direction}-1`],
    ]),
  );
}
