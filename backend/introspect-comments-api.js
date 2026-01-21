#!/usr/bin/env node
/**
 * Introspect Blue.cc API for Comments Support
 *
 * Check if Blue.cc GraphQL API exposes comment-related queries and mutations
 */

import blueClient from './blueClient.js';

async function introspectComments() {
    console.log('Connecting to Blue.cc...');
    const connected = await blueClient.testConnection();
    if (!connected) {
        console.error('Failed to connect');
        process.exit(1);
    }
    console.log('✓ Connected\n');

    // Check for comment-related mutations
    console.log('=== Checking for Comment Mutations ===');
    const mutationQuery = `
      query {
        __type(name: "Mutation") {
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
                ofType { name }
              }
            }
          }
        }
      }
    `;

    const mutationResult = await blueClient.query(mutationQuery);
    if (mutationResult.success && mutationResult.data.__type) {
        const commentMutations = mutationResult.data.__type.fields.filter(f =>
            f.name.toLowerCase().includes('comment')
        );

        console.log(`Found ${commentMutations.length} comment-related mutations:\n`);
        commentMutations.forEach(m => {
            console.log(`📝 ${m.name}`);
            if (m.description) {
                console.log(`   Description: ${m.description}`);
            }
            if (m.args && m.args.length > 0) {
                console.log('   Arguments:');
                m.args.forEach(arg => {
                    console.log(`     - ${arg.name}: ${arg.type.name || arg.type.ofType?.name || arg.type.kind}`);
                });
            }
            console.log('');
        });
    }

    // Check for comment-related queries
    console.log('\n=== Checking for Comment Queries ===');
    const queryQuery = `
      query {
        __type(name: "Query") {
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
                ofType { name }
              }
            }
          }
        }
      }
    `;

    const queryResult = await blueClient.query(queryQuery);
    if (queryResult.success && queryResult.data.__type) {
        const commentQueries = queryResult.data.__type.fields.filter(f =>
            f.name.toLowerCase().includes('comment')
        );

        console.log(`Found ${commentQueries.length} comment-related queries:\n`);
        commentQueries.forEach(q => {
            console.log(`🔍 ${q.name}`);
            if (q.description) {
                console.log(`   Description: ${q.description}`);
            }
            if (q.args && q.args.length > 0) {
                console.log('   Arguments:');
                q.args.forEach(arg => {
                    console.log(`     - ${arg.name}: ${arg.type.name || arg.type.ofType?.name || arg.type.kind}`);
                });
            }
            console.log('');
        });
    }

    // Check Comment type structure
    console.log('\n=== Comment Type Structure ===');
    const commentTypeQuery = `
      query {
        __type(name: "Comment") {
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

    const commentTypeResult = await blueClient.query(commentTypeQuery);
    if (commentTypeResult.success && commentTypeResult.data.__type) {
        console.log('Comment type fields:');
        commentTypeResult.data.__type.fields.forEach(f => {
            console.log(`  - ${f.name}: ${f.type.name || f.type.ofType?.name || f.type.kind}`);
        });
    } else {
        console.log('❌ No Comment type found in schema');
    }

    // Check Todo type for comment relationship
    console.log('\n=== Checking Todo Type for Comments Field ===');
    const todoCommentsQuery = `
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

    const todoResult = await blueClient.query(todoCommentsQuery);
    if (todoResult.success && todoResult.data.__type) {
        const commentFields = todoResult.data.__type.fields.filter(f =>
            f.name.toLowerCase().includes('comment')
        );

        if (commentFields.length > 0) {
            console.log('Todo has comment-related fields:');
            commentFields.forEach(f => {
                console.log(`  - ${f.name}: ${f.type.name || f.type.ofType?.name || f.type.kind}`);
            });
        } else {
            console.log('❌ No comment fields found on Todo type');
        }
    }

    console.log('\n=== Analysis ===');
    console.log('Comments could be used to store relationships/milestones if:');
    console.log('1. ✅ Comments can be attached to Todos');
    console.log('2. ✅ Comments support structured data (JSON or rich text)');
    console.log('3. ✅ Comments can be queried/filtered programmatically');
    console.log('4. ✅ Comments are hidden from UI unless opened');
    console.log('\nBenefits over metadata tasks:');
    console.log('  • No UI clutter in main todo list');
    console.log('  • Native Blue.cc feature');
    console.log('  • Can include human-readable descriptions');
    console.log('  • File attachment support (up to 5GB)');
}

introspectComments().catch(err => {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
