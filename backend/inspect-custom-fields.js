#!/usr/bin/env node
/**
 * Inspect Custom Fields Capabilities
 *
 * Get detailed information about custom fields and how they work with Todos
 */

import blueClient from './blueClient.js';

async function inspect() {
    console.log('Connecting to Blue.cc...');
    const connected = await blueClient.testConnection();
    if (!connected) {
        console.error('Failed to connect');
        process.exit(1);
    }
    console.log('✓ Connected\n');

    // Get details about CustomField type
    console.log('=== CustomField Type ===');
    const customFieldTypeQuery = `
      query {
        __type(name: "CustomField") {
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

    const cfTypeResult = await blueClient.query(customFieldTypeQuery);
    if (cfTypeResult.success && cfTypeResult.data.__type) {
        console.log('CustomField fields:');
        cfTypeResult.data.__type.fields.forEach(f => {
            console.log(`  - ${f.name}: ${f.type.name || f.type.ofType?.name || f.type.kind}`);
        });
    }

    // Get details about setTodoCustomField mutation
    console.log('\n=== setTodoCustomField Mutation ===');
    const setCustomFieldQuery = `
      query {
        __type(name: "Mutation") {
          fields {
            name
            args {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    `;

    const mutationResult = await blueClient.query(setCustomFieldQuery);
    if (mutationResult.success && mutationResult.data.__type) {
        const setCustomField = mutationResult.data.__type.fields.find(f => f.name === 'setTodoCustomField');
        if (setCustomField) {
            console.log('Arguments:');
            setCustomField.args.forEach(arg => {
                console.log(`  - ${arg.name}: ${arg.type.name || arg.type.ofType?.name || arg.type.kind}`);
            });
        }
    }

    // Check if project already has any custom fields
    console.log('\n=== Existing Custom Fields ===');
    const existingFieldsQuery = `
      query {
        customFields {
          id
          name
          fieldType
          description
        }
      }
    `;

    const existingResult = await blueClient.query(existingFieldsQuery);
    if (existingResult.success) {
        if (existingResult.data.customFields && existingResult.data.customFields.length > 0) {
            console.log('Found existing custom fields:');
            existingResult.data.customFields.forEach(cf => {
                console.log(`  - ${cf.name} (${cf.fieldType}): ${cf.description || '(no description)'}`);
                console.log(`    ID: ${cf.id}`);
            });
        } else {
            console.log('No custom fields defined yet.');
        }
    }

    // Get details about createCustomField mutation inputs
    console.log('\n=== CreateCustomFieldInput Type ===');
    const createInputQuery = `
      query {
        __type(name: "CreateCustomFieldInput") {
          inputFields {
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

    const inputResult = await blueClient.query(createInputQuery);
    if (inputResult.success && inputResult.data.__type) {
        console.log('CreateCustomFieldInput fields:');
        inputResult.data.__type.inputFields.forEach(f => {
            console.log(`  - ${f.name}: ${f.type.name || f.type.ofType?.name || f.type.kind}`);
        });
    }

    // Check Document type capabilities
    console.log('\n=== Document Type ===');
    const documentTypeQuery = `
      query {
        __type(name: "Document") {
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

    const docTypeResult = await blueClient.query(documentTypeQuery);
    if (docTypeResult.success && docTypeResult.data.__type) {
        console.log('Document fields:');
        docTypeResult.data.__type.fields.forEach(f => {
            console.log(`  - ${f.name}: ${f.type.name || f.type.ofType?.name || f.type.kind}`);
        });
    }

    console.log('\n=== Summary ===');
    console.log('Blue.cc provides multiple options for storing structured data:');
    console.log('1. Custom Fields - attach structured metadata directly to Todos');
    console.log('2. Documents - rich text documents linked to projects');
    console.log('3. Files - file attachments on Todos');
    console.log('\nRecommendation: Custom Fields appear to be the most suitable for');
    console.log('storing relationships and milestones as they are directly attached');
    console.log('to individual Todos rather than creating separate tasks.');
}

inspect().catch(err => {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
