export const API_ENDPOINTS = {

  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register'
  },

  USERS: {
    GET_ALL: '/api/users',
    GET_BY_ID: (id: number) => `/api/users/${id}`
  },

  PROJECTS: {
    GET_ALL: '/api/projects',
    CREATE: '/api/projects',
    UPDATE: (id: number) => `/api/projects/${id}`,
    DELETE: (id: number) => `/api/projects/${id}`
  },

  TASKS: {
    GET_ALL: '/api/tasks',
    CREATE: '/api/tasks',
    UPDATE: (id: number) => `/api/tasks/${id}`,
    DELETE: (id: number) => `/api/tasks/${id}`
  }

};