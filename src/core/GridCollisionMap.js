export class GridCollisionMap {
  constructor(options) {
    this.originX = options.originX;
    this.originY = options.originY;
    this.width = options.width;
    this.height = options.height;
    this.tileSize = options.tileSize;
    this.blockedTiles = new Set(options.blockedTiles ?? []);
  }

  toKey(gridX, gridY) {
    return `${gridX},${gridY}`;
  }

  gridToWorld(gridX, gridY) {
    return {
      x: this.originX + gridX * this.tileSize + this.tileSize / 2,
      y: this.originY + gridY * this.tileSize + this.tileSize / 2,
    };
  }

  isInside(gridX, gridY) {
    return gridX >= 0 && gridY >= 0 && gridX < this.width && gridY < this.height;
  }

  isBlocked(gridX, gridY) {
    return !this.isInside(gridX, gridY) || this.blockedTiles.has(this.toKey(gridX, gridY));
  }

  setBlocked(gridX, gridY, blocked = true) {
    const key = this.toKey(gridX, gridY);

    if (blocked) {
      this.blockedTiles.add(key);
      return;
    }

    this.blockedTiles.delete(key);
  }

  setBlockedRect(x, y, width, height, blocked = true) {
    for (let tileY = y; tileY < y + height; tileY += 1) {
      for (let tileX = x; tileX < x + width; tileX += 1) {
        this.setBlocked(tileX, tileY, blocked);
      }
    }
  }

  canEnter(gridX, gridY, players, requester) {
    if (this.isBlocked(gridX, gridY)) {
      return false;
    }

    return !players.some((player) => {
      if (player === requester) {
        return false;
      }

      return player.occupiedTiles().some((tile) => tile.x === gridX && tile.y === gridY);
    });
  }
}
