# Cloud Sync Architecture

## Blue.cc Integration Strategy

This document describes how PMT achieves full cloud synchronization with Blue.cc using native Blue.cc features.

---

## The Challenge

Blue.cc's GraphQL API has a **~180 character hard limit** on the `text` field for todos. This limit is enforced silently:
- Mutations return `success: true`
- But data exceeding 180 chars is truncated/rejected
- No error is returned to indicate the problem

Additionally, Blue.cc auto-formats text by inserting newlines, which corrupts JSON strings stored directly in the text field.

---

## The Solution: Comments API

We store relationships and milestones as **comments attached to todos** using Blue.cc's native Comments API, with each relationship/milestone represented by a dedicated comment.

### Architecture

#### 1. Regular Tasks
- **Title**: User-visible task name
- **Text/Description**: Contains Base64-encoded work metadata (workType, activities, resources, position)
- **Tags**: Dimension markers (Content, Practice, Community, Marketing, Admin)
- **Dates**: Due date, start date
- **Status**: Done/In Progress

#### 2. Relationship Comments
- **Category**: `TODO` (links comment to specific todo)
- **CategoryId**: Source task ID (fromTaskId)
- **Text**: Human-readable description
  - Example: `[PMT Relationship] feeds-into: Chapter to Book → def456`
- **HTML**: Machine-readable Base64-encoded JSON with data attribute:
  ```html
  <div data-pmt-relationship="rel-1769035951102-8n5c7">
    eyJpZCI6InJlbC0xNzY5MDM1OTUxMTAyLThuNWM3IiwiZnJvbVRhc2tJZCI6ImFiYzEyMyIsInRvVGFza0lkIjoiZGVmNDU2IiwidHlwZSI6ImZlZWRzLWludG8iLCJsYWJlbCI6IkNoYXB0ZXIgdG8gQm9vayIsImNyZWF0ZWRBdCI6IjIwMjYtMDEtMjFUMjI6NTI6MzEuMTAyWiJ9
  </div>
  ```
- **Hidden** in UI until task is opened
- **Decoded JSON**:
  ```json
  {
    "id": "rel-1769035951102-8n5c7",
    "fromTaskId": "abc123",
    "toTaskId": "def456",
    "type": "feeds-into",
    "label": "Chapter to Book",
    "createdAt": "2026-01-21T22:52:31.102Z"
  }
  ```

#### 3. Milestone Link Comments
- **Category**: `TODO` (links comment to specific todo)
- **CategoryId**: Task ID being linked to milestone
- **Text**: Human-readable description
  - Example: `[PMT Milestone] Linked to milestone-launch-2026`
- **HTML**: Machine-readable Base64-encoded JSON with data attribute:
  ```html
  <div data-pmt-milestone="milestone-launch-2026">
    eyJ0YXNrSWQiOiJhYmMxMjMiLCJtaWxlc3RvbmVJZCI6Im1pbGVzdG9uZS1sYXVuY2gtMjAyNiIsImNyZWF0ZWRBdCI6IjIwMjYtMDEtMjFUMjI6NTI6MzEuMTAyWiJ9
  </div>
  ```
- **Hidden** in UI until task is opened
- **Decoded JSON**:
  ```json
  {
    "taskId": "abc123",
    "milestoneId": "milestone-launch-2026",
    "createdAt": "2026-01-21T22:52:31.102Z"
  }
  ```

---

## Data Flow

### Creating a Relationship

1. User creates relationship in UI
2. Frontend calls `POST /api/relationships`
3. Backend `blueClient.createTaskRelationship()`:
   - Adds to `localRelationships` array
   - Saves to `tasks.json`
   - Creates comment on source task with:
     - Human-readable text: `[PMT Relationship] feeds-into: Label → targetId`
     - Base64-encoded JSON in HTML field
4. Relationship synced to cloud ✅

### Loading Data

1. App calls `blueClient.getTasks()`
2. Queries all todos from Blue.cc
3. **First pass**: Query comments for all todos
   - Fetch comments in parallel for efficiency (Promise.all)
   - Parse relationship comments (data-pmt-relationship attribute)
   - Parse milestone comments (data-pmt-milestone attribute)
   - Extract Base64-encoded JSON from HTML
4. **Second pass**: Parse regular tasks
   - Parse work metadata from description field (Base64-encoded JSON)
   - Populate `_relationships` and `_milestones` arrays on each task
5. Cache in `localTasks`, `localRelationships`, `localMilestoneLinks`
6. Save to `tasks.json`

### Deleting a Relationship

1. User deletes relationship in UI
2. Frontend calls `DELETE /api/relationships/:id`
3. Backend `blueClient.deleteRelationship()`:
   - Removes from `localRelationships` array
   - Saves to `tasks.json`
   - Deletes comment from Blue.cc (using stored commentId or by searching)
4. Relationship removed from cloud ✅

---

## Benefits

✅ **Native Blue.cc feature**: Uses Comments API as designed
✅ **No UI clutter**: Comments hidden until task is opened
✅ **Human-readable**: Text field provides context for users
✅ **Machine-readable**: HTML field contains structured JSON metadata
✅ **Fully cloud-backed**: All relationships and milestones sync to Blue.cc
✅ **Cross-device sync**: Data available on all devices
✅ **Data durability**: Survives local data loss
✅ **File attachments**: Can attach diagrams/documents (up to 5GB)
✅ **Future-proof**: Can add @mentions, discussions, rich formatting
✅ **Base64 encoding**: Prevents Blue.cc text formatting from corrupting JSON

---

## Trade-offs

⚠️ **More API calls**: Need to query comments separately from todos
⚠️ **Parallel queries**: Fetches comments for all todos during load (optimized with Promise.all)

---

## Testing

Comprehensive test suite: `backend/test-relationships-milestones.js`

Tests verify:
1. ✅ Create relationships → stored as comments in cloud
2. ✅ Link milestones → stored as comments in cloud
3. ✅ Delete relationships → comment removed from cloud
4. ✅ Local persistence → survives cache clears
5. ✅ Base64 encoding → prevents JSON corruption
6. ✅ Comment parsing → retrieves data from cloud

All tests passing as of 2026-01-21 (4/4 tests passed).

---

## Future Enhancements

Now that we're using Comments API, future possibilities include:
- **@mentions** → Notify team members about relationships
- **Rich formatting** → Add diagrams, explanations in comments
- **File attachments** → Attach visual relationship maps (5GB limit)
- **Discussion threads** → Collaborative notes on dependencies
- **Search & filter** → Query comments by content or metadata

The Comments API approach provides a solid foundation for advanced collaboration features.
