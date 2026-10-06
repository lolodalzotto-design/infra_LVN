export const PLAN_CONFIG = {
  A: {
    label: 'Bâtiment A',
    levels: {
      RDC: {
        label: 'Rez-de-chaussée',
        rooms: [
          { id: 'A-RDC-001', name: 'Accueil', x: 4, y: 7, w: 28, h: 35 },
          { id: 'A-RDC-002', name: 'Bureau 01', x: 34, y: 7, w: 28, h: 35 },
          { id: 'A-RDC-003', name: 'Vestiaire', x: 64, y: 7, w: 32, h: 35 },
          { id: 'A-RDC-004', name: 'Sanitaires', x: 4, y: 48, w: 28, h: 45 },
          { id: 'A-RDC-005', name: 'Local technique', x: 34, y: 48, w: 28, h: 45 },
          { id: 'A-RDC-006', name: 'Salle commune', x: 64, y: 48, w: 32, h: 45 }
        ]
      },
      R1: {
        label: 'R+1',
        rooms: [
          { id: 'A-R1-101', name: 'Bureau 101', x: 4, y: 7, w: 29, h: 38 },
          { id: 'A-R1-102', name: 'Bureau 102', x: 35, y: 7, w: 29, h: 38 },
          { id: 'A-R1-103', name: 'Salle réunion', x: 66, y: 7, w: 30, h: 38 },
          { id: 'A-R1-104', name: 'Archives', x: 4, y: 51, w: 44, h: 42 },
          { id: 'A-R1-105', name: 'Circulation', x: 50, y: 51, w: 46, h: 42 }
        ]
      }
    }
  },
  B: {
    label: 'Bâtiment B',
    levels: {
      RDC: {
        label: 'Rez-de-chaussée',
        rooms: [
          { id: 'B-RDC-001', name: 'Remise', x: 4, y: 7, w: 42, h: 86 },
          { id: 'B-RDC-002', name: 'Atelier', x: 48, y: 7, w: 23, h: 40 },
          { id: 'B-RDC-003', name: 'Local technique', x: 73, y: 7, w: 23, h: 40 },
          { id: 'B-RDC-004', name: 'Vestiaire', x: 48, y: 53, w: 23, h: 40 },
          { id: 'B-RDC-005', name: 'Sanitaires', x: 73, y: 53, w: 23, h: 40 }
        ]
      },
      R1: {
        label: 'R+1',
        rooms: [
          { id: 'B-R1-201', name: 'Salle formation', x: 4, y: 7, w: 45, h: 42 },
          { id: 'B-R1-202', name: 'Bureau 201', x: 51, y: 7, w: 45, h: 42 },
          { id: 'B-R1-203', name: 'Stock', x: 4, y: 55, w: 29, h: 38 },
          { id: 'B-R1-204', name: 'Sanitaires', x: 35, y: 55, w: 29, h: 38 },
          { id: 'B-R1-205', name: 'Dégagement', x: 66, y: 55, w: 30, h: 38 }
        ]
      }
    }
  }
};

export const CATEGORY_RULES = [
  { category: 'Électricité', words: ['prise', 'interrupteur', 'ampoule', 'éclairage', 'lumière', 'luminaire', 'électrique', 'courant', 'disjoncteur', 'câble'] },
  { category: 'Plomberie / Sanitaire', words: ['robinet', 'fuite', 'lavabo', 'wc', 'toilette', 'chasse', 'abattant', 'douche', 'eau', 'évacuation', 'siphon'] },
  { category: 'Menuiserie / Serrurerie', words: ['porte', 'poignée', 'serrure', 'clé', 'fenêtre', 'volet', 'gond', 'charnière', 'menuiserie'] },
  { category: 'Placo / Maçonnerie', words: ['placo', 'mur', 'cloison', 'trou', 'fissure', 'maçonnerie', 'plâtre'] },
  { category: 'Peinture', words: ['peinture', 'peindre', 'écaille', 'tache', 'revêtement mural'] },
  { category: 'Mobilier', words: ['chaise', 'table', 'bureau', 'armoire', 'étagère', 'casier', 'mobilier', 'banc'] },
  { category: 'Sols / Revêtements', words: ['sol', 'carrelage', 'dalle', 'lino', 'parquet', 'plinthe'] },
  { category: 'Chauffage / Climatisation', words: ['chauffage', 'radiateur', 'clim', 'climatisation', 'ventilation', 'vmc'] },
  { category: 'Extérieurs', words: ['extérieur', 'portail', 'grillage', 'gouttière', 'toiture', 'façade'] }
];

export const CATEGORIES = [...CATEGORY_RULES.map((r) => r.category), 'Autre'];

export function classifyCategory(description = '') {
  const normalized = description.toLocaleLowerCase('fr-FR');
  let best = { category: 'Autre', score: 0 };
  for (const rule of CATEGORY_RULES) {
    const score = rule.words.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { category: rule.category, score };
  }
  return best.category;
}

export function getRoom(roomId) {
  for (const [buildingId, building] of Object.entries(PLAN_CONFIG)) {
    for (const [levelId, level] of Object.entries(building.levels)) {
      const room = level.rooms.find((r) => r.id === roomId);
      if (room) return { ...room, buildingId, buildingLabel: building.label, levelId, levelLabel: level.label };
    }
  }
  return null;
}

export function allRooms() {
  return Object.entries(PLAN_CONFIG).flatMap(([buildingId, building]) =>
    Object.entries(building.levels).flatMap(([levelId, level]) =>
      level.rooms.map((room) => ({
        ...room,
        buildingId,
        buildingLabel: building.label,
        levelId,
        levelLabel: level.label
      }))
    )
  );
}
