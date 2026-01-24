#!/usr/bin/env node
/**
 * Blue.cc API Introspection Script
 *
 * Checks for Documents, Forms, Custom Fields, or File attachment support
 */

import blueClient from './blueClient.js';

async function introspect() {
  console.log('Connecting to Blue.cc...');
  const connected = await blueClient.testConnection();
  if (!connected) {
    console.error('Failed to connect');
    process.exit(1);
  }
  console.log('✓ Connected\n');

  // Check Todo type fields
  console.log('=== Checking Todo Type Fields ===');
  const todoQuery = `
      query {
        __type(name: "Todo") {
          fields {
            name
            type {
              name
              kind
              ofType { name }
            }
          }
        }
      }
    `;

  const todoResult = await blueClient.query(todoQuery);
  if (todoResult.success && todoResult.data.__type) {
    const allFields = todoResult.data.__type.fields;
    console.log('Total Todo fields:', allFields.length);

    // Look for custom/document/file related fields
    const relevantFields = allFields.filter(
      (f) =>
        f.name.toLowerCase().includes('custom') ||
        f.name.toLowerCase().includes('field') ||
        f.name.toLowerCase().includes('property') ||
        f.name.toLowerCase().includes('document') ||
        f.name.toLowerCase().includes('file') ||
        f.name.toLowerCase().includes('form') ||
        f.name.toLowerCase().includes('attachment')
    );

    console.log('\nRelevant fields found:', relevantFields.length);
    if (relevantFields.length > 0) {
      relevantFields.forEach((f) => {
        console.log(`  - ${f.name}: ${f.type.name || f.type.ofType?.name || f.type.kind}`);
      });
    } else {
      console.log('  (none found)');
    }
  }

  // Check all Mutation fields
  console.log('\n=== Checking Mutation Fields ===');
  const mutationQuery = `
      query {
        __type(name: "Mutation") {
          fields {
            name
            description
          }
        }
      }
    `;

  const mutationResult = await blueClient.query(mutationQuery);
  if (mutationResult.success && mutationResult.data.__type) {
    const allMutations = mutationResult.data.__type.fields;
    console.log('Total mutations:', allMutations.length);

    // Look for document/form/file related mutations
    const relevantMutations = allMutations.filter(
      (f) =>
        f.name.toLowerCase().includes('document') ||
        f.name.toLowerCase().includes('form') ||
        f.name.toLowerCase().includes('file') ||
        f.name.toLowerCase().includes('attachment') ||
        f.name.toLowerCase().includes('upload') ||
        f.name.toLowerCase().includes('custom')
    );

    console.log('\nRelevant mutations found:', relevantMutations.length);
    if (relevantMutations.length > 0) {
      relevantMutations.forEach((f) => {
        console.log(`  - ${f.name}${f.description ? ': ' + f.description : ''}`);
      });
    } else {
      console.log('  (none found)');
    }
  }

  // Check all Query fields
  console.log('\n=== Checking Query Fields ===');
  const queryQuery = `
      query {
        __type(name: "Query") {
          fields {
            name
            description
          }
        }
      }
    `;

  const queryResult = await blueClient.query(queryQuery);
  if (queryResult.success && queryResult.data.__type) {
    const allQueries = queryResult.data.__type.fields;
    console.log('Total queries:', allQueries.length);

    // Look for document/form related queries
    const relevantQueries = allQueries.filter(
      (f) =>
        f.name.toLowerCase().includes('document') ||
        f.name.toLowerCase().includes('form') ||
        f.name.toLowerCase().includes('file') ||
        f.name.toLowerCase().includes('attachment') ||
        f.name.toLowerCase().includes('custom')
    );

    console.log('\nRelevant queries found:', relevantQueries.length);
    if (relevantQueries.length > 0) {
      relevantQueries.forEach((f) => {
        console.log(`  - ${f.name}${f.description ? ': ' + f.description : ''}`);
      });
    } else {
      console.log('  (none found)');
    }
  }

  console.log('\n=== Summary ===');
  console.log('This introspection checks if Blue.cc exposes:');
  console.log('  - Custom fields on Todo objects');
  console.log('  - Document/Form storage APIs');
  console.log('  - File attachment capabilities');
  console.log('\nResults above show what is available in the GraphQL schema.');
}

introspect().catch((err) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
