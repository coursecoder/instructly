# Instructly - AI-Powered Instructional Design Platform

Transform instructional design from craft-based practice to evidence-based profession with AI-powered Clark & Mayer framework classification.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x LTS
- npm 10.0+
- Docker (optional, for containerized development)

### Setup
```bash
# Clone and setup
git clone <repository-url>
cd instructly

# Run setup script
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development servers
npm run dev
```

### Development URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## 📦 Architecture

### Monorepo Structure
```
instructly/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── shared/       # Shared types & utilities
│   ├── ui/           # UI components
│   └── config/       # Shared configuration
└── infrastructure/   # Database & deployment
```

### Technology Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend:** Fastify, TypeScript, tRPC
- **Database:** PostgreSQL (Supabase)
- **Testing:** Vitest, Testing Library, Playwright
- **Deployment:** Vercel, Docker

## 🎯 Performance Requirements

- **NFR1:** Generate lesson plans in <3 seconds, accessibility checks in <1 second
- **NFR2:** Support 1000+ concurrent users
- **NFR5:** AI costs <30% of revenue

## 🔒 Enterprise Features

- SOC 2 compliance foundation
- GDPR-compliant data handling
- WCAG AA accessibility compliance
- Role-based access controls
- Audit trails and encryption

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:web    # Frontend tests
npm run test:api    # Backend tests

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Staging
Automatic deployment on pushes to `develop` branch.

### Production
Automatic deployment on pushes to `main` branch.

### Manual Deployment
```bash
# Build all packages
npm run build

# Deploy with Vercel CLI
vercel --prod
```

## 📊 Monitoring

- Health Check: `/api/health`
- Metrics & AI Costs: `/api/metrics`
- Performance tracking built-in for all NFR requirements

## 🛠 Development

### Available Scripts
- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Run linting
- `npm run type-check` - TypeScript validation

### Docker Development
```bash
# Start with Docker Compose
docker-compose up

# Build containers
docker-compose build
```

## 📖 Documentation

- [Architecture Documentation](./docs/architecture/)
- [PRD & Requirements](./docs/prd/)
- [Development Workflow](./docs/architecture/development-workflow.md)

## 🤝 Contributing

1. Follow the coding standards in `docs/architecture/coding-standards.md`
2. All code must pass tests and type checking
3. Maintain WCAG AA accessibility compliance
4. Follow the established project structure

## 📄 License

Private - Instructly Platform