import { COLORS } from "../constants.js";

export const PLAYER_SPRITE_SOURCE_KEY = "player-sprites-source";
export const CONCERT_NPC_SOURCE_KEY = "concert-npc-back-source";
export const CONCERT_BAR_SOURCE_KEY = "concert-bar-right";
export const CONCERT_TEXTURE_SOURCE_KEY = "concert-textures-source";
export const DRUM_SPRITE_KEY = "drum-sprite";
export const PUNK_PARADISE_MAP_KEY = "punk-paradise-map";
export const OFFICE_MAP_KEY = "office-map";
export const FUKAI_MAP_KEY = "fukai-map";

const PLAYER_SPRITE_SIZE = {
  width: 48,
  height: 56,
};

const CONCERT_NPC_SPRITE_SIZE = {
  width: 48,
  height: 56,
};

const PLAYER_SPRITE_CROPS = [
  { key: "player-l", x: 198, y: 61, width: 185, height: 231 },
  { key: "player-l-down-0", x: 198, y: 61, width: 185, height: 231 },
  { key: "player-l-right-0", x: 485, y: 79, width: 150, height: 214 },
  { key: "player-l-left-0", x: 769, y: 79, width: 151, height: 214 },
  { key: "player-l-up-0", x: 1022, y: 63, width: 171, height: 230 },
  { key: "player-l-down-1", x: 198, y: 307, width: 185, height: 222 },
  { key: "player-l-right-1", x: 485, y: 320, width: 150, height: 216 },
  { key: "player-l-left-1", x: 769, y: 320, width: 151, height: 216 },
  { key: "player-l-up-1", x: 1022, y: 307, width: 170, height: 229 },
  { key: "player-a", x: 211, y: 596, width: 151, height: 232 },
  { key: "player-a-down-0", x: 211, y: 596, width: 151, height: 232 },
  { key: "player-a-right-0", x: 493, y: 603, width: 142, height: 225 },
  { key: "player-a-left-0", x: 771, y: 603, width: 143, height: 225 },
  { key: "player-a-up-0", x: 1036, y: 603, width: 147, height: 225 },
  { key: "player-a-down-1", x: 211, y: 837, width: 150, height: 229 },
  { key: "player-a-right-1", x: 493, y: 843, width: 142, height: 223 },
  { key: "player-a-left-1", x: 770, y: 843, width: 144, height: 223 },
  { key: "player-a-up-1", x: 1035, y: 843, width: 148, height: 223 },
];

const NPC_SPRITE_CROPS = [
  {
    key: "npc-lead-architect",
    x: 198,
    y: 61,
    width: 185,
    height: 231,
    recolor: {
      yellowClothing: COLORS.plum,
      brownHair: COLORS.berry,
    },
  },
  {
    key: "npc-drafter",
    x: 211,
    y: 596,
    width: 151,
    height: 232,
    recolor: {
      greenClothing: COLORS.blue,
    },
  },
];

const CONCERT_TEXTURE_CROPS = [
  { key: "concert-facades", x: 18, y: 54, width: 915, height: 254 },
  { key: "concert-stage", x: 963, y: 63, width: 383, height: 262 },
  { key: "concert-floor-concrete", x: 23, y: 768, width: 64, height: 76 },
  { key: "concert-floor-brick", x: 88, y: 768, width: 64, height: 76 },
  { key: "concert-floor-black-tile", x: 153, y: 768, width: 64, height: 76 },
  { key: "concert-floor-gray-tile", x: 282, y: 768, width: 62, height: 76 },
  { key: "concert-floor-brown", x: 345, y: 768, width: 63, height: 76 },
  { key: "concert-floor-blue-poster", x: 23, y: 845, width: 64, height: 76 },
  { key: "concert-floor-pink-wall", x: 88, y: 845, width: 64, height: 76 },
  { key: "concert-floor-purple", x: 282, y: 845, width: 62, height: 76 },
  { key: "concert-floor-planks", x: 345, y: 845, width: 63, height: 76 },
  { key: "concert-floor-grate", x: 409, y: 845, width: 125, height: 76 },
];

const CONCERT_NPC_SPRITE_CROPS = [
  { key: "concert-audience-dark-standing", x: 182, y: 176, width: 132, height: 190 },
  { key: "concert-audience-dark-dance", x: 948, y: 600, width: 146, height: 194 },
  { key: "concert-audience-green-standing", x: 786, y: 174, width: 132, height: 192 },
  { key: "concert-audience-green-dance", x: 950, y: 174, width: 142, height: 194 },
  { key: "concert-audience-hood-standing", x: 1156, y: 176, width: 132, height: 190 },
  { key: "concert-audience-hood-dance", x: 1288, y: 174, width: 146, height: 194 },
  { key: "concert-audience-blonde-standing", x: 552, y: 392, width: 134, height: 188 },
  { key: "concert-audience-blonde-dance", x: 550, y: 602, width: 146, height: 192 },
  { key: "concert-audience-brown-standing", x: 1148, y: 392, width: 134, height: 188 },
  { key: "concert-audience-brown-dance", x: 1288, y: 392, width: 146, height: 192 },
];

export function createGeneratedTextures(scene) {
  const didCreatePlayerSprites = createPlayerSpriteTextures(scene);

  if (!didCreatePlayerSprites) {
    createActorTexture(scene, "player-a", {
      shirt: COLORS.coral,
      detail: COLORS.paper,
      hair: COLORS.ink,
      accessory: COLORS.berry,
      variant: "cap",
    });
    createActorTexture(scene, "player-l", {
      shirt: COLORS.brass,
      detail: COLORS.ink,
      hair: COLORS.plum,
      accessory: COLORS.paper,
      variant: "bob",
    });
    createActorTexture(scene, "npc-lead-architect", {
      shirt: COLORS.plum,
      detail: COLORS.paper,
      hair: COLORS.berry,
      accessory: COLORS.brass,
      variant: "bob",
    });
    createActorTexture(scene, "npc-drafter", {
      shirt: COLORS.blue,
      detail: COLORS.paper,
      hair: COLORS.ink,
      accessory: COLORS.coral,
      variant: "cap",
    });
  }

  createActorTexture(scene, "colleague-b", {
    shirt: COLORS.mint,
    detail: COLORS.brass,
    hair: COLORS.berry,
    accessory: COLORS.blue,
    variant: "bob",
  });
  createMarkerTexture(scene, "interaction-marker", COLORS.brass);
  createConcertTextures(scene);
  createConcertNpcTextures(scene);
  createFukaiBartenderTexture(scene);
}

function createPlayerSpriteTextures(scene) {
  if (!scene.textures.exists(PLAYER_SPRITE_SOURCE_KEY)) {
    return false;
  }

  const sourceImage = scene.textures.get(PLAYER_SPRITE_SOURCE_KEY).getSourceImage();

  for (const crop of [...PLAYER_SPRITE_CROPS, ...NPC_SPRITE_CROPS]) {
    createCroppedPlayerTexture(scene, sourceImage, crop);
  }

  return true;
}

function createCroppedPlayerTexture(scene, sourceImage, crop) {
  if (scene.textures.exists(crop.key)) {
    scene.textures.remove(crop.key);
  }

  const texture = scene.textures.createCanvas(crop.key, PLAYER_SPRITE_SIZE.width, PLAYER_SPRITE_SIZE.height);
  const { canvas, context } = texture;
  const scale = Math.min(canvas.width / crop.width, canvas.height / crop.height);
  const drawWidth = Math.round(crop.width * scale);
  const drawHeight = Math.round(crop.height * scale);
  const drawX = Math.round((canvas.width - drawWidth) / 2);
  const drawY = Math.round((canvas.height - drawHeight) / 2);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(sourceImage, crop.x, crop.y, crop.width, crop.height, drawX, drawY, drawWidth, drawHeight);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);

  if (crop.recolor) {
    applySpriteRecolor(pixels, crop.recolor);
  }

  removeNearWhiteBackground(pixels);
  context.putImageData(pixels, 0, 0);
  texture.refresh();
}

function createConcertTextures(scene) {
  if (!scene.textures.exists(CONCERT_TEXTURE_SOURCE_KEY)) {
    return false;
  }

  const sourceImage = scene.textures.get(CONCERT_TEXTURE_SOURCE_KEY).getSourceImage();

  for (const crop of CONCERT_TEXTURE_CROPS) {
    createCroppedTexture(scene, sourceImage, crop);
  }

  return true;
}

function createConcertNpcTextures(scene) {
  if (!scene.textures.exists(CONCERT_NPC_SOURCE_KEY)) {
    return false;
  }

  const sourceImage = scene.textures.get(CONCERT_NPC_SOURCE_KEY).getSourceImage();

  for (const crop of CONCERT_NPC_SPRITE_CROPS) {
    createCroppedConcertNpcTexture(scene, sourceImage, crop);
  }

  return true;
}

function createCroppedTexture(scene, sourceImage, crop) {
  if (scene.textures.exists(crop.key)) {
    scene.textures.remove(crop.key);
  }

  const texture = scene.textures.createCanvas(crop.key, crop.width, crop.height);
  const { canvas, context } = texture;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(sourceImage, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  texture.refresh();
}

function createCroppedConcertNpcTexture(scene, sourceImage, crop) {
  if (scene.textures.exists(crop.key)) {
    scene.textures.remove(crop.key);
  }

  const texture = scene.textures.createCanvas(
    crop.key,
    CONCERT_NPC_SPRITE_SIZE.width,
    CONCERT_NPC_SPRITE_SIZE.height,
  );
  const { canvas, context } = texture;
  const scale = Math.min(canvas.width / crop.width, canvas.height / crop.height);
  const drawWidth = Math.round(crop.width * scale);
  const drawHeight = Math.round(crop.height * scale);
  const drawX = Math.round((canvas.width - drawWidth) / 2);
  const drawY = Math.round((canvas.height - drawHeight) / 2);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(sourceImage, crop.x, crop.y, crop.width, crop.height, drawX, drawY, drawWidth, drawHeight);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);

  removeConcertNpcSheetBackground(pixels);
  context.putImageData(pixels, 0, 0);
  texture.refresh();
}

function createFukaiBartenderTexture(scene) {
  const baseKey = "npc-lead-architect";

  if (!scene.textures.exists(baseKey)) {
    return;
  }

  const sourceImage = scene.textures.get(baseKey).getSourceImage();
  const width = sourceImage.width;
  const height = sourceImage.height;

  if (scene.textures.exists("npc-fukai-bartender")) {
    scene.textures.remove("npc-fukai-bartender");
  }

  const texture = scene.textures.createCanvas("npc-fukai-bartender", width, height);
  const { canvas, context } = texture;
  const scaleX = width / 48;
  const scaleY = height / 56;
  const rect = (x, y, rectWidth, rectHeight, color, alpha = 1) => {
    context.fillStyle = colorToCss(color, alpha);
    context.fillRect(
      Math.round(x * scaleX),
      Math.round(y * scaleY),
      Math.max(1, Math.round(rectWidth * scaleX)),
      Math.max(1, Math.round(rectHeight * scaleY)),
    );
  };

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(sourceImage, 0, 0, width, height);

  rect(11, 7, 26, 4, COLORS.ink);
  rect(9, 11, 7, 24, COLORS.ink);
  rect(32, 11, 7, 24, COLORS.ink);
  rect(12, 8, 24, 5, COLORS.berry);
  rect(10, 13, 6, 23, COLORS.berry);
  rect(32, 13, 6, 23, COLORS.berry);
  rect(14, 29, 5, 10, COLORS.berry);
  rect(29, 29, 5, 10, COLORS.berry);

  rect(15, 24, 18, 3, COLORS.ink);
  rect(16, 26, 16, 4, COLORS.berry);
  rect(18, 30, 12, 7, COLORS.berry);
  rect(20, 36, 8, 3, COLORS.ink);
  rect(19, 29, 3, 2, COLORS.skin, 0.76);
  rect(26, 29, 3, 2, COLORS.skin, 0.76);

  texture.refresh();
}

function applySpriteRecolor(pixels, recolor) {
  const { data } = pixels;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alpha === 0) {
      continue;
    }

    const category = getSpriteColorCategory(red, green, blue);
    const replacement = category ? recolor[category] : null;

    if (!replacement) {
      continue;
    }

    const replacementRgb = numberToRgb(replacement);
    const brightness = (red + green + blue) / (255 * 3);
    const shade = 0.54 + brightness * 0.72;

    data[index] = clampColor(replacementRgb.red * shade);
    data[index + 1] = clampColor(replacementRgb.green * shade);
    data[index + 2] = clampColor(replacementRgb.blue * shade);
  }
}

function getSpriteColorCategory(red, green, blue) {
  if (red > 145 && green > 105 && blue < 90) {
    return "yellowClothing";
  }

  if (green > 85 && green > red * 1.08 && green > blue * 1.08) {
    return "greenClothing";
  }

  if (red > 65 && red > green * 1.14 && green > blue * 1.2 && blue < 95) {
    return "brownHair";
  }

  if (red < 95 && green < 90 && blue < 85) {
    return "darkHair";
  }

  return null;
}

function numberToRgb(color) {
  return {
    red: (color >> 16) & 255,
    green: (color >> 8) & 255,
    blue: color & 255,
  };
}

function colorToCss(color, alpha = 1) {
  const { red, green, blue } = numberToRgb(color);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function removeConcertNpcSheetBackground(pixels) {
  const { width, height, data } = pixels;
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x += 1) {
    queue.push(x, (height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    queue.push(y * width, y * width + width - 1);
  }

  while (queue.length > 0) {
    const pixelIndex = queue.pop();

    if (visited[pixelIndex]) {
      continue;
    }

    visited[pixelIndex] = 1;

    if (!isConcertNpcSheetBackground(data, pixelIndex)) {
      continue;
    }

    data[pixelIndex * 4 + 3] = 0;

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (x > 0) {
      queue.push(pixelIndex - 1);
    }

    if (x < width - 1) {
      queue.push(pixelIndex + 1);
    }

    if (y > 0) {
      queue.push(pixelIndex - width);
    }

    if (y < height - 1) {
      queue.push(pixelIndex + width);
    }
  }
}

function isConcertNpcSheetBackground(data, pixelIndex) {
  const index = pixelIndex * 4;
  const alpha = data[index + 3];

  if (alpha === 0) {
    return true;
  }

  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  const brightness = (red + green + blue) / 3;

  if (brightness < 38) {
    return false;
  }

  if (chroma <= 46) {
    return true;
  }

  return red >= green && green >= blue && red - blue <= 72 && brightness >= 70 && brightness <= 218;
}

function removeNearWhiteBackground(pixels) {
  const { width, height, data } = pixels;
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x += 1) {
    queue.push(x, (height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    queue.push(y * width, y * width + width - 1);
  }

  while (queue.length > 0) {
    const pixelIndex = queue.pop();

    if (visited[pixelIndex]) {
      continue;
    }

    visited[pixelIndex] = 1;

    if (!isNearWhite(data, pixelIndex)) {
      continue;
    }

    data[pixelIndex * 4 + 3] = 0;

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (x > 0) {
      queue.push(pixelIndex - 1);
    }

    if (x < width - 1) {
      queue.push(pixelIndex + 1);
    }

    if (y > 0) {
      queue.push(pixelIndex - width);
    }

    if (y < height - 1) {
      queue.push(pixelIndex + width);
    }
  }
}

function isNearWhite(data, pixelIndex) {
  const index = pixelIndex * 4;

  return data[index] > 238 && data[index + 1] > 238 && data[index + 2] > 238;
}

function createActorTexture(scene, key, options) {
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  const { shirt, detail, hair, accessory, variant } = options;

  graphics.fillStyle(COLORS.ink, 0.22);
  graphics.fillRect(8, 36, 24, 4);

  // Chunky 8-bit outline: large head, small body, readable from a distance.
  graphics.fillStyle(COLORS.ink, 1);
  graphics.fillRect(8, 6, 24, 4);
  graphics.fillRect(6, 10, 28, 18);
  graphics.fillRect(10, 28, 20, 10);
  graphics.fillRect(6, 30, 6, 6);
  graphics.fillRect(28, 30, 6, 6);

  graphics.fillStyle(COLORS.skin, 1);
  graphics.fillRect(10, 12, 20, 14);
  graphics.fillRect(8, 18, 4, 6);
  graphics.fillRect(28, 18, 4, 6);
  graphics.fillRect(8, 30, 4, 4);
  graphics.fillRect(28, 30, 4, 4);

  graphics.fillStyle(hair, 1);
  graphics.fillRect(10, 8, 20, 6);
  graphics.fillRect(8, 12, 6, 6);
  graphics.fillRect(26, 12, 6, 6);

  if (variant === "cap") {
    graphics.fillStyle(accessory, 1);
    graphics.fillRect(10, 6, 18, 6);
    graphics.fillRect(26, 10, 8, 4);
    graphics.fillStyle(detail, 1);
    graphics.fillRect(16, 6, 6, 4);
  }

  if (variant === "bob") {
    graphics.fillStyle(accessory, 1);
    graphics.fillRect(12, 8, 16, 4);
    graphics.fillRect(8, 12, 4, 10);
    graphics.fillRect(28, 12, 4, 10);
    graphics.fillStyle(detail, 1);
    graphics.fillRect(24, 8, 4, 4);
  }

  graphics.fillStyle(shirt, 1);
  graphics.fillRect(12, 28, 16, 8);
  graphics.fillRect(14, 36, 5, 2);
  graphics.fillRect(22, 36, 5, 2);
  graphics.fillStyle(detail, 1);
  graphics.fillRect(16, 28, 8, 3);
  graphics.fillRect(18, 32, 4, 4);

  graphics.fillStyle(COLORS.ink, 1);
  graphics.fillRect(13, 19, 3, 3);
  graphics.fillRect(24, 19, 3, 3);
  graphics.fillRect(17, 25, 6, 2);
  graphics.fillRect(14, 36, 5, 2);
  graphics.fillRect(22, 36, 5, 2);

  graphics.fillStyle(COLORS.paper, 1);
  graphics.fillRect(14, 19, 1, 1);
  graphics.fillRect(25, 19, 1, 1);
  graphics.fillRect(11, 14, 3, 2);

  graphics.generateTexture(key, 40, 44);
  graphics.destroy();
}

function createMarkerTexture(scene, key, color) {
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(COLORS.ink, 1);
  graphics.fillRect(6, 0, 4, 2);
  graphics.fillRect(4, 2, 8, 2);
  graphics.fillRect(2, 4, 12, 8);
  graphics.fillRect(4, 12, 8, 2);
  graphics.fillRect(6, 14, 4, 2);

  graphics.fillStyle(color, 1);
  graphics.fillRect(6, 4, 4, 2);
  graphics.fillRect(4, 6, 8, 4);
  graphics.fillRect(6, 10, 4, 2);

  graphics.generateTexture(key, 16, 16);
  graphics.destroy();
}
