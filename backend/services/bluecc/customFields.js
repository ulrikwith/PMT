import coreClient from './core.js';

class CustomFieldService {
  constructor() {
    this.fieldCache = new Map(); // name -> id
    this.initializationPromise = null;
  }

  async getFieldId(name) {
    if (this.fieldCache.has(name)) {
      return this.fieldCache.get(name);
    }
    await this.ensureInitialized();
    return this.fieldCache.get(name);
  }

  async ensureInitialized() {
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  async _initialize() {
    // 1. Fetch existing fields
    const projectId = await coreClient.getDefaultProjectId();

    // We try to fetch custom fields via the project
    const query = `
      query GetProjectFields($projectId: String!) {
        project(id: $projectId) {
          customFields {
            id
            name
          }
        }
      }
    `;

    const result = await coreClient.query(query, { projectId });

    if (result.success && result.data.project.customFields) {
      result.data.project.customFields.forEach((cf) => {
        this.fieldCache.set(cf.name, cf.id);
      });
    }

    // 2. Create if missing
    await this.ensureField('PMT_Relationships', 'TEXT_MULTI');
    await this.ensureField('PMT_Milestones', 'TEXT_MULTI');
  }

  async ensureField(name, type) {
    if (this.fieldCache.has(name)) return;

    console.log(`Creating custom field: ${name}...`);
    const projectId = await coreClient.getDefaultProjectId();

    const mutation = `
      mutation CreateCF($input: CreateCustomFieldInput!) {
        createCustomField(input: $input) {
          id
          name
        }
      }
    `;

    // Note: 'TEXT_MULTI' might be the enum, but input expects 'type' field.
    const input = {
      name,
      type,
      referenceProjectId: projectId, // Associate with current project
    };

    const result = await coreClient.query(mutation, { input });

    if (result.success) {
      this.fieldCache.set(name, result.data.createCustomField.id);
      console.log(`Created CF ${name}: ${result.data.createCustomField.id}`);
    } else {
      console.error(`Failed to create CF ${name}:`, result.error);
      // Fallback: maybe it exists but wasn't returned in query?
      // Proceeding without it will cause errors later.
    }
  }

  async setTaskValue(todoId, fieldName, value) {
    const fieldId = await this.getFieldId(fieldName);
    if (!fieldId) {
      console.error(`Cannot set value for unknown field: ${fieldName}`);
      return { success: false, error: 'Field not found' };
    }

    // Convert value to string if it's an object/array
    const textValue = typeof value === 'string' ? value : JSON.stringify(value);

    const mutation = `
      mutation SetValue($input: SetTodoCustomFieldInput!) {
        setTodoCustomField(input: $input) {
          id
        }
      }
    `;

    const input = {
      todoId,
      customFieldId: fieldId,
      text: textValue,
    };

    return coreClient.query(mutation, { input });
  }
}

export default new CustomFieldService();
