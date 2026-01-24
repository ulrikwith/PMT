#!/usr/bin/env node
/**
 * Migration Script: Metadata Tasks → Comments API
 *
 * This script migrates existing relationship and milestone metadata tasks
 * to the new Comments API-based storage.
 *
 * What it does:
 * 1. Finds all _META_REL_ and _META_LINK_ tasks
 * 2. Creates equivalent comments for each relationship/milestone
 * 3. Deletes the old metadata tasks
 * 4. Verifies data integrity
 */

import blueClient from './blueClient.js';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

async function migrate() {
  log(COLORS.blue, '\n╔══════════════════════════════════════════════════════════╗');
  log(COLORS.blue, '║  PMT Migration: Metadata Tasks → Comments API          ║');
  log(COLORS.blue, '╚══════════════════════════════════════════════════════════╝\n');

  // Connect to Blue.cc
  info('Connecting to Blue.cc...');
  const connected = await blueClient.testConnection();

  if (!connected) {
    error('Failed to connect to Blue.cc API');
    process.exit(1);
  }
  success('Connected to Blue.cc\n');

  // Step 1: Find all metadata tasks
  section('Step 1: Finding Metadata Tasks');

  const todoListId = await blueClient.getDefaultTodoListId();
  const query = `
      query GetTodos($todoListId: String!) {
        todoList(id: $todoListId) {
          todos {
            id
            title
            text
          }
        }
      }
    `;

  const result = await blueClient.query(query, { todoListId });
  if (!result.success) {
    error('Failed to fetch todos from Blue.cc');
    process.exit(1);
  }

  const metaRelTasks = result.data.todoList.todos.filter((t) => t.title.startsWith('_META_REL_'));
  const metaLinkTasks = result.data.todoList.todos.filter((t) => t.title.startsWith('_META_LINK_'));

  info(`Found ${metaRelTasks.length} relationship metadata tasks`);
  info(`Found ${metaLinkTasks.length} milestone link metadata tasks`);

  if (metaRelTasks.length === 0 && metaLinkTasks.length === 0) {
    success('\nNo metadata tasks to migrate. You are already using Comments API!');
    process.exit(0);
  }

  // Step 2: Migrate relationships
  section('Step 2: Migrating Relationships');

  const migratedRelationships = [];
  const failedRelationships = [];

  for (const metaTask of metaRelTasks) {
    try {
      // Parse Base64-encoded relationship data
      const base64Data = (metaTask.text || '').replace(/\s/g, '');
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const relData = JSON.parse(jsonString);

      info(
        `Migrating relationship: ${relData.fromTaskId} --[${relData.type}]--> ${relData.toTaskId}`
      );

      // Create comment for this relationship
      const metadataJson = JSON.stringify({
        id: metaTask.title.replace('_META_REL_', ''),
        fromTaskId: relData.fromTaskId,
        toTaskId: relData.toTaskId,
        type: relData.type,
        label: relData.label,
        createdAt: relData.createdAt,
      });

      const base64Metadata = Buffer.from(metadataJson).toString('base64');
      const text = `[PMT Relationship] ${relData.type}${relData.label ? ': ' + relData.label : ''} → ${relData.toTaskId}`;
      const html = `<div data-pmt-relationship="${metaTask.title.replace('_META_REL_', '')}">${base64Metadata}</div>`;

      const commentResult = await blueClient.createComment(relData.fromTaskId, text, html);

      if (commentResult.success) {
        success(`  Created comment for relationship`);
        migratedRelationships.push({
          metaTaskId: metaTask.id,
          relationshipId: metaTask.title.replace('_META_REL_', ''),
          commentId: commentResult.data.id,
        });
      } else {
        error(`  Failed to create comment: ${commentResult.error}`);
        failedRelationships.push(metaTask);
      }
    } catch (e) {
      error(`  Failed to parse metadata: ${e.message}`);
      failedRelationships.push(metaTask);
    }
  }

  // Step 3: Migrate milestone links
  section('Step 3: Migrating Milestone Links');

  const migratedMilestones = [];
  const failedMilestones = [];

  for (const metaTask of metaLinkTasks) {
    try {
      // Parse Base64-encoded milestone data
      const base64Data = (metaTask.text || '').replace(/\s/g, '');
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const linkData = JSON.parse(jsonString);

      info(`Migrating milestone link: ${linkData.taskId} -> ${linkData.milestoneId}`);

      // Create comment for this milestone link
      const metadataJson = JSON.stringify({
        taskId: linkData.taskId,
        milestoneId: linkData.milestoneId,
        createdAt: linkData.createdAt,
      });

      const base64Metadata = Buffer.from(metadataJson).toString('base64');
      const text = `[PMT Milestone] Linked to ${linkData.milestoneId}`;
      const html = `<div data-pmt-milestone="${linkData.milestoneId}">${base64Metadata}</div>`;

      const commentResult = await blueClient.createComment(linkData.taskId, text, html);

      if (commentResult.success) {
        success(`  Created comment for milestone link`);
        migratedMilestones.push({
          metaTaskId: metaTask.id,
          milestoneId: linkData.milestoneId,
          commentId: commentResult.data.id,
        });
      } else {
        error(`  Failed to create comment: ${commentResult.error}`);
        failedMilestones.push(metaTask);
      }
    } catch (e) {
      error(`  Failed to parse metadata: ${e.message}`);
      failedMilestones.push(metaTask);
    }
  }

  // Step 4: Delete old metadata tasks
  section('Step 4: Deleting Old Metadata Tasks');

  info(`Deleting ${migratedRelationships.length} relationship metadata tasks...`);
  for (const rel of migratedRelationships) {
    try {
      await blueClient.deleteTask(rel.metaTaskId);
      success(`  Deleted metadata task for relationship ${rel.relationshipId}`);
    } catch (e) {
      error(`  Failed to delete metadata task: ${e.message}`);
    }
  }

  info(`Deleting ${migratedMilestones.length} milestone link metadata tasks...`);
  for (const milestone of migratedMilestones) {
    try {
      await blueClient.deleteTask(milestone.metaTaskId);
      success(`  Deleted metadata task for milestone link`);
    } catch (e) {
      error(`  Failed to delete metadata task: ${e.message}`);
    }
  }

  // Step 5: Verification
  section('Step 5: Verification');

  info('Refreshing data from cloud...');
  const tasksResult = await blueClient.getTasks();

  if (tasksResult.success) {
    success(`Loaded ${blueClient.localRelationships.length} relationships from comments`);
    success(`Loaded ${blueClient.localMilestoneLinks.length} milestone links from comments`);
  }

  // Summary
  section('Migration Summary');

  console.log('\nRelationships:');
  console.log(`  ✓ Migrated: ${migratedRelationships.length}`);
  if (failedRelationships.length > 0) {
    console.log(`  ✗ Failed: ${failedRelationships.length}`);
  }

  console.log('\nMilestone Links:');
  console.log(`  ✓ Migrated: ${migratedMilestones.length}`);
  if (failedMilestones.length > 0) {
    console.log(`  ✗ Failed: ${failedMilestones.length}`);
  }

  const totalMigrated = migratedRelationships.length + migratedMilestones.length;
  const totalFailed = failedRelationships.length + failedMilestones.length;

  console.log(`\nTotal: ${totalMigrated} migrated, ${totalFailed} failed\n`);

  if (totalFailed === 0) {
    success('✓ MIGRATION COMPLETE!');
    success('All metadata tasks have been migrated to Comments API.\n');
    info('Benefits:');
    info('  • No UI clutter in Blue.cc workspace');
    info('  • Comments are hidden until task is opened');
    info('  • Human-readable text + machine-readable metadata');
    info('  • Native Blue.cc feature (future-proof)\n');
  } else {
    error(`✗ MIGRATION INCOMPLETE: ${totalFailed} items failed`);
    info('Please review the errors above and retry if needed.\n');
  }

  process.exit(totalFailed === 0 ? 0 : 1);
}

// Run migration
migrate().catch((err) => {
  error(`Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
