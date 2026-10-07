function layoutRooms(items, cols = 4) {
  const margin = 2;
  const gap = 1.5;
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const width = (100 - margin * 2 - gap * (cols - 1)) / cols;
  const height = (100 - margin * 2 - gap * (rows - 1)) / rows;
  return items.map((room, index) => ({
    ...room,
    x: margin + (index % cols) * (width + gap),
    y: margin + Math.floor(index / cols) * (height + gap),
    w: width,
    h: height
  }));
}

const room = (id, code, name) => ({ id, code, name });

export const PLAN_CONFIG = {
  A: {
    label: 'Bâtiment A',
    levels: {
      RDC: {
        label: 'Rez-de-chaussée',
        zones: {
          caserne: {
            label: 'Caserne',
            rooms: layoutRooms([
              room('A-RDC-CAS-A013', 'A013', 'Cuisine'),
              room('A-RDC-CAS-A014', 'A014', 'Cafétéria'),
              room('A-RDC-CAS-A014BIS', 'A014 Bis', 'Souillarde'),
              room('A-RDC-CAS-A015', 'A015', 'Réserve infirmerie'),
              room('A-RDC-CAS-A016', 'A016', 'Local électrique'),
              room('A-RDC-CAS-A017', 'A017', 'Infirmerie'),
              room('A-RDC-CAS-A018', 'A018', 'Circulation'),
              room('A-RDC-CAS-A019', 'A019', 'Chambrée VPI'),
              room('A-RDC-CAS-A020', 'A020', 'Local vide'),
              room('A-RDC-CAS-A021', 'A021', 'WC'),
              room('A-RDC-CAS-A022', 'A022', 'Douche / WC'),
              room('A-RDC-CAS-A023', 'A023', 'Chambrée VSAV 2'),
              room('A-RDC-CAS-A024', 'A024', 'Chambrée VSAV 1'),
              room('A-RDC-CAS-A025', 'A025', 'Standard'),
              room('A-RDC-CAS-A026', 'A026', 'Local MTS'),
              room('A-RDC-CAS-A026BIS', 'A026 Bis', 'Local radios'),
              room('A-RDC-CAS-A027', 'A027', 'Local CRSS'),
              room('A-RDC-CAS-A028', 'A028', 'Local corvées GPTS'),
              room('A-RDC-CAS-A037', 'A037', 'Vestiaire'),
              room('A-RDC-CAS-A038', 'A038', 'WC'),
              room('A-RDC-CAS-A039', 'A039', 'Local'),
              room('A-RDC-CAS-A040', 'A040', 'Bureau commis'),
              room('A-RDC-CAS-A041', 'A041', 'Vestiaire')
            ], 4)
          },
          garage: {
            label: 'Garage',
            rooms: layoutRooms([
              room('A-RDC-GAR-ALV1', 'Alv. 1', 'Alvéole 1'),
              room('A-RDC-GAR-ALV2', 'Alv. 2', 'Alvéole 2'),
              room('A-RDC-GAR-ALV3', 'Alv. 3', 'Alvéole 3'),
              room('A-RDC-GAR-ALV4', 'Alv. 4', 'Alvéole 4'),
              room('A-RDC-GAR-A029', 'A029', 'VSR / zone escalier'),
              room('A-RDC-GAR-A030', 'A030', 'AR / escalier'),
              room('A-RDC-GAR-A031', 'A031', 'Local 02'),
              room('A-RDC-GAR-A032', 'A032', 'Local blanc'),
              room('A-RDC-GAR-A033', 'A033', 'Showroom'),
              room('A-RDC-GAR-A035', 'A035', 'Garage VSAV'),
              room('A-RDC-GAR-A036', 'A036', 'Garage CVGD VRCG2'),
              room('A-RDC-GAR-MEA', 'MEA', 'MEA'),
              room('A-RDC-GAR-VPI2', 'VPI 2', 'VPI 2')
            ], 3)
          }
        }
      },
      R1: {
        label: 'R+1',
        zones: {
          caserne: {
            label: 'Caserne',
            rooms: layoutRooms([
              room('A-R1-A100', 'A100', 'Balcon'),
              room('A-R1-A101', 'A101', 'Poste OMS'),
              room('A-R1-A101BIS', 'A101 Bis', 'Salle repos OMS'),
              room('A-R1-A102', 'A102', 'Office'),
              room('A-R1-A102BIS', 'A102 Bis', 'Entrée BAT 14'),
              room('A-R1-A103', 'A103', 'Cadre officier'),
              room('A-R1-A104', 'A104', 'Buanderie'),
              room('A-R1-A105', 'A105', 'Bureau chef de centre'),
              room('A-R1-A106', 'A106', 'Bureau 02'),
              room('A-R1-A107', 'A107', 'Coffre-fort'),
              room('A-R1-A108', 'A108', 'Sanitaires'),
              room('A-R1-A109', 'A109', 'Photocopieur'),
              room('A-R1-A109BIS', 'A109 Bis', 'Bureau multi-services'),
              room('A-R1-A109TER', 'A109 Ter', 'Bureau adjudant'),
              room('A-R1-A109Q', 'A109 Quater', 'Réserve BSC'),
              room('A-R1-A110', 'A110', 'Bureau 03'),
              room('A-R1-A111', 'A111', 'Local trans'),
              room('A-R1-A112', 'A112', 'Bureau CDG'),
              room('A-R1-A113', 'A113', 'Salle entraînement'),
              room('A-R1-A114', 'A114', 'Bureau chef services'),
              room('A-R1-A115', 'A115', 'Chambrée N4'),
              room('A-R1-A116', 'A116', 'WC / douches'),
              room('A-R1-A117', 'A117', 'Local'),
              room('A-R1-A118', 'A118', 'Chambrée N4'),
              room('A-R1-A119', 'A119', 'Poste PL'),
              room('A-R1-A119BIS', 'A119 Bis', 'Chambrée PL'),
              room('A-R1-A119TER', 'A119 Ter', 'Vestiaire PL'),
              room('A-R1-A120', 'A120', 'Chambrée N4'),
              room('A-R1-A121', 'A121', 'Chambrée / vestiaire N1 impair'),
              room('A-R1-A122', 'A122', 'Chambrée stagiaire'),
              room('A-R1-A123', 'A123', 'Local DIH'),
              room('A-R1-A124', 'A124', 'Chambrée officier'),
              room('A-R1-A125', 'A125', 'Local distraction'),
              room('A-R1-A126', 'A126', 'Chambrée / vestiaire N3 pair')
            ], 4)
          }
        }
      },
      R2: {
        label: 'R+2',
        zones: {
          caserne: {
            label: 'Caserne',
            rooms: layoutRooms([
              room('A-R2-A201', 'A201', 'Chambrée N5'),
              room('A-R2-A201BIS', 'A201 Bis', 'Entrée / chambrée N3 impair'),
              room('A-R2-A202', 'A202', 'Chambrée N5'),
              room('A-R2-A202BIS', 'A202 Bis', 'SDB N5'),
              room('A-R2-A203', 'A203', 'Chambrée N3 impair'),
              room('A-R2-A204', 'A204', 'Chambrée N4'),
              room('A-R2-A205', 'A205', 'Douches / lavabos / WC'),
              room('A-R2-A206', 'A206', 'Local / entrée BAT 8'),
              room('A-R2-A207', 'A207', 'Chambrée N4'),
              room('A-R2-A208', 'A208', 'Chambrée féminine'),
              room('A-R2-A208BIS', 'A208 Bis', 'WC'),
              room('A-R2-A208TER', 'A208 Ter', 'SDB'),
              room('A-R2-A209', 'A209', 'Chambrée N4'),
              room('A-R2-A210', 'A210', 'Chambrée équipe paire'),
              room('A-R2-A211', 'A211', 'Archives BSC'),
              room('A-R2-A212', 'A212', 'Chambrée stagiaire'),
              room('A-R2-A213', 'A213', 'Chambrée N4'),
              room('A-R2-A214', 'A214', 'Chambrée niveau 3 impair'),
              room('A-R2-A215', 'A215', 'Local')
            ], 4)
          }
        }
      }
    }
  },
  B: {
    label: 'Bâtiment B',
    levels: {
      RDC: {
        label: 'Rez-de-chaussée',
        zones: {
          caserne: {
            label: 'Caserne',
            rooms: layoutRooms([
              room('B-RDC-CAS-B002', 'B002', 'Salle Crossfit'),
              room('B-RDC-CAS-B003', 'B003', 'Magasin incendie'),
              room('B-RDC-CAS-B003BIS', 'B003 bis', 'Bureau MI'),
              room('B-RDC-CAS-B004', 'B004', 'Infra'),
              room('B-RDC-CAS-B005', 'B005', 'Salle de sport'),
              room('B-RDC-CAS-B006', 'B006', 'Salle TV'),
              room('B-RDC-CAS-B007', 'B007', 'Circulation'),
              room('B-RDC-CAS-B008', 'B008', 'Coopérative'),
              room('B-RDC-CAS-B009', 'B009', 'Réserve Coop'),
              room('B-RDC-CAS-B010', 'B010', 'Appro HCC'),
              room('B-RDC-CAS-B011', 'B011', 'Local sous escalier')
            ], 3)
          },
          garage: {
            label: 'Garage',
            rooms: layoutRooms([
              room('B-RDC-GAR-B001-T1', 'B001-1', 'Travée 1'),
              room('B-RDC-GAR-B001-T2', 'B001-2', 'Travée 2'),
              room('B-RDC-GAR-B001-T3', 'B001-3', 'Travée 3'),
              room('B-RDC-GAR-B001-T4', 'B001-4', 'Travée 4'),
              room('B-RDC-GAR-B001-T5', 'B001-5', 'Travée 5'),
              room('B-RDC-GAR-MEZZ', 'Mezz.', 'Mezzanine')
            ], 3)
          }
        }
      },
      R1: {
        label: 'R+1',
        zones: {
          caserne: {
            label: 'Caserne',
            rooms: layoutRooms([
              room('B-R1-B101', 'B101', 'Poste OM'),
              room('B-R1-B102', 'B102', 'HCC'),
              room('B-R1-B103', 'B103', 'WC femmes'),
              room('B-R1-B104', 'B104', 'WC hommes'),
              room('B-R1-B105', 'B105', 'Salon de coiffure'),
              room('B-R1-B106', 'B106', 'Buanderie'),
              room('B-R1-B107', 'B107', 'Bureau sport GPTS'),
              room('B-R1-B108', 'B108', 'Salle cardio'),
              room('B-R1-B109', 'B109', 'Salle musculation')
            ], 3)
          }
        }
      }
    }
  }
};

export const CATEGORY_RULES = [
  { category: 'Électrique', words: ['prise', 'interrupteur', 'ampoule', 'éclairage', 'lumière', 'luminaire', 'électrique', 'courant', 'disjoncteur', 'câble'] },
  { category: 'Menuiserie', words: ['porte', 'poignée', 'serrure', 'clé', 'fenêtre', 'volet', 'gond', 'charnière', 'menuiserie'] },
  { category: 'Sol', words: ['sol', 'carrelage', 'dalle', 'lino', 'parquet', 'plinthe', 'revêtement'] },
  { category: 'Mur', words: ['mur', 'cloison', 'placo', 'plâtre', 'fissure', 'trou', 'peinture'] },
  { category: 'Plafond', words: ['plafond', 'faux plafond', 'dalle plafond'] },
  { category: 'Plomberie', words: ['robinet', 'fuite', 'lavabo', 'wc', 'toilette', 'chasse', 'abattant', 'douche', 'eau', 'évacuation', 'siphon', 'canalisation'] }
];

export const CATEGORIES = ['Électrique', 'Menuiserie', 'Sol', 'Mur', 'Plafond', 'Plomberie'];

export function classifyCategory(description = '') {
  const normalized = description.toLocaleLowerCase('fr-FR');
  let best = { category: '', score: 0 };
  for (const rule of CATEGORY_RULES) {
    const score = rule.words.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { category: rule.category, score };
  }
  return best.category || '';
}

export function getRoom(roomId) {
  for (const [buildingId, building] of Object.entries(PLAN_CONFIG)) {
    for (const [levelId, level] of Object.entries(building.levels)) {
      for (const [zoneId, zone] of Object.entries(level.zones)) {
        const found = zone.rooms.find((r) => r.id === roomId);
        if (found) {
          return {
            ...found,
            buildingId,
            buildingLabel: building.label,
            levelId,
            levelLabel: level.label,
            zoneId,
            zoneLabel: zone.label
          };
        }
      }
    }
  }
  return null;
}

export function allRooms() {
  return Object.entries(PLAN_CONFIG).flatMap(([buildingId, building]) =>
    Object.entries(building.levels).flatMap(([levelId, level]) =>
      Object.entries(level.zones).flatMap(([zoneId, zone]) =>
        zone.rooms.map((item) => ({
          ...item,
          buildingId,
          buildingLabel: building.label,
          levelId,
          levelLabel: level.label,
          zoneId,
          zoneLabel: zone.label
        }))
      )
    )
  );
}
