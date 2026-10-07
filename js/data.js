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
            coordinateScaleY: 1,
            planImage: './assets/plans/A-RDC-caserne.svg?v=20261007-1140',
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
            viewBox: { width: 100, height: 90 },
            coordinateScaleY: 1.046511628,
            planImage: './assets/plans/A-RDC-garage.webp?v=20261007-1030',
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
            viewBox: { width: 100, height: 25.333333 },
            coordinateScaleY: 1.055555542,
            planImage: './assets/plans/A-R1.webp?v=20261007-1030',
            rooms: [
              { id:'A-R1-A126', code:'A126', name:'Chambrée / vestiaire niv 3 pair', x:1.5, y:0.7, w:12.4, h:11.6, points:[[1.5,0.7],[13.9,0.7],[13.9,11.8],[4.4,11.8]] },
              { id:'A-R1-ENT6', code:'', name:'Entrée BAT 6', x:13.9, y:0.7, w:3.6, h:4.9 },
              { id:'A-R1-A123', code:'A123', name:'Local DIH', x:13.9, y:5.6, w:3.6, h:6.2 },
              { id:'A-R1-A121', code:'A121', name:'Chambrée / vestiaire niv 1 impair', x:17.5, y:0.7, w:6.6, h:11.1 },
              { id:'A-R1-A119TER', code:'A119 Ter', name:'Vestiaire PL', x:24.1, y:0.7, w:4.2, h:6.9 },
              { id:'A-R1-A119BIS', code:'A119 Bis', name:'Chambrée PL', x:28.3, y:0.7, w:4.6, h:5.9 },
              { id:'A-R1-A119', code:'A119', name:'Poste PL', x:28.3, y:6.6, w:4.6, h:5.2 },
              { id:'A-R1-ENT8', code:'', name:'Entrée BAT 8', x:32.9, y:0.7, w:3.4, h:4.9 },
              { id:'A-R1-A117', code:'A117', name:'Local', x:32.9, y:5.6, w:3.4, h:6.2 },
              { id:'A-R1-A116', code:'A116', name:'Douches / lavabos / WC', x:36.3, y:0.7, w:8.8, h:11.1 },
              { id:'A-R1-SAS', code:'', name:'SAS', x:45.1, y:11.7, w:2.2, h:3.0 },

              { id:'A-R1-A125', code:'A125', name:'Local distraction', x:0.8, y:11.8, w:4.0, h:4.3 },
              { id:'A-R1-A124', code:'A124', name:'Chambrée officier', x:4.8, y:15.1, w:8.9, h:7.2, points:[[4.8,15.1],[13.7,15.1],[13.7,22.3],[7.9,22.3]] },
              { id:'A-R1-A122', code:'A122', name:'Chambrée stagiaire', x:13.7, y:15.1, w:3.8, h:7.2 },
              { id:'A-R1-A120', code:'A120', name:'Chambrée N4', x:17.5, y:15.1, w:4.6, h:7.2 },
              { id:'A-R1-SDB120', code:'', name:'SDB', x:22.1, y:15.1, w:2.0, h:7.2 },
              { id:'A-R1-A118', code:'A118', name:'Chambrée N4', x:24.1, y:15.1, w:6.7, h:7.2 },
              { id:'A-R1-SDB118', code:'', name:'SDB', x:30.8, y:15.1, w:2.1, h:7.2 },
              { id:'A-R1-ESC', code:'', name:'Escalier', x:32.9, y:15.1, w:3.4, h:7.2 },
              { id:'A-R1-A115', code:'A115', name:'Chambrée N4', x:36.3, y:14.2, w:6.5, h:8.1 },
              { id:'A-R1-SDB115', code:'', name:'SDB', x:42.8, y:14.2, w:2.3, h:8.1 },

              { id:'A-R1-A113', code:'A113', name:'Salle entraînement', x:47.5, y:1.0, w:9.7, h:10.8 },
              { id:'A-R1-A111', code:'A111', name:'Local trans', x:57.2, y:1.0, w:3.2, h:10.8 },
              { id:'A-R1-A109BIS', code:'A109 Bis', name:'Bureau multi-services', x:60.4, y:1.0, w:4.9, h:5.5 },
              { id:'A-R1-A109', code:'A109', name:'Photocopieur', x:60.4, y:6.5, w:4.9, h:5.3 },
              { id:'A-R1-A109TER', code:'A109 Ter', name:'Bureau adjudant', x:65.3, y:1.0, w:5.0, h:5.5 },
              { id:'A-R1-A109Q', code:'A109 Quater', name:'Réserve BSC', x:65.3, y:6.5, w:5.0, h:5.3 },
              { id:'A-R1-ENT12', code:'', name:'Entrée BAT 12', x:70.3, y:1.0, w:4.8, h:4.8 },
              { id:'A-R1-A107', code:'A107', name:'Local coffre-fort', x:70.3, y:5.8, w:4.8, h:6.0 },
              { id:'A-R1-A105', code:'A105', name:'Bureau chef de centre', x:75.1, y:1.0, w:7.1, h:6.9 },
              { id:'A-R1-WCSDS', code:'', name:'WC SDS', x:76.0, y:7.9, w:2.2, h:3.9 },
              { id:'A-R1-A104', code:'A104', name:'Buanderie', x:78.2, y:7.9, w:4.0, h:3.9 },
              { id:'A-R1-A103', code:'A103', name:'Cadre officier', x:82.2, y:1.0, w:6.3, h:10.8 },
              { id:'A-R1-A102BIS', code:'A102 Bis', name:'Entrée BAT 14', x:88.5, y:1.0, w:4.0, h:4.8 },
              { id:'A-R1-A102', code:'A102', name:'Office', x:88.5, y:5.8, w:4.0, h:6.0 },
              { id:'A-R1-A101BIS', code:'A101 Bis', name:'Salle repos OMS', x:92.5, y:1.0, w:6.6, h:4.8 },
              { id:'A-R1-A101', code:'A101', name:'Poste OMS', x:92.5, y:5.8, w:6.6, h:8.5 },

              { id:'A-R1-A114', code:'A114', name:'Bureau chef de services OPS / ENT / TECH', x:47.5, y:14.3, w:9.7, h:8.0 },
              { id:'A-R1-A112', code:'A112', name:'Bureau CDG', x:57.2, y:14.3, w:5.2, h:8.0 },
              { id:'A-R1-A110', code:'A110', name:'Bureau 03', x:62.4, y:14.3, w:5.1, h:8.0 },
              { id:'A-R1-A108', code:'A108', name:'Sanitaires', x:67.5, y:14.3, w:4.9, h:8.0 },
              { id:'A-R1-ESC2', code:'', name:'Escalier', x:72.4, y:14.3, w:4.4, h:8.0 },
              { id:'A-R1-A106', code:'A106', name:'Bureau 02', x:76.8, y:14.3, w:4.8, h:8.0 },
              { id:'A-R1-A100', code:'A100', name:'Balcon', x:81.6, y:14.3, w:7.2, h:4.0 }
            ]
          }
        }
      },
      R2: {
        label: 'R+2',
        zones: {
          caserne: {
            label: 'Caserne',
            viewBox: { width: 100, height: 36.666667 },
            coordinateScaleY: 1.111111121,
            planImage: './assets/plans/A-R2.webp?v=20261007-1030',
            rooms: [
              { id:'A-R2-A214', code:'A214', name:'Chambrée niv 3 impair', x:1.7, y:0.0, w:16.9, h:16.8, points:[[1.7,0],[18.6,0],[18.6,16.8],[5.5,16.8]] },
              { id:'A-R2-ENT6', code:'', name:'Entrée BAT 6', x:18.6, y:0.0, w:6.4, h:7.0 },
              { id:'A-R2-A211', code:'A211', name:'Archives BSC', x:18.6, y:7.0, w:6.4, h:9.8 },
              { id:'A-R2-A210', code:'A210', name:'Chambrée équipe paire', x:25.0, y:0.0, w:10.8, h:16.8 },
              { id:'A-R2-A208TER', code:'A208 Ter', name:'SDB', x:35.8, y:5.2, w:5.9, h:8.1 },
              { id:'A-R2-A208BIS', code:'A208 Bis', name:'WC', x:35.8, y:13.3, w:5.9, h:3.5 },
              { id:'A-R2-A208', code:'A208', name:'Chambrée féminine', x:41.7, y:0.0, w:8.9, h:16.8 },
              { id:'A-R2-ENT8', code:'', name:'Entrée BAT 8', x:50.6, y:0.0, w:6.2, h:7.0 },
              { id:'A-R2-A206', code:'A206', name:'Local', x:50.6, y:7.0, w:6.2, h:9.8 },
              { id:'A-R2-A205', code:'A205', name:'Douches / lavabos / WC', x:56.8, y:0.0, w:18.3, h:16.8 },
              { id:'A-R2-A203', code:'A203', name:'Chambrée N3 impair', x:75.1, y:0.0, w:17.7, h:16.8 },
              { id:'A-R2-A201BIS', code:'A201 Bis', name:'Entrée / dégagement', x:86.0, y:13.3, w:6.8, h:3.5 },
              { id:'A-R2-ENT10', code:'', name:'Entrée BAT 10', x:92.8, y:0.0, w:7.2, h:7.0 },

              { id:'A-R2-A215', code:'A215', name:'Local', x:0.0, y:16.8, w:5.5, h:6.9 },
              { id:'A-R2-A213', code:'A213', name:'Chambrée N4', x:5.5, y:23.7, w:11.5, h:9.3 },
              { id:'A-R2-A212', code:'A212', name:'Chambrée stagiaire', x:17.0, y:23.7, w:8.0, h:9.3 },
              { id:'A-R2-A209', code:'A209', name:'Chambrée N4', x:25.0, y:23.7, w:7.4, h:9.3 },
              { id:'A-R2-SDB209', code:'', name:'SDB', x:32.4, y:23.7, w:3.4, h:9.3 },
              { id:'A-R2-A207', code:'A207', name:'Chambrée N4', x:35.8, y:23.7, w:11.2, h:9.3 },
              { id:'A-R2-SDB207', code:'', name:'SDB', x:47.0, y:23.7, w:3.6, h:9.3 },
              { id:'A-R2-ESC', code:'', name:'Escalier', x:50.6, y:25.5, w:6.2, h:7.5 },
              { id:'A-R2-A204', code:'A204', name:'Chambrée N4', x:56.8, y:23.7, w:17.6, h:9.3, points:[[56.8,23.7],[62.4,23.7],[64.0,22.0],[74.4,22.0],[74.4,33.0],[56.8,33.0]] },
              { id:'A-R2-SDB204', code:'', name:'SDB', x:70.7, y:23.7, w:3.7, h:9.3 },
              { id:'A-R2-A202BIS', code:'A202 Bis', name:'SDB N5', x:74.4, y:22.0, w:8.0, h:11.0 },
              { id:'A-R2-A202', code:'A202', name:'Chambrée N5', x:82.4, y:22.0, w:10.4, h:11.0 },
              { id:'A-R2-A201', code:'A201', name:'Chambrée N5', x:92.8, y:16.8, w:7.2, h:16.2 }
            ]
          }
        }
      }
    },
  },
  B: {
    label: 'Bâtiment B',
    levels: {
      RDC: {
        label: 'Rez-de-chaussée',
        zones: {
          caserne: {
            label: 'Caserne',
            viewBox: { width: 100, height: 71.523179 },
            coordinateScaleY: 0.993377486,
            planImage: './assets/plans/B-RDC-caserne.webp?v=20261007-1030',
            rooms: [
              { id:'B-RDC-CAS-B002', code:'B002', name:'Salle Crossfit', x:0.0, y:0.0, w:18.5, h:46.5 },
              { id:'B-RDC-CAS-B003', code:'B003', name:'Magasin incendie', x:18.5, y:0.0, w:13.5, h:46.5 },
              { id:'B-RDC-CAS-B003BIS', code:'B003 bis', name:'Bureau MI', x:18.5, y:46.5, w:13.5, h:25.5 },
              { id:'B-RDC-CAS-B004', code:'B004', name:'Infra', x:32.0, y:0.0, w:13.2, h:33.5 },
              { id:'B-RDC-CAS-B005', code:'B005', name:'Salle de sport', x:45.2, y:0.0, w:16.0, h:33.5 },
              { id:'B-RDC-CAS-B010', code:'B010', name:'Appro HCC', x:32.0, y:33.5, w:13.2, h:38.5 },
              { id:'B-RDC-CAS-B009', code:'B009', name:'Réserve Coop', x:45.2, y:38.0, w:16.0, h:34.0 },
              { id:'B-RDC-CAS-B007', code:'B007', name:'Circulation', x:61.2, y:18.0, w:8.0, h:54.0 },
              { id:'B-RDC-CAS-B006', code:'B006', name:'Salle TV', x:69.2, y:0.0, w:8.5, h:22.0 },
              { id:'B-RDC-CAS-B011', code:'B011', name:'Local sous escalier', x:69.2, y:51.0, w:8.5, h:21.0 },
              { id:'B-RDC-CAS-B008', code:'B008', name:'Coopérative', x:77.7, y:0.0, w:22.3, h:72.0, points:[[77.7,0],[100,0],[100,52],[92.0,72],[77.7,72]] }
            ]
          },
          garage: {
            label: 'Garage',
            viewBox: { width: 100, height: 93.103448 },
            coordinateScaleY: 2.660098514,
            planImage: './assets/plans/B-RDC-garage.webp?v=20261007-1030',
            rooms: [
              { id:'B-RDC-GAR-B001-T1', code:'B001', name:'Travée 1', x:0.0, y:0.0, w:18.0, h:35.0 },
              { id:'B-RDC-GAR-B001-T2', code:'B001', name:'Travée 2', x:18.0, y:0.0, w:18.0, h:35.0 },
              { id:'B-RDC-GAR-B001-T3', code:'B001', name:'Travée 3', x:36.0, y:0.0, w:18.0, h:35.0 },
              { id:'B-RDC-GAR-B001-T4', code:'B001', name:'Travée 4', x:54.0, y:0.0, w:18.0, h:35.0 },
              { id:'B-RDC-GAR-B001-T5', code:'B001', name:'Travée 5', x:72.0, y:0.0, w:14.0, h:16.0 },
              { id:'B-RDC-GAR-MEZZ', code:'', name:'Mezzanine', x:72.0, y:16.0, w:14.0, h:19.0 },
              { id:'B-RDC-GAR-CCFS', code:'', name:'CCFS', x:86.0, y:0.0, w:7.0, h:35.0 },
              { id:'B-RDC-GAR-VRCG3', code:'', name:'VRCG3 / CDF', x:93.0, y:0.0, w:7.0, h:35.0 }
            ]
          }
        }
      },
      R1: {
        label: 'R+1',
        zones: {
          caserne: {
            label: 'Caserne',
            viewBox: { width: 100, height: 60.888889 },
            coordinateScaleY: 2.029629633,
            planImage: './assets/plans/B-R1.webp?v=20261007-1030',
            rooms: [
              { id:'B-R1-B109', code:'B109', name:'Salle musculation', x:0.0, y:0.0, w:39.5, h:15.8 },
              { id:'B-R1-B108', code:'B108', name:'Salle cardio', x:41.6, y:0.0, w:16.5, h:15.8 },
              { id:'B-R1-B102', code:'B102', name:'HCC', x:58.1, y:0.0, w:21.2, h:15.8 },
              { id:'B-R1-B101', code:'B101', name:'Poste OM', x:79.3, y:0.0, w:20.7, h:30.0 },
              { id:'B-R1-B107', code:'B107', name:'Bureau sport GPTS', x:0.0, y:15.8, w:18.8, h:14.2 },
              { id:'B-R1-B106', code:'B106', name:'Buanderie', x:18.8, y:15.8, w:13.9, h:14.2 },
              { id:'B-R1-B105', code:'B105', name:'Salon de coiffure', x:32.7, y:15.8, w:13.6, h:14.2 },
              { id:'B-R1-B104', code:'B104', name:'WC hommes', x:46.3, y:15.8, w:8.7, h:14.2 },
              { id:'B-R1-B103', code:'B103', name:'WC femmes', x:55.0, y:15.8, w:7.9, h:14.2 },
              { id:'B-R1-ESC', code:'', name:'Escalier', x:62.9, y:15.8, w:16.4, h:14.2 }
            ]
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
