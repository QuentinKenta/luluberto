export const officeDialogues = {
  players: {
    playerA: {
      speaker: "Alberto",
      text: "Je vais verifier les archives du projet hospitalité.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Je vais demander autour de moi pour l'ancienne salle.",
    },
  },
  archiveComputer: {
    playerA: {
      speaker: "Alberto",
      text: "Les archives ont été déplacées dans l'ancienne salle de réunion.",
    },
    playerL: {
      speaker: "Ordinateur",
      text: "Session déjà ouverte. Plusieurs dossiers d'agence sont en attente.",
    },
  },
  planTable: {
    playerA: {
      speaker: "Alberto",
      text: "Des plans d'exécution bien rangés. Pas ceux que je cherche.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Les annotations sont propres. Presque trop propres.",
    },
  },
  model: {
    playerA: {
      speaker: "Alberto",
      text: "Une maquette de concours, encore sous cloche.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Les volumes ont pris la poussière, mais l'idée tient encore.",
    },
  },
  archiveBoxes: {
    playerA: {
      speaker: "Alberto",
      text: "Des cartons d'archives récentes. Rien sur l'hospitalité.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Tout est daté, tamponné, classé. Sauf ce qu'on cherche.",
    },
  },
  oldRoomColleague: {
    playerA: {
      speaker: "Collègue",
      text: "Lucie a raison, si vous cherchez les originaux il faut l'ancienne salle.",
    },
    playerL: {
      speaker: "Collègue",
      text: "Les croquis originaux ? Je crois qu'ils sont dans l'ancienne salle de réunion.",
    },
  },
  drafter: {
    playerA: {
      speaker: "Collegue",
      text: "Le serveur d'archives répond lentement aujourd'hui.",
    },
    playerL: {
      speaker: "Collegue",
      text: "Demande à Claire, elle garde les clés des salles oubliées.",
    },
  },
  oldArchiveCabinet: {
    playerA: {
      speaker: "Alberto",
      text: "L'armoire est lourde. Il vaut mieux regarder ensemble.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Elle n'a pas été ouverte depuis longtemps. On devrait être deux.",
    },
  },
  objectives: {
    playerAArchiveLocation: {
      speaker: "Alberto",
      text: "Les archives ont été déplacées dans l'ancienne salle de réunion.",
    },
    playerLKey: [
      {
        speaker: "Collègue",
        text: "Les croquis originaux ? Je crois qu'ils sont dans l'ancienne salle de réunion.",
      },
      {
        speaker: "Lucie",
        text: "Tu aurais la clé ?",
      },
      {
        speaker: "Collègue",
        text: "Oui, tiens. Mais personne n'y va jamais.",
      },
    ],
  },
};

export const concertDialogues = {
  players: {
    playerA: {
      speaker: "Alberto",
      text: "La lumiere violette aide a avoir l'air sur de soi.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Si on rate l'entree, on appellera ca une transition punk.",
    },
  },
  stage: {
    playerA: {
      speaker: "Alberto",
      text: "La scene est petite, mais les spots lui donnent une vraie gueule.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Batterie, ampli, rideau violet. On a assez pour faire du bruit.",
    },
  },
  bar: {
    playerA: {
      speaker: "Alberto",
      text: "Le comptoir colle aux manches. Bon signe pour un concert.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Les bouteilles brillent comme une deuxieme rampe de spots.",
    },
  },
  entrance: {
    playerA: {
      speaker: "Alberto",
      text: "Dehors Paris est calme. Ici, tout tremble deja.",
    },
    playerL: {
      speaker: "Lucie",
      text: "On garde cette porte ouverte. Au cas ou le trac voudrait fuir.",
    },
  },
  barmaid: {
    playerA: {
      speaker: "Bar",
      text: "Vous jouez apres le groupe aux vestes dechirees.",
    },
    playerL: {
      speaker: "Bar",
      text: "Shots a droite, biere a gauche, courage au milieu.",
    },
  },
  audienceFriend: {
    playerA: {
      speaker: "Public",
      text: "On garde le premier rang. Meme les retours sifflent juste.",
    },
    playerL: {
      speaker: "Public",
      text: "Alberto court partout, mais il finira bien par tomber sur une bonne idee.",
    },
  },
  backstageFriend: {
    playerA: {
      speaker: "Backstage",
      text: "Le canape a survecu a trois tournages et deux ruptures.",
    },
    playerL: {
      speaker: "Backstage",
      text: "J'ai garde une place pour respirer avant le rappel.",
    },
  },
  bassist: {
    playerA: {
      speaker: "Bassiste",
      text: "Monte, fais attention aux cables. La basse couvre les doutes.",
    },
    playerL: {
      speaker: "Bassiste",
      text: "Si tu sens le sol vibrer, c'est que la salle respire avec nous.",
    },
  },
  drummer: {
    playerA: {
      speaker: "Batteur",
      text: "Je compte quatre temps, puis on laisse le vacarme faire son travail.",
    },
    playerL: {
      speaker: "Batteur",
      text: "Reste pres du retour, sinon tu vas entendre surtout le plafond.",
    },
  },
  objectives: {
    playerABassist: [
      {
        speaker: "Alberto",
        text: "Il me faut une blague nulle pour commencer le concert.",
      },
      {
        speaker: "Alberto",
        text: "Et en plus, Lucie est la ce soir.",
      },
      {
        speaker: "Bassiste",
        text: "Si tu poses ton mediator sur l'ampli, les cables auront moins peur du mardi.",
      },
      {
        speaker: "Alberto",
        text: "Hein ?",
      },
    ],
    playerADrummer: [
      {
        speaker: "Alberto",
        text: "Tu n'aurais pas une blague pour commencer le live ?",
      },
      {
        speaker: "Batteur",
        text: "Detends-toi. Poste-toi devant la scene et l'inspiration viendra au moment du concert.",
      },
      {
        speaker: "Alberto",
        text: "Mouai...",
      },
    ],
    playerAStage: [
      {
        speaker: "Alberto",
        text: "Ok. Je me poste la. Inspiration, si tu m'entends...",
      },
    ],
    playerLCrowd: [
      {
        speaker: "Public",
        text: "T'as vu comme Alberto est beau ce soir ?",
      },
      {
        speaker: "Lucie",
        text: "Ouais c'est vrai mais j'arrive pas à l'attraper depuis tout à l'heure, il court partout.",
      },
      {
        speaker: "Public",
        text: "Il a l'air un peu tendu, tu sais ce qui lui faudrait ? Une grosse PINTE !",
      },
    ],
    playerLBeer: [
      {
        speaker: "Lucie",
        text: "Une bière pour Alberto, s'il te plait.",
      },
      {
        speaker: "Barmaid",
        text: "Pour Alberto ? Je te fais une grosse pinte. Qu'elle arrive entiere jusqu'a la scene.",
      },
    ],
    playerLStage: [
      {
        speaker: "Lucie",
        text: "Je la pose la. Impossible qu'il la rate.",
      },
    ],
    finaleBeer: [
      {
        speaker: "Alberto",
        text: "Oh une bière !",
      },
      {
        speaker: "Alberto",
        text: "Et glou et glou...",
      },
    ],
    finaleJoke: [
      {
        speaker: "Alberto",
        text: "C'est un aveugle qui rentre dans un bar... Puis dans une chaise, puis dans une table.",
      },
    ],
  },
};

export const fukaiDialogues = {
  players: {
    playerA: {
      speaker: "Alberto",
      text: "Je dois commander deux bieres et trouver la bonne table. Simple, presque trop.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Le fumeur dehors a l'air de savoir ou les conversations commencent.",
    },
  },
  bartender: {
    playerA: {
      speaker: "Barman",
      text: "Si c'est pour deux bieres, il faut demander franchement.",
    },
    playerL: {
      speaker: "Barman",
      text: "Pas derriere le bar, meme pour chercher une excuse brillante.",
    },
  },
  smoker: {
    playerA: {
      speaker: "Fumeur",
      text: "La rue est froide, mais la vitrine rechauffe bien les secrets.",
    },
    playerL: {
      speaker: "Fumeur",
      text: "Eh, Alberto a une tete a te payer une biere, tu devrais aller a sa table.",
    },
  },
  backGuest: {
    playerA: {
      speaker: "Client du fond",
      text: "Au fond, on entend moins la rue et mieux les silences.",
    },
    playerL: {
      speaker: "Client du fond",
      text: "La table du fond voit tout. Elle ne repete rien.",
    },
  },
  tableSpots: {
    playerA: {
      speaker: "Alberto",
      text: "Cette place est parfaite. Deux bieres, une table, aucun plan B.",
    },
    playerL: {
      speaker: "Lucie",
      text: "Je m'installe la. Maintenant, je ne bouge plus.",
    },
  },
  objectives: {
    playerABeer: [
      {
        speaker: "Alberto",
        text: "Deux bieres, s'il te plait.",
      },
      {
        speaker: "Barman",
        text: "Deux bieres pour une seule table. Ambitieux, mais respectable.",
      },
    ],
    playerATable: [
      {
        speaker: "Alberto",
        text: "Ok, je me cale la. Les bieres sont alignees.",
      },
    ],
    playerLSmoker: [
      {
        speaker: "Fumeur",
        text: "Eh, Alberto a une tete a te payer une biere, tu devrais aller a sa table.",
      },
      {
        speaker: "Lucie",
        text: "Bon. Une prediction fumeuse, mais j'ecoute.",
      },
    ],
    playerLTable: [
      {
        speaker: "Lucie",
        text: "Je m'assois ici. S'il a vraiment deux bieres, je veux voir ca.",
      },
    ],
    reunion: [
      {
        speaker: "Alberto",
        text: "Tiens je t'ai pris une biere pour l'autre fois au concert, ca m'a ouvert les chakras.",
      },
      {
        speaker: "Lucie",
        text: "Oui je me suis dit que t'en aurais besoin.",
      },
      {
        speaker: "Alberto",
        text: "C'est cool de partager une biere avec toi.",
      },
      {
        speaker: "Lucie",
        text: "D'ailleurs je me disais que ce serait bien de partager plus qu'une biere...",
      },
      {
        speaker: "Alberto",
        text: "Tu veux dire... deux bieres ?",
      },
      {
        speaker: "Lucie",
        text: "Ben.....",
      },
    ],
  },
};
