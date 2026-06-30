import { AUDIO_KEYS, COLORS } from "../../constants.js";
import { officeDialogues } from "../dialogues.js";

export const officeLevel = {
  title: "Agence d'architecture - archives hospitalite",
  accentColor: COLORS.mint,
  floorColor: COLORS.floor,
  blockedTileColor: COLORS.wall,
  wallStyle: "office-pixel",
  floorStyle: "office-pixel",
  backgroundTexture: "office-map",
  music: {
    initial: "officeLoop",
    volume: 0.42,
    tracks: {
      officeLoop: AUDIO_KEYS.officeLoop,
    },
  },
  controlsIntro: [
    "Alberto : deplacement avec les fleches, interaction avec P.",
    "Lucie : deplacement avec ZQSD, interaction avec E.",
    "Entrez par la devanture bleue cote rue.",
  ],
  room: {
    originX: 32,
    originY: 16,
    width: 33,
    height: 37,
  },
  relationship: {
    max: 100,
    initial: {
      playerA: 18,
      playerL: 18,
    },
    labels: {
      playerA: "Confiance Alberto",
      playerL: "Confiance Lucie",
    },
    colors: {
      playerA: "#70e040",
      playerL: "#d8a038",
    },
  },
  players: [
    {
      id: "playerA",
      name: "Alberto",
      texture: "player-a",
      gridX: 14,
      gridY: 32,
      speed: 148,
      turnDelayMs: 150,
      bubbleColor: "#70e040",
      lookColor: COLORS.mint,
      dialogue: officeDialogues.players.playerA,
    },
    {
      id: "playerL",
      name: "Lucie",
      texture: "player-l",
      gridX: 15,
      gridY: 32,
      speed: 148,
      turnDelayMs: 150,
      bubbleColor: "#d8a038",
      lookColor: COLORS.brass,
      dialogue: officeDialogues.players.playerL,
    },
  ],
  collisionRects: [
    { x: 0, y: 0, width: 33, height: 1 },
    { x: 0, y: 36, width: 33, height: 1 },
    { x: 0, y: 0, width: 1, height: 37 },
    { x: 32, y: 0, width: 1, height: 37 },

    // Rue -> bureau : seule la porte de la devanture bleue reste traversable.
    { x: 1, y: 23, width: 13, height: 8 },
    { x: 16, y: 23, width: 16, height: 8 },

    // Cloisons principales du bureau.
    { x: 1, y: 1, width: 31, height: 1 },
    { x: 1, y: 9, width: 13, height: 1 },
    { x: 16, y: 9, width: 3, height: 1 },
    { x: 21, y: 9, width: 11, height: 1 },
    { x: 15, y: 1, width: 1, height: 8 },
    { x: 22, y: 1, width: 1, height: 8 },

    // Mobilier visible sur la map.
    { x: 5, y: 5, width: 8, height: 2 },
    { x: 2, y: 2, width: 3, height: 2 },
    { x: 17, y: 2, width: 4, height: 3 },
    { x: 24, y: 3, width: 5, height: 3 },
    { x: 29, y: 8, width: 3, height: 7 },
    { x: 1, y: 10, width: 2, height: 3 },
    { x: 1, y: 14, width: 2, height: 3 },
    { x: 2, y: 20, width: 5, height: 2 },
    { x: 8, y: 11, width: 5, height: 9 },
    { x: 20, y: 11, width: 5, height: 9 },
    { x: 16, y: 20, width: 4, height: 3 },
    { x: 29, y: 17, width: 3, height: 5 },
  ],
  lockedDoors: [
    {
      id: "oldMeetingRoomDoor",
      x: 19,
      y: 8,
      width: 2,
      height: 1,
      label: "Ancienne salle",
      fill: COLORS.plum,
      stroke: COLORS.ink,
      opensOn: "objectivesComplete",
    },
  ],
  furniture: [],
  npcs: [
    {
      id: "oldRoomColleague",
      label: "Collegue",
      texture: "npc-lead-architect",
      gridX: 26,
      gridY: 10,
      dialogues: officeDialogues.oldRoomColleague,
    },
    {
      id: "drafter",
      label: "Traceur",
      texture: "npc-drafter",
      gridX: 7,
      gridY: 21,
      dialogues: officeDialogues.drafter,
    },
  ],
  interactions: [
    {
      id: "archiveComputer",
      gridX: 10,
      gridY: 11,
      label: "Ordinateur",
      tint: COLORS.mint,
      dialogues: officeDialogues.archiveComputer,
    },
    {
      id: "planTable",
      gridX: 11,
      gridY: 15,
      label: "Plans",
      tint: COLORS.brass,
      dialogues: officeDialogues.planTable,
    },
    {
      id: "model",
      gridX: 22,
      gridY: 15,
      label: "Maquette",
      tint: COLORS.blue,
      dialogues: officeDialogues.model,
    },
    {
      id: "archiveBoxes",
      gridX: 19,
      gridY: 4,
      label: "Cartons",
      tint: COLORS.plum,
      dialogues: officeDialogues.archiveBoxes,
    },
    {
      id: "oldArchiveCabinet",
      gridX: 19,
      gridY: 4,
      label: "Armoire",
      tint: COLORS.paper,
      dialogues: officeDialogues.oldArchiveCabinet,
    },
  ],
  objectives: {
    playerA: {
      title: "Alberto",
      color: "#70e040",
      steps: [
        {
          targetId: "archiveComputer",
          hint: "Consulter l'ordinateur pour retrouver les archives du projet hospitalite.",
          dialogue: officeDialogues.objectives.playerAArchiveLocation,
          setFlag: "aFoundArchiveLocation",
          loveGain: {
            playerA: 3,
            playerL: 2,
          },
        },
      ],
    },
    playerL: {
      title: "Lucie",
      color: "#d8a038",
      steps: [
        {
          targetId: "oldRoomColleague",
          hint: "Demander la cle de l'ancienne salle a un collegue.",
          dialogue: officeDialogues.objectives.playerLKey,
          setFlag: "lHasOldRoomKey",
          loveGain: {
            playerA: 2,
            playerL: 3,
          },
          offsetX: 8,
        },
      ],
    },
  },
  commonObjectiveOnComplete: {
    text: "Explorer l'ancienne salle de reunion.",
    targetId: "oldMeetingRoomDoor",
  },
};
