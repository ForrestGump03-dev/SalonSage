import { 
  type Client, type InsertClient,
  type Service, type InsertService,
  type Subscription, type InsertSubscription,
  type ClientSubscription, type InsertClientSubscription,
  type Booking, type InsertBooking,
  type LicenseKey, type InsertLicenseKey
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private clients: Map<string, Client>;
  private services: Map<string, Service>;
  private subscriptions: Map<string, Subscription>;
  private clientSubscriptions: Map<string, ClientSubscription>;
  private bookings: Map<string, Booking>;
  private licenseKeys: Map<string, LicenseKey>;

  constructor() {
    this.clients = new Map();
    this.services = new Map();
    this.subscriptions = new Map();
    this.clientSubscriptions = new Map();
    this.bookings = new Map();
    this.licenseKeys = new Map();

    // Initialize with default services and subscriptions
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    // Default services
    const defaultServices = [
      { name: "Taglio e Piega", description: "Taglio professionale con piega", price: "85.00", duration: 60, isActive: true },
      { name: "Colore Capelli", description: "Servizio completo di colorazione capelli", price: "150.00", duration: 120, isActive: true },
      { name: "Condizionamento Profondo", description: "Trattamento intensivo per capelli", price: "75.00", duration: 45, isActive: true },
      { name: "Trattamento Capelli", description: "Trattamento specializzato per la cura dei capelli", price: "95.00", duration: 90, isActive: true },
      { name: "Shampoo e Piega", description: "Servizio base di lavaggio e asciugatura", price: "45.00", duration: 30, isActive: true },
    ];

    for (const service of defaultServices) {
      await this.createService(service);
    }

    // Default subscriptions
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
      await this.createSubscription(subscription);
    }

    // Default license key
    await this.createLicenseKey({
      key: "SALON_FLOW_FULL_2024",
      isActive: true,
      expiryDate: null,
      features: ["full_access", "analytics", "unlimited_clients"]
    });
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByPhone(phone: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.phone === phone);
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
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...updateData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Services
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { 
      ...insertService,
      description: insertService.description || null,
      isActive: insertService.isActive ?? true,
      id 
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...updateData };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = { 
      ...insertSubscription,
      description: insertSubscription.description || null,
      isActive: insertSubscription.isActive ?? true,
      id 
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: string, updateData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updateData };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    return this.subscriptions.delete(id);
  }

  // Client Subscriptions
  async getClientSubscriptions(): Promise<ClientSubscription[]> {
    return Array.from(this.clientSubscriptions.values());
  }

  async getClientSubscription(id: string): Promise<ClientSubscription | undefined> {
    return this.clientSubscriptions.get(id);
  }

  async getClientSubscriptionsByClientId(clientId: string): Promise<ClientSubscription[]> {
    return Array.from(this.clientSubscriptions.values()).filter(cs => cs.clientId === clientId);
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
    this.clientSubscriptions.set(id, clientSubscription);
    return clientSubscription;
  }

  async updateClientSubscription(id: string, updateData: Partial<InsertClientSubscription>): Promise<ClientSubscription | undefined> {
    const clientSubscription = this.clientSubscriptions.get(id);
    if (!clientSubscription) return undefined;
    
    const updatedClientSubscription = { ...clientSubscription, ...updateData };
    this.clientSubscriptions.set(id, updatedClientSubscription);
    return updatedClientSubscription;
  }

  async deleteClientSubscription(id: string): Promise<boolean> {
    return this.clientSubscriptions.delete(id);
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByClientId(clientId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.clientId === clientId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking,
      notes: insertBooking.notes || null,
      additionalServices: insertBooking.additionalServices || null,
      clientSubscriptionId: insertBooking.clientSubscriptionId || null,
      id, 
      createdAt: new Date() 
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updateData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updateData };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  // License Keys
  async getLicenseKeys(): Promise<LicenseKey[]> {
    return Array.from(this.licenseKeys.values());
  }

  async getLicenseKey(key: string): Promise<LicenseKey | undefined> {
    return Array.from(this.licenseKeys.values()).find(lk => lk.key === key);
  }

  async createLicenseKey(insertLicenseKey: InsertLicenseKey): Promise<LicenseKey> {
    const id = randomUUID();
    const licenseKey: LicenseKey = { 
      ...insertLicenseKey,
      isActive: insertLicenseKey.isActive ?? true,
      expiryDate: insertLicenseKey.expiryDate || null,
      id 
    };
    this.licenseKeys.set(id, licenseKey);
    return licenseKey;
  }

  async validateLicense(key: string): Promise<boolean> {
    const license = await this.getLicenseKey(key);
    if (!license || !license.isActive) return false;
    if (license.expiryDate && new Date() > license.expiryDate) return false;
    return true;
  }
}

export const storage = new MemStorage();
