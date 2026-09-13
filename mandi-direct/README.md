# Mandi Direct (मंडी डायरेक्ट)
> **Smart India Hackathon (SIH 2026) — Problem Statement 26033**  
> *Theme: Agriculture, FoodTech & Rural Development*  
> *Problem: Multiple intermediaries reduce farmers' earnings and increase consumer prices.*

Mandi Direct is a production-grade Farm-to-Consumer (F2C) direct exchange platform engineered to eliminate predatory agricultural middlemen, allowing farmers to capture full mandi margins while delivering transparent wholesale pricing to institutional buyers and retailers.

---

## Architecture Overview

```mermaid
graph TD
    subgraph Frontend ["Frontend (React + TypeScript + Vite + shadcn/ui)"]
        UI["UI Components & Dashboards"]
        AuthCtx["AuthContext (@supabase/supabase-js)"]
        AxiosClient["Axios Interceptor (Bearer JWT)"]
        ReactRouter["React Router (ProtectedRoute & RoleRoute)"]
    end

    subgraph AuthGateway ["Supabase Authentication"]
        GoTrue["Supabase GoTrue (User signup / login)"]
    end

    subgraph Backend ["FastAPI Gateway (Python 3.12+)"]
        Main["main.py (CORS, Logging, Error Handlers)"]
        HealthEndpoint["GET /health"]
        AuthRouter["api/v1/endpoints/auth.py"]
        RoleDeps["api/deps.py (get_current_user, require_roles)"]
        Services["services/ (profile_service, supabase_service)"]
        Repos["repositories/ (profile_repository)"]
    end

    subgraph Database ["Supabase PostgreSQL"]
        ProfilesTable[("profiles Table (Role CHECK Constraints)")]
        AlembicMigrations["Alembic Version Control"]
    end

    UI --> AuthCtx
    AuthCtx -->|"1. User Login / Registration"| GoTrue
    GoTrue -->> AuthCtx: Return Session & JWT
    AuthCtx --> AxiosClient
    ReactRouter --> UI
    AxiosClient -->|"2. REST Calls with Authorization: Bearer JWT"| Main
    Main --> AuthRouter
    Main --> RoleDeps
    RoleDeps -->|"3. Decode & Cryptographically Verify JWT"| RoleDeps
    RoleDeps -->|"4. Query DB-verified Profile & Role"| Services
    Services --> Repos
    Repos --> ProfilesTable
```

---

## Deep Dive: How Supabase Auth, JWT Validation & FastAPI RBAC Work Together

### 1. Client-Side Authentication (Supabase GoTrue)
- The user initiates registration or login on the React frontend using `@supabase/supabase-js` (`supabase.auth.signUp` / `supabase.auth.signInWithPassword`).
- Password handling, hashing (bcrypt), salting, rate-limiting, and email confirmations are fully delegated to Supabase Auth. **No plain or custom passwords ever touch the FastAPI application code.**
- On successful authentication, Supabase returns a session payload containing an HMAC-SHA256 signed `access_token` (JWT) with standard claims:
  - `sub`: The unique UUID of the user in `auth.users`.
  - `email`: Verified user email address.
  - `role`: "authenticated" (Supabase platform role).
  - `exp`: Expiration Unix timestamp.

### 2. Profile Synchronization (`POST /api/v1/auth/profile`)
- Upon registering, the frontend sends a sync request to FastAPI (`POST /api/v1/auth/profile`) with the user's selected role (`FARMER`, `BUYER`, `FPO`, or `LOGISTICS`).
- FastAPI extracts the Bearer token, validates the JWT, and extracts `auth_user_id = token.sub`.
- **Security Rule — Never Trust Client Roles for Elevation:** The Pydantic validator strictly forbids self-assignment of `ADMIN`.
- The profile is committed to the PostgreSQL `profiles` table, guarded by a database `CHECK (role IN ('FARMER', 'BUYER', 'ADMIN', 'FPO', 'LOGISTICS'))` constraint.

### 3. FastAPI Authentication & RBAC Dependencies (`api/deps.py`)
- **`get_token_payload`**: Extracts the `Authorization: Bearer <token>` header. It validates the signature against `SUPABASE_JWT_SECRET` (HS256) and verifies expiration. Returns HTTP 401 if missing, expired, or malformed.
- **`get_current_user`**: Queries `profiles` in PostgreSQL by `auth_user_id`. Returns HTTP 401 if no profile is found.
- **`get_current_active_user`**: Verifies `profile.status == 'ACTIVE'`. Returns HTTP 403 if suspended.
- **`require_roles(*allowed_roles)`**: Dependency factory checking `current_user.role in allowed_roles`. If unauthorized: raises **HTTP 403 Forbidden**.

### 4. Frontend Route Guards (`ProtectedRoute` & `RoleRoute`)
- `<ProtectedRoute>`: Redirects unauthenticated sessions to `/login`.
- `<RoleRoute allowedRoles={['FARMER']}>`: Checks the database-verified `profile.role`. If mismatched, redirects to `/unauthorized` (HTTP 403 screen).
- Post-login redirection per requirements:
  - `FARMER` $\rightarrow$ `/farmer/dashboard`
  - `BUYER` $\rightarrow$ `/buyer/marketplace`
  - `ADMIN` $\rightarrow$ `/admin/dashboard`
  - `FPO` $\rightarrow$ `/fpo/portal`
  - `LOGISTICS` $\rightarrow$ `/logistics/portal`

---

## Monorepo Directory Structure

```
mandi-direct/
├── .gitignore
├── README.md
├── frontend/                          # React + TypeScript + Vite Frontend
│   ├── .env                           # Local environment variables
│   ├── .env.example                   # Environment variable template
│   ├── package.json                   # Dependencies & scripts
│   ├── vite.config.ts                 # Vite config with path aliases & API proxy
│   ├── tailwind.config.js             # Tailwind CSS & design tokens
│   ├── components.json                # shadcn/ui configuration
│   ├── index.html                     # HTML5 entry with Inter & Outfit typography
│   └── src/
│       ├── main.tsx                   # React root entry
│       ├── App.tsx                    # Top-level providers (QueryClient, Auth, Router)
│       ├── index.css                  # Design system tokens (Emerald/Slate palette)
│       ├── context/
│       │   └── AuthContext.tsx        # Supabase auth state & profile sync
│       ├── components/
│       │   ├── ui/                    # Button, Card, Badge, Input, Label
│       │   ├── layout/                # Navbar (with live API status), Footer
│       │   └── auth/                  # ProtectedRoute, RoleRoute
│       ├── pages/
│       │   ├── HomePage.tsx           # Hero, SIH problem, live health check, demo logins
│       │   ├── LoginPage.tsx          # Supabase login + role redirect
│       │   ├── RegisterPage.tsx       # Registration with interactive role selector
│       │   ├── FarmerDashboard.tsx    # Farmer view (secured by FARMER role)
│       │   ├── BuyerMarketplace.tsx   # Buyer view (secured by BUYER role)
│       │   ├── AdminDashboard.tsx     # Admin console (secured by ADMIN role)
│       │   ├── FpoPortal.tsx          # FPO cooperative view
│       │   ├── LogisticsPortal.tsx    # Fleet & cold chain dispatch view
│       │   └── UnauthorizedPage.tsx   # Visual HTTP 403 Forbidden display
│       ├── lib/
│       │   ├── axios.ts               # Axios client with Bearer token interceptor
│       │   ├── supabase.ts            # Supabase JS client
│       │   ├── query-client.ts        # TanStack QueryClient setup
│       │   └── utils.ts               # cn() class utility
│       └── test/
│           └── auth.test.ts           # Frontend RBAC unit tests
└── backend/                           # FastAPI REST API Backend
    ├── .env                           # Backend environment variables
    ├── .env.example                   # Backend environment template
    ├── requirements.txt               # Pinned pip dependencies
    ├── pyproject.toml                 # Pytest & package settings
    ├── alembic.ini                    # Alembic migration configuration
    ├── alembic/
    │   ├── env.py                     # Alembic migration runner
    │   └── versions/
    │       └── 001_initial_profiles_table.py # Profiles table with CHECK constraints
    ├── app/
    │   ├── main.py                    # FastAPI app, CORS, error handling, /health
    │   ├── core/
    │   │   ├── config.py              # Pydantic BaseSettings (no hardcoded secrets)
    │   │   ├── database.py            # SQLAlchemy 2.0 engine & SessionLocal
    │   │   ├── security.py            # Supabase JWT decoder (HS256)
    │   │   └── logging.py             # Structured console logging
    │   ├── models/
    │   │   ├── base.py                # UUID PK & Timestamps abstract model
    │   │   ├── enums.py               # UserRole & UserStatus enums
    │   │   └── profile.py             # SQLAlchemy Profile model with CHECK constraints
    │   ├── schemas/
    │   │   ├── common.py              # HealthResponse, ErrorResponse
    │   │   └── auth.py                # ProfileCreateRequest, ProfileResponse
    │   ├── repositories/
    │   │   ├── base.py                # Generic BaseRepository[Model, Create, Update]
    │   │   └── profile.py             # ProfileRepository
    │   ├── services/
    │   │   ├── profile.py             # Profile business logic & duplicate check
    │   │   └── supabase.py            # Supabase Python SDK integration
    │   └── api/
    │       ├── deps.py                # get_db, get_current_user, require_roles
    │       └── v1/
    │           ├── router.py          # Aggregated v1 router
    │           └── endpoints/
    │               ├── health.py      # GET /health
    │               ├── auth.py        # POST /profile, GET /me
    │               └── roles.py       # Role-guarded endpoints
    └── tests/
        ├── conftest.py                # In-memory SQLite fixtures & mock JWT generator
        ├── test_health.py             # Verifies required GET /health contract
        └── test_auth_rbac.py          # 401 unauth, 403 forbidden, role enforcement tests
```

---

## Environment Variables

### Frontend (`frontend/.env`)
| Variable | Description | Example Value |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of FastAPI backend | `http://localhost:8001` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anon Key | `eyJh...` |

### Backend (`backend/.env`)
| Variable | Description | Example Value |
|---|---|---|
| `ENVIRONMENT` | Environment name | `development` / `production` |
| `LOG_LEVEL` | Logging verbosity | `INFO` / `DEBUG` |
| `SECRET_KEY` | Application secret key | `min-32-chars-random-string` |
| `SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJh...` |
| `SUPABASE_JWT_SECRET` | Secret used to sign Supabase JWTs | `your-supabase-jwt-secret` |
| `DATABASE_URL` | SQLAlchemy PostgreSQL / SQLite URL | `postgresql://user:pass@host:5432/db` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173,http://localhost:3000` |

---

## Installation & Setup

### Prerequisites
- **Python 3.12+** (tested with Python 3.13)
- **Node.js 20+** (tested with Node.js v22 LTS)

### 1. Backend Setup
```powershell
# Navigate to backend directory
cd mandi-direct/backend

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment file
cp .env.example .env
```

### 2. Frontend Setup
```powershell
# Navigate to frontend directory
cd mandi-direct/frontend

# Install node dependencies
npm install

# Configure environment file
cp .env.example .env
```

---

## Running the Development Servers

### Start the FastAPI Backend
```powershell
cd mandi-direct/backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```
- Interactive Swagger UI: `http://127.0.0.1:8001/docs`
- ReDoc Documentation: `http://127.0.0.1:8001/redoc`
- OpenAPI JSON Spec: `http://127.0.0.1:8001/api/v1/openapi.json`
- Health Check: `http://127.0.0.1:8001/health`

### Start the React Frontend
```powershell
cd mandi-direct/frontend
npm run dev
```
- Access the web interface at `http://localhost:5173`

---

## Running the Test Suites

### Backend Tests (Pytest)
```powershell
cd mandi-direct/backend
.\.venv\Scripts\python.exe -m pytest tests -v
```
**Test Coverage (27 tests):**
- `test_root_health_endpoint`: Verifies `GET /health` exact JSON contract.
- `test_v1_health_endpoint`: Verifies `/api/v1/health`.
- `test_unauthorized_user_receives_401`: Missing or invalid Bearer tokens receive HTTP 401.
- `test_create_profile_success`: `POST /api/v1/auth/profile` commits profile to DB.
- `test_cannot_self_assign_admin_role`: Prevents client-side elevation to `ADMIN`.
- `test_get_auth_me`: `GET /api/v1/auth/me` returns current user's DB profile.
- `test_rbac_farmer_allowed_and_forbidden`: `FARMER` allowed on farmer endpoint, receives 403 on buyer/admin endpoints.
- `test_rbac_buyer_access`: `BUYER` allowed on buyer endpoint, receives 403 on farmer endpoint.
- `test_rbac_admin_access`: `ADMIN` allowed on admin endpoint.
- `test_suspended_user_forbidden`: Suspended accounts receive HTTP 403.
- `test_database_role_constraint`: Verifies PostgreSQL check constraint rejects invalid roles.
- `test_unauthenticated_user_cannot_access_farmer_endpoints`: Tests 401 on all `/farmers/*`.
- `test_buyer_cannot_access_farmer_endpoints`: Tests 403 when buyer calls farmer profile or farm endpoints.
- `test_farmer_can_create_profile`: Creates initial farmer profile and verifies 80% completion.
- `test_farmer_cannot_create_duplicate_profile`: Verifies 409 Conflict.
- `test_farmer_can_retrieve_own_profile`: Retrieves farmer profile with computed scores.
- `test_farmer_can_update_own_profile`: Updates address and personal details.
- `test_farmer_can_create_farm`: Registers farm with crops and GPS coordinates.
- `test_profile_completion_reaches_100_percent_after_adding_farm`: Verifies 100% completion & produce readiness.
- `test_farmer_can_retrieve_own_farms`: Lists registered parcels.
- `test_farmer_can_update_own_farm`: Updates parcel acreage and soil.
- `test_farmer_cannot_access_another_farmers_farm`: Verifies cross-farmer isolation (404 on GET/PUT/DELETE).
- `test_invalid_farm_data_is_rejected`: Rejects negative area, invalid unit (422).
- `test_invalid_coordinates_are_rejected`: Rejects latitude > 90 (422).
- `test_invalid_pincode_is_rejected`: Rejects non-6-digit PIN (422).
- `test_farmer_can_upload_photo`: Uploads avatar image.
- `test_farmer_can_delete_own_farm`: Deletes parcel and verifies removal.

### Frontend Tests (Vitest)
```powershell
cd mandi-direct/frontend
npm test
```
**Test Coverage (18 tests):**
- Role route guard verification.
- Denial of unpermitted roles.
- Post-login role routing logic.
- Indian 6-digit PIN code regex validation.
- Farmer profile Zod schema validation.
- Farm parcel Zod schema validation (area > 0, latitude/longitude ranges, non-empty primary crops).
- Profile completion scoring calculation (0% -> 80% -> 100%).
- Route access control for all 5 farmer management paths.

### Frontend Type Check & Build
```powershell
cd mandi-direct/frontend
npm run build
```
Verifies strict TypeScript compliance (`tsc -b`) and bundles for production via Vite.

---

## Phase 3: Farmer Profile & Farm Management Architecture

### 1. Database Schema
- **`farmer_profiles` table**: 1-to-1 extension of `profiles` storing DOB, gender, profile photo URL, full agricultural address (village, mandal, district, state, 6-digit pincode), verification status (`PENDING`, `VERIFIED`, `REJECTED`), and admin notes.
- **`farms` table**: 1-to-many parcels per farmer profile. Stores farm name, total area, area unit (`ACRE`, `HECTARE`), ownership type (`OWNED`, `LEASED`, `FAMILY`, `OTHER`), soil type, irrigation type, primary crops array (`JSON`), GPS coordinates, and parcel location.
- **Alembic Migration**: `002_farmer_profiles_and_farms.py`
- **Supabase PostgreSQL RLS**: `supabase_rls_phase3.sql` enforces strict tenant isolation at the database level.

### 2. Profile Completion Score Formula
- Personal Details (Name, Phone): **20%**
- Complete Address (Address line, Village, Mandal, District, State, Pincode): **60%**
- At least one registered farm parcel: **20%**
- **Total: 100%** $\rightarrow$ unlocks "✓ Profile ready for produce listing" (Phase 4).

### 3. API Endpoints Summary

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Root health check |
| `POST` | `/api/v1/auth/profile` | Supabase JWT | Syncs authenticated user into `profiles` table |
| `GET` | `/api/v1/auth/me` | Supabase JWT | Retrieves current user profile with DB-verified role |
| `GET` | `/api/v1/farmers/profile` | Role: `FARMER` | Retrieves authenticated farmer's profile & completion status |
| `POST` | `/api/v1/farmers/profile` | Role: `FARMER` | Creates initial farmer profile |
| `PUT` | `/api/v1/farmers/profile` | Role: `FARMER` | Updates farmer profile & personal info |
| `POST` | `/api/v1/farmers/profile/photo` | Role: `FARMER` | Uploads avatar photo to Supabase Storage (`farmer-profiles`) |
| `GET` | `/api/v1/farmers/farms` | Role: `FARMER` | Lists farms owned exclusively by the authenticated farmer |
| `POST` | `/api/v1/farmers/farms` | Role: `FARMER` | Registers a new farm parcel |
| `GET` | `/api/v1/farmers/farms/{id}` | Role: `FARMER` | Retrieves specific farm (404 if not owned by caller) |
| `PUT` | `/api/v1/farmers/farms/{id}` | Role: `FARMER` | Updates farm details (404 if not owned by caller) |
| `DELETE` | `/api/v1/farmers/farms/{id}` | Role: `FARMER` | Deletes farm parcel (404 if not owned by caller) |
| `GET` | `/api/v1/farmers/summary` | Role: `FARMER` | Aggregated dashboard metrics, completion %, and produce readiness |
| `GET` | `/api/v1/farmer/dashboard-stats` | Role: `FARMER` | Farmer sales & bid metrics overview |
| `GET` | `/api/v1/buyer/marketplace-preview` | Role: `BUYER` | Transparent wholesale lots preview |
| `GET` | `/api/v1/admin/system-overview` | Role: `ADMIN` | National platform metrics & governance |
| `GET` | `/api/v1/fpo/portal` | Role: `FPO` | FPO crop bulk aggregation stats |
| `GET` | `/api/v1/logistics/routes` | Role: `LOGISTICS` | Cold-chain truck dispatch schedules |

---

## Phase 4: Add Produce & Produce Management Architecture

### 1. Database Schema & Inventory Engine
- **`produce_listings` table**: Represents harvest lots cultivated on verified farm parcels.
  - Linked via foreign key to `farmer_profiles.id` (`CASCADE`) and `farms.id` (`RESTRICT`).
  - Strict inventory model: `total_quantity`, `available_quantity`, `reserved_quantity`, and `sold_quantity` stored as `Numeric(12, 2)`.
  - Agricultural classification: `category` (`VEGETABLE`, `FRUIT`, `GRAIN`, `PULSE`, `SPICE`, `OILSEED`, `OTHER`), variety, and `quality_grade` (`PREMIUM`, `GRADE_A`, `GRADE_B`, `GRADE_C`, `UNGRADED`).
  - Fulfillment dates: `harvest_date`, `available_from`, and `available_until` (shelf life threshold).
  - Pricing terms: `expected_price` (`Numeric(10, 2)`), `price_unit` (`PER_KG`, `PER_QUINTAL`, `PER_TON`), and `minimum_order_quantity`.
  - State machine status: `DRAFT`, `PENDING_VERIFICATION`, `APPROVED`, `REJECTED`, `LISTED`, `PARTIALLY_SOLD`, `SOLD_OUT`, `EXPIRED`, `ARCHIVED`.
- **`produce_images` table**: Stores references to photos in Supabase Storage (`produce-images` bucket).
  - Supports 1 to 5 photos per listing lot with `is_primary` cover designation and display `sort_order`.
- **Alembic Migration**: `003_produce_listings_and_images.py`.
- **Supabase Storage & PostgreSQL RLS**: `backend/supabase_rls_phase4.sql` provides bucket setup and tenant isolation policies.

### 2. State Machine & Security Guards
```
      ┌────────────────────────────────────────────────────────┐
      │                                                        │
      ▼                                                        │
  [ DRAFT ] ───────────► [ PENDING_VERIFICATION ] ──► [ REJECTED ]
      │                         │
      ▼                         ▼
  (Deleted)               [ APPROVED ]
                                │
                                ▼
                           [ LISTED ]
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
           [ PARTIALLY_SOLD ]       [ SOLD_OUT / EXPIRED ]
```
- **Profile Completion Gate**: Only farmers with a 100% profile score and $\ge 1$ registered farm can create produce lots or submit them for verification.
- **Farm Ownership Verification**: Origin farm must strictly belong to the calling farmer.
- **Modification Guard**: Only `DRAFT` or `REJECTED` produce lots can be modified (`PATCH`) or deleted (`DELETE` allowed only on `DRAFT`). Once submitted or approved, listings are tamper-proof to ensure marketplace integrity.
- **Verification Gate**: Submitting for verification requires all mandatory fields (`product_name`, `category`, `harvest_date`, `available_from`, `total_quantity > 0`, `expected_price > 0`) and at least 1 photo uploaded.

### 3. Produce Endpoints Summary

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/reference/crops` | Public | Standard crop catalog autocomplete (varieties, units, categories) |
| `GET` | `/api/v1/farmers/produce/stats` | Role: `FARMER` | Summary count breakdown across listing statuses |
| `GET` | `/api/v1/farmers/produce` | Role: `FARMER` | Filterable, paginated list of farmer produce lots |
| `POST` | `/api/v1/farmers/produce` | Role: `FARMER` | Creates a new produce lot draft |
| `GET` | `/api/v1/farmers/produce/{id}` | Role: `FARMER` | Fetches full lot detail with image gallery and inventory |
| `PATCH` | `/api/v1/farmers/produce/{id}` | Role: `FARMER` | Updates DRAFT or REJECTED lot details |
| `DELETE` | `/api/v1/farmers/produce/{id}` | Role: `FARMER` | Permanently deletes a DRAFT produce lot and its photos |
| `POST` | `/api/v1/farmers/produce/{id}/submit` | Role: `FARMER` | Submits lot for admin verification (requires >= 1 photo) |
| `GET` | `/api/v1/farmers/produce/{id}/images` | Role: `FARMER` | Lists photos ordered by display_order ASC |
| `POST` | `/api/v1/farmers/produce/{id}/images` | Role: `FARMER` | Uploads photo (JPEG/PNG/WEBP, max 10MB, max 5 photos) |
| `PATCH` | `/api/v1/farmers/produce/{id}/images/reorder` | Role: `FARMER` | Reorders photos by updating display_order |
| `POST` / `PATCH` | `/api/v1/farmers/produce/{id}/images/{img_id}/primary` | Role: `FARMER` | Designates photo as primary cover |
| `DELETE` | `/api/v1/farmers/produce/{id}/images/{img_id}` | Role: `FARMER` | Deletes photo with auto-promotion of next remaining photo |

---

## Phase 5: Product Photos & Media Management Architecture

### 1. Zero Binary in Database & Path-Isolated Storage
- **PostgreSQL `produce_images` Metadata Model**:
  - Image files are **never** stored as binary or base64 in the database.
  - Database stores metadata: `id`, `produce_listing_id`, `storage_path`, `public_url`, `file_name`, `mime_type`, `file_size`, `width`, `height`, `is_primary`, `display_order`, `sort_order`, `created_at`.
- **Supabase Storage Architecture**:
  - Dedicated storage bucket: `produce-images` (10MB per object limit, allowed MIME types: `image/jpeg`, `image/png`, `image/webp`).
  - Path structure: `produce-images/{farmer_profile_id}/{produce_id}/{image_uuid}.{ext}`.
  - Public read access for marketplace buyers and verified users.
  - Path-isolated Row Level Security (RLS) policies ensuring farmers can only insert, update, or delete objects within their own `auth.uid()` directory paths.
- **Alembic Migration**: `004_produce_images_metadata.py` adding all metadata columns and indexes.
- **Supabase Storage SQL Setup**: `backend/supabase_rls_phase5.sql`.

### 2. Validation & Security Pipeline
- **Max File Size**: 10MB (`10 * 1024 * 1024` bytes), enforced on both backend and frontend.
- **Strict Magic-Byte Content Inspection**: Files are validated against binary signatures (JPEG: `\xff\xd8\xff`, PNG: `\x89PNG\r\n\x1a\n`, WebP: `RIFF...WEBP`), immediately rejecting disguised SVGs, PDFs, or executable binaries.
- **Dimension Parsing Without Heavy C-Dependencies**: Pure-Python binary header extractor using the standard library `struct` to extract `width` and `height` without requiring Pillow.
- **Storage/DB Consistency Rollback**: If Supabase Storage upload succeeds but database metadata insertion fails, the storage file is immediately cleaned up to prevent orphaned files.
- **Single Primary Invariant & Auto-Promotion**: Only one photo can have `is_primary = true`. If the primary photo is deleted, the earliest remaining photo (`display_order.asc()`) is automatically promoted to primary.
- **State Machine Guard**: Uploading, reordering, or deleting photos is strictly restricted to lots in `DRAFT` or `REJECTED` status.

### 3. Frontend Rich Media UI & Components
- **`ProduceImageUploader`**:
  - Drag-and-drop zone with live hover/drop animations.
  - Client-side validation with instant file size and format feedback.
  - Local Object URL pre-upload previews.
  - State machine lifecycle: `SELECTED` $\rightarrow$ `UPLOADING` (with numeric progress bar) $\rightarrow$ `UPLOADED` or `FAILED` (with retry button).
  - Reorder controls (Move Left / Move Right) with immediate server synchronization (`PATCH /images/reorder`).
  - Set Primary Cover Photo button with gold star badge.
  - Fullscreen Lightbox / Modal for detailed crop quality inspection.
- **`ProduceDetailPage` Hero Photo Gallery**:
  - High-resolution hero photo viewer with responsive aspect ratio.
  - Smooth thumbnail navigation carousel strip.
  - Badges for primary cover, resolution (e.g. `1920 × 1080 px`), and file size.
- **`AddProducePage` Integrated Staging**:
  - Ability to stage 1–5 photos during initial produce creation, uploaded sequentially upon draft creation.

---

## License & SIH 2026 Participation
Developed for Smart India Hackathon (SIH 2026) under Problem Statement 26033. All rights reserved.
