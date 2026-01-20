# PMT Application Testing Guide

## Unified Data Layer Testing

The application now uses a **unified TasksContext** that provides a single source of truth for all task data. This ensures data consistency across all views.

### Test Scenarios

#### 1. Create Task Flow
**Steps:**
1. Go to Tasks view (`/`)
2. Click "Create Task" button
3. Fill in task details:
   - Dimension: Content
   - Element: Books
   - Title: "Test Book Project"
   - Description: "Testing unified data sync"
   - Work Type: "Part of Element"
   - Add 2 activities
   - Set Start Date and Due Date
4. Click Save

**Expected Results:**
- Task appears immediately in Tasks view
- Task count in Sidebar updates for "Content > Books"
- Task should have all metadata preserved

#### 2. Cross-View Consistency
**Steps:**
1. After creating task above, navigate to Board view (`/board`)
2. Find the "Test Book Project" node on the canvas
3. Click on the node to open Work Wizard
4. Add another activity or modify start date
5. Save changes
6. Navigate back to Tasks view

**Expected Results:**
- Changes made in Board view appear in Tasks view
- All metadata remains intact
- No data duplication or loss

#### 3. Timeline View Sync
**Steps:**
1. Go to Timeline view (`/timeline`)
2. Verify "Test Book Project" appears with correct dates
3. Go back to Tasks view and change the due date
4. Return to Timeline view

**Expected Results:**
- Timeline updates with new due date
- Task position on timeline adjusts accordingly

#### 4. Readiness Dashboard
**Steps:**
1. Create tasks covering different readiness categories:
   - A "Books" task (Content category)
   - A "BOPA" task (Marketing category)
   - An "Accounting" task (Admin category)
2. Go to Readiness view (`/readiness`)
3. Mark the "Books" task as "Done" from Tasks view
4. Check Readiness dashboard

**Expected Results:**
- Relevant readiness checks toggle based on task completion
- Progress percentages update
- All views reflect the "Done" status

### Data Consistency Checks

After each test scenario, verify:

1. **Sidebar Counts**: 
   - Total task count matches actual number of tasks
   - Dimension counts are accurate
   - Child element counts are correct

2. **No Duplicate API Calls**:
   - Open browser DevTools Network tab
   - Navigate between views
   - Should see minimal `/api/tasks` requests
   - TasksContext caches data globally

3. **State Persistence**:
   - Refresh page
   - All data should reload correctly
   - No data loss

### Blue.cc Cloud Sync Testing

Currently in **LOCAL STORAGE MODE**. To test Blue.cc integration:

1. **Manual Data Entry Test**:
   - Create a task with rich metadata (activities, resources)
   - Check `backend/tasks.json` to verify local storage
   - Structure should match Blue.cc's expected format

2. **Blue.cc Sync (When Available)**:
   - Verify company and project IDs are correct
   - Check `backend/test-bluecc-integration.js` output
   - Confirm todoList queries work
   - Validate rich metadata serialization

### Known Issues

1. **Blue.cc Project Not Found**: Queries fail with "PROJECT_NOT_FOUND" - requires workspace configuration in Blue.cc UI
2. **Legacy Components**: Some older components may still call API directly - these need migration to TasksContext

### Success Criteria

✅ **Data Consistency**: All views show the same data at all times
✅ **No Duplication**: Single source of truth, no redundant data stores
✅ **Metadata Preservation**: Activities, resources, workType, dates all persist
✅ **Performance**: Minimal API calls, fast view transitions
✅ **Blue.cc Ready**: Local data structure compatible with Blue.cc schema

