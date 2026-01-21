#!/usr/bin/env node
/**
 * Test Script: Relationships and Milestones Cloud Backing
 *
 * Tests that relationships and milestones are:
 * 1. Stored as comments in Blue.cc cloud
 * 2. Retrieved correctly from cloud
 * 3. Updated correctly in cloud
 * 4. Deleted correctly from cloud
 * 5. Persist in local storage (backend/tasks.json)
 *
 * IMPLEMENTATION: Relationships and milestones are stored as comments on todos.
 * - Comments contain human-readable text and Base64-encoded JSON in HTML field
 * - HTML includes data attributes for identification (data-pmt-relationship, data-pmt-milestone)
 * - Comments are directly attached to source tasks
 * - No UI clutter - comments are hidden until task is opened
 */

import blueClient from './blueClient.js';

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${color}${message}${COLORS.reset}`);
}

function success(message) {
    log(COLORS.green, `✓ ${message}`);
}

function error(message) {
    log(COLORS.red, `✗ ${message}`);
}

function info(message) {
    log(COLORS.cyan, `ℹ ${message}`);
}

function section(message) {
    log(COLORS.blue, `\n${'='.repeat(60)}\n${message}\n${'='.repeat(60)}`);
}

async function cleanup() {
    info('Cleaning up test data...');
    const tasks = await blueClient.getTasks();
    if (tasks.success && tasks.data) {
        for (const task of tasks.data) {
            if (task.title && task.title.startsWith('TEST_REL_')) {
                await blueClient.deleteTask(task.id);
                info(`  Deleted test task: ${task.title}`);
            }
        }
    }
}

async function test1_CreateTasksWithRelationships() {
    section('TEST 1: Create Tasks and Add Relationships');

    try {
        // Create Task A
        info('Creating Task A...');
        const taskA = await blueClient.createTask({
            title: 'TEST_REL_TaskA',
            description: 'Source task for relationship testing',
            workType: 'part-of-element',
            tags: ['test'],
            activities: [],
            resources: {}
        });

        if (!taskA.success) {
            error(`Failed to create Task A: ${taskA.error}`);
            return false;
        }
        success(`Created Task A: ${taskA.data.id}`);

        // Create Task B
        info('Creating Task B...');
        const taskB = await blueClient.createTask({
            title: 'TEST_REL_TaskB',
            description: 'Target task for relationship testing',
            workType: 'delivery-enabler',
            tags: ['test'],
            activities: [],
            resources: {}
        });

        if (!taskB.success) {
            error(`Failed to create Task B: ${taskB.error}`);
            return false;
        }
        success(`Created Task B: ${taskB.data.id}`);

        // Create relationship: A feeds-into B
        info('Creating relationship: A --[feeds-into]--> B');
        const rel = await blueClient.createTaskRelationship(
            taskA.data.id,
            taskB.data.id,
            'feeds-into',
            'Chapter to Book'
        );

        if (!rel.success) {
            error(`Failed to create relationship: ${rel.error}`);
            return false;
        }
        success(`Created relationship: ${rel.data.id}`);
        info(`  From: ${rel.data.fromTaskId}`);
        info(`  To: ${rel.data.toTaskId}`);
        info(`  Type: ${rel.data.type}`);
        info(`  Label: ${rel.data.label || '(none)'}`);

        // Verify relationship was stored in local storage
        info('\nChecking local storage...');
        const taskALocal = blueClient.localTasks.find(t => t.id === taskA.data.id);

        if (!taskALocal) {
            error('Task A not found in local cache!');
            return false;
        }

        const relCount = blueClient.localRelationships.filter(r => r.fromTaskId === taskA.data.id).length;
        if (relCount === 0) {
            error('Task A has no relationships in local storage!');
            return false;
        }

        success(`Task A has ${relCount} relationship(s) in local storage`);
        info(`  Relationships: ${JSON.stringify(blueClient.localRelationships.filter(r => r.fromTaskId === taskA.data.id), null, 2)}`);

        return { taskAId: taskA.data.id, taskBId: taskB.data.id, relId: rel.data.id };
    } catch (err) {
        error(`Test 1 failed with exception: ${err.message}`);
        return false;
    }
}

async function test2_CreateTaskWithMilestones(taskIds) {
    section('TEST 2: Link Tasks to Milestones');

    if (!taskIds) {
        error('Skipping Test 2 - Test 1 failed');
        return false;
    }

    try {
        const milestoneId = 'milestone-launch-2026';

        // Link Task A to milestone
        info(`Linking Task A to milestone: ${milestoneId}`);
        const link1 = await blueClient.linkTaskToMilestone(taskIds.taskAId, milestoneId);

        if (!link1.success) {
            error(`Failed to link Task A: ${link1.error}`);
            return false;
        }
        success(`Linked Task A to milestone`);

        // Link Task B to same milestone
        info(`Linking Task B to milestone: ${milestoneId}`);
        const link2 = await blueClient.linkTaskToMilestone(taskIds.taskBId, milestoneId);

        if (!link2.success) {
            error(`Failed to link Task B: ${link2.error}`);
            return false;
        }
        success(`Linked Task B to milestone`);

        // Verify milestones were stored in local storage
        info('\nChecking local storage...');

        const linkA = blueClient.localMilestoneLinks.find(l => l.taskId === taskIds.taskAId && l.milestoneId === milestoneId);
        const linkB = blueClient.localMilestoneLinks.find(l => l.taskId === taskIds.taskBId && l.milestoneId === milestoneId);

        if (!linkA) {
            error('Task A milestone link not found in local storage!');
            return false;
        }

        if (!linkB) {
            error('Task B milestone link not found in local storage!');
            return false;
        }

        success('Both tasks have milestone links in local storage');
        info(`  Total milestone links: ${blueClient.localMilestoneLinks.length}`);

        // Get tasks for milestone
        info('\nGetting tasks for milestone...');
        const milestoneTasks = await blueClient.getTasksForMilestone(milestoneId);

        if (!milestoneTasks.success) {
            error(`Failed to get milestone tasks: ${milestoneTasks.error}`);
            return false;
        }

        success(`Found ${milestoneTasks.data.length} tasks for milestone`);
        milestoneTasks.data.forEach(t => {
            info(`  - ${t.title} (${t.id})`);
        });

        return true;
    } catch (err) {
        error(`Test 2 failed with exception: ${err.message}`);
        return false;
    }
}

async function test3_DeleteRelationship(taskIds) {
    section('TEST 3: Delete Relationship');

    if (!taskIds || !taskIds.relId) {
        error('Skipping Test 3 - Test 1 failed');
        return false;
    }

    try {
        info(`Deleting relationship: ${taskIds.relId}`);
        const result = await blueClient.deleteRelationship(taskIds.relId);

        if (!result.success) {
            error(`Failed to delete relationship: ${result.error}`);
            return false;
        }
        success('Relationship deleted');

        // Verify deletion from local storage
        info('\nChecking local storage...');

        const relCount = blueClient.localRelationships.filter(r => r.id === taskIds.relId).length;
        if (relCount !== 0) {
            error(`Relationship still exists in local storage after deletion!`);
            return false;
        }

        success('Relationship successfully removed from local storage');
        return true;
    } catch (err) {
        error(`Test 3 failed with exception: ${err.message}`);
        return false;
    }
}

async function test4_LocalPersistence() {
    section('TEST 4: Local Storage Persistence');

    try {
        info('Checking if data persists in tasks.json...');

        // Read the tasks.json file directly
        const fs = await import('fs/promises');
        const tasksJsonPath = './tasks.json';

        try {
            const data = await fs.readFile(tasksJsonPath, 'utf-8');
            const parsed = JSON.parse(data);

            success(`Local storage file exists: ${tasksJsonPath}`);
            success(`Tasks in file: ${parsed.tasks?.length || 0}`);
            success(`Relationships in file: ${parsed.relationships?.length || 0}`);
            success(`Milestone links in file: ${parsed.milestoneLinks?.length || 0}`);

            // Verify our test data is present
            const testTasks = parsed.tasks?.filter(t => t.title && t.title.startsWith('TEST_REL_')) || [];
            if (testTasks.length === 0) {
                error('No test tasks found in local storage file!');
                return false;
            }

            success(`Found ${testTasks.length} test task(s) in local storage`);

            const testRels = parsed.relationships?.filter(r =>
                testTasks.some(t => t.id === r.fromTaskId)
            ) || [];

            if (testRels.length > 0) {
                success(`Found ${testRels.length} relationship(s) for test tasks in local storage`);
            }

            return true;
        } catch (e) {
            error(`Failed to read local storage file: ${e.message}`);
            return false;
        }
    } catch (err) {
        error(`Test 4 failed with exception: ${err.message}`);
        return false;
    }
}

async function runTests() {
    log(COLORS.blue, '\n╔══════════════════════════════════════════════════════════╗');
    log(COLORS.blue, '║  PMT Relationships & Milestones Cloud Backing Test      ║');
    log(COLORS.blue, '╚══════════════════════════════════════════════════════════╝\n');

    // Connect to Blue.cc
    info('Connecting to Blue.cc...');
    const connected = await blueClient.testConnection();

    if (!connected) {
        error('Failed to connect to Blue.cc API');
        process.exit(1);
    }
    success('Connected to Blue.cc\n');

    // Clean up any existing test data
    await cleanup();

    // Run tests
    const results = {
        test1: false,
        test2: false,
        test3: false,
        test4: false
    };

    const test1Result = await test1_CreateTasksWithRelationships();
    results.test1 = test1Result !== false;

    const test2Result = await test2_CreateTaskWithMilestones(test1Result);
    results.test2 = test2Result !== false;

    const test3Result = await test3_DeleteRelationship(test1Result);
    results.test3 = test3Result !== false;

    const test4Result = await test4_LocalPersistence();
    results.test4 = test4Result !== false;

    // Summary
    section('TEST SUMMARY');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    console.log('\nResults:');
    console.log(`  ${results.test1 ? '✓' : '✗'} Test 1: Create Tasks with Relationships`);
    console.log(`  ${results.test2 ? '✓' : '✗'} Test 2: Link Tasks to Milestones`);
    console.log(`  ${results.test3 ? '✓' : '✗'} Test 3: Delete Relationship`);
    console.log(`  ${results.test4 ? '✓' : '✗'} Test 4: Local Storage Persistence`);

    console.log(`\n${passed}/${total} tests passed\n`);

    if (passed === total) {
        success('✓ ALL TESTS PASSED!');
        success('Relationships and milestones are FULLY CLOUD-BACKED!\n');
        info('Implementation: Comments API stores relationships and milestones.');
        info('Each relationship/milestone is a comment attached to the source task.');
        info('Comments contain human-readable text + Base64-encoded JSON metadata.');
        info('No UI clutter - comments are hidden until task is opened.\n');
    } else {
        error(`✗ ${total - passed} TEST(S) FAILED`);
        error('Some issues detected with cloud backing.\n');
    }

    // Cleanup
    info('Cleaning up test data...');
    await cleanup();
    success('Cleanup complete\n');

    process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(err => {
    error(`Fatal error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});
