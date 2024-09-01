# Features For Post Flow

### Endpoints Overview:
- **Register Endpoint:** `/auth/register`
- **Register Verification Endpoint:** `auth/register/verify`
- **Login Endpoint:** `/auth/login`
- **Google Authentication Endpoint:** `/auth/googleauth`
- **Forgot Password Endpoint:** `/auth/forgot-password`
- **Forgot Password Verification Endpoint:** `/auth/forgot-password/verify`
- **Get Integrations Endpoint:** `/integrations`
- **Get Authorization Url Endpoint:** `/integrations/:integrationId`
- **Delete User Integration Endpoint:** `/integrations/:integrationId`
- **Exchange Tokens for Access Token:** `/integrations/exchange-code`
- **Swagger:** `/docs`

### Steps to Start the Project:

1. **Clone the Project:**
    ```bash
    git clone <repository_url>
    cd <project_directory>
    ```

2. **Create the `.env` File:**
   - Copy `.env.example` to a new file named `.env`.
   - Update the `.env` file with the appropriate environment variables.
   - Note: `REDIS_URL=redis://redis:6379` and `DB_HOST=db` can be used for Docker

3. **Build and Start the Docker Containers:**
   - In the terminal, run:
     ```bash
     docker-compose up --build
     ```

4. **Access the `api` Container:**
   - Open a new terminal and run:
     ```bash
     docker-compose exec api sh
     ```

5. **Run Migrations and Seed the Database:**
     ```bash
     npx ts-node ./node_modules/typeorm/cli.js migration:run -d src/common/database/ormconfig.ts

     ```

6. **Using path `/docs` can access the swagger from the browser**

