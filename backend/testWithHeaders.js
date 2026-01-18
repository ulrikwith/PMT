import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const BLUE_API_ENDPOINT = 'https://api.blue.cc/graphql';

// Test 1: Get companies/workspace info
async function testCompanies() {
  console.log('=== Test 1: Get Companies ===\n');

  const client = new GraphQLClient(BLUE_API_ENDPOINT, {
    headers: {
      'x-bloo-token-id': process.env.BLUE_TOKEN_ID,
      'x-bloo-token-secret': process.env.BLUE_SECRET_ID,
      'Content-Type': 'application/json',
    },
  });

  const query = `
    query {
      companies(take: 10) {
        nodes {
          id
          name
        }
      }
    }
  `;

  try {
    const data = await client.request(query);
    console.log('Success!');
    console.log(JSON.stringify(data, null, 2));
    return data.companies.nodes[0]?.id;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response?.errors) {
      console.error('Errors:', JSON.stringify(error.response.errors, null, 2));
    }
  }
}

// Test 2: Get projects
async function testProjects(companyId) {
  console.log(`\n=== Test 2: Get Projects (Company: ${companyId}) ===\n`);

  const headers = {
    'x-bloo-token-id': process.env.BLUE_TOKEN_ID,
    'x-bloo-token-secret': process.env.BLUE_SECRET_ID,
    'Content-Type': 'application/json',
  };

  if (companyId) {
    headers['x-bloo-company-id'] = companyId;
  }

  const client = new GraphQLClient(BLUE_API_ENDPOINT, { headers });

  const query = `
    query {
      projectList(take: 10) {
        nodes {
          id
          name
        }
      }
    }
  `;

  try {
    const data = await client.request(query);
    console.log('Success!');
    console.log(JSON.stringify(data, null, 2));
    return data.projectList?.nodes[0]?.id;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response?.errors) {
      console.error('Errors:', JSON.stringify(error.response.errors, null, 2));
    }
  }
}

// Run tests
(async () => {
  const companyId = await testCompanies();
  if (companyId) {
    await testProjects(companyId);
  }
})();
