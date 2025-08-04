import Database from 'better-sqlite3';
import { randomUUID } from "crypto";

const databasePath = "./data/salon_sage.db";
const db = new Database(databasePath);

// Insert sample clients
const insertClient = db.prepare(`
  INSERT INTO clients (id, first_name, last_name, phone, email, notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertService = db.prepare(`
  INSERT INTO services (id, name, description, price, duration, is_active)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Sample clients
const clients = [
  {
    id: randomUUID(),
    firstName: "Mario",
    lastName: "Rossi",
    phone: "+39 123 456 7890",
    email: "mario.rossi@email.com",
    notes: "Cliente abituale",
    createdAt: Date.now()
  },
  {
    id: randomUUID(),
    firstName: "Giulia",
    lastName: "Bianchi", 
    phone: "+39 987 654 3210",
    email: "giulia.bianchi@email.com", 
    notes: "Preferisce appuntamenti pomeridiani",
    createdAt: Date.now()
  },
  {
    id: randomUUID(),
    firstName: "Luca",
    lastName: "Verdi",
    phone: "+39 555 123 4567",
    email: "luca.verdi@email.com",
    notes: "",
    createdAt: Date.now()
  }
];

// Sample services
const services = [
  {
    id: randomUUID(),
    name: "Taglio Uomo",
    description: "Taglio di capelli per uomo",
    price: 25.00,
    duration: 30,
    isActive: 1
  },
  {
    id: randomUUID(),
    name: "Taglio Donna",
    description: "Taglio di capelli per donna",
    price: 35.00,
    duration: 45,
    isActive: 1
  },
  {
    id: randomUUID(),
    name: "Colore",
    description: "Tinta per capelli",
    price: 60.00,
    duration: 120,
    isActive: 1
  },
  {
    id: randomUUID(),
    name: "Piega",
    description: "Piega con phon",
    price: 20.00,
    duration: 30,
    isActive: 1
  },
  {
    id: randomUUID(),
    name: "Barba",
    description: "Taglio e sistemazione barba",
    price: 15.00,
    duration: 20,
    isActive: 1
  }
];

console.log("Inserimento dati di esempio...");

// Insert clients
for (const client of clients) {
  try {
    insertClient.run(
      client.id,
      client.firstName,
      client.lastName,
      client.phone,
      client.email,
      client.notes,
      client.createdAt
    );
    console.log(`✓ Cliente inserito: ${client.firstName} ${client.lastName}`);
  } catch (error) {
    console.error(`✗ Errore inserimento cliente ${client.firstName}:`, error.message);
  }
}

// Insert services  
for (const service of services) {
  try {
    insertService.run(
      service.id,
      service.name,
      service.description,
      service.price,
      service.duration,
      service.isActive
    );
    console.log(`✓ Servizio inserito: ${service.name}`);
  } catch (error) {
    console.error(`✗ Errore inserimento servizio ${service.name}:`, error.message);
  }
}

db.close();
console.log("✅ Dati di esempio inseriti con successo!");
