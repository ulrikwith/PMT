# Project Management Tool (PMT)

A personal project management application designed for content creators, integrating task management with Blue.cc cloud sync.

**Status**: ✅ Production Ready
**Last Updated**: 2026-01-21

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or bun
- Blue.cc account (for cloud sync)

### Installation

```bash
# Clone repository
git clone https://github.com/ulrikwith/PMT.git
cd PMT

# Install dependencies
npm install

# Setup backend
cd backend
cp tasks.json.template tasks.json
cp .env.example .env
# Add your Blue.cc API tokens to .env

# Start development servers
npm run dev        # Terminal 1: Backend (port 3001)
cd ../frontend
npm run dev        # Terminal 2: Frontend (port 3002)
```

### Access Application
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001

---

## Features

### 📋 Task Management
- Create, edit, and organize tasks
- Rich metadata: activities, resources, work types
- Tag-based categorization (dimensions & elements)
- Status tracking: To Do, In Progress, Done

### 🎯 Multiple Views
1. **Tasks View**: List of all tasks with filtering
2. **Board View**: Visual workflow canvas with drag-and-drop
3. **Timeline View**: Gantt chart for scheduling
4. **Readiness View**: Dashboard showing project completion

### ☁️ Blue.cc Cloud Sync
- Automatic backup to Blue.cc
- Multi-device access (coming soon)
- Offline-first with sync when online
- Data recovery from cloud

### 🎨 Smart Organization
- **Dimensions**: Content, Practice, Community, Marketing, Admin
- **Elements**: Substack, Books, Newsletter, etc.
- **Work Types**: Part-of-element, Delivery-enabler
- **Activities**: Break tasks into sub-tasks

---

## Blue.cc Integration

### Workspace Structure
```
Company: Inner Allies Academy (clzwnz89g20hbx92uay4mzglv)
  └─ Project: PMT (cmklpzm7k152gp71ee0lm6bwa)
      └─ TodoList: Tasks (cmklqbb0z13yjnd1e4pjokze9)
```

### Setup
1. Get API tokens from Blue.cc
2. Add to `backend/.env`:
   ```
   BLUE_TOKEN_ID=your_token_id
   BLUE_SECRET_ID=your_secret_id
   ```
3. Test connection: `cd backend && node test-bluecc-integration.js`

### Features
- ✅ Automatic sync on create/update/delete
- ✅ Rich metadata preserved (activities, resources, positions)
- ✅ Data recovery after hard reset
- ✅ Local cache for offline access

---

## Documentation

- **README.md** (this file): Overview and quick start
- **backend/README.md**: Backend architecture and data storage
- **docs/**: Additional documentation (see [`docs/`](docs/) folder)
- **OLD/**: Archived documentation

---

## Development

### Running Tests
```bash
# Backend API tests
cd backend
node test-bluecc-integration.js
```

### Key Commands
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Clean Blue.cc test data
cd backend && node cleanup-bluecc-data.js
```

---

## Troubleshooting

### Frontend won't start
- Check port 3002 is available
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Backend API errors
- Verify tasks.json exists: `cp backend/tasks.json.template backend/tasks.json`
- Check Blue.cc credentials in .env

### Data recovery
If local data is lost, backend auto-recovers from Blue.cc cloud.

---

## Contact

**Developer**: Ulrik With Andersen
**Email**: ulrikwith@gmail.com
**GitHub**: https://github.com/ulrikwith/PMT

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
