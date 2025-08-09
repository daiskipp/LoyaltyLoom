# Customer Loyalty App

## Overview

This is a Japanese customer loyalty application designed for elderly users, featuring passkey authentication and QR code check-ins. The app allows users to earn points by visiting participating stores, track their visit history, and manage their loyalty status. It emphasizes accessibility with large fonts, simple navigation, and touch-friendly interfaces optimized for senior users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript running on Vite for fast development and builds
- **UI Components**: Shadcn/UI component library built on Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with custom design tokens optimized for senior accessibility (large touch targets, high contrast)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Language**: Japanese-first interface with appropriate typography (Inter + Noto Sans JP fonts)

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Authentication**: Replit Auth integration with OpenID Connect and passkey support for secure, passwordless authentication
- **Session Management**: Express sessions with PostgreSQL storage for persistent login state
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **API Design**: RESTful endpoints for user management, store operations, point transactions, and QR code handling

### Data Storage
- **Database**: PostgreSQL with Neon serverless hosting for scalability
- **Schema Design**: 
  - Users table with points tracking and loyalty rank system
  - Stores table with QR codes and point reward configuration
  - Point transactions for audit trail of all point changes
  - Store visits to track user check-in history
  - Passkey credentials for WebAuthn authentication support
- **Migrations**: Drizzle Kit for database schema versioning and deployment

### Authentication & Authorization
- **Primary Method**: Replit Auth with OpenID Connect for seamless integration
- **Passkey Support**: WebAuthn credentials stored for future passwordless authentication
- **Session Security**: Secure HTTP-only cookies with PostgreSQL session store
- **Authorization**: Middleware-based route protection requiring authenticated sessions

### Mobile-First Design
- **Responsive Layout**: Mobile-optimized with max-width containers and touch-friendly interactions
- **PWA-Ready**: Service worker support and installable app capabilities
- **Camera Integration**: QR code scanning with device camera access
- **Accessibility**: Large fonts, high contrast colors, and simplified navigation for elderly users

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Platform**: Development environment and deployment platform integration

### Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication
- **WebAuthn API**: Browser-native passkey authentication (future enhancement)

### Frontend Libraries
- **Shadcn/UI**: Pre-built accessible component library
- **Radix UI**: Headless UI primitives for complex components
- **TanStack Query**: Server state synchronization and caching
- **Wouter**: Lightweight routing library

### Backend Services
- **Express Session Store**: PostgreSQL-backed session persistence
- **QR Code Generation**: Server-side QR code creation for store check-ins
- **Crypto Module**: Secure random token generation for QR codes

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling framework
- **Drizzle Kit**: Database migration and schema management tool