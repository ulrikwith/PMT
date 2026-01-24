#!/usr/bin/env node

/**
 * Blue.cc Integration Test Suite
 *
 * This script thoroughly tests the Blue.cc API integration to ensure:
 * 1. Connection and authentication work
 * 2. Rich metadata serialization/deserialization works
 * 3. Create, Read, Update operations preserve all data
 * 4. Cloud sync properly handles activities, resources, workType, position
 */

import dotenv from 'dotenv';
import blueClient from './blueClient.js';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(msg) {
  log(colors.green, '✓', msg);
}
function error(msg) {
  log(colors.red, '✗', msg);
}
function info(msg) {
  log(colors.blue, 'ℹ', msg);
}
function warn(msg) {
  log(colors.yellow, '⚠', msg);
}

async function testBlueCC() {
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + '  Blue.cc Integration Test Suite' + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');

  const client = blueClient;
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Connection
  info('Test 1: Testing Blue.cc API connection...');
  try {
    const connected = await client.testConnection();
    if (connected && !client.useLocalMode) {
      success('Blue.cc API connection successful');
      testsPassed++;
    } else {
      error('Connection failed - running in LOCAL MODE');
      warn('This means data is NOT syncing to Blue.cc cloud');
      testsFailed++;
      return; // Can't continue without connection
    }
  } catch (e) {
    error(`Connection test failed: ${e.message}`);
    testsFailed++;
    return;
  }

  // Test 2: Create Task with Rich Metadata
  info('\nTest 2: Creating task with rich metadata...');
  const testTask = {
    title: 'Test Work - Rich Metadata Integration',
    description: 'Testing if activities, resources, and workType persist to cloud',
    tags: ['content', 'books'],
    dueDate: '2026-02-01',
    workType: 'part-of-element',
    targetOutcome: 'Verify cloud sync works correctly',
    activities: [
      { title: 'Test activity 1', status: 'todo' },
      { title: 'Test activity 2', status: 'done' },
      { title: 'Test activity 3', status: 'in-progress' },
    ],
    resources: {
      timeEstimate: '5',
      energyLevel: 'Focused work',
      tools: ['Jest', 'Blue.cc API'],
      materials: 'Test data',
    },
    position: { x: 100, y: 200 },
  };

  let createdTaskId;
  try {
    const result = await client.createTask(testTask);
    if (result.success && result.data) {
      createdTaskId = result.data.id;
      success(`Task created with ID: ${createdTaskId}`);

      // Verify metadata was included
      if (result.data.workType === testTask.workType) {
        success('  ✓ workType preserved');
      } else {
        error(`  ✗ workType lost (expected: ${testTask.workType}, got: ${result.data.workType})`);
        testsFailed++;
      }

      if (result.data.activities && result.data.activities.length === 3) {
        success(`  ✓ activities preserved (${result.data.activities.length} items)`);
      } else {
        error(`  ✗ activities lost or incomplete`);
        testsFailed++;
      }

      if (result.data.resources && result.data.resources.timeEstimate === '5') {
        success('  ✓ resources preserved');
      } else {
        error('  ✗ resources lost');
        testsFailed++;
      }

      if (result.data.position && result.data.position.x === 100) {
        success('  ✓ position preserved');
      } else {
        error('  ✗ position lost');
        testsFailed++;
      }

      testsPassed++;
    } else {
      error('Task creation failed');
      testsFailed++;
      return;
    }
  } catch (e) {
    error(`Create task failed: ${e.message}`);
    testsFailed++;
    return;
  }

  // Wait for Blue.cc to process
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: Read Task and Verify Deserialization
  info('\nTest 3: Reading task back from Blue.cc...');
  try {
    const result = await client.getTasks();
    if (result.success && result.data) {
      const foundTask = result.data.find((t) => t.id === createdTaskId);

      if (foundTask) {
        success('Task retrieved from cloud');

        // Verify deserialization worked
        if (foundTask.workType === testTask.workType) {
          success('  ✓ workType deserialized correctly');
        } else {
          error(
            `  ✗ workType deserialization failed (expected: ${testTask.workType}, got: ${foundTask.workType})`
          );
          testsFailed++;
        }

        if (foundTask.activities && foundTask.activities.length === 3) {
          success(`  ✓ activities deserialized (${foundTask.activities.length} items)`);
        } else {
          error('  ✗ activities deserialization failed');
          console.log('    Got:', foundTask.activities);
          testsFailed++;
        }

        if (foundTask.resources && foundTask.resources.timeEstimate === '5') {
          success('  ✓ resources deserialized');
        } else {
          error('  ✗ resources deserialization failed');
          console.log('    Got:', foundTask.resources);
          testsFailed++;
        }

        if (foundTask.position && foundTask.position.x === 100) {
          success('  ✓ position deserialized');
        } else {
          error('  ✗ position deserialization failed');
          console.log('    Got:', foundTask.position);
          testsFailed++;
        }

        testsPassed++;
      } else {
        error('Task not found in cloud response');
        testsFailed++;
      }
    } else {
      error('Failed to retrieve tasks');
      testsFailed++;
    }
  } catch (e) {
    error(`Read tasks failed: ${e.message}`);
    testsFailed++;
  }

  // Test 4: Update Task and Verify Metadata Preservation
  info('\nTest 4: Updating task and verifying metadata preservation...');
  try {
    const updates = {
      title: 'Test Work - UPDATED',
      activities: [
        { title: 'Test activity 1', status: 'done' }, // Changed status
        { title: 'Test activity 2', status: 'done' },
        { title: 'Test activity 3', status: 'done' },
        { title: 'Test activity 4 - NEW', status: 'todo' }, // Added new
      ],
      resources: {
        timeEstimate: '8', // Changed
        energyLevel: 'Deep work', // Changed
        tools: ['Jest', 'Blue.cc API', 'Postman'], // Added tool
        materials: 'Test data updated',
      },
    };

    const result = await client.updateTask(createdTaskId, updates);

    if (result.success && result.data) {
      success('Task updated successfully');

      // Verify updates applied
      if (result.data.activities && result.data.activities.length === 4) {
        success('  ✓ activities updated (4 items)');
      } else {
        error(
          `  ✗ activities update failed (expected 4, got ${result.data.activities?.length || 0})`
        );
        testsFailed++;
      }

      if (result.data.resources && result.data.resources.timeEstimate === '8') {
        success('  ✓ resources updated');
      } else {
        error('  ✗ resources update failed');
        testsFailed++;
      }

      // Verify original metadata not lost
      if (result.data.workType === testTask.workType) {
        success('  ✓ workType preserved during update');
      } else {
        error('  ✗ workType lost during update');
        testsFailed++;
      }

      if (result.data.position && result.data.position.x === 100) {
        success('  ✓ position preserved during update');
      } else {
        error('  ✗ position lost during update');
        testsFailed++;
      }

      testsPassed++;
    } else {
      error('Task update failed');
      testsFailed++;
    }
  } catch (e) {
    error(`Update task failed: ${e.message}`);
    testsFailed++;
  }

  // Test 4.5: Relationships and Milestones
  info('\nTest 4.5: Testing Relationships and Milestones...');
  let secondTaskId;
  try {
    // 1. Create a second task to link to
    const task2 = { title: 'Test Work 2 - Linked' };
    const createRes = await client.createTask(task2);
    if (createRes.success) {
      secondTaskId = createRes.data.id;
      success(`Second task created: ${secondTaskId}`);

      // 2. Create Relationship
      info('  Creating relationship...');
      const relRes = await client.createTaskRelationship(createdTaskId, secondTaskId, 'feeds-into');
      if (relRes.success) {
        success('  ✓ Relationship created via API');
      } else {
        error(`  ✗ Failed to create relationship: ${relRes.error}`);
        testsFailed++;
      }

      // 3. Link Milestone
      info('  Linking milestone...');
      const mileRes = await client.linkTaskToMilestone(createdTaskId, 'milestone-test-123');
      if (mileRes.success) {
        success('  ✓ Milestone linked via API');
      } else {
        error(`  ✗ Failed to link milestone: ${mileRes.error}`);
        testsFailed++;
      }

      // 4. Verify Persistence (Read back from Cloud)
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for cloud propagation
      info('  Verifying persistence from cloud...');

      // Force clear local cache to ensure we read from cloud
      // client.localTasks = []; // Deprecated
      const fetchRes = await client.getTasks(); // This pulls from cloud

      if (fetchRes.success) {
        const task1 = fetchRes.data.find((t) => t.id === createdTaskId);

        // Verify relationships via separate call
        const relRes = await client.getTaskRelationships(createdTaskId);

        if (relRes.success && relRes.data.length > 0) {
          const rel = relRes.data.find((r) => r.toTaskId === secondTaskId);
          if (rel && rel.type === 'feeds-into') {
            success(
              '  ✓ Relationship persisted in cloud metadata (fetched via getTaskRelationships)'
            );
          } else {
            error('  ✗ Relationship data incorrect or missing');
            console.log('    Got Rels:', relRes.data);
            testsFailed++;
          }
        } else {
          error('  ✗ No relationships found via API');
          testsFailed++;
        }

        // Verify milestones via separate call
        const mileRes = await client.getTasksForMilestone('milestone-test-123');
        if (mileRes.success && mileRes.data.some((t) => t.id === createdTaskId)) {
          success('  ✓ Milestone link persisted (fetched via getTasksForMilestone)');
        } else {
          error('  ✗ Milestone link missing');
          testsFailed++;
        }
      } else {
        error('  ✗ Failed to fetch tasks for verification');
        testsFailed++;
      }
    } else {
      error('Failed to create second task for linking');
      testsFailed++;
    }
  } catch (e) {
    error(`Relationship test failed: ${e.message}`);
    testsFailed++;
  }

  // Test 5: Cleanup - Delete Test Task
  info('\nTest 5: Cleaning up test data...');
  try {
    const result = await client.deleteTask(createdTaskId);
    if (result.success) {
      success('Test task deleted successfully');
      testsPassed++;
    } else {
      warn('Failed to delete test task - manual cleanup may be needed');
      testsFailed++;
    }
  } catch (e) {
    warn(`Cleanup failed: ${e.message} - manual cleanup may be needed`);
  }

  // Summary
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + '  Test Results' + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(`${colors.green}  Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}  Failed: ${testsFailed}${colors.reset}`);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');

  if (testsFailed === 0) {
    success('All tests passed! Blue.cc integration is working correctly.');
    process.exit(0);
  } else {
    error(`${testsFailed} test(s) failed. Blue.cc integration has issues.`);
    process.exit(1);
  }
}

// Run tests
testBlueCC().catch((err) => {
  error(`Test suite crashed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
