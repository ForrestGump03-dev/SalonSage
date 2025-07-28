# SalonFlow - Salon Management System

## Overview

SalonFlow is a comprehensive salon management system built as a full-stack web application. It's designed to help salon owners manage clients, bookings, services, subscriptions, and analytics in a user-friendly interface. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.
Interface Language: Full Italian localization requested - all UI text, forms, messages, and user-facing content should be in Italian.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom salon-themed color palette
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with conventional HTTP methods
- **Middleware**: Custom logging middleware for API request tracking
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Layer
- **Database**: PostgreSQL (configured for use with Neon Database)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Uses `@neondatabase/serverless` for serverless PostgreSQL connections

## Key Components

### Data Models
The application manages five core entities:
- **Clients**: Customer information with contact details and notes
- **Services**: Available salon services with pricing and duration
- **Subscriptions**: Service packages with usage limits and pricing
- **Client Subscriptions**: Active subscriptions owned by clients
- **Bookings**: Scheduled appointments linking clients to services
- **License Keys**: System licensing for feature management

### User Interface Components
- **Layout System**: Sidebar navigation with responsive design
- **Modal System**: Reusable modal components for data entry (clients, bookings, subscriptions)
- **Data Tables**: Comprehensive tables with search, filtering, and action buttons
- **Dashboard**: Analytics overview with charts and key metrics
- **Form Management**: React Hook Form with Zod validation

### Business Logic
- **License Management**: Feature gating system with validation
- **Booking Management**: Appointment scheduling with status tracking
- **Subscription Tracking**: Usage-based subscription system with remaining uses
- **Analytics**: Dashboard metrics and service performance tracking

## Data Flow

### Client-Server Communication
1. **API Requests**: Frontend uses a centralized `apiRequest` function for all HTTP communications
2. **Query Management**: TanStack React Query handles caching, background updates, and optimistic updates
3. **Form Submissions**: Form data is validated client-side with Zod before API submission
4. **Real-time Updates**: Query invalidation ensures UI stays synchronized with server state

### Database Operations
1. **Schema Definition**: Shared TypeScript schema definitions between frontend and backend
2. **Type Safety**: Drizzle ORM provides end-to-end type safety from database to UI
3. **Validation**: Zod schemas validate data at API boundaries
4. **Storage Layer**: Abstract storage interface allows for different database implementations

## External Dependencies

### Core Dependencies
- **UI Framework**: React, React DOM, React Router (Wouter)
- **Backend**: Express.js, Node.js runtime
- **Database**: Drizzle ORM, PostgreSQL, Neon Database connector
- **Validation**: Zod for schema validation
- **Forms**: React Hook Form with Radix UI resolvers
- **Styling**: Tailwind CSS, Radix UI components, class-variance-authority

### Development Tools
- **Build System**: Vite with React plugin and error overlay
- **TypeScript**: Full TypeScript support with strict configuration
- **Linting**: ESBuild for production bundling
- **Development**: TSX for TypeScript execution in development

### UI Component Library
- **Design System**: shadcn/ui with "new-york" style variant
- **Components**: Comprehensive set of Radix UI primitives (dialogs, forms, tables, etc.)
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds the React application for production
2. **Backend Build**: ESBuild bundles the Express server with external packages
3. **Static Assets**: Frontend assets are served from `dist/public`
4. **Server Bundle**: Backend is bundled as a single ESM file

### Environment Configuration
- **Development**: Uses TSX for direct TypeScript execution
- **Production**: Runs pre-built JavaScript bundle with Node.js
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection
- **Migrations**: Database schema is managed through Drizzle Kit migrations

### Runtime Architecture
- **Single Server**: Express server handles both API routes and static file serving
- **Development Mode**: Vite dev server with HMR integration
- **Production Mode**: Express serves pre-built static assets
- **Database Migrations**: Manual migration execution via `npm run db:push`

The application is designed to be easily deployable on platforms like Replit, Vercel, or any Node.js hosting environment with PostgreSQL database support.