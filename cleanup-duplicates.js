const Database = require('better-sqlite3');

console.log('🧹 Pulizia duplicati dal database...');

try {
  const db = new Database('./data/salon_sage.db');

  // Conta items prima
  const beforeServices = db.prepare('SELECT COUNT(*) as count FROM services').get();
  const beforeSubs = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get();
  
  console.log(`Prima: ${beforeServices.count} servizi, ${beforeSubs.count} abbonamenti`);

  // Rimuovi duplicati servizi
  const serviceDuplicates = db.prepare(`
    SELECT name, MIN(rowid) as keep_rowid, COUNT(*) as count
    FROM services 
    GROUP BY name 
    HAVING COUNT(*) > 1
  `).all();

  let deletedServices = 0;
  serviceDuplicates.forEach(service => {
    const deleteStmt = db.prepare('DELETE FROM services WHERE name = ? AND rowid != ?');
    const result = deleteStmt.run(service.name, service.keep_rowid);
    deletedServices += result.changes;
    console.log(`  🗑️ Rimossi ${result.changes} duplicati del servizio: ${service.name}`);
  });

  // Rimuovi duplicati abbonamenti
  const subDuplicates = db.prepare(`
    SELECT name, MIN(rowid) as keep_rowid, COUNT(*) as count
    FROM subscriptions 
    GROUP BY name 
    HAVING COUNT(*) > 1
  `).all();

  let deletedSubs = 0;
  subDuplicates.forEach(sub => {
    const deleteStmt = db.prepare('DELETE FROM subscriptions WHERE name = ? AND rowid != ?');
    const result = deleteStmt.run(sub.name, sub.keep_rowid);
    deletedSubs += result.changes;
    console.log(`  🗑️ Rimossi ${result.changes} duplicati dell'abbonamento: ${sub.name}`);
  });

  // Conta items dopo
  const afterServices = db.prepare('SELECT COUNT(*) as count FROM services').get();
  const afterSubs = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get();

  console.log(`Dopo: ${afterServices.count} servizi, ${afterSubs.count} abbonamenti`);
  console.log(`✅ Rimossi ${deletedServices} servizi duplicati e ${deletedSubs} abbonamenti duplicati`);

  db.close();
} catch (error) {
  console.error('❌ Errore:', error);
  process.exit(1);
}
