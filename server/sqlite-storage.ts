import Database from 'better-sqlite3';
import { randomUUID } from "crypto";
import path from 'path';
import fs from 'fs';
import { 
  type Client, type InsertClient,
  type Service, type InsertService,
  type Subscription, type InsertSubscription,
  type ClientSubscription, type InsertClientSubscription,
  type Booking, type InsertBooking,
  type LicenseKey, type InsertLicenseKey
} from "@shared/schema";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByPhone(phone: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  // Subscriptions
  getSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;

  // Client Subscriptions
  getClientSubscriptions(): Promise<ClientSubscription[]>;
  getClientSubscription(id: string): Promise<ClientSubscription | undefined>;
  getClientSubscriptionsByClientId(clientId: string): Promise<ClientSubscription[]>;
  createClientSubscription(clientSubscription: InsertClientSubscription): Promise<ClientSubscription>;
  updateClientSubscription(id: string, clientSubscription: Partial<InsertClientSubscription>): Promise<ClientSubscription | undefined>;
  deleteClientSubscription(id: string): Promise<boolean>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByClientId(clientId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;

  // License Keys
  getLicenseKeys(): Promise<LicenseKey[]>;
  getLicenseKey(key: string): Promise<LicenseKey | undefined>;
  createLicenseKey(licenseKey: InsertLicenseKey): Promise<LicenseKey>;
  validateLicense(key: string): Promise<boolean>;
}

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor(dbPath: string = 'salon_sage.db') {
    // Assicurati che la directory esista
    const fullPath = path.resolve(dbPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(fullPath);
    this.db.pragma('foreign_keys = ON');
    this.initializeTables();
    this.initializeDefaults();
  }

  private initializeTables() {
    // Crea le tabelle se non esistono
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        duration INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        services_included TEXT NOT NULL,
        usage_limit INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS client_subscriptions (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        subscription_id TEXT NOT NULL,
        remaining_uses INTEGER NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATETIME,
        is_active INTEGER DEFAULT 1,
        scaled_usage_limit INTEGER,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        service_id TEXT NOT NULL,
        additional_services TEXT,
        client_subscription_id TEXT,
        appointment_date DATETIME NOT NULL,
        total_price TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (service_id) REFERENCES services(id),
        FOREIGN KEY (client_subscription_id) REFERENCES client_subscriptions(id)
      );

      CREATE TABLE IF NOT EXISTS license_keys (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        expiry_date DATETIME,
        features TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private initializeDefaults() {
    // Verifica se ci sono già dati per ogni tabella specificamente
    const serviceCount = this.db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
    const subscriptionCount = this.db.prepare('SELECT COUNT(*) as count FROM subscriptions').get() as { count: number };
    const licenseCount = this.db.prepare('SELECT COUNT(*) as count FROM license_keys').get() as { count: number };

    // Servizi di default (solo se non ci sono servizi)
    if (serviceCount.count === 0) {
      const defaultServices = [
        { name: "Taglio e Piega", description: "Taglio professionale con piega", price: "85.00", duration: 60, isActive: true },
        { name: "Colore Capelli", description: "Servizio completo di colorazione capelli", price: "150.00", duration: 120, isActive: true },
        { name: "Condizionamento Profondo", description: "Trattamento intensivo per capelli", price: "75.00", duration: 45, isActive: true },
        { name: "Trattamento Capelli", description: "Trattamento specializzato per la cura dei capelli", price: "95.00", duration: 90, isActive: true },
        { name: "Shampoo e Piega", description: "Servizio base di lavaggio e asciugatura", price: "45.00", duration: 30, isActive: true },
      ];

      for (const service of defaultServices) {
        this.createService({
          ...service,
          price: parseFloat(service.price)
        });
      }
    }

    // Pacchetti di default (solo se non ci sono abbonamenti)
    if (subscriptionCount.count === 0) {
      const defaultSubscriptions = [
        { 
          name: "Pacchetto Base", 
          description: "3 servizi base al mese", 
          price: "200.00", 
          servicesIncluded: ["Taglio e Piega", "Shampoo e Piega"], 
          usageLimit: 3, 
          isActive: true 
        },
        { 
          name: "Pacchetto Premium", 
          description: "5 servizi premium al mese", 
          price: "350.00", 
          servicesIncluded: ["Taglio e Piega", "Colore Capelli", "Condizionamento Profondo"], 
          usageLimit: 5, 
          isActive: true 
        },
      ];

      for (const subscription of defaultSubscriptions) {
        this.createSubscription({
          ...subscription,
          price: parseFloat(subscription.price)
        });
      }
    }

    // Chiave di licenza di default (solo se non ne esistono)
    if (licenseCount.count === 0) {
      this.createLicenseKey({
        key: "SALON_SAGE_FULL_2024",
        isActive: true,
        expiryDate: null,
        features: ["full_access", "analytics", "unlimited_clients"]
      });
    }
  }

  // Backup e restore methods
  backup(backupPath: string): void {
    const backup = this.db.backup(backupPath);
    backup.then(() => {
      console.log(`Backup completato: ${backupPath}`);
    }).catch((err) => {
      console.error('Errore durante il backup:', err);
    });
  }

  // Helper per convertire row del database in oggetti tipizzati
  private dbRowToClient(row: any): Client {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    };
  }

  private dbRowToService(row: any): Service {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      duration: row.duration,
      isActive: row.is_active === 1
    };
  }

  private dbRowToSubscription(row: any): Subscription {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      servicesIncluded: JSON.parse(row.services_included),
      usageLimit: row.usage_limit,
      isActive: row.is_active === 1
    };
  }

  private dbRowToClientSubscription(row: any): ClientSubscription {
    return {
      id: row.id,
      clientId: row.client_id,
      subscriptionId: row.subscription_id,
      remainingUses: row.remaining_uses,
      purchaseDate: new Date(row.purchase_date),
      expiryDate: row.expiry_date ? new Date(row.expiry_date) : null,
      isActive: row.is_active === 1,
      scaledUsageLimit: row.scaled_usage_limit
    };
  }

  private dbRowToBooking(row: any): Booking {
    return {
      id: row.id,
      clientId: row.client_id,
      serviceId: row.service_id,
      additionalServices: row.additional_services ? JSON.parse(row.additional_services) : null,
      clientSubscriptionId: row.client_subscription_id,
      appointmentDate: new Date(row.appointment_date),
      totalPrice: row.total_price,
      status: row.status,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    };
  }

  private dbRowToLicenseKey(row: any): LicenseKey {
    return {
      id: row.id,
      key: row.key,
      isActive: row.is_active === 1,
      expiryDate: row.expiry_date ? new Date(row.expiry_date) : null,
      features: JSON.parse(row.features)
    };
  }

  // Clients
  async getClients(): Promise<Client[]> {
    const stmt = this.db.prepare('SELECT * FROM clients ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.dbRowToClient(row));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const stmt = this.db.prepare('SELECT * FROM clients WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return this.dbRowToClient(row);
  }

  async getClientByPhone(phone: string): Promise<Client | undefined> {
    const stmt = this.db.prepare('SELECT * FROM clients WHERE phone = ?');
    const row = stmt.get(phone) as any;
    if (!row) return undefined;
    return this.dbRowToClient(row);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { 
      ...insertClient,
      email: insertClient.email || null,
      notes: insertClient.notes || null,
      id, 
      createdAt: new Date() 
    };

    const stmt = this.db.prepare(`
      INSERT INTO clients (id, first_name, last_name, phone, email, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      client.id,
      client.firstName,
      client.lastName,
      client.phone,
      client.email,
      client.notes,
      client.createdAt ? client.createdAt.toISOString() : new Date().toISOString()
    );

    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const current = await this.getClient(id);
    if (!current) return undefined;

    const updated = { ...current, ...updateData };
    const stmt = this.db.prepare(`
      UPDATE clients 
      SET first_name = ?, last_name = ?, phone = ?, email = ?, notes = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.firstName,
      updated.lastName,
      updated.phone,
      updated.email,
      updated.notes,
      id
    );

    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Services
  async getServices(): Promise<Service[]> {
    const stmt = this.db.prepare('SELECT * FROM services ORDER BY name');
    const rows = stmt.all() as any[];
    return rows.map(row => this.dbRowToService(row));
  }

  async getService(id: string): Promise<Service | undefined> {
    const stmt = this.db.prepare('SELECT * FROM services WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return this.dbRowToService(row);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { 
      ...insertService,
      description: insertService.description || null,
      isActive: insertService.isActive ?? true,
      id 
    };

    const stmt = this.db.prepare(`
      INSERT INTO services (id, name, description, price, duration, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      service.id,
      service.name,
      service.description,
      service.price,
      service.duration,
      service.isActive ? 1 : 0
    );

    return service;
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const current = await this.getService(id);
    if (!current) return undefined;

    const updated = { ...current, ...updateData };
    const stmt = this.db.prepare(`
      UPDATE services 
      SET name = ?, description = ?, price = ?, duration = ?, is_active = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.name,
      updated.description,
      updated.price,
      updated.duration,
      updated.isActive ? 1 : 0,
      id
    );

    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM services WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    const stmt = this.db.prepare('SELECT * FROM subscriptions ORDER BY name');
    const rows = stmt.all() as any[];
    return rows.map(row => this.dbRowToSubscription(row));
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const stmt = this.db.prepare('SELECT * FROM subscriptions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return this.dbRowToSubscription(row);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = { 
      ...insertSubscription,
      description: insertSubscription.description || null,
      isActive: insertSubscription.isActive ?? true,
      servicesIncluded: Array.isArray(insertSubscription.servicesIncluded) 
        ? insertSubscription.servicesIncluded as string[]
        : [],
      id 
    };

    const stmt = this.db.prepare(`
      INSERT INTO subscriptions (id, name, description, price, services_included, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      subscription.id,
      subscription.name,
      subscription.description,
      subscription.price,
      JSON.stringify(subscription.servicesIncluded),
      subscription.usageLimit,
      subscription.isActive ? 1 : 0
    );

    return subscription;
  }

  async updateSubscription(id: string, updateData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const current = await this.getSubscription(id);
    if (!current) return undefined;

    const updated = { 
      ...current, 
      ...updateData,
      servicesIncluded: updateData.servicesIncluded 
        ? Array.isArray(updateData.servicesIncluded) 
          ? updateData.servicesIncluded as string[]
          : current.servicesIncluded
        : current.servicesIncluded
    };

    const stmt = this.db.prepare(`
      UPDATE subscriptions 
      SET name = ?, description = ?, price = ?, services_included = ?, usage_limit = ?, is_active = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.name,
      updated.description,
      updated.price,
      JSON.stringify(updated.servicesIncluded),
      updated.usageLimit,
      updated.isActive ? 1 : 0,
      id
    );

    return updated;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM subscriptions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Client Subscriptions
  async getClientSubscriptions(): Promise<ClientSubscription[]> {
    const stmt = this.db.prepare('SELECT * FROM client_subscriptions ORDER BY purchase_date DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.dbRowToClientSubscription(row));
  }

  async getClientSubscription(id: string): Promise<ClientSubscription | undefined> {
    const stmt = this.db.prepare('SELECT * FROM client_subscriptions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return this.dbRowToClientSubscription(row);
  }

  async getClientSubscriptionsByClientId(clientId: string): Promise<ClientSubscription[]> {
    const stmt = this.db.prepare('SELECT * FROM client_subscriptions WHERE client_id = ? ORDER BY purchase_date DESC');
    const rows = stmt.all(clientId) as any[];
    return rows.map(row => this.dbRowToClientSubscription(row));
  }

  async createClientSubscription(insertClientSubscription: InsertClientSubscription): Promise<ClientSubscription> {
    const id = randomUUID();
    const clientSubscription: ClientSubscription = { 
      ...insertClientSubscription,
      isActive: insertClientSubscription.isActive ?? true,
      expiryDate: insertClientSubscription.expiryDate || null,
      scaledUsageLimit: insertClientSubscription.scaledUsageLimit || null,
      id, 
      purchaseDate: new Date() 
    };

    const stmt = this.db.prepare(`
      INSERT INTO client_subscriptions (id, client_id, subscription_id, remaining_uses, purchase_date, expiry_date, is_active, scaled_usage_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      clientSubscription.id,
      clientSubscription.clientId,
      clientSubscription.subscriptionId,
      clientSubscription.remainingUses,
      clientSubscription.purchaseDate ? clientSubscription.purchaseDate.toISOString() : new Date().toISOString(),
      clientSubscription.expiryDate?.toISOString() || null,
      clientSubscription.isActive ? 1 : 0,
      clientSubscription.scaledUsageLimit
    );

    return clientSubscription;
  }

  async updateClientSubscription(id: string, updateData: Partial<InsertClientSubscription>): Promise<ClientSubscription | undefined> {
    const current = await this.getClientSubscription(id);
    if (!current) return undefined;

    const updated = { ...current, ...updateData };
    const stmt = this.db.prepare(`
      UPDATE client_subscriptions 
      SET client_id = ?, subscription_id = ?, remaining_uses = ?, expiry_date = ?, is_active = ?, scaled_usage_limit = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updated.clientId,
      updated.subscriptionId,
      updated.remainingUses,
      updated.expiryDate?.toISOString() || null,
      updated.isActive ? 1 : 0,
      updated.scaledUsageLimit,
      id
    );

    return updated;
  }

  async deleteClientSubscription(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM client_subscriptions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const stmt = this.db.prepare('SELECT * FROM bookings ORDER BY appointment_date DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.dbRowToBooking(row));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const stmt = this.db.prepare('SELECT * FROM bookings WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return this.dbRowToBooking(row);
  }

  async getBookingsByClientId(clientId: string): Promise<Booking[]> {
    const stmt = this.db.prepare('SELECT * FROM bookings WHERE client_id = ? ORDER BY appointment_date DESC');
    const rows = stmt.all(clientId) as any[];
    return rows.map(row => this.dbRowToBooking(row));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking,
      notes: insertBooking.notes || null,
      status: insertBooking.status || 'scheduled',
      additionalServices: Array.isArray(insertBooking.additionalServices) 
        ? insertBooking.additionalServices as string[]
        : null,
      clientSubscriptionId: insertBooking.clientSubscriptionId || null,
      id, 
      createdAt: new Date() 
    };

    const stmt = this.db.prepare(`
      INSERT INTO bookings (id, client_id, service_id, additional_services, client_subscription_id, appointment_date, total_price, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      booking.id,
      booking.clientId,
      booking.serviceId,
      booking.additionalServices ? JSON.stringify(booking.additionalServices) : null,
      booking.clientSubscriptionId,
      booking.appointmentDate.toISOString(),
      booking.totalPrice,
      booking.status,
      booking.notes,
      booking.createdAt ? booking.createdAt.toISOString() : new Date().toISOString()
    );

    return booking;
  }

  async updateBooking(id: string, updateData: Partial<InsertBooking>): Promise<Booking | undefined> {
    try {
      const current = await this.getBooking(id);
      if (!current) {
        return undefined;
      }

      // Filter out undefined values from updateData to prevent overwriting existing values
      const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const updated = { 
        ...current, 
        ...filteredUpdateData,
        additionalServices: filteredUpdateData.additionalServices !== undefined
          ? Array.isArray(filteredUpdateData.additionalServices) 
            ? filteredUpdateData.additionalServices as string[]
            : current.additionalServices
          : current.additionalServices
      };

      // Ensure appointmentDate is a valid Date object
      const appointmentDate = updated.appointmentDate instanceof Date 
        ? updated.appointmentDate 
        : new Date(updated.appointmentDate);

      const stmt = this.db.prepare(`
        UPDATE bookings 
        SET client_id = ?, service_id = ?, additional_services = ?, client_subscription_id = ?, appointment_date = ?, total_price = ?, status = ?, notes = ?
        WHERE id = ?
      `);
      
      stmt.run(
        updated.clientId,
        updated.serviceId,
        updated.additionalServices ? JSON.stringify(updated.additionalServices) : null,
        updated.clientSubscriptionId,
        appointmentDate.getTime(), // Store as timestamp
        updated.totalPrice,
        updated.status,
        updated.notes,
        id
      );

      return updated;
    } catch (error) {
      console.error('[updateBooking] Error:', error);
      throw error;
    }
  }

  async deleteBooking(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM bookings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // License Keys
  async getLicenseKeys(): Promise<LicenseKey[]> {
    const stmt = this.db.prepare('SELECT * FROM license_keys');
    const rows = stmt.all() as any[];
    return rows.map(row => this.dbRowToLicenseKey(row));
  }

  async getLicenseKey(key: string): Promise<LicenseKey | undefined> {
    const stmt = this.db.prepare('SELECT * FROM license_keys WHERE key = ?');
    const row = stmt.get(key) as any;
    if (!row) return undefined;
    return this.dbRowToLicenseKey(row);
  }

  async createLicenseKey(insertLicenseKey: InsertLicenseKey): Promise<LicenseKey> {
    const id = randomUUID();
    const licenseKey: LicenseKey = { 
      ...insertLicenseKey,
      isActive: insertLicenseKey.isActive ?? true,
      expiryDate: insertLicenseKey.expiryDate || null,
      features: Array.isArray(insertLicenseKey.features) 
        ? insertLicenseKey.features as string[]
        : [],
      id 
    };

    const stmt = this.db.prepare(`
      INSERT INTO license_keys (id, key, is_active, expiry_date, features)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      licenseKey.id,
      licenseKey.key,
      licenseKey.isActive ? 1 : 0,
      licenseKey.expiryDate?.toISOString() || null,
      JSON.stringify(licenseKey.features)
    );

    return licenseKey;
  }

  async validateLicense(key: string): Promise<boolean> {
    const license = await this.getLicenseKey(key);
    if (!license || !license.isActive) return false;
    if (license.expiryDate && new Date() > license.expiryDate) return false;
    return true;
  }

  // Metodi per aggiornamenti automatici
  async setAppMetadata(key: string, value: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO app_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, value, new Date().toISOString());
  }

  async getAppMetadata(key: string): Promise<string | null> {
    const stmt = this.db.prepare('SELECT value FROM app_metadata WHERE key = ?');
    const row = stmt.get(key) as any;
    return row ? row.value : null;
  }

  close(): void {
    this.db.close();
  }
}
