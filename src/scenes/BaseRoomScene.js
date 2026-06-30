import { COLORS, GAME_SIZE, SCENE_KEYS, TILE_SIZE } from "../constants.js";
import { GridCollisionMap } from "../core/GridCollisionMap.js";
import { GridPlayerController } from "../core/GridPlayerController.js";
import { InputController } from "../core/InputController.js";
import { DialogSystem } from "../systems/DialogSystem.js";
import { MusicLoopSystem } from "../systems/MusicLoopSystem.js";
import { SpeechBubbleSystem } from "../systems/SpeechBubbleSystem.js";

export class BaseRoomScene extends Phaser.Scene {
  createRoom(level, options = {}) {
    this.level = level;
    this.room = level.room;
    this.returnScene = options.returnScene ?? SCENE_KEYS.title;
    this.playerAInput = new InputController(this, {
      gamepadIndex: 0,
      keysOnly: {
        interact: "P",
        cancel: "ESC",
        advance: "SPACE",
      },
    });
    this.playerLInput = new InputController(this, {
      gamepadIndex: 1,
      useCursors: false,
      keysOnly: {
        up: "Z",
        left: "Q",
        down: "S",
        right: "D",
        interact: "E",
      },
    });

    this.collisionMap = new GridCollisionMap({
      ...this.room,
      tileSize: TILE_SIZE,
      blockedTiles: this.createBlockedTiles(),
    });
    this.speechBubbles = new SpeechBubbleSystem(this);
    this.dialogSystem = new DialogSystem(this);
    this.controlsLocked = false;
    this.createLevelMusic();

    this.drawRoom();
    this.createLockedDoors();
    this.createNpcs();
    this.createPlayers();
    this.createInteractions();
    this.createObjectives();
    this.updateCamera();
  }

  createLevelMusic() {
    if (!this.level.music) {
      return;
    }

    this.music = new MusicLoopSystem(this, this.level.music);
    this.events.on("music:play-loop", this.playMusicLoop, this);
    this.events.once("shutdown", this.stopLevelMusic, this);

    if (this.level.music.initial) {
      this.playMusicLoop(this.level.music.initial);
    }
  }

  playMusicLoop(trackId, options = {}) {
    return this.music?.playLoop(trackId, options) ?? null;
  }

  stopLevelMusic() {
    this.events.off("music:play-loop", this.playMusicLoop, this);
    this.music?.destroy();
    this.music = null;
  }

  update(time, delta) {
    if (!this.level) {
      return;
    }

    if (this.dialogSystem?.active) {
      if (
        this.dialogSystem.canAdvance &&
        (this.playerAInput.isAdvancePressed() || this.playerLInput.isAdvancePressed())
      ) {
        this.dialogSystem.advance();
      }

      this.speechBubbles.update(this.players);
      this.updateCamera();
      return;
    }

    if (this.controlsLocked) {
      this.speechBubbles.update(this.players);
      this.updateCamera();
      return;
    }

    if (this.playerAInput.isCancelPressed() || this.playerLInput.isCancelPressed()) {
      this.scene.start(this.returnScene);
      return;
    }

    const playerInputs = [
      [this.players[0], this.playerAInput],
      [this.players[1], this.playerLInput],
    ];

    for (const [player, input] of playerInputs) {
      if (!this.isPlayerMovementLocked?.(player)) {
        this.handleInteraction(player, input);
      }
    }

    for (const [player, input] of playerInputs) {
      if (!this.isPlayerMovementLocked?.(player)) {
        player.update(delta, input, this.collisionMap, this.players);
      }
    }

    this.updateInteractionMarkers();
    this.updateObjectiveHighlights();
    this.speechBubbles.update(this.players);
    this.updateCamera();
  }

  createBlockedTiles() {
    const blocked = [];
    const blockRect = (x, y, width, height) => {
      for (let tileY = y; tileY < y + height; tileY += 1) {
        for (let tileX = x; tileX < x + width; tileX += 1) {
          blocked.push(`${tileX},${tileY}`);
        }
      }
    };

    for (const rect of this.level.collisionRects) {
      blockRect(rect.x, rect.y, rect.width, rect.height);
    }

    for (const door of this.level.lockedDoors ?? []) {
      if (door.open) {
        continue;
      }

      blockRect(door.x, door.y, door.width, door.height);
    }

    for (const npc of this.level.npcs ?? []) {
      blockRect(npc.gridX, npc.gridY, 1, 1);
    }

    return blocked;
  }

  drawRoom() {
    this.cameras.main.setBackgroundColor(COLORS.ink);

    const roomWidth = this.room.width * TILE_SIZE;
    const roomHeight = this.room.height * TILE_SIZE;
    const centerX = this.room.originX + roomWidth / 2;
    const centerY = this.room.originY + roomHeight / 2;
    const hasBackgroundMap = Boolean(this.level.backgroundTexture && this.textures.exists(this.level.backgroundTexture));

    this.add.rectangle(centerX + 8, centerY + 8, roomWidth + 34, roomHeight + 34, COLORS.ink, 0.5);
    this.add.rectangle(centerX, centerY, roomWidth + 34, roomHeight + 34, COLORS.wall, 1);
    this.add.rectangle(centerX, centerY, roomWidth + 18, roomHeight + 18, COLORS.ink, 1);
    this.add.rectangle(centerX, centerY, roomWidth, roomHeight, this.level.floorColor ?? COLORS.floor, 1);
    if (hasBackgroundMap) {
      this.add
        .image(centerX, centerY, this.level.backgroundTexture)
        .setDisplaySize(roomWidth, roomHeight)
        .setDepth(80);
    }
    this.add
      .rectangle(centerX, centerY, roomWidth, roomHeight, 0x000000, 0)
      .setStrokeStyle(4, this.level.accentColor ?? COLORS.brass);

    for (let y = 0; y < this.room.height; y += 1) {
      for (let x = 0; x < this.room.width; x += 1) {
        const world = this.collisionMap.gridToWorld(x, y);
        const blocked = this.collisionMap.isBlocked(x, y);
        const color = blocked ? (this.level.blockedTileColor ?? COLORS.wall) : (this.level.floorColor ?? COLORS.floor);
        const alpha = hasBackgroundMap ? 0 : blocked ? 1 : 0.28;

        this.add.rectangle(world.x, world.y, TILE_SIZE, TILE_SIZE, color, alpha).setDepth(hasBackgroundMap ? 90 : 0);
        this.add
          .rectangle(world.x, world.y, TILE_SIZE, TILE_SIZE, 0x000000, 0)
          .setStrokeStyle(
            1,
            hasBackgroundMap ? COLORS.paper : blocked ? COLORS.ink : COLORS.floorLine,
            hasBackgroundMap ? 0.12 : blocked ? 0.62 : 0.52,
          )
          .setDepth(hasBackgroundMap ? 91 : 0);

        if (!blocked && !hasBackgroundMap) {
          if (this.level.floorStyle === "office-pixel") {
            this.drawOfficeFloorTile(world.x, world.y, x, y);
          } else if (this.level.floorStyle === "concert-pixel") {
            this.drawConcertFloorTile(world.x, world.y, x, y);
          } else {
            this.add.rectangle(world.x - 10, world.y - 10, 4, 4, COLORS.floorLine, 0.5);
            this.add.rectangle(world.x + 7, world.y - 5, 3, 3, COLORS.wall, 0.56);
            this.add.rectangle(world.x - 2, world.y + 9, 3, 3, COLORS.sky, 0.24);
          }
        }

        if (blocked && !hasBackgroundMap) {
          if (this.level.wallStyle === "office-pixel") {
            this.drawOfficeWallTile(world.x, world.y, x, y);
          } else if (this.level.wallStyle === "concert-pixel") {
            this.drawConcertWallTile(world.x, world.y, x, y);
          } else {
            this.add.rectangle(world.x - 10, world.y - 10, 12, 12, COLORS.floor, 0.42);
            this.add.rectangle(world.x + 6, world.y - 12, 10, 10, COLORS.wallDark, 0.38);
            this.add.rectangle(world.x - 2, world.y + 6, 14, 14, COLORS.wall, 0.74);
            this.add.rectangle(world.x + 10, world.y + 10, 5, 5, COLORS.ink, 0.24);
          }
        }
      }
    }

    this.drawFurniture();
    this.drawHud();
  }

  drawFurniture() {
    for (const item of this.level.furniture) {
      if (item.type === "rect") {
        this.drawTileRect(item.x, item.y, item.width, item.height, item.fill, item.stroke, item.alpha);
      }

      if (item.type === "circle") {
        this.add
          .circle(...this.tileCenter(item.x, item.y), item.radius, item.fill, item.alpha ?? 1)
          .setDepth(item.depth ?? 120);
      }

      if (item.type === "pixelRect") {
        this.add
          .rectangle(...this.tileCenter(item.x, item.y), item.width, item.height, item.fill, item.alpha ?? 1)
          .setDepth(item.depth ?? 120);
      }

      if (item.type === "image") {
        this.drawFurnitureImage(item);
      }

      if (item.type === "desk") {
        this.drawDesk(item);
      }

      if (item.type === "computer") {
        this.drawComputer(item);
      }

      if (item.type === "chair") {
        this.drawChair(item);
      }

      if (item.type === "plant") {
        this.drawPlant(item);
      }

      if (item.type === "cabinet") {
        this.drawCabinet(item);
      }

      if (item.type === "shelf") {
        this.drawShelf(item);
      }

      if (item.type === "blueprint") {
        this.drawBlueprint(item);
      }

      if (item.type === "model") {
        this.drawModel(item);
      }

      if (item.type === "paperStack") {
        this.drawPaperStack(item);
      }

      if (item.type === "cobweb") {
        this.drawCobweb(item);
      }

      if (item.type === "wallPoster") {
        this.drawWallPoster(item);
      }

      if (item.type === "wallScreen") {
        this.drawWallScreen(item);
      }

      if (item.type === "printer") {
        this.drawPrinter(item);
      }

      if (item.type === "waterCooler") {
        this.drawWaterCooler(item);
      }

      if (item.type === "vendingMachine") {
        this.drawVendingMachine(item);
      }

      if (item.type === "rollingCart") {
        this.drawRollingCart(item);
      }

      if (item.type === "deskLamp") {
        this.drawDeskLamp(item);
      }

      if (item.type === "trashBin") {
        this.drawTrashBin(item);
      }

      if (item.type === "stackedBoxes") {
        this.drawStackedBoxes(item);
      }

      if (item.type === "lowSeat") {
        this.drawLowSeat(item);
      }

      if (item.type === "floorMat") {
        this.drawFloorMat(item);
      }

      if (item.type === "concertStage") {
        this.drawConcertStage(item);
      }

      if (item.type === "backstageBooth") {
        this.drawBackstageBooth(item);
      }

      if (item.type === "barCounter") {
        this.drawBarCounter(item);
      }

      if (item.type === "streetFacade") {
        this.drawStreetFacade(item);
      }

      if (item.type === "roadStrip") {
        this.drawRoadStrip(item);
      }

      if (item.type === "sideServiceWall") {
        this.drawSideServiceWall(item);
      }

      if (item.type === "tableSet") {
        this.drawTableSet(item);
      }

      if (item.type === "rightWallBar") {
        this.drawRightWallBar(item);
      }

      if (item.type === "audienceBack") {
        this.drawAudienceBack(item);
      }
    }
  }

  drawFurnitureImage(item) {
    if (!item.texture || !this.textures.exists(item.texture)) {
      return;
    }

    const [x, y] = this.tileCenter(item.x, item.y);
    const image = this.add
      .image(x + (item.offsetX ?? 0), y + (item.offsetY ?? 0), item.texture)
      .setOrigin(item.originX ?? 0.5, item.originY ?? 0.5)
      .setDepth(item.depth ?? y + 8);

    if (item.displayWidth || item.displayHeight) {
      image.setDisplaySize(item.displayWidth ?? image.displayWidth, item.displayHeight ?? image.displayHeight);
    } else if (item.scale) {
      image.setScale(item.scale);
    }
  }

  drawOfficeFloorTile(worldX, worldY, gridX, gridY) {
    const depth = 88;
    const shade = (gridX + gridY) % 2 === 0 ? 0.06 : 0;

    this.add.rectangle(worldX, worldY, TILE_SIZE - 2, TILE_SIZE - 2, COLORS.wall, 0.12 + shade).setDepth(depth);
    this.add.rectangle(worldX, worldY - 15, TILE_SIZE - 3, 1, COLORS.floorLine, 0.42).setDepth(depth + 1);
    this.add.rectangle(worldX - 15, worldY, 1, TILE_SIZE - 3, COLORS.floorLine, 0.36).setDepth(depth + 1);

    if ((gridX + gridY * 2) % 4 === 0) {
      this.add.rectangle(worldX - 8, worldY - 8, 5, 2, COLORS.floorLine, 0.38).setDepth(depth + 2);
      this.add.rectangle(worldX + 7, worldY + 8, 3, 3, COLORS.wallDark, 0.16).setDepth(depth + 2);
    }

    if ((gridX * 3 + gridY) % 5 === 0) {
      this.add.rectangle(worldX + 10, worldY - 3, 4, 4, COLORS.sky, 0.18).setDepth(depth + 2);
    }
  }

  drawOfficeWallTile(worldX, worldY, gridX, gridY) {
    const depth = 92;
    const shade = (gridX + gridY) % 2 === 0 ? 0.18 : 0.1;

    this.add.rectangle(worldX, worldY - 9, TILE_SIZE - 3, 8, COLORS.floor, 0.34 + shade).setDepth(depth);
    this.add.rectangle(worldX, worldY + 4, TILE_SIZE - 5, 15, COLORS.wallDark, 0.25).setDepth(depth + 1);
    this.add.rectangle(worldX - 9, worldY - 12, 5, 4, COLORS.paper, 0.45).setDepth(depth + 2);
    this.add.rectangle(worldX + 8, worldY - 10, 6, 3, COLORS.floorLine, 0.42).setDepth(depth + 2);
    this.add.rectangle(worldX - 8, worldY + 3, 10, 2, COLORS.ink, 0.13).setDepth(depth + 2);
    this.add.rectangle(worldX + 8, worldY + 10, 5, 5, COLORS.ink, 0.2).setDepth(depth + 2);
    this.add.rectangle(worldX, worldY + 15, TILE_SIZE - 2, 3, COLORS.ink, 0.32).setDepth(depth + 3);
  }

  drawConcertFloorTile(worldX, worldY, gridX, gridY) {
    const depth = 88;
    const streetStartY = this.level.streetStartY ?? this.room.height - 3;
    const inStreet = gridY >= streetStartY;
    const base = inStreet ? COLORS.sidewalk : COLORS.clubFloorLine;
    const line = inStreet ? COLORS.asphalt : COLORS.clubWall;
    const shade = (gridX * 2 + gridY) % 3 === 0 ? 0.12 : 0.04;

    const tileTexture = this.concertFloorTextureForTile(gridX, gridY, inStreet);

    if (tileTexture && this.textures.exists(tileTexture)) {
      this.add.image(worldX, worldY, tileTexture).setDisplaySize(TILE_SIZE - 1, TILE_SIZE - 1).setDepth(depth);
    }

    this.add.rectangle(worldX, worldY, TILE_SIZE - 2, TILE_SIZE - 2, base, inStreet ? 0.4 : 0.2 + shade).setDepth(depth);
    this.add.rectangle(worldX, worldY - 15, TILE_SIZE - 3, 1, line, inStreet ? 0.5 : 0.36).setDepth(depth + 1);
    this.add.rectangle(worldX - 15, worldY, 1, TILE_SIZE - 3, line, inStreet ? 0.42 : 0.3).setDepth(depth + 1);

    if ((gridX + gridY * 3) % 4 === 0) {
      this.add.rectangle(worldX - 9, worldY + 6, 5, 2, COLORS.clubWallDark, 0.38).setDepth(depth + 2);
      this.add.rectangle(worldX + 8, worldY - 6, 3, 3, COLORS.amber, inStreet ? 0.16 : 0.2).setDepth(depth + 2);
    }

    if (!inStreet && (gridX * 5 + gridY) % 7 === 0) {
      this.add.rectangle(worldX + 3, worldY + 9, 4, 2, COLORS.neonPink, 0.18).setDepth(depth + 2);
    }
  }

  concertFloorTextureForTile(gridX, gridY, inStreet) {
    if (inStreet) {
      return null;
    }

    if (gridY <= 4) {
      return (gridX + gridY) % 2 === 0 ? "concert-floor-black-tile" : "concert-floor-brown";
    }

    if (gridX <= 3) {
      return (gridX + gridY) % 2 === 0 ? "concert-floor-brick" : "concert-floor-pink-wall";
    }

    if (gridX >= 21) {
      return "concert-floor-planks";
    }

    const textures = [
      "concert-floor-gray-tile",
      "concert-floor-concrete",
      "concert-floor-purple",
      "concert-floor-brick",
    ];

    return textures[Math.abs(gridX * 3 + gridY * 5) % textures.length];
  }

  drawConcertWallTile(worldX, worldY, gridX, gridY) {
    const depth = 92;
    const brick = (gridX + gridY) % 2 === 0 ? COLORS.clubWall : COLORS.clubWallDark;

    this.add.rectangle(worldX, worldY, TILE_SIZE - 2, TILE_SIZE - 2, brick, 1).setDepth(depth);
    this.add.rectangle(worldX, worldY - 13, TILE_SIZE - 4, 2, COLORS.clubFloorLine, 0.38).setDepth(depth + 1);
    this.add.rectangle(worldX - 8, worldY - 4, 12, 2, COLORS.brick, 0.28).setDepth(depth + 1);
    this.add.rectangle(worldX + 7, worldY + 6, 10, 2, COLORS.plum, 0.34).setDepth(depth + 1);
    this.add.rectangle(worldX + 9, worldY - 8, 4, 4, COLORS.neonPink, (gridX + gridY * 2) % 5 === 0 ? 0.55 : 0.12).setDepth(depth + 2);
    this.add.rectangle(worldX, worldY + 15, TILE_SIZE - 2, 3, COLORS.ink, 0.42).setDepth(depth + 3);
  }

  drawDesk(item) {
    const fill = item.fill ?? COLORS.paper;
    const stroke = item.stroke ?? COLORS.brass;
    const width = item.width ?? 3;
    const height = item.height ?? 1;
    const [x, y] = this.tileCenter(item.x + (width - 1) / 2, item.y + (height - 1) / 2);
    const depth = item.depth ?? y;

    this.add.rectangle(x + 4, y + 5, width * TILE_SIZE - 8, height * TILE_SIZE - 8, COLORS.ink, 0.28).setDepth(depth - 1);
    this.add.rectangle(x, y, width * TILE_SIZE - 8, height * TILE_SIZE - 9, fill, 1).setStrokeStyle(2, stroke, 0.9).setDepth(depth);
    this.add.rectangle(x - width * 10, y + 6, 12, 4, stroke, 0.72).setDepth(depth + 1);
    this.add.rectangle(x + width * 8, y + 6, 18, 4, COLORS.wallDark, 0.28).setDepth(depth + 1);
  }

  drawComputer(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 18;

    this.add.rectangle(x, y - 5, 20, 15, COLORS.ink, 1).setDepth(depth);
    this.add.rectangle(x, y - 6, 14, 9, item.screen ?? COLORS.sky, 1).setDepth(depth + 1);
    this.add.rectangle(x, y + 4, 7, 4, COLORS.wallDark, 1).setDepth(depth + 1);
    this.add.rectangle(x, y + 10, 23, 5, COLORS.ink, 1).setDepth(depth + 1);
    this.add.rectangle(x - 4, y + 10, 3, 2, COLORS.paper, 0.7).setDepth(depth + 2);
    this.add.rectangle(x + 4, y + 10, 3, 2, COLORS.paper, 0.7).setDepth(depth + 2);
  }

  drawChair(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 8;

    this.add.rectangle(x, y - 7, 18, 7, item.back ?? COLORS.blue, 1).setStrokeStyle(2, COLORS.ink, 0.85).setDepth(depth);
    this.add.rectangle(x, y + 2, 20, 12, item.seat ?? COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.85).setDepth(depth + 1);
    this.add.rectangle(x - 6, y + 11, 4, 8, COLORS.ink, 0.68).setDepth(depth);
    this.add.rectangle(x + 6, y + 11, 4, 8, COLORS.ink, 0.68).setDepth(depth);
  }

  drawPlant(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 12;
    const leaf = item.leaf ?? COLORS.grassDark;

    this.add.rectangle(x, y + 9, 18, 12, item.pot ?? COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.76).setDepth(depth);
    this.add.rectangle(x - 8, y - 2, 7, 17, leaf, 1).setDepth(depth + 1);
    this.add.rectangle(x + 6, y - 7, 7, 21, leaf, 1).setDepth(depth + 1);
    this.add.rectangle(x, y - 12, 8, 18, COLORS.grassLight, 0.9).setDepth(depth + 2);
    this.add.rectangle(x - 2, y - 1, 4, 16, COLORS.grassDark, 1).setDepth(depth + 1);
  }

  drawCabinet(item) {
    const width = item.width ?? 2;
    const height = item.height ?? 1;
    const [x, y] = this.tileCenter(item.x + (width - 1) / 2, item.y + (height - 1) / 2);
    const body = item.fill ?? COLORS.wallDark;
    const depth = item.depth ?? y;
    const pixelWidth = width * TILE_SIZE - 6;
    const pixelHeight = height * TILE_SIZE - 6;

    this.add.rectangle(x + 3, y + 4, pixelWidth, pixelHeight, COLORS.ink, 0.28).setDepth(depth - 1);
    this.add.rectangle(x, y, pixelWidth, pixelHeight, body, 1).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth);

    for (let column = 1; column < width; column += 1) {
      this.add.rectangle(x - pixelWidth / 2 + column * TILE_SIZE, y, 2, pixelHeight - 4, COLORS.ink, 0.24).setDepth(depth + 1);
    }

    this.add.rectangle(x, y - pixelHeight / 4, pixelWidth - 8, 3, COLORS.paper, 0.28).setDepth(depth + 1);
    this.add.rectangle(x - 6, y + 4, 4, 6, COLORS.brass, 1).setDepth(depth + 2);
    this.add.rectangle(x + 6, y + 4, 4, 6, COLORS.brass, 1).setDepth(depth + 2);
  }

  drawShelf(item) {
    const width = item.width ?? 2;
    const [x, y] = this.tileCenter(item.x + (width - 1) / 2, item.y);
    const depth = item.depth ?? y;
    const pixelWidth = width * TILE_SIZE - 7;

    this.add.rectangle(x, y + 8, pixelWidth, 8, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.75).setDepth(depth);
    this.add.rectangle(x, y - 9, pixelWidth, 6, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.75).setDepth(depth);

    const left = x - pixelWidth / 2 + 8;
    const colors = [COLORS.blue, COLORS.paper, COLORS.mint, COLORS.coral, COLORS.wallDark];
    for (let index = 0; index < Math.floor(pixelWidth / 10); index += 1) {
      this.add.rectangle(left + index * 10, y - 2, 5, 16, colors[index % colors.length], 1).setDepth(depth + 1);
    }
  }

  drawBlueprint(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 18;

    this.add.rectangle(x, y, 28, 17, COLORS.blue, 1).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth);
    this.add.rectangle(x - 6, y - 2, 12, 2, COLORS.sky, 0.9).setDepth(depth + 1);
    this.add.rectangle(x + 5, y + 3, 10, 2, COLORS.sky, 0.9).setDepth(depth + 1);
    this.add.rectangle(x + 10, y - 4, 2, 8, COLORS.paper, 0.7).setDepth(depth + 1);
  }

  drawModel(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 18;

    this.add.rectangle(x, y + 5, 30, 9, COLORS.wall, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth);
    this.add.rectangle(x - 8, y - 3, 8, 14, COLORS.paper, 1).setStrokeStyle(2, COLORS.ink, 0.68).setDepth(depth + 1);
    this.add.rectangle(x + 4, y - 7, 10, 18, COLORS.sky, 1).setStrokeStyle(2, COLORS.ink, 0.68).setDepth(depth + 1);
    this.add.rectangle(x + 12, y - 1, 5, 11, COLORS.mint, 1).setStrokeStyle(1, COLORS.ink, 0.62).setDepth(depth + 2);
    this.add.rectangle(x + 4, y - 1, 3, 3, COLORS.ink, 0.48).setDepth(depth + 3);
    this.add.rectangle(x + 4, y + 5, 3, 3, COLORS.ink, 0.48).setDepth(depth + 3);
  }

  drawPaperStack(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 10;

    this.add.rectangle(x + 4, y + 4, 22, 14, COLORS.ink, 0.22).setDepth(depth - 1);
    this.add.rectangle(x, y + 4, 24, 12, COLORS.wall, 1).setStrokeStyle(2, COLORS.ink, 0.7).setDepth(depth);
    this.add.rectangle(x - 3, y, 24, 12, COLORS.paper, 1).setStrokeStyle(2, COLORS.ink, 0.6).setDepth(depth + 1);
    this.add.rectangle(x + 4, y - 5, 20, 10, COLORS.floor, 1).setStrokeStyle(2, COLORS.ink, 0.5).setDepth(depth + 2);
  }

  drawCobweb(item) {
    const topLeftX = this.room.originX + item.x * TILE_SIZE;
    const topLeftY = this.room.originY + item.y * TILE_SIZE;
    const size = item.size ?? 30;
    const originX = item.corner === "right" ? topLeftX + TILE_SIZE : topLeftX;
    const originY = topLeftY;
    const sign = item.corner === "right" ? -1 : 1;
    const graphics = this.add.graphics().setDepth(item.depth ?? 360);

    graphics.lineStyle(1, COLORS.floor, 0.62);
    graphics.beginPath();
    graphics.moveTo(originX, originY);
    graphics.lineTo(originX + sign * size, originY);
    graphics.moveTo(originX, originY);
    graphics.lineTo(originX, originY + size);
    graphics.moveTo(originX, originY);
    graphics.lineTo(originX + sign * size * 0.75, originY + size * 0.75);
    graphics.strokePath();

    for (let step = 1; step <= 3; step += 1) {
      const offset = step * 7;
      const webX = originX + sign * offset;
      const webY = originY + offset;

      graphics.beginPath();
      graphics.moveTo(webX, originY);
      graphics.lineTo(webX, webY);
      graphics.lineTo(originX, webY);
      graphics.strokePath();
    }
  }

  drawWallPoster(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const width = item.width ?? 44;
    const height = item.height ?? 30;
    const depth = item.depth ?? 310;

    this.add.rectangle(x + 3, y + 3, width, height, COLORS.ink, 0.24).setDepth(depth - 1);
    this.add.rectangle(x, y, width, height, COLORS.paper, 1).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth);
    this.add.rectangle(x - width / 4, y - 3, 11, 11, item.colorA ?? COLORS.coral, 1).setDepth(depth + 1);
    this.add.rectangle(x + width / 6, y + 4, 16, 4, item.colorB ?? COLORS.mint, 1).setDepth(depth + 1);
    this.add.rectangle(x + width / 5, y - 7, 4, 10, item.colorC ?? COLORS.blue, 1).setDepth(depth + 1);
    this.add.rectangle(x - width / 8, y + 9, 25, 2, COLORS.floorLine, 0.65).setDepth(depth + 1);
  }

  drawWallScreen(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const width = item.width ?? 62;
    const height = item.height ?? 35;
    const depth = item.depth ?? 310;

    this.add.rectangle(x + 4, y + 4, width, height, COLORS.ink, 0.28).setDepth(depth - 1);
    this.add.rectangle(x, y, width, height, COLORS.ink, 1).setDepth(depth);
    this.add.rectangle(x, y, width - 8, height - 8, item.fill ?? COLORS.floor, 1).setDepth(depth + 1);
    this.add.rectangle(x - 14, y + 3, 15, 3, COLORS.blue, 0.9).setDepth(depth + 2);
    this.add.rectangle(x + 9, y - 4, 22, 3, COLORS.coral, 0.9).setDepth(depth + 2);
    this.add.rectangle(x + 15, y + 7, 18, 3, COLORS.sky, 0.9).setDepth(depth + 2);
    this.add.rectangle(x - 3, y - 6, 4, 15, COLORS.mint, 0.9).setDepth(depth + 2);
  }

  drawPrinter(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 12;

    this.add.rectangle(x + 4, y + 5, 25, 20, COLORS.ink, 0.24).setDepth(depth - 1);
    this.add.rectangle(x, y - 2, 27, 15, COLORS.wall, 1).setStrokeStyle(2, COLORS.ink, 0.78).setDepth(depth);
    this.add.rectangle(x, y + 8, 23, 10, COLORS.wallDark, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 1);
    this.add.rectangle(x - 5, y - 11, 18, 7, COLORS.floor, 1).setStrokeStyle(1, COLORS.ink, 0.52).setDepth(depth + 1);
    this.add.rectangle(x + 8, y - 2, 5, 3, COLORS.mint, 1).setDepth(depth + 2);
    this.add.rectangle(x + 9, y + 8, 6, 2, COLORS.paper, 0.8).setDepth(depth + 2);
  }

  drawWaterCooler(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 18;

    this.add.rectangle(x, y + 8, 20, 22, COLORS.wallDark, 1).setStrokeStyle(2, COLORS.ink, 0.75).setDepth(depth);
    this.add.rectangle(x, y - 3, 14, 16, COLORS.sky, 0.85).setStrokeStyle(2, COLORS.ink, 0.75).setDepth(depth + 1);
    this.add.rectangle(x - 5, y + 8, 4, 3, COLORS.blue, 1).setDepth(depth + 2);
    this.add.rectangle(x + 5, y + 8, 4, 3, COLORS.coral, 1).setDepth(depth + 2);
    this.add.rectangle(x, y + 18, 10, 3, COLORS.ink, 0.38).setDepth(depth + 2);
  }

  drawVendingMachine(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 18;

    this.add.rectangle(x + 4, y + 4, 32, 52, COLORS.ink, 0.25).setDepth(depth - 1);
    this.add.rectangle(x, y, 31, 52, item.fill ?? COLORS.wallDark, 1).setStrokeStyle(2, COLORS.ink, 0.85).setDepth(depth);
    this.add.rectangle(x - 4, y - 6, 16, 30, COLORS.ink, 0.75).setDepth(depth + 1);
    this.add.rectangle(x - 8, y - 14, 5, 5, COLORS.coral, 1).setDepth(depth + 2);
    this.add.rectangle(x - 1, y - 14, 5, 5, COLORS.mint, 1).setDepth(depth + 2);
    this.add.rectangle(x - 8, y - 5, 5, 5, COLORS.paper, 1).setDepth(depth + 2);
    this.add.rectangle(x - 1, y - 5, 5, 5, COLORS.blue, 1).setDepth(depth + 2);
    this.add.rectangle(x + 10, y - 8, 5, 22, COLORS.sky, 1).setDepth(depth + 1);
    this.add.rectangle(x, y + 20, 18, 4, COLORS.ink, 0.55).setDepth(depth + 1);
  }

  drawRollingCart(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 15;

    this.add.rectangle(x, y - 3, 28, 17, COLORS.wall, 1).setStrokeStyle(2, COLORS.ink, 0.75).setDepth(depth);
    this.add.rectangle(x - 3, y - 8, 17, 5, COLORS.paper, 1).setDepth(depth + 1);
    this.add.rectangle(x + 5, y, 12, 4, COLORS.blue, 0.85).setDepth(depth + 1);
    this.add.rectangle(x - 9, y + 9, 5, 5, COLORS.ink, 0.75).setDepth(depth + 1);
    this.add.rectangle(x + 9, y + 9, 5, 5, COLORS.ink, 0.75).setDepth(depth + 1);
  }

  drawDeskLamp(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 22;

    this.add.rectangle(x - 2, y + 8, 17, 4, COLORS.ink, 0.8).setDepth(depth);
    this.add.rectangle(x, y, 3, 14, COLORS.wallDark, 1).setDepth(depth + 1);
    this.add.rectangle(x + 7, y - 8, 12, 8, item.fill ?? COLORS.sky, 1).setStrokeStyle(1, COLORS.ink, 0.7).setDepth(depth + 2);
    this.add.rectangle(x + 11, y - 4, 12, 2, COLORS.paper, 0.75).setDepth(depth + 3);
  }

  drawTrashBin(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 10;

    this.add.rectangle(x, y + 4, 17, 18, COLORS.wallDark, 1).setStrokeStyle(2, COLORS.ink, 0.78).setDepth(depth);
    this.add.rectangle(x, y - 6, 20, 4, COLORS.ink, 0.82).setDepth(depth + 1);
    this.add.rectangle(x - 4, y + 4, 2, 12, COLORS.floorLine, 0.55).setDepth(depth + 1);
    this.add.rectangle(x + 4, y + 4, 2, 12, COLORS.floorLine, 0.55).setDepth(depth + 1);
  }

  drawStackedBoxes(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 12;

    this.add.rectangle(x - 7, y + 7, 18, 15, COLORS.brass, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth);
    this.add.rectangle(x + 9, y + 4, 17, 18, COLORS.paper, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 1);
    this.add.rectangle(x, y - 10, 22, 14, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 2);
    this.add.rectangle(x, y - 12, 9, 2, COLORS.floorLine, 0.75).setDepth(depth + 3);
    this.add.rectangle(x + 8, y + 2, 7, 2, COLORS.floorLine, 0.75).setDepth(depth + 3);
  }

  drawLowSeat(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 8;

    this.add.rectangle(x, y + 2, 23, 12, item.fill ?? COLORS.blue, 1).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth);
    this.add.rectangle(x, y - 7, 19, 6, item.back ?? COLORS.wallDark, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth - 1);
    this.add.rectangle(x - 6, y + 10, 4, 6, COLORS.ink, 0.62).setDepth(depth - 1);
    this.add.rectangle(x + 6, y + 10, 4, 6, COLORS.ink, 0.62).setDepth(depth - 1);
  }

  drawFloorMat(item) {
    const width = item.width ?? 3;
    const height = item.height ?? 1;
    const [x, y] = this.tileCenter(item.x + (width - 1) / 2, item.y + (height - 1) / 2);
    const depth = item.depth ?? 101;
    const pixelWidth = width * TILE_SIZE - 8;
    const pixelHeight = height * TILE_SIZE - 8;

    this.add.rectangle(x, y, pixelWidth, pixelHeight, item.fill ?? COLORS.floorLine, 0.72).setDepth(depth);
    this.add.rectangle(x, y, pixelWidth - 8, pixelHeight - 8, item.detail ?? COLORS.wall, 0.35).setDepth(depth + 1);
    this.add.rectangle(x - pixelWidth / 4, y, 4, pixelHeight - 10, item.line ?? COLORS.sky, 0.55).setDepth(depth + 2);
    this.add.rectangle(x + pixelWidth / 4, y, 4, pixelHeight - 10, item.line ?? COLORS.sky, 0.55).setDepth(depth + 2);
  }

  drawConcertStage(item) {
    const left = this.room.originX + item.x * TILE_SIZE;
    const top = this.room.originY + item.y * TILE_SIZE;
    const width = item.width * TILE_SIZE;
    const height = item.height * TILE_SIZE;
    const centerX = left + width / 2;
    const depth = item.depth ?? 118;

    if (this.textures.exists("concert-stage")) {
      this.add
        .image(centerX, top + height / 2 + 2, "concert-stage")
        .setDisplaySize(width + 24, height + 72)
        .setDepth(depth);
      return;
    }

    this.add.rectangle(centerX + 6, top + height / 2 + 7, width - 4, height - 2, COLORS.ink, 0.38).setDepth(depth - 2);
    this.add.rectangle(centerX, top + height / 2, width - 8, height - 6, COLORS.clubWallDark, 1).setStrokeStyle(2, COLORS.clubFloorLine, 0.9).setDepth(depth);
    this.add.rectangle(centerX, top + 25, width - 28, 54, COLORS.stagePurple, 0.45).setDepth(depth + 1);

    for (let strip = 0; strip < 9; strip += 1) {
      const x = left + 28 + strip * 38;
      this.add.rectangle(x, top + 36, 18, 64, strip % 2 === 0 ? COLORS.clubWall : COLORS.stagePurple, 0.5).setDepth(depth + 2);
      this.add.rectangle(x + 8, top + 36, 2, 64, COLORS.neonPink, 0.12).setDepth(depth + 3);
    }

    this.add.rectangle(centerX, top + 15, width - 34, 6, COLORS.ink, 0.96).setDepth(depth + 4);
    for (let light = 0; light < 7; light += 1) {
      const lightX = left + 45 + light * 45;
      const lamp = this.add.circle(lightX, top + 17, 7, COLORS.ink, 1).setDepth(depth + 5);
      const bulb = this.add.circle(lightX, top + 18, 3, light % 2 === 0 ? COLORS.neonPink : COLORS.stagePurple, 1).setDepth(depth + 6);
      const beam = this.add.triangle(lightX, top + 24, 0, 0, -18, 58, 18, 58, light % 2 === 0 ? COLORS.neonPink : COLORS.stagePurple, 0.16).setDepth(depth + 1);

      this.tweens.add({
        targets: [bulb, beam],
        alpha: { from: light % 2 === 0 ? 0.55 : 0.35, to: light % 2 === 0 ? 0.95 : 0.7 },
        duration: 900 + light * 120,
        yoyo: true,
        repeat: -1,
      });
      lamp.setStrokeStyle(1, COLORS.clubFloorLine, 0.8);
    }

    this.add.rectangle(centerX, top + height - 19, width - 12, 22, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.78).setDepth(depth + 8);
    this.add.rectangle(centerX, top + height - 33, width - 16, 8, COLORS.clubFloorLine, 0.8).setDepth(depth + 9);
    this.add.rectangle(centerX, top + height - 4, width - 10, 6, COLORS.ink, 0.8).setDepth(depth + 10);

    this.drawAmpStack(left + 28, top + 76, depth + 14);
    this.drawAmpStack(left + width - 34, top + 75, depth + 14);
    this.drawDrumKit(left + width * 0.42, top + 78, depth + 15);
    this.drawMicrophone(left + width * 0.57, top + 77, depth + 18);
  }

  drawAmpStack(x, y, depth) {
    this.add.rectangle(x, y + 18, 30, 48, COLORS.ink, 1).setDepth(depth);
    this.add.rectangle(x, y + 2, 24, 20, COLORS.clubWall, 1).setStrokeStyle(2, COLORS.clubFloorLine, 0.72).setDepth(depth + 1);
    this.add.rectangle(x, y + 28, 28, 28, COLORS.clubWall, 1).setStrokeStyle(2, COLORS.clubFloorLine, 0.72).setDepth(depth + 1);
    this.add.circle(x, y + 27, 8, COLORS.ink, 0.8).setDepth(depth + 2);
    this.add.circle(x, y + 27, 4, COLORS.clubFloorLine, 0.6).setDepth(depth + 3);
  }

  drawDrumKit(x, y, depth) {
    this.add.circle(x, y + 8, 19, COLORS.paper, 1).setStrokeStyle(3, COLORS.ink, 0.86).setDepth(depth);
    this.add.text(x - 12, y + 1, "P//", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#303050",
    }).setDepth(depth + 1);
    this.add.circle(x - 23, y - 8, 10, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.78).setDepth(depth + 1);
    this.add.circle(x + 22, y - 8, 10, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.78).setDepth(depth + 1);
    this.add.rectangle(x - 32, y - 20, 25, 4, COLORS.amber, 1).setStrokeStyle(1, COLORS.ink, 0.65).setDepth(depth + 2);
    this.add.rectangle(x + 32, y - 21, 25, 4, COLORS.amber, 1).setStrokeStyle(1, COLORS.ink, 0.65).setDepth(depth + 2);
  }

  drawStagePlayer(x, y, depth, shirt, hair) {
    this.add.rectangle(x, y + 21, 23, 7, COLORS.ink, 0.32).setDepth(depth - 1);
    this.add.rectangle(x, y - 15, 16, 17, COLORS.skin, 1).setStrokeStyle(2, COLORS.ink, 0.88).setDepth(depth);
    this.add.rectangle(x, y + 4, 18, 27, shirt, 1).setStrokeStyle(2, COLORS.ink, 0.88).setDepth(depth);
    this.add.rectangle(x - 8, y - 24, 20, 10, hair, 1).setDepth(depth + 1);
    this.add.rectangle(x + 3, y + 4, 34, 8, COLORS.wood, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 2);
    this.add.circle(x + 21, y + 3, 7, COLORS.amber, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 3);
    this.add.rectangle(x - 6, y + 22, 4, 14, COLORS.ink, 0.8).setDepth(depth + 1);
    this.add.rectangle(x + 7, y + 22, 4, 14, COLORS.ink, 0.8).setDepth(depth + 1);
  }

  drawMicrophone(x, y, depth) {
    this.add.rectangle(x, y + 12, 3, 35, COLORS.ink, 0.9).setDepth(depth);
    this.add.rectangle(x, y + 30, 22, 3, COLORS.ink, 0.9).setDepth(depth);
    this.add.circle(x + 2, y - 8, 6, COLORS.paper, 1).setStrokeStyle(2, COLORS.ink, 0.88).setDepth(depth + 1);
  }

  drawBackstageBooth(item) {
    const left = this.room.originX + item.x * TILE_SIZE;
    const top = this.room.originY + item.y * TILE_SIZE;
    const width = item.width * TILE_SIZE;
    const height = item.height * TILE_SIZE;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const depth = item.depth ?? 123;

    this.add.rectangle(centerX, centerY, width - 8, height - 6, COLORS.clubWall, 1).setStrokeStyle(2, COLORS.clubFloorLine, 0.82).setDepth(depth);
    this.add.rectangle(centerX, top + 20, width - 34, 21, COLORS.ink, 0.92).setStrokeStyle(2, COLORS.wood, 0.85).setDepth(depth + 1);
    this.add.text(centerX - 44, top + 11, "BACKSTAGE", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#fff0a8",
    }).setDepth(depth + 2);
    this.add.rectangle(centerX, top + 68, 76, 25, COLORS.clubWallDark, 1).setStrokeStyle(2, COLORS.ink, 0.75).setDepth(depth + 2);
    this.add.rectangle(centerX - 23, top + 58, 26, 16, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 3);
    this.add.rectangle(centerX + 23, top + 58, 26, 16, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 3);
    this.add.rectangle(left + width - 21, top + 52, 16, 40, COLORS.clubWallDark, 1).setStrokeStyle(2, COLORS.clubFloorLine, 0.62).setDepth(depth + 2);
    this.add.rectangle(left + 20, top + 48, 20, 22, COLORS.brick, 0.7).setStrokeStyle(2, COLORS.ink, 0.62).setDepth(depth + 2);
  }

  drawBarCounter(item) {
    const left = this.room.originX + item.x * TILE_SIZE;
    const top = this.room.originY + item.y * TILE_SIZE;
    const width = item.width * TILE_SIZE;
    const height = item.height * TILE_SIZE;
    const centerX = left + width / 2;
    const depth = item.depth ?? 126;

    this.add.rectangle(centerX, top + 23, width - 10, 42, COLORS.clubWall, 1).setStrokeStyle(2, COLORS.wood, 0.9).setDepth(depth);
    this.add.rectangle(centerX, top + 41, width - 18, 8, COLORS.neonPink, 0.42).setDepth(depth + 1);

    for (let shelf = 0; shelf < 2; shelf += 1) {
      const shelfY = top + 26 + shelf * 17;
      this.add.rectangle(centerX, shelfY + 9, width - 24, 4, COLORS.wood, 1).setDepth(depth + 2);
      for (let bottle = 0; bottle < 9; bottle += 1) {
        const bottleX = left + 18 + bottle * 14;
        const color = [COLORS.amber, COLORS.paper, COLORS.stagePurple, COLORS.coral][(bottle + shelf) % 4];
        this.add.rectangle(bottleX, shelfY, 5, 15, color, 1).setStrokeStyle(1, COLORS.ink, 0.55).setDepth(depth + 3);
        this.add.rectangle(bottleX, shelfY - 9, 3, 6, COLORS.clubFloorLine, 1).setDepth(depth + 4);
      }
    }

    this.add.rectangle(left + 43, top + 4, 55, 24, COLORS.ink, 0.86).setStrokeStyle(2, COLORS.wood, 0.9).setDepth(depth + 4);
    this.add.text(left + 22, top - 5, "BIERE", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#f0a048",
    }).setDepth(depth + 5);
    this.add.rectangle(left + width - 43, top + 4, 55, 24, COLORS.ink, 0.86).setStrokeStyle(2, COLORS.wood, 0.9).setDepth(depth + 4);
    this.add.text(left + width - 65, top - 5, "SHOTS", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#f0a048",
    }).setDepth(depth + 5);

    this.add.rectangle(centerX, top + height - 24, width - 6, 42, COLORS.wood, 1).setStrokeStyle(3, COLORS.ink, 0.88).setDepth(depth + 8);
    this.add.rectangle(centerX, top + height - 43, width - 3, 8, COLORS.amber, 0.5).setDepth(depth + 9);
    for (let sticker = 0; sticker < 13; sticker += 1) {
      const stickerX = left + 12 + sticker * 12;
      this.add.rectangle(stickerX, top + height - 19 - (sticker % 2) * 7, 6, 4, [COLORS.neonPink, COLORS.amber, COLORS.stagePurple, COLORS.paper][sticker % 4], 0.8).setDepth(depth + 10);
    }
    this.add.rectangle(left + width - 14, top + 15, 28, 38, COLORS.neonPink, 0.22).setStrokeStyle(2, COLORS.neonPink, 0.7).setDepth(depth + 6);
  }

  drawStreetFacade(item) {
    const left = this.room.originX + item.x * TILE_SIZE;
    const top = this.room.originY + item.y * TILE_SIZE;
    const width = item.width * TILE_SIZE;
    const depth = item.depth ?? 112;

    if (this.textures.exists("concert-facades")) {
      this.add
        .image(left + width / 2, top + 48, "concert-facades")
        .setDisplaySize(width - 18, 142)
        .setDepth(depth);
      return;
    }

    this.add.rectangle(left + width / 2, top + 35, width, 70, COLORS.sidewalk, 1).setDepth(depth);
    this.add.rectangle(left + 100, top + 17, 190, 60, COLORS.brick, 1).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth + 1);
    this.add.rectangle(left + 96, top + 30, 172, 22, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 2);
    this.add.text(left + 38, top + 22, "SMOOTHIES", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#fff0a8",
    }).setDepth(depth + 3);

    this.add.rectangle(left + 372, top + 13, 190, 44, COLORS.greenAwning, 1).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth + 1);
    this.add.text(left + 324, top + 5, "PUNK PARADISE", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#fff0a8",
    }).setDepth(depth + 3);
    this.add.rectangle(left + 372, top + 54, 116, 58, COLORS.clubWallDark, 1).setStrokeStyle(3, COLORS.ink, 0.86).setDepth(depth + 2);
    this.add.rectangle(left + 346, top + 55, 3, 48, COLORS.paper, 0.25).setDepth(depth + 3);
    this.add.rectangle(left + 396, top + 55, 3, 48, COLORS.paper, 0.25).setDepth(depth + 3);
    this.add.rectangle(left + 372, top + 60, 92, 8, COLORS.neonPink, 0.18).setDepth(depth + 3);

    this.add.rectangle(left + width - 114, top + 17, 190, 60, COLORS.wall, 0.76).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth + 1);
    this.add.rectangle(left + width - 114, top + 30, 176, 22, COLORS.greenAwning, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 2);
    this.add.text(left + width - 177, top + 22, "FRESH", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#f0a048",
    }).setDepth(depth + 3);
    this.add.text(left + width - 93, top + 22, "FRESH", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#f0a048",
    }).setDepth(depth + 3);

    for (let post = 0; post < 7; post += 1) {
      const postX = left + 42 + post * 110;
      this.add.rectangle(postX, top + 82, 5, 28, COLORS.ink, 0.9).setDepth(depth + 4);
      this.add.rectangle(postX, top + 67, 11, 4, COLORS.ink, 0.9).setDepth(depth + 4);
    }

    this.add.circle(left + 218, top + 67, 9, COLORS.amber, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 5);
    this.add.rectangle(left + 218, top + 88, 4, 40, COLORS.ink, 0.9).setDepth(depth + 4);
  }

  drawRoadStrip(item) {
    const [x, y] = this.tileCenter(item.x + (item.width - 1) / 2, item.y);
    const width = item.width * TILE_SIZE;
    const depth = item.depth ?? 108;

    this.add.rectangle(x, y + 11, width, 54, COLORS.asphalt, 1).setDepth(depth);
    this.add.rectangle(x, y - 16, width, 4, COLORS.ink, 0.52).setDepth(depth + 1);
    for (let dash = 0; dash < 8; dash += 1) {
      this.add.rectangle(x - width / 2 + 48 + dash * 92, y + 18, 42, 4, COLORS.floorLine, 0.5).setDepth(depth + 2);
    }
    for (let stripe = 0; stripe < 5; stripe += 1) {
      this.add.rectangle(x - 70 + stripe * 28, y - 2, 18, 34, COLORS.paper, 0.42).setDepth(depth + 2);
    }
  }

  drawSideServiceWall(item) {
    const left = this.room.originX + item.x * TILE_SIZE;
    const top = this.room.originY + item.y * TILE_SIZE;
    const width = item.width * TILE_SIZE;
    const height = item.height * TILE_SIZE;
    const depth = item.depth ?? 121;

    this.add.rectangle(left + width / 2, top + height / 2, width - 8, height - 4, COLORS.wallDark, 0.86).setStrokeStyle(2, COLORS.ink, 0.78).setDepth(depth);
    for (let poster = 0; poster < 8; poster += 1) {
      const posterX = left + 17 + (poster % 2) * 30;
      const posterY = top + 20 + Math.floor(poster / 2) * 38;
      this.add.rectangle(posterX, posterY, 18, 24, [COLORS.neonPink, COLORS.amber, COLORS.stagePurple, COLORS.paper][poster % 4], 0.55).setStrokeStyle(1, COLORS.ink, 0.6).setDepth(depth + 1);
      this.add.rectangle(posterX + 2, posterY + 6, 10, 3, COLORS.ink, 0.45).setDepth(depth + 2);
    }
    this.add.rectangle(left + 20, top + height - 28, 23, 35, COLORS.wood, 0.82).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 1);
    this.add.rectangle(left + 60, top + height - 39, 28, 32, COLORS.clubWallDark, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth + 1);
  }

  drawTableSet(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 8;

    this.add.circle(x, y, 24, COLORS.stagePurple, 1).setStrokeStyle(3, COLORS.ink, 0.82).setDepth(depth);
    this.add.circle(x, y, 5, COLORS.paper, 0.7).setDepth(depth + 1);
    this.add.rectangle(x - 41, y, 18, 25, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth - 1);
    this.add.rectangle(x + 41, y, 18, 25, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth - 1);
    this.add.rectangle(x, y + 39, 25, 18, COLORS.plum, 1).setStrokeStyle(2, COLORS.ink, 0.72).setDepth(depth - 1);
  }

  drawRightWallBar(item) {
    const left = this.room.originX + item.x * TILE_SIZE;
    const top = this.room.originY + item.y * TILE_SIZE;
    const width = item.width * TILE_SIZE;
    const height = item.height * TILE_SIZE;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const depth = item.depth ?? 124;
    const spriteKey = item.textureKey ?? "concert-bar-right";

    if (this.textures.exists(spriteKey)) {
      this.add
        .image(centerX + (item.spriteOffsetX ?? 0), centerY + (item.spriteOffsetY ?? 0), spriteKey)
        .setOrigin(0.5)
        .setDisplaySize(item.spriteWidth ?? width, item.spriteHeight ?? height)
        .setDepth(item.spriteDepth ?? 360);
      return;
    }

    this.add.rectangle(centerX + 3, centerY + 5, width - 5, height - 4, COLORS.ink, 0.32).setDepth(depth - 1);
    this.add.rectangle(centerX, centerY, width - 10, height - 8, COLORS.clubWall, 1).setStrokeStyle(2, COLORS.wood, 0.9).setDepth(depth);
    this.add.rectangle(left + 15, centerY, 20, height - 20, COLORS.wood, 1).setStrokeStyle(2, COLORS.ink, 0.85).setDepth(depth + 6);
    this.add.rectangle(left + 29, centerY, 4, height - 26, COLORS.amber, 0.52).setDepth(depth + 7);

    for (let shelf = 0; shelf < 4; shelf += 1) {
      const shelfY = top + 28 + shelf * 56;
      this.add.rectangle(centerX + 10, shelfY + 9, width - 52, 4, COLORS.wood, 1).setDepth(depth + 1);

      for (let bottle = 0; bottle < 4; bottle += 1) {
        const bottleX = centerX - 4 + bottle * 14;
        const color = [COLORS.amber, COLORS.paper, COLORS.stagePurple, COLORS.coral][(bottle + shelf) % 4];
        this.add.rectangle(bottleX, shelfY, 5, 15, color, 1).setStrokeStyle(1, COLORS.ink, 0.55).setDepth(depth + 2);
        this.add.rectangle(bottleX, shelfY - 9, 3, 6, COLORS.clubFloorLine, 1).setDepth(depth + 3);
      }
    }

    this.add.rectangle(centerX + 10, top + 20, width - 48, 24, COLORS.ink, 0.9).setStrokeStyle(2, COLORS.wood, 0.9).setDepth(depth + 4);
    this.add.text(centerX - 11, top + 11, "BAR", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#f0a048",
    }).setDepth(depth + 5);
  }

  drawAudienceBack(item) {
    const [x, y] = this.tileCenter(item.x, item.y);
    const depth = item.depth ?? y + 7;
    const jacket = item.jacket ?? COLORS.clubWallDark;
    const hair = item.hair ?? COLORS.berry;

    this.add.rectangle(x, y + 15, 21, 6, COLORS.ink, 0.28).setDepth(depth - 1);
    this.add.rectangle(x - 9, y + 1, 5, 14, COLORS.ink, 0.7).setDepth(depth);
    this.add.rectangle(x + 9, y + 1, 5, 14, COLORS.ink, 0.7).setDepth(depth);
    this.add.rectangle(x, y - 3, 19, 18, jacket, 1).setStrokeStyle(2, COLORS.ink, 0.78).setDepth(depth + 1);
    this.add.rectangle(x, y - 19, 18, 14, hair, 1).setStrokeStyle(2, COLORS.ink, 0.82).setDepth(depth + 2);
    this.add.rectangle(x - 5, y + 11, 4, 9, COLORS.ink, 0.86).setDepth(depth + 1);
    this.add.rectangle(x + 5, y + 11, 4, 9, COLORS.ink, 0.86).setDepth(depth + 1);
  }

  createLockedDoors() {
    this.lockedDoors = (this.level.lockedDoors ?? []).map((door) => {
      const tiles = [];
      const panels = [];
      const knobs = [];
      const floorPatches = [];

      for (let y = door.y; y < door.y + door.height; y += 1) {
        for (let x = door.x; x < door.x + door.width; x += 1) {
          tiles.push({ x, y });

          const world = this.collisionMap.gridToWorld(x, y);
          const floorPatch = this.add
            .rectangle(world.x, world.y, TILE_SIZE, TILE_SIZE, this.level.floorColor ?? COLORS.floor, 1)
            .setStrokeStyle(1, COLORS.floorLine, 0.52)
            .setDepth(96)
            .setVisible(Boolean(door.open));

          const panel = this.add
            .rectangle(world.x, world.y, TILE_SIZE - 6, TILE_SIZE - 4, door.fill ?? COLORS.plum, 1)
            .setStrokeStyle(2, door.stroke ?? COLORS.ink, 0.92)
            .setDepth(world.y + 8)
            .setVisible(!door.open);

          const knob = this.add
            .circle(world.x + 7, world.y, 3, door.knobColor ?? COLORS.brass, 1)
            .setDepth(world.y + 9)
            .setVisible(!door.open);

          panels.push(panel);
          knobs.push(knob);
          floorPatches.push(floorPatch);
        }
      }

      const labelWorld = this.collisionMap.gridToWorld(door.x + (door.width - 1) / 2, door.y);
      const label = this.add
        .text(labelWorld.x, labelWorld.y - 25, door.label ?? "Porte", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#fff0a8",
          backgroundColor: "#303050",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(labelWorld.y + 10)
        .setVisible(!door.open && Boolean(door.label));

      return {
        ...door,
        open: Boolean(door.open),
        gridX: door.x + (door.width - 1) / 2,
        gridY: door.y + (door.height - 1) / 2,
        tiles,
        panels,
        knobs,
        floorPatches,
        label,
      };
    });
  }

  drawTileRect(gridX, gridY, width, height, fill, stroke, alpha = 1) {
    const x = this.room.originX + gridX * TILE_SIZE + (width * TILE_SIZE) / 2;
    const y = this.room.originY + gridY * TILE_SIZE + (height * TILE_SIZE) / 2;

    this.add
      .rectangle(x + 4, y + 4, width * TILE_SIZE - 4, height * TILE_SIZE - 4, COLORS.ink, 0.32)
      .setDepth(y - 1);

    return this.add
      .rectangle(x, y, width * TILE_SIZE - 4, height * TILE_SIZE - 4, fill, alpha)
      .setStrokeStyle(2, stroke, 0.9)
      .setDepth(y);
  }

  drawHud() {
    this.add
      .rectangle(256, 55, 420, 72, COLORS.ink, 0.88)
      .setStrokeStyle(2, COLORS.wall, 0.72)
      .setScrollFactor(0)
      .setDepth(890);
    this.add
      .rectangle(GAME_SIZE.width - 164, 58, 260, 78, COLORS.ink, 0.78)
      .setStrokeStyle(2, COLORS.floorLine, 0.82)
      .setScrollFactor(0)
      .setDepth(890);
    this.add
      .rectangle(GAME_SIZE.width / 2, GAME_SIZE.height - 35, GAME_SIZE.width - 110, 34, COLORS.ink, 0.82)
      .setStrokeStyle(2, COLORS.wall, 0.52)
      .setScrollFactor(0)
      .setDepth(890);

    this.add.text(58, 26, this.level.title, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#d8a038",
    }).setScrollFactor(0).setDepth(900);

    this.objectiveTexts = {};

    this.objectiveTexts.playerA = this.add.text(58, 52, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#70e040",
      wordWrap: { width: 380 },
    }).setScrollFactor(0).setDepth(900);

    this.objectiveTexts.playerL = this.add.text(522, 52, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#d8a038",
      wordWrap: { width: 380 },
    }).setScrollFactor(0).setDepth(900);

    this.createLoveGauges();

    this.commonObjectiveText = this.add.text(58, 52, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#fff0a8",
      wordWrap: { width: GAME_SIZE.width - 116 },
    }).setScrollFactor(0).setDepth(902).setVisible(false);

    this.add.text(58, GAME_SIZE.height - 44, "Alberto: fleches/P   Lucie: ZQSD/E   Retour: Esc", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#fff0a8",
    }).setScrollFactor(0).setDepth(900);

    if (this.level.controlsIntro) {
      this.showControlsIntro();
    }
  }

  showControlsIntro() {
    const lines = this.level.controlsIntro;
    const group = this.add.group();
    const panel = this.add
      .rectangle(GAME_SIZE.width / 2, 148, 612, 126, COLORS.ink, 0.94)
      .setStrokeStyle(2, COLORS.paper, 0.86)
      .setScrollFactor(0)
      .setDepth(1100);
    const text = this.add
      .text(GAME_SIZE.width / 2 - 276, 104, lines.join("\n"), {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff0a8",
        lineSpacing: 8,
        wordWrap: { width: 552 },
      })
      .setScrollFactor(0)
      .setDepth(1101);

    group.addMultiple([panel, text]);

    this.time.delayedCall(5600, () => {
      this.tweens.add({
        targets: [panel, text],
        alpha: 0,
        duration: 420,
        onComplete: () => {
          panel.destroy();
          text.destroy();
        },
      });
    });
  }

  createLoveGauges() {
    const relationship = this.level.relationship;

    if (!relationship) {
      return;
    }

    this.loveMax = relationship.max ?? 100;
    this.loveValues = {
      playerA: relationship.initial?.playerA ?? 0,
      playerL: relationship.initial?.playerL ?? 0,
    };
    this.loveGauges = {};

    this.loveGauges.playerA = this.createLoveGauge({
      x: 58,
      y: 92,
      width: 156,
      label: relationship.labels?.playerA ?? "Amour Alberto",
      color: relationship.colors?.playerA ?? "#70e040",
    });
    this.loveGauges.playerL = this.createLoveGauge({
      x: GAME_SIZE.width - 214,
      y: 92,
      width: 156,
      label: relationship.labels?.playerL ?? "Amour Lucie",
      color: relationship.colors?.playerL ?? "#d8a038",
    });

    this.updateLoveGauges();
  }

  createLoveGauge(options) {
    const label = this.add
      .text(options.x, options.y - 16, options.label, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: options.color,
      })
      .setScrollFactor(0)
      .setDepth(910);
    const back = this.add
      .rectangle(options.x, options.y, options.width, 12, COLORS.ink, 0.92)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, COLORS.wall, 0.55)
      .setScrollFactor(0)
      .setDepth(910);
    const fill = this.add
      .rectangle(options.x + 3, options.y, 0, 6, this.hexColorStringToNumber(options.color), 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(911);

    return { ...options, back, fill, label };
  }

  hexColorStringToNumber(color) {
    return Number.parseInt(color.replace("#", ""), 16);
  }

  createNpcs() {
    this.npcs = (this.level.npcs ?? []).map((npc) => {
      const world = this.collisionMap.gridToWorld(npc.gridX, npc.gridY);
      const sprite = this.add.sprite(world.x, world.y, npc.texture ?? "colleague-b").setDepth(world.y);
      sprite.setOrigin(0.5, 0.78);

      if (npc.tint) {
        sprite.setTint(npc.tint);
      }

      const label = this.add
        .text(world.x, world.y - 34, npc.label ?? "", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#fff0a8",
          backgroundColor: "#303050",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(world.y + 1)
        .setVisible(Boolean(npc.label));

      return { ...npc, sprite, label };
    });
  }

  createPlayers() {
    this.players = this.level.players.map(
      (player) =>
        new GridPlayerController(this, {
          ...player,
          grid: this.collisionMap,
        }),
    );
  }

  createInteractions() {
    this.interactions = this.level.interactions.map((interaction) => this.createInteraction(interaction));
  }

  createInteraction(options) {
    const { id, gridX, gridY, label, tint, dialogues } = options;
    const world = this.collisionMap.gridToWorld(gridX, gridY);
    const marker = this.add.image(world.x, world.y, "interaction-marker").setTint(tint).setDepth(350);
    const text = this.add
      .text(world.x, world.y - 28, label, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#303050",
        backgroundColor: "#d8a038",
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(350)
      .setVisible(false);

    return { id, gridX, gridY, label, marker, text, dialogues };
  }

  createObjectives() {
    this.objectiveStates = {};
    this.objectiveHighlights = {};

    for (const [playerId, objective] of Object.entries(this.level.objectives ?? {})) {
      this.objectiveStates[playerId] = {
        index: 0,
        completed: false,
        objective,
      };

      const highlight = this.add
        .text(0, 0, "!", {
        fontFamily: "monospace",
        fontSize: "18px",
          color: "#303050",
          backgroundColor: objective.color ?? "#d8a038",
          padding: { x: 7, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setDepth(700)
        .setVisible(false);

      this.objectiveHighlights[playerId] = highlight;
    }

    const createCommonObjectiveHighlight = (color) =>
      this.add
        .text(0, 0, "!", {
        fontFamily: "monospace",
        fontSize: "18px",
          color: "#303050",
          backgroundColor: color,
          padding: { x: 7, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setDepth(700)
        .setVisible(false);

    this.commonObjectiveHighlights = [
      createCommonObjectiveHighlight("#70e040"),
      createCommonObjectiveHighlight("#d8a038"),
    ];
    this.commonObjectiveHighlight = this.commonObjectiveHighlights[0];

    this.updateObjectiveTexts();
    this.updateObjectiveHighlights();
  }

  handleInteraction(player, input) {
    if (!input.isInteractPressed()) {
      return;
    }

    if (this.speechBubbles.isVisible(player)) {
      this.speechBubbles.hide(player);
      return;
    }

    if (player.isMoving) {
      return;
    }

    const targetTile = player.facingTile();
    const otherPlayer = this.players.find((candidate) => candidate !== player);

    if (otherPlayer && targetTile.x === otherPlayer.gridX && targetTile.y === otherPlayer.gridY) {
      return;
    }

    const interaction = this.findInteractionAt(targetTile.x, targetTile.y, player);

    if (interaction && this.handleCustomInteraction?.(player, interaction)) {
      return;
    }

    if (interaction?.dialogues[player.id]) {
      const objectiveLine = this.advanceObjectiveIfTarget(player, interaction.id);
      this.showInteractionDialogue(player, objectiveLine ?? interaction.dialogues[player.id], {
        forceDialog: Boolean(objectiveLine),
      });
      return;
    }

    const npc = this.findNpcAt(targetTile.x, targetTile.y);

    if (npc && this.handleCustomNpcInteraction?.(player, npc)) {
      return;
    }

    if (npc?.dialogues?.[player.id]) {
      const objectiveLine = this.advanceObjectiveIfTarget(player, npc.id);
      this.showInteractionDialogue(player, objectiveLine ?? npc.dialogues[player.id], {
        forceDialog: Boolean(objectiveLine),
      });
    }
  }

  showInteractionDialogue(player, dialogue, options = {}) {
    if (Array.isArray(dialogue) || options.forceDialog) {
      this.showDialogue(Array.isArray(dialogue) ? dialogue : [dialogue]);
      return;
    }

    this.speechBubbles.show(player, dialogue);
  }

  showDialogue(lines, onComplete, options = {}) {
    for (const player of this.players ?? []) {
      this.speechBubbles.hide(player);
    }

    this.dialogSystem.show(Array.isArray(lines) ? lines : [lines], onComplete, options);
  }

  findInteractionAt(gridX, gridY, player = null) {
    const matches = this.interactions.filter((interaction) => interaction.gridX === gridX && interaction.gridY === gridY);

    if (matches.length <= 1) {
      return matches[0] ?? null;
    }

    const preferredTargetIds = [
      this.commonObjective?.targetId,
      player ? this.currentObjectiveStep(player.id)?.targetId : null,
    ].filter(Boolean);

    for (const targetId of preferredTargetIds) {
      const match = matches.find((interaction) => interaction.id === targetId);

      if (match) {
        return match;
      }
    }

    return matches[0];
  }

  findNpcAt(gridX, gridY) {
    return this.npcs.find((npc) => npc.gridX === gridX && npc.gridY === gridY);
  }

  advanceObjectiveIfTarget(player, targetId) {
    const state = this.objectiveStates?.[player.id];

    if (!state || state.completed || state.pending) {
      return null;
    }

    const step = state.objective.steps[state.index];

    if (!step || step.targetId !== targetId) {
      return null;
    }

    state.pending = true;

    if (step.setFlag) {
      this[step.setFlag] = true;
    }

    this.applyLoveGain(step.loveGain, player.id);
    this.flashObjectiveText(player.id, () => {
      state.index += 1;
      state.completed = state.index >= state.objective.steps.length;
      state.pending = false;
      this.updateObjectiveTexts();
      this.updateObjectiveHighlights();
      this.handleObjectivesCompleteIfNeeded();
    });

    return step.dialogue ?? null;
  }

  flashObjectiveText(playerId, onComplete) {
    const text = this.objectiveTexts?.[playerId];

    if (!text) {
      onComplete();
      return;
    }

    this.tweens.add({
      targets: text,
      alpha: 0.25,
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        text.setAlpha(1);
        onComplete();
      },
    });
  }

  currentObjectiveStep(playerId) {
    const state = this.objectiveStates?.[playerId];

    if (!state || state.completed) {
      return null;
    }

    return state.objective.steps[state.index] ?? null;
  }

  updateObjectiveTexts() {
    if (this.commonObjective) {
      for (const text of Object.values(this.objectiveTexts ?? {})) {
        text.setVisible(false);
      }

      this.commonObjectiveText
        ?.setText(`Objectif commun: ${this.commonObjective.text}`)
        .setVisible(true);
      return;
    }

    this.commonObjectiveText?.setVisible(false);

    for (const [playerId, state] of Object.entries(this.objectiveStates ?? {})) {
      const text = this.objectiveTexts?.[playerId];

      if (!text) {
        continue;
      }

      text.setVisible(true);

      if (state.completed) {
        text.setText(`${state.objective.title}: termine`);
        continue;
      }

      const step = state.objective.steps[state.index];
      text.setText(`${state.objective.title}: ${step.hint}`);
    }
  }

  updateObjectiveHighlights() {
    for (const [playerId, highlight] of Object.entries(this.objectiveHighlights ?? {})) {
      const step = this.currentObjectiveStep(playerId);

      if (!step) {
        highlight.setVisible(false);
        continue;
      }

      const target = this.findTargetById(step.targetId);

      if (!target) {
        highlight.setVisible(false);
        continue;
      }

      const world = this.collisionMap.gridToWorld(target.gridX, target.gridY);
      highlight
        .setDepth(this.objectiveHighlightDepthForTarget(target))
        .setPosition(world.x + (step.offsetX ?? 0), world.y - 18 + (step.offsetY ?? 0))
        .setVisible(true);
    }

    this.updateCommonObjectiveHighlight();
  }

  objectiveHighlightDepthForTarget(target) {
    return Math.max(700, target.sprite?.depth ?? 0, target.label?.depth ?? 0, target.marker?.depth ?? 0) + 2;
  }

  setCommonObjective(text, targetId = null, options = {}) {
    this.commonObjective = { text, targetId, ...options };
    this.updateObjectiveTexts();
    this.updateObjectiveHighlights();
  }

  updateCommonObjectiveHighlight() {
    if (!this.commonObjectiveHighlights?.length) {
      return;
    }

    if (!this.commonObjective?.targetId) {
      this.hideCommonObjectiveHighlights();
      return;
    }

    const target = this.findTargetById(this.commonObjective.targetId);

    if (!target) {
      this.hideCommonObjectiveHighlights();
      return;
    }

    const world = this.collisionMap.gridToWorld(target.gridX, target.gridY);
    const markerOffsets = this.commonObjective.markerOffsets ?? [{ x: 0, y: 0 }];
    const depth = this.objectiveHighlightDepthForTarget(target);

    for (const [index, highlight] of this.commonObjectiveHighlights.entries()) {
      const offset = markerOffsets[index];

      if (!offset) {
        highlight.setVisible(false);
        continue;
      }

      highlight
        .setDepth(depth)
        .setPosition(world.x + (offset.x ?? 0), world.y - 18 + (offset.y ?? 0))
        .setVisible(true);
    }
  }

  hideCommonObjectiveHighlights() {
    for (const highlight of this.commonObjectiveHighlights ?? []) {
      highlight.setVisible(false);
    }
  }

  applyLoveGain(gain, sourcePlayerId) {
    if (!gain || !this.loveValues) {
      return;
    }

    const gains = typeof gain === "number" ? { [sourcePlayerId]: gain } : gain;

    for (const [playerId, amount] of Object.entries(gains)) {
      if (typeof this.loveValues[playerId] !== "number") {
        continue;
      }

      this.loveValues[playerId] = Phaser.Math.Clamp(this.loveValues[playerId] + amount, 0, this.loveMax);
      this.updateLoveGauge(playerId);
      this.pulseLoveGauge(playerId);
    }
  }

  updateLoveGauges() {
    for (const playerId of Object.keys(this.loveGauges ?? {})) {
      this.updateLoveGauge(playerId);
    }
  }

  updateLoveGauge(playerId) {
    const gauge = this.loveGauges?.[playerId];

    if (!gauge) {
      return;
    }

    const ratio = Phaser.Math.Clamp((this.loveValues[playerId] ?? 0) / this.loveMax, 0, 1);
    gauge.fill.setDisplaySize((gauge.width - 4) * ratio, 6);
  }

  pulseLoveGauge(playerId) {
    const gauge = this.loveGauges?.[playerId];

    if (!gauge) {
      return;
    }

    this.tweens.add({
      targets: [gauge.fill, gauge.label],
      alpha: 0.55,
      duration: 120,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        gauge.fill.setAlpha(1);
        gauge.label.setAlpha(1);
      },
    });
  }

  handleObjectivesCompleteIfNeeded() {
    if (this.roomCompleteHandled) {
      return;
    }

    if (!this.areAllObjectivesComplete()) {
      return;
    }

    this.roomCompleteHandled = true;
    this.openDoorsForTrigger("objectivesComplete");

    if (this.level.commonObjectiveOnComplete) {
      this.setCommonObjective(
        this.level.commonObjectiveOnComplete.text,
        this.level.commonObjectiveOnComplete.targetId,
      );
    }

    for (const playerId of Object.keys(this.loveGauges ?? {})) {
      this.pulseLoveGauge(playerId);
    }
  }

  areAllObjectivesComplete() {
    const states = Object.values(this.objectiveStates ?? {});

    return states.length > 0 && states.every((state) => state.completed);
  }

  openDoorsForTrigger(trigger) {
    for (const door of this.lockedDoors ?? []) {
      if (door.open || (door.opensOn ?? "objectivesComplete") !== trigger) {
        continue;
      }

      this.openDoor(door);
    }
  }

  openDoor(door) {
    door.open = true;
    this.collisionMap.setBlockedRect(door.x, door.y, door.width, door.height, false);

    for (const patch of door.floorPatches) {
      patch.setVisible(true);
    }

    for (const panel of door.panels) {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        scaleY: 0.35,
        duration: 260,
        ease: "Sine.easeInOut",
        onComplete: () => panel.setVisible(false),
      });
    }

    for (const knob of door.knobs) {
      this.tweens.add({
        targets: knob,
        alpha: 0,
        duration: 160,
        onComplete: () => knob.setVisible(false),
      });
    }

    if (door.label) {
      door.label.setVisible(false);
    }
  }

  findTargetById(targetId) {
    return (
      this.interactions.find((interaction) => interaction.id === targetId) ??
      this.npcs.find((npc) => npc.id === targetId) ??
      this.lockedDoors?.find((door) => door.id === targetId)
    );
  }

  updateInteractionMarkers() {
    const activeInteractionIds = new Set();

    for (const player of this.players) {
      const targetTile = player.facingTile();
      const interaction = this.findInteractionAt(targetTile.x, targetTile.y, player);

      if (interaction) {
        activeInteractionIds.add(interaction.id);
      }
    }

    for (const interaction of this.interactions) {
      const isActive = activeInteractionIds.has(interaction.id);

      interaction.marker.setAlpha(isActive ? 1 : 0.35);
      interaction.text.setVisible(isActive);
    }
  }

  updateCamera() {
    const playerA = this.players[0].sprite;
    const playerL = this.players[1].sprite;
    const middleX = (playerA.x + playerL.x) / 2;
    const middleY = (playerA.y + playerL.y) / 2;
    const distance = Phaser.Math.Distance.Between(playerA.x, playerA.y, playerL.x, playerL.y);
    const zoom = Phaser.Math.Clamp(1 - Math.max(0, distance - 180) / 900, 0.86, 1);

    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(middleX, middleY);
  }

  tileCenter(gridX, gridY) {
    const world = this.collisionMap.gridToWorld(gridX, gridY);
    return [world.x, world.y];
  }
}
