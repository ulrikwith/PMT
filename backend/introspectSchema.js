import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const BLUE_API_ENDPOINT = 'https://api.blue.cc/graphql';

const client = new GraphQLClient(BLUE_API_ENDPOINT, {
  headers: {
    'x-bloo-token-id': process.env.BLUE_TOKEN_ID,
    'x-bloo-token-secret': process.env.BLUE_SECRET_ID,
    'Content-Type': 'application/json',
  },
});

// GraphQL introspection query to discover the schema
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType {
        name
        fields {
          name
          description
          args {
            name
            description
            type {
              name
              kind
            }
          }
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
      types {
        name
        kind
        description
        fields {
          name
          description
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

async function introspectSchema() {
  try {
    console.log('Introspecting blue.cc GraphQL schema...\n');
    const data = await client.request(introspectionQuery);

    console.log('=== Available Query Types ===\n');
    const queryFields = data.__schema.queryType.fields;

    // Filter for task/item/project related queries
    const relevantQueries = queryFields.filter(field =>
      field.name.toLowerCase().includes('task') ||
      field.name.toLowerCase().includes('item') ||
      field.name.toLowerCase().includes('project') ||
      field.name.toLowerCase().includes('workspace') ||
      field.name.toLowerCase().includes('card') ||
      field.name.toLowerCase().includes('todo')
    );

    console.log('Relevant queries found:', relevantQueries.length);
    relevantQueries.forEach(field => {
      console.log(`\n- ${field.name}`);
      if (field.description) console.log(`  Description: ${field.description}`);
      console.log(`  Returns: ${field.type.name || field.type.ofType?.name}`);
      if (field.args.length > 0) {
        console.log('  Arguments:');
        field.args.forEach(arg => {
          console.log(`    - ${arg.name}: ${arg.type.name || arg.type.ofType?.name}`);
        });
      }
    });

    // Also show all available queries
    console.log('\n\n=== ALL Available Queries ===\n');
    queryFields.forEach(field => {
      console.log(`- ${field.name} (returns ${field.type.name || field.type.ofType?.name})`);
    });

    // Look for types that might be relevant
    console.log('\n\n=== Relevant Types ===\n');
    const relevantTypes = data.__schema.types.filter(type =>
      !type.name.startsWith('__') &&
      (type.name.toLowerCase().includes('task') ||
       type.name.toLowerCase().includes('item') ||
       type.name.toLowerCase().includes('project') ||
       type.name.toLowerCase().includes('workspace') ||
       type.name.toLowerCase().includes('card'))
    );

    relevantTypes.forEach(type => {
      console.log(`\n${type.name} (${type.kind})`);
      if (type.description) console.log(`  ${type.description}`);
      if (type.fields && type.fields.length > 0) {
        console.log('  Fields:');
        type.fields.slice(0, 10).forEach(field => {
          console.log(`    - ${field.name}: ${field.type.name || field.type.ofType?.name}`);
        });
        if (type.fields.length > 10) {
          console.log(`    ... and ${type.fields.length - 10} more fields`);
        }
      }
    });

  } catch (error) {
    console.error('Error introspecting schema:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

introspectSchema();
