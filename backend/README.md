# Backend Data Storage

## Current Status: ✅ Hybrid Mode - Local + Cloud Sync

The app runs in **hybrid mode** with both local storage and Blue.cc cloud sync fully operational.

## Database File

`tasks.json` - This file contains your project data and is **not tracked by git** to preserve your work data during development.

### Initial Setup

If you're setting up the project for the first time:

1. Copy the template file:
   ```bash
   cp backend/tasks.json.template backend/tasks.json
   ```

2. Start the backend server:
   ```bash
   npm run dev
   ```

### Important Notes

- **tasks.json is gitignored** - Your local data will never be committed to the repository
- This prevents accidental data loss during development
- Each developer/environment maintains their own data

## Blue.cc Integration Status

### ✅ FULLY WORKING - Cloud Sync Enabled!

**Last Tested**: 2026-01-20
**Status**: All integration tests passing

#### What's Working
- ✅ API authentication (tokens valid)
- ✅ Company: "Inner Allies Academy" (UID: b7601c606ec54c68918034b06fac01bb)
- ✅ Project: "InnerAllies" (UID: e6af414f10734aff84fe8445c3aecb53)
- ✅ TodoList configured (ID: cmklqbb0z13yjnd1e4pjokze9)
- ✅ Task creation with rich metadata
- ✅ Task retrieval from cloud
- ✅ Task updates preserving all metadata
- ✅ Task deletion
- ✅ Rich metadata serialization (activities, resources, workType, position)

#### Test Results
Run the integration test suite:
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

#### How It Works
The application uses a **hybrid approach**:
1. **Local Cache** (tasks.json): Fast access, offline support
2. **Cloud Sync** (Blue.cc API): Automatic backup, multi-device sync

All CRUD operations automatically sync to Blue.cc while maintaining a local copy for performance and offline resilience.

### Data Structure

The tasks.json file follows this structure:
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "tags": ["dimension", "element"],
      "status": "To do",
      "dueDate": "2026-01-20",
      "workType": "part-of-element",
      "activities": [],
      "resources": {}
    }
  ],
  "nextId": 2
}
```
