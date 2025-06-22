
## 1. **Install Prisma & Initialize Project**

**Install Prisma Client (runtime) and Prisma CLI (dev):**

```bash
npm install @prisma/client
npm install -D prisma
```

- `@prisma/client` is used by your app to talk to your DB.
    
- `prisma` CLI is for generating clients and managing schema.
    

**(Optional, for `.env` flexibility in scripts:)**

```bash
npm install -D dotenv-cli
```


---

## 2. **Initialize Prisma (once per project)**

```bash
npx prisma init --datasource-provider=postgresql
```

- Creates a `prisma/` folder with a sample `schema.prisma` and `.env`.
    
- For MySQL: use `--datasource-provider=mysql`.


---

## 3. **Custom Schema File / Multiple Schemas**
### Did not implemented this step, I using a single schema (public)
### And a single database setup, and left the defaul Prisma folder structure
```txt
For this project, I decided not to implement custom schemas.
All tables are created in the default public schema for simplicity and to ensure maximum
compatibility with TimescaleDB features and tools.
If the project grows or requires stricter logical separation in the future, migrating tables to separate 
schemas can be done later with minimal disruption.
```

- **You can rename `schema.prisma`** to something like `schema.iot_solutions.prisma` for clarity or multi-DB setups.
    
- **If using multiple Postgres schemas (not the default `public`):**  
    Add / update the `schemas` field and enable the `multiSchema` preview feature in your `generator` and `datasource` blocks:

```prisma
generator client {
  provider        = "prisma-client-js"
  output          = "../src/generated/iot_solutions"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["iot_solutions", "teltonika"]  // list your schemas here
}
```

- Each `.prisma` file needs its own generator/datasource block.
    

---


## 4. **Pull Schema from the Database**

**For a specific schema file:**

```bash
npx prisma db pull --schema=prisma/schema.prisma
```

**With custom `.env` file (e.g. `.env.development`):**

```bash
npx dotenv -e .env.development -- prisma db pull --schema=prisma/schema.prisma

```

* This introspects the existing DB and updates the Prisma schema file accordingly.

---

## 5. **Generate the Prisma Client**

**After pulling (or after editing the schema), always regenerate:**

```bash

npx prisma generate --schema=prisma/schema.prisma

```

**With dotenv (optional):**

```bash

npx dotenv -e .env.development -- prisma generate --schema=prisma/schema.prisma

```

**Or with custom environment::**


```bash
npx dotenv -e .env.development -- prisma generate --schema=prisma/schema.prisma
```

* Regenerates the client after any schema pull or manual update.

---

## 6. **(Optional) Using with Multiple Databases**
### Did not implemented this step

- You may have a separate `.prisma` schema file per DB, with its own datasource/generator/output path.
    
- Example: `schema.iot_solutions.prisma`, `schema.app.prisma`
    
- Repeat **pull** and **generate** for each schema file as needed.
    

---

## 7. **(Best Practices & Tips)**

- After `db pull`, review your generated `schema.prisma` for clarity.
    
- If you change the DB structure outside Prisma, always `pull` and `generate` before using new tables/columns in code.
    
- In production, use `npx prisma generate` as part of your deployment step to ensure the client matches the schema.
    
- Prisma migrate (`npx prisma migrate ...`) is only needed if you want **Prisma to manage schema changes**.

---


## **SUMMARY TABLE**

|Step|Command Example|
|---|---|
|Pull from DB|`npx prisma db pull --schema=prisma/schema.iot_solutions.prisma`|
|Generate client|`npx prisma generate --schema=prisma/schema.iot_solutions.prisma`|
|(Optional) Use dotenv|`npx dotenv -e .env.development -- prisma ...`|

---

## Optional: NPM Scripts

Add to `package.json` for convenience:

```json
"scripts": {
  "prisma:pull:dev": "dotenv -e .env.development -- prisma db pull --schema=prisma/schema.prisma",
  "prisma:generate:dev": "dotenv -e .env.development -- prisma generate --schema=prisma/schema.prisma"
}

```