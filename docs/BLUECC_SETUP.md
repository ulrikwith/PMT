# Blue.cc Cloud Sync Setup

Complete guide for setting up Blue.cc integration with PMT.

**Last Updated**: 2026-01-21

---

## Overview

Blue.cc provides cloud backup and sync for your tasks. All task data is automatically synced to Blue.cc while maintaining a local cache for performance and offline access.

---

## Prerequisites

- Blue.cc account
- Access to Inner Allies Academy organization
- API tokens (Token ID and Secret)

---

## Workspace Structure

### Correct Structure (IMPORTANT!)

```
Company: Inner Allies Academy
├─ Organization ID: clzwnz89g20hbx92uay4mzglv
├─ Organization UID: b7601c606ec54c68918034b06fac01bb
└─ URL: https://blue.cc/org/inner-allies-academy

    └─ Project: PMT
       ├─ Project ID: cmklpzm7k152gp71ee0lm6bwa
       ├─ Project UID: e6af414f10734aff84fe8445c3aecb53
       └─ TodoList: Tasks
          └─ TodoList ID: cmklqbb0z13yjnd1e4pjokze9
```

**Critical Notes**:
- Blue.cc only allows **ONE company per account**
- The company is "Inner Allies Academy" (cannot be changed)
- The project name is "PMT" (not "InnerAllies")
- Do NOT try to create additional companies

---

## Setup Steps

### 1. Get API Tokens

1. Log into https://blue.cc
2. Navigate to Settings → API
3. Generate new API tokens:
   - **Token ID**: Your public token identifier
   - **Secret ID**: Your private secret key

⚠️ **Keep your Secret ID secure!** Never commit it to git.

### 2. Configure Backend

Create `.env` file in `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your tokens:

```env
BLUE_TOKEN_ID=your_token_id_here
BLUE_SECRET_ID=your_secret_id_here
PORT=3001
```

### 3. Verify Connection

Test the Blue.cc connection:

```bash
cd backend
node test-bluecc-integration.js
```

**Expected Output**:
```
✅ Test 1: API connection - PASSED
✅ Test 2: Create task with metadata - PASSED
✅ Test 3: Read task from cloud - PASSED
✅ Test 4: Update task - PASSED
✅ Test 5: Delete test task - PASSED

All 5 tests passed! Blue.cc integration is working correctly.
```

---

## How It Works

### Hybrid Storage Architecture

```
Frontend (React)
      ↓
TasksContext (Global State)
      ↓
Backend API
   ↓     ↓
Local   Blue.cc
Cache   Cloud
```

### Data Flow

1. **Create Task**:
   - Frontend → Backend API
   - Backend saves to tasks.json (local)
   - Backend syncs to Blue.cc (cloud)

2. **Read Tasks**:
   - Backend loads from local cache (fast)
   - Falls back to Blue.cc if cache empty

3. **Update Task**:
   - Frontend → Backend API
   - Backend updates tasks.json
   - Backend syncs changes to Blue.cc

4. **Delete Task**:
   - Frontend → Backend API
   - Backend removes from tasks.json
   - Backend deletes from Blue.cc

### Benefits

- **Performance**: Local cache provides instant access
- **Reliability**: Works offline, syncs when online
- **Backup**: All data automatically backed up to cloud
- **Recovery**: Data recoverable after hard reset
- **Multi-Device**: (Coming soon) Access from any device

---

## Rich Metadata Preservation

PMT stores extended metadata beyond standard todo fields:

### Metadata Fields

```javascript
{
  "title": "Book 4",
  "description": "Write book about project management",
  "status": "In Progress",
  "startDate": "2026-01-21",
  "dueDate": "2026-02-28",
  "tags": ["books", "content"],

  // Extended metadata
  "workType": "part-of-element",
  "targetOutcome": "Complete the book",
  "activities": [
    {"title": "Chapter 1", "status": "done", "timeEstimate": "4"},
    {"title": "Chapter 2", "status": "in-progress", "timeEstimate": "6"}
  ],
  "resources": {
    "timeEstimate": "20",
    "energyLevel": "Focused work",
    "tools": ["Google Docs", "Grammarly"],
    "materials": "Research notes"
  },
  "position": {"x": 200, "y": 150}
}
```

### How Metadata is Stored

Blue.cc natively supports:
- Title, Description, Status, Dates, Tags

Extended metadata is serialized as JSON in the `Description` field:
- Human-readable description (first part)
- JSON metadata (after separator)

This allows:
- ✅ Full metadata preservation in cloud
- ✅ Board view positions saved
- ✅ Activities and resources intact
- ✅ Compatible with Blue.cc UI

---

## Testing

### Test Cloud Sync

Create a task in PMT:

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Cloud Sync",
    "description": "Verify sync works",
    "tags": ["test"],
    "status": "To do"
  }'
```

Verify it appears in Blue.cc:
1. Go to https://blue.cc/org/inner-allies-academy
2. Navigate to PMT project
3. Check Tasks list for "Test Cloud Sync"

### Test Data Recovery

Simulate hard reset:

```bash
cd backend
# Clear local cache
echo '{"tasks":[],"tags":[],"relationships":[],"milestoneLinks":[]}' > tasks.json

# Restart backend (will auto-load from Blue.cc)
npm run dev
```

Verify data recovered:
```bash
curl http://localhost:3001/api/tasks
```

---

## CSV Import/Export

Blue.cc supports CSV format for bulk operations.

### CSV Structure

```csv
Title,List,Done,Start Date,Due Date,Description,Assignees,Created At,Updated At,Created By,Color,Project,Tags
```

### Export from Blue.cc

1. Go to PMT project in Blue.cc
2. Click "Export" or "Download CSV"
3. Save as `PMT.csv`

### Import to Blue.cc

1. Prepare CSV file with correct columns
2. Go to PMT project in Blue.cc
3. Click "Import" and upload CSV

---

## Troubleshooting

### Connection Fails

**Error**: "Cannot connect to Blue.cc API"

**Solutions**:
1. Verify tokens in `.env` file
2. Check internet connection
3. Test tokens: `node test-bluecc-integration.js`
4. Regenerate tokens if expired

### Wrong Workspace

**Error**: "PROJECT_NOT_FOUND" or "TODOLIST_NOT_FOUND"

**Solution**:
Verify workspace IDs in `backend/blueClient.js`:
```javascript
this.companyId = 'clzwnz89g20hbx92uay4mzglv';  // Inner Allies Academy
this.defaultProjectId = 'cmklpzm7k152gp71ee0lm6bwa';  // PMT
this.defaultTodoListId = 'cmklqbb0z13yjnd1e4pjokze9';  // Tasks
```

### Metadata Not Preserved

**Issue**: Activities or resources missing after sync

**Check**:
1. Verify `blueClient.js` serialization logic
2. Test with: `node test-bluecc-integration.js` (Test 2 & 3)
3. Check Blue.cc description field contains JSON

### Clean Test Data

If you have test data cluttering Blue.cc:

```bash
cd backend
node cleanup-bluecc-data.js
```

This will:
- Fetch all records from Blue.cc
- Delete each one
- Clear local cache
- Leave workspace empty

---

## Best Practices

### 1. Keep Tokens Secure
- Never commit `.env` to git
- Regenerate tokens if exposed
- Use environment variables in production

### 2. Regular Backups
- Export CSV periodically
- Store backups in secure location
- Test restore process

### 3. Monitor Sync Status
(Coming in v1.1)
- Check sync indicator in UI
- Verify last sync timestamp
- Review sync logs

### 4. Handle Conflicts
(Coming in v1.1)
- Last-write-wins strategy currently
- Manual resolution for conflicts
- Keep local and cloud in sync

---

## API Rate Limits

Blue.cc may have rate limits. Best practices:

- ✅ Use local cache for reads
- ✅ Batch updates when possible
- ✅ Implement retry logic
- ✅ Monitor API usage

---

## Future Enhancements

### v1.1
- [ ] Sync status indicator
- [ ] Manual sync trigger
- [ ] Conflict resolution UI
- [ ] Sync history log

### v2.0
- [ ] Real-time sync (WebSockets)
- [ ] Multi-device collaboration
- [ ] Version history
- [ ] Selective sync

---

## Resources

- **Blue.cc Website**: https://blue.cc
- **Blue.cc API Docs**: https://docs.blue.cc/api
- **PMT Backend README**: ../backend/README.md
- **Support**: ulrikwith@gmail.com

---

**Last Updated**: 2026-01-21
**Status**: ✅ Fully Operational
