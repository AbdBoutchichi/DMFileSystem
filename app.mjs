import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convertir import.meta.url en chemin de fichier pour obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Définition des chemins
const storesDirPath = path.join(__dirname, 'stores');
const salesTotalsDirPath = path.join(__dirname, 'salesTotals');

// Vérifier l'existence du répertoire salesTotals, sinon le créer
if (!fs.existsSync(salesTotalsDirPath)) {
  fs.mkdirSync(salesTotalsDirPath);
}

// Chemins des fichiers dans salesTotals
const totalsFilePath = path.join(salesTotalsDirPath, 'totals.txt');
const totalFilePath = path.join(salesTotalsDirPath, 'total.txt');

// Fonction pour parcourir les fichiers JSON et calculer les totaux
async function calculateAndWriteTotals(dirPath) {
  let cumulativeTotal = 0;
  let totalsByDate = '';

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subResult = await calculateAndWriteTotals(fullPath);
      cumulativeTotal += subResult.cumulativeTotal;
      totalsByDate += subResult.totalsByDate;
    } else if (entry.isFile() && path.extname(fullPath) === '.json') {
      const data = JSON.parse(fs.readFileSync(fullPath));
      if (data.total) {
        cumulativeTotal += data.total;
        const date = new Date().toLocaleDateString();
        totalsByDate += `Total le ${date}: ${data.total} €\n`;
      }
    }
  }

  return { cumulativeTotal, totalsByDate };
}

// Fonction principale pour exécuter le script
async function run() {
    const { cumulativeTotal, totalsByDate } = await calculateAndWriteTotals(storesDirPath);
    const todayDate = new Date().toLocaleDateString();
  
    // Filtrer les totaux pour obtenir uniquement ceux de la date du jour
    const totalForToday = totalsByDate
      .split('\n')
      .filter(line => line.includes(`Total le ${todayDate}`))
      .reduce((total, line) => {
        const match = line.match(/: ([\d.]+) €/);
        return total + (match ? parseFloat(match[1]) : 0);
      }, 0);
  
    // Écrire les totaux par date dans totals.txt (cette ligne reste inchangée)
    fs.writeFileSync(totalsFilePath, totalsByDate, { flag: 'a' });

    // Ajouter le total cumulé pour la date du jour à la fin de total.txt sans écraser l'ancien contenu
    const totalLine = `Le total cumulé pour la date "${todayDate}" est : ${totalForToday} €\n`;
    fs.appendFileSync(totalFilePath, totalLine);
  
    console.log('Les fichiers dans salesTotals ont été mis à jour.');
  }
  
  run().catch(console.error);
