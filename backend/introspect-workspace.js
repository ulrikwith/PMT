import coreClient from './services/bluecc/core.js';

async function introspect() {
  await coreClient.testConnection();

  console.log('\n--- Recent Projects ---');
  const q1 = `query { recentProjects { id name todoLists { id title } } }`;
  const r1 = await coreClient.query(q1, {}, { skipProjectHeader: true, skipCompanyHeader: true });
  if (r1.success) {
    r1.data.recentProjects.forEach((p) => {
      console.log(`Project: ${p.name} (${p.id})`);
      p.todoLists.forEach((l) => console.log(`  - List: ${l.title} (${l.id})`));
    });
  }
}

introspect();
