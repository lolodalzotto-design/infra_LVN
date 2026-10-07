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
            viewBox: { width: 100, height: 40 },
            rooms: [
              { id:'A-RDC-CAS-ENT10', code:'', name:'Entrée BAT 10', x:6.52, y:5.42, w:5.55, h:13.35 },
              { id:'A-RDC-CAS-MEA', code:'', name:'MEA', x:0.20, y:18.90, w:6.10, h:3.16 },
              { id:'A-RDC-CAS-PORCHE', code:'', name:'Porche entrée', x:12.06, y:5.42, w:4.97, h:27.48 },
              { id:'A-RDC-CAS-A025', code:'A025', name:'Standard', x:17.03, y:0.20, w:6.77, h:5.28 },
              { id:'A-RDC-CAS-A026', code:'A026', name:'Local MTS', x:17.03, y:5.42, w:6.77, h:10.58 },
              { id:'A-RDC-CAS-A026BIS', code:'A026 Bis', name:'Local radios', x:17.03, y:16.00, w:6.77, h:4.97 },
              { id:'A-RDC-CAS-A024', code:'A024', name:'Chambrée VSAV 1', x:23.81, y:5.42, w:5.55, h:10.58 },
              { id:'A-RDC-CAS-A023', code:'A023', name:'Chambrée VSAV 2', x:29.35, y:5.42, w:6.26, h:10.58 },
              { id:'A-RDC-CAS-A022', code:'A022', name:'Douche', x:30.90, y:16.00, w:4.71, h:1.80 },
              { id:'A-RDC-CAS-A021', code:'A021', name:'WC', x:27.55, y:18.00, w:3.35, h:2.97 },
              { id:'A-RDC-CAS-ENT12', code:'', name:'Entrée BAT 12', x:35.61, y:5.42, w:7.03, h:15.55 },
              { id:'A-RDC-CAS-A016', code:'A016', name:'Local électrique', x:38.84, y:13.48, w:3.81, h:7.48 },
              { id:'A-RDC-CAS-A040', code:'A040', name:'Bureau commis', x:42.65, y:5.42, w:4.71, h:4.65 },
              { id:'A-RDC-CAS-A041', code:'A041', name:'Vestiaire', x:47.35, y:5.42, w:4.65, h:4.65 },
              { id:'A-RDC-CAS-A037', code:'A037', name:'Vestiaire', x:42.65, y:10.06, w:4.65, h:3.42 },
              { id:'A-RDC-CAS-A038', code:'A038', name:'WC', x:47.35, y:10.06, w:2.39, h:3.42 },
              { id:'A-RDC-CAS-A039', code:'A039', name:'Local', x:49.74, y:10.06, w:2.26, h:3.42 },
              { id:'A-RDC-CAS-A014BIS', code:'A014 Bis', name:'Souillarde', x:42.65, y:13.48, w:9.29, h:7.55 },
              { id:'A-RDC-CAS-A014', code:'A014', name:'Cafétéria', x:51.94, y:5.42, w:7.29, h:15.61 },
              { id:'A-RDC-CAS-ENT14', code:'', name:'Entrée BAT 14', x:57.74, y:5.42, w:6.45, h:8.13 },
              { id:'A-RDC-CAS-A013', code:'A013', name:'Cuisine', x:64.00, y:5.42, w:7.87, h:16.00 },
              { id:'A-RDC-CAS-APPAR', code:'', name:'Appartement AR', x:71.87, y:5.42, w:22.84, h:16.06 },
              { id:'A-RDC-CAS-ENT16', code:'', name:'Entrée BAT 16', x:91.10, y:5.42, w:6.77, h:7.81 },
              { id:'A-RDC-CAS-A015', code:'A015', name:'Réserve infirmerie', x:51.94, y:21.03, w:4.26, h:3.48 },
              { id:'A-RDC-CAS-A018', code:'A018', name:'Circulation', x:17.03, y:20.97, w:21.81, h:3.48 },
              { id:'A-RDC-CAS-A028', code:'A028', name:'Local corvées GPTS', x:6.39, y:20.90, w:5.68, h:12.58 },
              { id:'A-RDC-CAS-A027', code:'A027', name:'Local CRSS', x:17.03, y:24.45, w:6.84, h:9.03 },
              { id:'A-RDC-CAS-A019', code:'A019', name:'Chambrée VPI', x:23.87, y:24.45, w:11.61, h:9.03 },
              { id:'A-RDC-CAS-A020', code:'A020', name:'Local vide', x:38.90, y:24.45, w:3.74, h:9.03 },
              { id:'A-RDC-CAS-A017', code:'A017', name:'Infirmerie', x:42.65, y:24.45, w:4.65, h:9.03 },
              { id:'A-RDC-CAS-PORCHE2', code:'', name:'Porche', x:47.29, y:24.45, w:4.65, h:12.06 }
            ]
          },
          garage: {
            label: 'Garage',
            viewBox: { width: 100, height: 86 },
            rooms: [
              { id:'A-RDC-GAR-A035', code:'A035', name:'Garage VSAV', x:2.33, y:23.20, w:16.67, h:35.90 },
              { id:'A-RDC-GAR-A036', code:'A036', name:'Garage CVGD VRCG2', x:2.33, y:59.10, w:16.75, h:16.35 },
              { id:'A-RDC-GAR-PARKMOTO', code:'', name:'Parking moto', x:2.33, y:75.45, w:16.75, h:6.20 },
              { id:'A-RDC-GAR-A033', code:'A033', name:'Showroom', x:18.92, y:6.20, w:9.42, h:17.10 },
              { id:'A-RDC-GAR-ENT6', code:'', name:'Entrée BAT 6', x:28.33, y:6.20, w:7.42, h:17.10 },
              { id:'A-RDC-GAR-A032', code:'A032', name:'Local blanc', x:18.92, y:23.30, w:9.42, h:18.80 },
              { id:'A-RDC-GAR-A031', code:'A031', name:'Local 02', x:28.33, y:28.90, w:7.50, h:13.20 },
              { id:'A-RDC-GAR-DECL', code:'', name:'Déclassement', x:45.17, y:6.20, w:9.08, h:7.00 },
              { id:'A-RDC-GAR-VPI2', code:'', name:'VPI 2 / Alvéole 4', x:35.75, y:13.20, w:9.42, h:28.90 },
              { id:'A-RDC-GAR-AR', code:'', name:'AR / Alvéole 3', x:45.17, y:13.20, w:9.08, h:28.90 },
              { id:'A-RDC-GAR-ENT8', code:'', name:'Entrée BAT 8', x:54.25, y:6.20, w:7.92, h:17.10 },
              { id:'A-RDC-GAR-A029', code:'A029', name:'VSR', x:54.25, y:23.30, w:7.92, h:5.60 },
              { id:'A-RDC-GAR-A030', code:'A030', name:'Escalier / AR', x:54.25, y:28.90, w:3.60, h:13.20 },
              { id:'A-RDC-GAR-ALV2', code:'', name:'Alvéole 2', x:62.17, y:13.20, w:8.58, h:28.90 },
              { id:'A-RDC-GAR-ALV1', code:'', name:'Alvéole 1', x:70.75, y:13.20, w:8.42, h:28.90 },
              { id:'A-RDC-GAR-MEA', code:'', name:'MEA', x:70.75, y:23.30, w:8.42, h:5.60 },
              { id:'A-RDC-GAR-ENT10', code:'', name:'Entrée BAT 10', x:79.42, y:6.20, w:6.92, h:17.10 },
              { id:'A-RDC-GAR-A028', code:'A028', name:'Local corvées GPTS', x:79.42, y:25.50, w:6.92, h:16.60 },
              { id:'A-RDC-GAR-PORCHE', code:'', name:'Porche entrée', x:86.34, y:6.20, w:6.20, h:35.90 }
            ]
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
