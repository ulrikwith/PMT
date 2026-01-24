#!/usr/bin/env node
import blueClient from './blueClient.js';

console.log('🔄 Connecting to Blue.cc...');

try {
  // Get all tasks
  console.log('📥 Fetching all records from Blue.cc...');
  const result = await blueClient.getTasks();
  const tasks = result.data || [];

  if (tasks.length === 0) {
    console.log('✅ No records found. Blue.cc is already clean!');
    process.exit(0);
  }

  console.log(`\n📋 Found ${tasks.length} records to delete:`);
  tasks.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.title || 'Untitled'} (ID: ${task.id})`);
  });

  console.log('\n🗑️  Deleting all records...');
  let deleted = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      await blueClient.deleteTask(task.id);
      deleted++;
      console.log(`  ✓ Deleted: ${task.title || 'Untitled'}`);
    } catch (err) {
      failed++;
      console.log(`  ✗ Failed to delete: ${task.title || 'Untitled'} - ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Cleanup complete!`);
  console.log(`   Deleted: ${deleted} records`);
  if (failed > 0) {
    console.log(`   Failed: ${failed} records`);
  }
  console.log('='.repeat(50));

  // Clear local storage too
  console.log('\n🧹 Clearing local storage (tasks.json)...');
  await blueClient.saveLocalStore();
  console.log('✅ Local storage cleared!');

  console.log('\n🎉 Blue.cc workspace is now clean and ready for use!');
} catch (error) {
  console.error('\n❌ Error during cleanup:', error.message);
  console.error(error);
  process.exit(1);
}
