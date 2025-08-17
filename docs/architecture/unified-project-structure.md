# Unified Project Structure

```plaintext
instructly/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       ├── deploy-staging.yaml
│       └── deploy-production.yaml
├── apps/                       # Application packages
│   ├── web/                    # Frontend Next.js application
│   │   ├── src/
│   │   │   ├── components/     # UI components (organized by domain)
│   │   │   ├── pages/          # Next.js pages/routes
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API client services
│   │   │   ├── stores/         # Zustand state stores
│   │   │   ├── styles/         # Global styles/themes
│   │   │   └── utils/          # Frontend utilities
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Frontend tests
│   │   ├── next.config.js      # Next.js configuration
│   │   └── package.json
│   └── api/                    # Backend Vercel functions
│       ├── src/
│       │   ├── functions/      # Vercel Edge/Serverless functions
│       │   ├── services/       # Business logic services
│       │   ├── middleware/     # Authentication & validation
│       │   ├── utils/          # Backend utilities
│       │   └── types/          # Backend-specific types
│       ├── tests/              # Backend tests
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   ├── constants/      # Shared constants
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   └── utils/          # Shared utilities
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   └── styles/         # Component styles
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       ├── tailwind/
│       └── jest/
├── infrastructure/             # Infrastructure as Code
│   ├── terraform/              # AWS resources
│   ├── vercel/                 # Vercel configuration
│   └── supabase/               # Database migrations & types
├── scripts/                    # Build/deploy scripts
│   ├── build.sh
│   ├── test.sh
│   └── deploy.sh
├── docs/                       # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   ├── architecture.md
│   └── api-reference.md
├── .env.example                # Environment template
├── package.json                # Root package.json
├── turbo.json                  # Turborepo configuration
└── README.md
```
