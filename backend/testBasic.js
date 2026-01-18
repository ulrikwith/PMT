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

// Get profile and companies
const profileQuery = `
  query GetProfile {
    profile {
      id
      name
      email
      companies {
        id
        name
      }
    }
  }
`;

async function testBasicQuery() {
  try {
    console.log('Testing profile query...\n');
    const data = await client.request(profileQuery);
    console.log('Success! Profile data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.profile && data.profile.companies && data.profile.companies.length > 0) {
      const companyId = data.profile.companies[0].id;
      console.log(`\n\nNow testing todos with company ID: ${companyId}\n`);

      const todosQuery = `
        query GetMyTodos($companyId: ID!) {
          myTodoList(companyId: $companyId, done: false, first: 10) {
            todos {
              id
              title
              done
            }
          }
        }
      `;

      const todosData = await client.request(todosQuery, { companyId });
      console.log('Todos data:');
      console.log(JSON.stringify(todosData, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response errors:', JSON.stringify(error.response.errors, null, 2));
    }
  }
}

testBasicQuery();
