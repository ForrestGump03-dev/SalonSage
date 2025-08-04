import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const services = sqliteTable("services", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  duration: integer("duration").notNull(), // in minutes
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  servicesIncluded: text("services_included", { mode: 'json' }).$type<string[]>().notNull(),
  usageLimit: integer("usage_limit").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
});

export const clientSubscriptions = sqliteTable("client_subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id).notNull(),
  subscriptionId: text("subscription_id").references(() => subscriptions.id).notNull(),
  remainingUses: integer("remaining_uses").notNull(),
  purchaseDate: integer("purchase_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  expiryDate: integer("expiry_date", { mode: 'timestamp' }),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  scaledUsageLimit: integer("scaled_usage_limit"), // For upgraded subscription limits
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id).notNull(),
  serviceId: text("service_id").references(() => services.id).notNull(),
  additionalServices: text("additional_services", { mode: 'json' }).$type<string[]>().default([]), // Array of service IDs for extra services
  clientSubscriptionId: text("client_subscription_id").references(() => clientSubscriptions.id),
  appointmentDate: integer("appointment_date", { mode: 'timestamp' }).notNull(),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const licenseKeys = sqliteTable("license_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  expiryDate: integer("expiry_date", { mode: 'timestamp' }),
  features: text("features", { mode: 'json' }).$type<string[]>().notNull(),
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
});

export const insertClientSubscriptionSchema = createInsertSchema(clientSubscriptions).omit({
  id: true,
  purchaseDate: true,
}).extend({
  clientId: z.string().min(1, "Cliente è obbligatorio"),
  subscriptionId: z.string().min(1, "Pacchetto abbonamento è obbligatorio"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// API schema that accepts string dates for HTTP requests
export const apiInsertBookingSchema = z.object({
  clientId: z.string().min(1, "Cliente è obbligatorio"),
  serviceId: z.string().min(1, "Servizio è obbligatorio"),
  appointmentDate: z.string().min(1, "Data appuntamento è obbligatoria"),
  totalPrice: z.number().min(0, "Prezzo deve essere positivo"),
  status: z.string().default("scheduled"),
  notes: z.string().optional(),
  additionalServices: z.array(z.string()).default([]),
  clientSubscriptionId: z.string().optional(),
});

// API schema for updating bookings
export const apiUpdateBookingSchema = z.object({
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  appointmentDate: z.string().optional(),
  totalPrice: z.number().min(0, "Prezzo deve essere positivo").optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  additionalServices: z.array(z.string()).optional(),
  clientSubscriptionId: z.string().optional(),
});

export const insertLicenseKeySchema = createInsertSchema(licenseKeys).omit({
  id: true,
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type ClientSubscription = typeof clientSubscriptions.$inferSelect;
export type InsertClientSubscription = z.infer<typeof insertClientSubscriptionSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = z.infer<typeof insertLicenseKeySchema>;
