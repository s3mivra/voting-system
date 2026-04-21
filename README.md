# Secure MERN Voting System

A highly secure, responsive (Mobile & PC) voting system built with the MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS. The system implements **Data Immutability** and **Zero-Tenant Isolation** - once a vote is cast, it cannot be altered, and voter identities are cryptographically decoupled from their specific vote choices.

## Features

### Security Features
- **Data Immutability**: Votes cannot be modified after submission
- **Zero-Tenant Isolation**: Voter identities separated from vote choices
- **HTTP-only Cookies**: JWT tokens stored securely in HTTP-only cookies
- **Compound Unique Index**: Database-level prevention of double-voting
- **MongoDB Transactions**: Atomic vote submission across multiple collections
- **Role-Based Access Control (RBAC)**: Admin and voter roles with strict permissions

### Voter Flow
1. **Pre-Registration Login**: Voters log in using admin-provided credentials
2. **Screening Gateway**: First-time users complete demographic profile
3. **Dynamic Voting Form**: Questions rendered based on JSON structure
4. **Transaction Submission**: Atomic vote submission using MongoDB transactions

### Admin Dashboard
- **Metrics Overview**: Real-time statistics using MongoDB aggregation pipelines
- **Accounts Management**: CRUD operations with CSV bulk upload
- **Forms Creator**: Dynamic poll/question builder (Google Forms-like)
- **Data Export**: Immutable CSV export with streaming for large datasets
- **Poll Lifecycle**: Draft → Active → Closed workflow with read-only live polls

## Tech Stack

### Backend
- Node.js v22.16.0+
- Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- Multer for file uploads
- csv-parser & fast-csv for CSV processing

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication

## Project Structure

```
voting-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js  # Login, screening, logout
│   │   │   ├── voterController.js # Poll viewing, vote submission
│   │   │   └── adminController.js # Dashboard, CRUD, exports
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification, role checks
│   │   │   └── errorHandler.js    # Global error handler
│   │   ├── models/
│   │   │   ├── User.js            # User schema with demographic data
│   │   │   ├── Poll.js            # Dynamic poll/questions schema
│   │   │   ├── VoterReceipt.js    # Vote tracking with unique index
│   │   │   └── CastVote.js        # Anonymous vote storage
│   │   ├── routes/
│   │   │   ├── authRoutes.js      # Authentication endpoints
│   │   │   ├── voterRoutes.js     # Voter-specific endpoints
│   │   │   └── adminRoutes.js     # Admin-only endpoints
│   │   └── server.js              # Express server setup
│   ├── uploads/                   # CSV upload directory
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   │   └── AuthContext.tsx    # Authentication state
    │   ├── pages/
    │   │   ├── Login.tsx          # Login page
    │   │   ├── Screening.tsx      # Profile completion
    │   │   ├── Voting.tsx         # Voting interface
    │   │   ├── Success.tsx        # Vote confirmation
    │   │   ├── AdminDashboard.tsx # Admin main dashboard
    │   │   ├── PollForm.tsx       # Poll creator/editor
    │   │   └── UserForm.tsx       # User management
    │   ├── services/
    │   │   ├── api.ts             # Axios configuration
    │   │   ├── authService.ts     # Auth API calls
    │   │   ├── voterService.ts    # Voter API calls
    │   │   └── adminService.ts    # Admin API calls
    │   ├── types/
    │   │   └── index.ts           # TypeScript interfaces
    │   ├── App.tsx                # Router setup
    │   ├── main.tsx               # Entry point
    │   └── index.css              # Tailwind imports
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── tsconfig.json
```

## Installation & Setup

### Prerequisites
- Node.js v22.16.0 or higher
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting-system
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

5. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Initial Setup

### Create First Admin User

Since there's no signup functionality (users are created by admins), you'll need to create the first admin user directly in MongoDB:

```javascript
// In MongoDB shell or MongoDB Compass
use voting-system
db.users.insertOne({
  email: "admin@example.com",
  password: "$2a$10$hashedpasswordhere", // Use bcrypt to hash
  role: "admin",
  hasVoted: false,
  isScreened: true,
  profile: {
    name: "System Admin",
    department: "IT",
    age: 30,
    employeeId: "ADMIN001"
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

To generate a hashed password, you can use Node.js:
```javascript
const bcrypt = require('bcryptjs');
const password = 'your-admin-password';
const hashedPassword = bcrypt.hashSync(password, 10);
console.log(hashedPassword);
```

## Usage

### For Voters

1. **Login**: Use credentials provided by admin
2. **Complete Screening**: First-time users fill in demographic information
3. **Vote**: Select from active polls and submit answers
4. **Confirmation**: Receive immutable vote confirmation

### For Admins

1. **Login** with admin credentials
2. **Dashboard Overview**: View metrics (total voters, voted ratio, top options)
3. **Manage Users**:
   - Create individual users
   - Bulk upload via CSV (format: `email,password,role`)
   - Edit user details
   - Filter by voted status
   - Export user data
4. **Manage Polls**:
   - Create new polls with dynamic questions
   - Add multiple question types (multiple choice, checkbox, fill-in-the-blank)
   - Launch polls (changes status to active)
   - Close polls (prevents new votes)
   - View poll status
5. **Export Data**: Download vote data as CSV

## CSV Bulk Upload Format

For bulk user upload, create a CSV file with the following columns:

```csv
email,password,role
voter1@example.com,password123,voter
voter2@example.com,password123,voter
admin2@example.com,adminpass,admin
```

The `role` column is optional and defaults to `voter`.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/screening` - Complete profile screening
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Voter
- `GET /api/voter/polls` - Get active polls
- `GET /api/voter/polls/:id` - Get specific poll
- `POST /api/voter/vote` - Submit vote

### Admin
- `GET /api/admin/metrics` - Get dashboard metrics
- `GET /api/admin/users` - Get all users (with optional filter)
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/bulk-upload` - Bulk upload users (CSV)
- `GET /api/admin/polls` - Get all polls
- `POST /api/admin/polls` - Create poll
- `PUT /api/admin/polls/:id` - Update poll (draft only)
- `POST /api/admin/polls/:id/launch` - Launch poll
- `POST /api/admin/polls/:id/close` - Close poll
- `DELETE /api/admin/polls/:id` - Delete poll (draft only)
- `GET /api/admin/export/votes` - Export votes as CSV
- `GET /api/admin/export/users` - Export users as CSV

## Security Constraints

### Implemented
- **No PUT/PATCH/DELETE for votes**: Vote data is immutable
- **Read-only live polls**: Active polls cannot be edited
- **HTTP-only cookies**: JWT tokens stored securely
- **Compound unique index**: Prevents double-voting at database level
- **MongoDB transactions**: Ensures atomic vote submission
- **Role-based middleware**: Protects routes based on user role

### Vote Anonymity
- `CastVotes` collection stores only `pollId` and vote selections
- No user ID is linked to vote data
- `VoterReceipts` tracks who voted (not what they voted for)

## Deployment

### Backend Deployment (e.g., Render, Railway, Heroku)

1. Set environment variables in your hosting platform
2. Ensure MongoDB URI points to production database
3. Set `NODE_ENV=production`
4. Use a strong `JWT_SECRET`

### Frontend Deployment (e.g., Vercel, Netlify)

1. Build the project: `npm run build`
2. Deploy the `dist/` folder
3. Set `VITE_API_URL` to production backend URL

## Development

### Running Tests
(Add your test commands here if you implement tests)

### Code Style
- Backend: Standard JavaScript with Express conventions
- Frontend: TypeScript with React best practices
- Styling: Tailwind CSS utility classes

## Troubleshooting

### Common Issues

**CORS Errors**: Ensure backend CORS is configured for your frontend URL in `server.js`

**MongoDB Connection**: Verify MongoDB URI is correct and MongoDB is running

**JWT Errors**: Check that `JWT_SECRET` is set and matches between requests

**Vote Submission Fails**: Check MongoDB transaction support (requires replica set or sharded cluster for transactions)

## License

ISC

## Support

For issues or questions, please refer to the project documentation or contact the development team.
