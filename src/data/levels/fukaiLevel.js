import { AUDIO_KEYS, COLORS } from "../../constants.js";
import { fukaiDialogues } from "../dialogues.js";

export const fukaiLevel = {
  title: "La Fukai",
  accentColor: COLORS.coral,
  floorColor: COLORS.clubFloor,
  blockedTileColor: COLORS.clubWall,
  wallStyle: "concert-pixel",
  floorStyle: "concert-pixel",
  backgroundTexture: "fukai-map",
  music: {
    initial: "fukaiLoop",
    volume: 0.42,
    tracks: {
      fukaiLoop: AUDIO_KEYS.fukaiLoop,
      fukaiBattleLoop: AUDIO_KEYS.fukaiBattleLoop,
    },
  },
  controlsIntro: [
    "Alberto : deplacement avec les fleches, interaction avec P.",
    "Lucie : deplacement avec ZQSD, interaction avec E.",
    "Alberto commande deux bieres. Lucie ecoute le fumeur, puis chacun rejoint la table.",
  ],
  room: {
    originX: 64,
    originY: 16,
    width: 26,
    height: 35,
  },
  players: [
    {
      id: "playerA",
      name: "Alberto",
      texture: "player-a",
      gridX: 12,
      gridY: 32,
      speed: 148,
      turnDelayMs: 150,
      bubbleColor: "#f87838",
      lookColor: COLORS.coral,
      dialogue: fukaiDialogues.players.playerA,
    },
    {
      id: "playerL",
      name: "Lucie",
      texture: "player-l",
      gridX: 13,
      gridY: 32,
      speed: 148,
      turnDelayMs: 150,
      bubbleColor: "#d8a038",
      lookColor: COLORS.amber,
      dialogue: fukaiDialogues.players.playerL,
    },
  ],
  collisionRects: [
    { x: 0, y: 0, width: 26, height: 1 },
    { x: 0, y: 34, width: 26, height: 1 },
    { x: 0, y: 0, width: 1, height: 35 },
    { x: 25, y: 0, width: 1, height: 35 },

    { x: 2, y: 1, width: 23, height: 1 },
    { x: 1, y: 2, width: 2, height: 20 },
    { x: 24, y: 2, width: 1, height: 20 },
    { x: 9, y: 1, width: 2, height: 7 },

    { x: 0, y: 22, width: 12, height: 9 },
    { x: 15, y: 22, width: 11, height: 9 },

    { x: 4, y: 6, width: 4, height: 3 },
    { x: 4, y: 10, width: 4, height: 3 },
    { x: 3, y: 14, width: 5, height: 3 },
    { x: 2, y: 18, width: 6, height: 3 },
    { x: 11, y: 3, width: 3, height: 2 },
    { x: 11, y: 5, width: 3, height: 2 },

    { x: 15, y: 5, width: 1, height: 17 },
    { x: 16, y: 2, width: 8, height: 20 },
    { x: 15, y: 18, width: 10, height: 4 },
  ],
  furniture: [],
  npcs: [
    {
      id: "bartender",
      label: "Barman",
      texture: "npc-fukai-bartender",
      gridX: 15,
      gridY: 10,
      dialogues: fukaiDialogues.bartender,
    },
    {
      id: "smoker",
      label: "Fumeur",
      texture: "npc-drafter",
      gridX: 10,
      gridY: 31,
      tint: COLORS.wall,
      dialogues: fukaiDialogues.smoker,
    },
  ],
  interactions: [
    {
      id: "aTableSpot",
      gridX: 12,
      gridY: 18,
      label: "Place Alberto",
      tint: COLORS.mint,
      dialogues: fukaiDialogues.tableSpots,
    },
    {
      id: "lTableSpot",
      gridX: 13,
      gridY: 18,
      label: "Place Lucie",
      tint: COLORS.amber,
      dialogues: fukaiDialogues.tableSpots,
    },
  ],
  objectives: {
    playerA: {
      title: "Alberto",
      color: "#70e040",
      steps: [
        {
          targetId: "bartender",
          hint: "Commander deux bieres au barman.",
          dialogue: fukaiDialogues.objectives.playerABeer,
          setFlag: "aHasTwoBeers",
        },
        {
          targetId: "aTableSpot",
          hint: "Se placer a gauche de la table, face a Lucie.",
          dialogue: fukaiDialogues.objectives.playerATable,
          setFlag: "aAtTable",
        },
      ],
    },
    playerL: {
      title: "Lucie",
      color: "#d8a038",
      steps: [
        {
          targetId: "smoker",
          hint: "Parler au fumeur dehors.",
          dialogue: fukaiDialogues.objectives.playerLSmoker,
          offsetY: -34,
        },
        {
          targetId: "lTableSpot",
          hint: "S'installer a droite de la table, face a Alberto.",
          dialogue: fukaiDialogues.objectives.playerLTable,
          setFlag: "lAtTable",
        },
      ],
    },
  },
};
