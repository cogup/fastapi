# FastAPI

FastAPI is a powerful library that simplifies the creation of RESTful APIs using Fastify and Sequelize. It allows you to define your database tables and API routes in a JSON file, making the development process faster and more efficient.

## Features

- **Database Generation**: Define your database structure in a JSON file and let FastAPI handle the rest. It supports various data types and constraints.

- **API Generation**: Create API endpoints quickly and easily, with support for all CRUD operations.

- **Custom Route Customization**: In addition to the automatically generated routes, you can define your own custom routes as needed.

- **Error Handling**: Integrated error handling, making it easier to deal with unexpected situations.

- **CORS Support**: Easily configure the CORS policies for your API.

## Getting Started

### Prerequisites

- Node.js
- A SQL database compatible with Sequelize

### Installation

```
   npm i cogup/fastapi
```

### Basic Usage

```typescript
import { FastAPI } from '@cogup/fastapi';
import { xAdminRoutes } from '@cogup/fastapi-x-admin';

async function main() {
  const publicRoutes = new PublicRoutes();

  const fastAPI = new FastAPI({
    routes: [xAdminRoutes],
    sequelize
  });

  await fastAPI.listen();
}

main();
```

## Contributing
Contributions are always welcome! Whether through pull requests, reporting bugs, or suggesting new features.

## License
MIT
