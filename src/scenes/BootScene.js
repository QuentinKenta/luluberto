import { AUDIO_KEYS, SCENE_KEYS } from "../constants.js";
import {
  CONCERT_NPC_SOURCE_KEY,
  CONCERT_TEXTURE_SOURCE_KEY,
  createGeneratedTextures,
  DRUM_SPRITE_KEY,
  FUKAI_MAP_KEY,
  OFFICE_MAP_KEY,
  PLAYER_SPRITE_SOURCE_KEY,
  PUNK_PARADISE_MAP_KEY,
} from "../utils/createTextures.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  preload() {
    this.load.image(PLAYER_SPRITE_SOURCE_KEY, "assets/persos-mouv.png");
    this.load.image(CONCERT_NPC_SOURCE_KEY, "assets/pnj-dos-concert.png");
    this.load.image(CONCERT_TEXTURE_SOURCE_KEY, "assets/textures-concert.png");
    this.load.image(DRUM_SPRITE_KEY, "assets/drum-sprite.png");
    this.load.image(PUNK_PARADISE_MAP_KEY, "assets/punk-paradise-map.png");
    this.load.image(OFFICE_MAP_KEY, "assets/alcmeamap.png");
    this.load.image(FUKAI_MAP_KEY, "assets/fukai-map.png");
    this.load.audio(AUDIO_KEYS.officeLoop, "assets/office.mp3");
    this.load.audio(AUDIO_KEYS.fukaiLoop, "assets/fukai.mp3");
    this.load.audio(AUDIO_KEYS.concertWallsSolo, "assets/concert-walls-solo.mp3");
    this.load.audio(AUDIO_KEYS.concertWallsLoop, "assets/concert-walls-loop.mp3");
    this.load.audio(AUDIO_KEYS.concertWallsClimax, "assets/concert-walls-climax.mp3");
    this.load.audio(AUDIO_KEYS.fukaiBattleLoop, "assets/combat.mp3");
  }

  create() {
    createGeneratedTextures(this);
    this.scene.start(SCENE_KEYS.title);
  }
}
