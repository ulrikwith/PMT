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

// Test query to fetch todos
const testQuery = `
  query MyTodos {
    myTodoList(done: false, first: 10) {
      todos {
        id
        title
        description
        done
        position
        createdAt
        duedAt
        assignees {
          id
          name
        }
        todoList {
          id
          title
        }
      }
    }
  }
`;

async function testTodoQuery() {
  try {
    console.log('Testing myTodoList query...\n');
    const data = await client.request(testQuery);
    console.log('Success! Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response errors:', JSON.stringify(error.response.errors, null, 2));
    }
  }
}

testTodoQuery();
