```
npm install typescript --save-dev
```
<!-- --------------------------------------------------------------- -->

### express (relapse for fastify)

https://www.npmjs.com/package/express

```
npm install express --save
npm install @types/express --save-dev
```

<!-- --------------------------------------------------------------- -->

### fastify 

https://www.npmjs.com/package/fastify

```
npm install fastify 
```


<!-- --------------------------------------------------------------- -->
### cors (relapse for @fastify/cors)

npm install cors -save
npm install @types/cors --save-dev


<!-- --------------------------------------------------------------- -->

### @fastify/cors

https://www.npmjs.com/package/@fastify/cors

```
npm i @fastify/cors
```
<!-- --------------------------------------------------------------- -->

### dotenv

https://www.npmjs.com/package/dotenv

```
npm install dotenv
```

<!-- --------------------------------------------------------------- -->
### pino pino-pretty

https://github.com/pinojs/pino
https://github.com/pinojs/pino-pretty

```
npm install pino pino-pretty
```

<!-- --------------------------------------------------------------- -->

### ioredis

https://www.npmjs.com/package/ioredis

    $ npm install ioredis

<!-- --------------------------------------------------------------- -->

### uuidv7

https://www.npmjs.com/package/uuidv7

    $ npm install uuidv7


<!-- --------------------------------------------------------------- -->

npm install @prisma/client
npm install -D prisma
npm install -D dotenv-cli

<!-- --------------------------------------------------------------- -->

### express-validator

https://express-validator.github.io/docs/
https://www.npmjs.com/package/express-validator

<!-- --------------------------------------------------------------- -->

### jsonwebtoken

https://github.com/auth0/node-jsonwebtoken#readme
https://www.npmjs.com/package/jsonwebtoken
https://www.npmjs.com/package/@types/jsonwebtoken

https://jwt.io/

npm i jsonwebtoken
npm install --save @types/jsonwebtoken


<!-- --------------------------------------------------------------- -->

### bcryptjs

https://www.npmjs.com/package/bcryptjs
```
$ npm install bcryptjs    
```

<!-- --------------------------------------------------------------- -->

### zod

https://zod.dev/

    npm install zod 

<!-- --------------------------------------------------------------- -->


ubuntu@d2-2-de1:~/iotrack.live$ pwd
/home/ubuntu/iotrack.live
ubuntu@d2-2-de1:~/iotrack.live$ cd web.backend.node.ts
ubuntu@d2-2-de1:~/iotrack.live/web.backend.node.ts$ tsc
ubuntu@d2-2-de1:~/iotrack.live/web.backend.node.ts$ npm run prisma-pull

✔ Introspected 12 models and wrote them into prisma/schema.prisma in 452ms
    ... 

ubuntu@d2-2-de1:~/iotrack.live/web.backend.node.ts$ npm run prisma-generate
    ...

✔ Generated Prisma Client (v6.12.0) to ./generated/prisma in 497ms

   ...

ubuntu@d2-2-de1:~/iotrack.live/web.backend.node.ts$ cd ..
ubuntu@d2-2-de1:~/iotrack.live$ sudo docker compose down web-backend; sudo docker compose build --no-cache web-backend; sudo docker compose up web-backend
