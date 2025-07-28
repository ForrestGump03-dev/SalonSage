import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertServiceSchema, 
  insertSubscriptionSchema,
  insertClientSubscriptionSchema,
  insertBookingSchema,
  insertLicenseKeySchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      
      // Check if client with phone already exists
      const existingClient = await storage.getClientByPhone(clientData.phone);
      if (existingClient) {
        return res.status(400).json({ message: "Client with this phone number already exists" });
      }

      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const updateData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, updateData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const updateData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, updateData);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteService(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Subscription routes
  app.get("/api/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const subscriptionData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      const subscriptionId = req.params.id;
      await storage.deleteSubscription(subscriptionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  // Client Subscription routes
  app.get("/api/client-subscriptions", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      if (clientId) {
        const clientSubscriptions = await storage.getClientSubscriptionsByClientId(clientId);
        res.json(clientSubscriptions);
      } else {
        const clientSubscriptions = await storage.getClientSubscriptions();
        res.json(clientSubscriptions);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client subscriptions" });
    }
  });

  app.post("/api/client-subscriptions", async (req, res) => {
    try {
      const clientSubscriptionData = insertClientSubscriptionSchema.parse(req.body);
      const clientSubscription = await storage.createClientSubscription(clientSubscriptionData);
      res.status(201).json(clientSubscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client subscription data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client subscription" });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      if (clientId) {
        const bookings = await storage.getBookingsByClientId(clientId);
        res.json(bookings);
      } else {
        const bookings = await storage.getBookings();
        res.json(bookings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // If using subscription, deduct usage
      if (bookingData.clientSubscriptionId) {
        const clientSubscription = await storage.getClientSubscription(bookingData.clientSubscriptionId);
        if (clientSubscription && clientSubscription.remainingUses > 0) {
          await storage.updateClientSubscription(bookingData.clientSubscriptionId, {
            remainingUses: clientSubscription.remainingUses - 1
          });
        } else {
          return res.status(400).json({ message: "No remaining uses on subscription" });
        }
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const updateData = insertBookingSchema.partial().extend({
        additionalServices: z.array(z.string()).optional()
      }).parse(req.body);
      const booking = await storage.updateBooking(req.params.id, updateData);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Client subscription update route for scaling
  app.put("/api/client-subscriptions/:id", async (req, res) => {
    try {
      const updateData = insertClientSubscriptionSchema.partial().extend({
        scaledUsageLimit: z.number().optional()
      }).parse(req.body);
      const clientSubscription = await storage.updateClientSubscription(req.params.id, updateData);
      if (!clientSubscription) {
        return res.status(404).json({ message: "Client subscription not found" });
      }
      res.json(clientSubscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client subscription data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client subscription" });
    }
  });

  // Single subscription by ID
  app.get("/api/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const clients = await storage.getClients();
      const bookings = await storage.getBookings();
      const clientSubscriptions = await storage.getClientSubscriptions();
      const services = await storage.getServices();

      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Calculate stats
      const activeClients = clients.length;
      const todayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.appointmentDate);
        return bookingDate.toDateString() === today.toDateString();
      });

      const monthlyRevenue = bookings
        .filter(booking => new Date(booking.createdAt) >= thisMonth)
        .reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0);

      const activeSubscriptions = clientSubscriptions.filter(cs => cs.isActive).length;

      // Service analytics
      const serviceBookingCounts = new Map<string, number>();
      bookings.forEach(booking => {
        const count = serviceBookingCounts.get(booking.serviceId) || 0;
        serviceBookingCounts.set(booking.serviceId, count + 1);
      });

      const maxBookings = Math.max(...Array.from(serviceBookingCounts.values()));
      const serviceAnalytics = services.map(service => {
        const bookingCount = serviceBookingCounts.get(service.id) || 0;
        const percentage = maxBookings > 0 ? Math.round((bookingCount / maxBookings) * 100) : 0;
        return {
          id: service.id,
          name: service.name,
          bookings: bookingCount,
          percentage
        };
      }).sort((a, b) => b.bookings - a.bookings);

      res.json({
        stats: {
          activeClients,
          monthlyRevenue,
          todayAppointments: todayBookings.length,
          activeSubscriptions,
          subscriptionRate: activeClients > 0 ? Math.round((activeSubscriptions / activeClients) * 100) : 0
        },
        serviceAnalytics,
        todayBookings: todayBookings.slice(0, 5) // Limit to 5 for display
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // License validation
  app.post("/api/license/validate", async (req, res) => {
    try {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ message: "License key is required" });
      }

      const isValid = await storage.validateLicense(key);
      const license = await storage.getLicenseKey(key);
      
      res.json({ 
        isValid, 
        features: license?.features || [],
        expiryDate: license?.expiryDate 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate license" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
