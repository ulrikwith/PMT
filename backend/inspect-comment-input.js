#!/usr/bin/env node
/**
 * Inspect CreateCommentInput and EditCommentInput structures
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

    // Get CreateCommentInput structure
    console.log('=== CreateCommentInput Structure ===');
    const createInputQuery = `
      query {
        __type(name: "CreateCommentInput") {
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

    const createResult = await blueClient.query(createInputQuery);
    if (createResult.success && createResult.data.__type) {
        console.log('CreateCommentInput fields:');
        createResult.data.__type.inputFields.forEach(f => {
            const typeName = f.type.name || f.type.ofType?.name || f.type.kind;
            console.log(`  - ${f.name}: ${typeName}`);
        });
    }

    // Get EditCommentInput structure
    console.log('\n=== EditCommentInput Structure ===');
    const editInputQuery = `
      query {
        __type(name: "EditCommentInput") {
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

    const editResult = await blueClient.query(editInputQuery);
    if (editResult.success && editResult.data.__type) {
        console.log('EditCommentInput fields:');
        editResult.data.__type.inputFields.forEach(f => {
            const typeName = f.type.name || f.type.ofType?.name || f.type.kind;
            console.log(`  - ${f.name}: ${typeName}`);
        });
    }

    // Get CommentCategory enum values
    console.log('\n=== CommentCategory Enum ===');
    const categoryQuery = `
      query {
        __type(name: "CommentCategory") {
          enumValues {
            name
            description
          }
        }
      }
    `;

    const categoryResult = await blueClient.query(categoryQuery);
    if (categoryResult.success && categoryResult.data.__type) {
        console.log('CommentCategory values:');
        categoryResult.data.__type.enumValues.forEach(v => {
            console.log(`  - ${v.name}${v.description ? ': ' + v.description : ''}`);
        });
    }

    console.log('\n=== Implementation Plan ===');
    console.log('To use Comments for storing relationships/milestones:');
    console.log('');
    console.log('1. Create comment with relationship data:');
    console.log('   mutation CreateRelationshipComment {');
    console.log('     createComment(input: {');
    console.log('       todoId: "abc123"');
    console.log('       text: "Relationship: feeds-into -> def456"');
    console.log('       html: "<hidden>JSON_DATA_HERE</hidden>"');
    console.log('     }) { id }');
    console.log('   }');
    console.log('');
    console.log('2. Query comments for a todo:');
    console.log('   query GetTodoComments {');
    console.log('     commentList(categoryId: "todo-abc123") {');
    console.log('       id, text, html');
    console.log('     }');
    console.log('   }');
    console.log('');
    console.log('3. Benefits:');
    console.log('   • Native Blue.cc feature (no metadata task clutter)');
    console.log('   • File attachment support (5GB limit)');
    console.log('   • Can include human-readable descriptions');
    console.log('   • Hidden from main UI');
}

inspect().catch(err => {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
