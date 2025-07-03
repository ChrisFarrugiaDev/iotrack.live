
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model assets
 * 
 */
export type assets = $Result.DefaultSelection<Prisma.$assetsPayload>
/**
 * Model devices
 * 
 */
export type devices = $Result.DefaultSelection<Prisma.$devicesPayload>
/**
 * Model organizations
 * 
 */
export type organizations = $Result.DefaultSelection<Prisma.$organizationsPayload>
/**
 * Model codec12_commands
 * 
 */
export type codec12_commands = $Result.DefaultSelection<Prisma.$codec12_commandsPayload>
/**
 * Model telemetry
 * 
 */
export type telemetry = $Result.DefaultSelection<Prisma.$telemetryPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Assets
 * const assets = await prisma.assets.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Assets
   * const assets = await prisma.assets.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.assets`: Exposes CRUD operations for the **assets** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Assets
    * const assets = await prisma.assets.findMany()
    * ```
    */
  get assets(): Prisma.assetsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.devices`: Exposes CRUD operations for the **devices** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Devices
    * const devices = await prisma.devices.findMany()
    * ```
    */
  get devices(): Prisma.devicesDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.organizations`: Exposes CRUD operations for the **organizations** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Organizations
    * const organizations = await prisma.organizations.findMany()
    * ```
    */
  get organizations(): Prisma.organizationsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.codec12_commands`: Exposes CRUD operations for the **codec12_commands** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Codec12_commands
    * const codec12_commands = await prisma.codec12_commands.findMany()
    * ```
    */
  get codec12_commands(): Prisma.codec12_commandsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.telemetry`: Exposes CRUD operations for the **telemetry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Telemetries
    * const telemetries = await prisma.telemetry.findMany()
    * ```
    */
  get telemetry(): Prisma.telemetryDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    assets: 'assets',
    devices: 'devices',
    organizations: 'organizations',
    codec12_commands: 'codec12_commands',
    telemetry: 'telemetry'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "assets" | "devices" | "organizations" | "codec12_commands" | "telemetry"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      assets: {
        payload: Prisma.$assetsPayload<ExtArgs>
        fields: Prisma.assetsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.assetsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.assetsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>
          }
          findFirst: {
            args: Prisma.assetsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.assetsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>
          }
          findMany: {
            args: Prisma.assetsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>[]
          }
          create: {
            args: Prisma.assetsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>
          }
          createMany: {
            args: Prisma.assetsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.assetsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>[]
          }
          delete: {
            args: Prisma.assetsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>
          }
          update: {
            args: Prisma.assetsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>
          }
          deleteMany: {
            args: Prisma.assetsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.assetsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.assetsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>[]
          }
          upsert: {
            args: Prisma.assetsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$assetsPayload>
          }
          aggregate: {
            args: Prisma.AssetsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAssets>
          }
          groupBy: {
            args: Prisma.assetsGroupByArgs<ExtArgs>
            result: $Utils.Optional<AssetsGroupByOutputType>[]
          }
          count: {
            args: Prisma.assetsCountArgs<ExtArgs>
            result: $Utils.Optional<AssetsCountAggregateOutputType> | number
          }
        }
      }
      devices: {
        payload: Prisma.$devicesPayload<ExtArgs>
        fields: Prisma.devicesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.devicesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.devicesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>
          }
          findFirst: {
            args: Prisma.devicesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.devicesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>
          }
          findMany: {
            args: Prisma.devicesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>[]
          }
          create: {
            args: Prisma.devicesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>
          }
          createMany: {
            args: Prisma.devicesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.devicesCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>[]
          }
          delete: {
            args: Prisma.devicesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>
          }
          update: {
            args: Prisma.devicesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>
          }
          deleteMany: {
            args: Prisma.devicesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.devicesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.devicesUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>[]
          }
          upsert: {
            args: Prisma.devicesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$devicesPayload>
          }
          aggregate: {
            args: Prisma.DevicesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDevices>
          }
          groupBy: {
            args: Prisma.devicesGroupByArgs<ExtArgs>
            result: $Utils.Optional<DevicesGroupByOutputType>[]
          }
          count: {
            args: Prisma.devicesCountArgs<ExtArgs>
            result: $Utils.Optional<DevicesCountAggregateOutputType> | number
          }
        }
      }
      organizations: {
        payload: Prisma.$organizationsPayload<ExtArgs>
        fields: Prisma.organizationsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.organizationsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.organizationsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>
          }
          findFirst: {
            args: Prisma.organizationsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.organizationsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>
          }
          findMany: {
            args: Prisma.organizationsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>[]
          }
          create: {
            args: Prisma.organizationsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>
          }
          createMany: {
            args: Prisma.organizationsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.organizationsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>[]
          }
          delete: {
            args: Prisma.organizationsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>
          }
          update: {
            args: Prisma.organizationsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>
          }
          deleteMany: {
            args: Prisma.organizationsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.organizationsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.organizationsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>[]
          }
          upsert: {
            args: Prisma.organizationsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$organizationsPayload>
          }
          aggregate: {
            args: Prisma.OrganizationsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrganizations>
          }
          groupBy: {
            args: Prisma.organizationsGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrganizationsGroupByOutputType>[]
          }
          count: {
            args: Prisma.organizationsCountArgs<ExtArgs>
            result: $Utils.Optional<OrganizationsCountAggregateOutputType> | number
          }
        }
      }
      codec12_commands: {
        payload: Prisma.$codec12_commandsPayload<ExtArgs>
        fields: Prisma.codec12_commandsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.codec12_commandsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.codec12_commandsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>
          }
          findFirst: {
            args: Prisma.codec12_commandsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.codec12_commandsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>
          }
          findMany: {
            args: Prisma.codec12_commandsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>[]
          }
          create: {
            args: Prisma.codec12_commandsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>
          }
          createMany: {
            args: Prisma.codec12_commandsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.codec12_commandsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>[]
          }
          delete: {
            args: Prisma.codec12_commandsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>
          }
          update: {
            args: Prisma.codec12_commandsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>
          }
          deleteMany: {
            args: Prisma.codec12_commandsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.codec12_commandsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.codec12_commandsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>[]
          }
          upsert: {
            args: Prisma.codec12_commandsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$codec12_commandsPayload>
          }
          aggregate: {
            args: Prisma.Codec12_commandsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCodec12_commands>
          }
          groupBy: {
            args: Prisma.codec12_commandsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Codec12_commandsGroupByOutputType>[]
          }
          count: {
            args: Prisma.codec12_commandsCountArgs<ExtArgs>
            result: $Utils.Optional<Codec12_commandsCountAggregateOutputType> | number
          }
        }
      }
      telemetry: {
        payload: Prisma.$telemetryPayload<ExtArgs>
        fields: Prisma.telemetryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.telemetryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.telemetryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>
          }
          findFirst: {
            args: Prisma.telemetryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.telemetryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>
          }
          findMany: {
            args: Prisma.telemetryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>[]
          }
          create: {
            args: Prisma.telemetryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>
          }
          createMany: {
            args: Prisma.telemetryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.telemetryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>[]
          }
          delete: {
            args: Prisma.telemetryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>
          }
          update: {
            args: Prisma.telemetryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>
          }
          deleteMany: {
            args: Prisma.telemetryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.telemetryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.telemetryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>[]
          }
          upsert: {
            args: Prisma.telemetryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$telemetryPayload>
          }
          aggregate: {
            args: Prisma.TelemetryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTelemetry>
          }
          groupBy: {
            args: Prisma.telemetryGroupByArgs<ExtArgs>
            result: $Utils.Optional<TelemetryGroupByOutputType>[]
          }
          count: {
            args: Prisma.telemetryCountArgs<ExtArgs>
            result: $Utils.Optional<TelemetryCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    assets?: assetsOmit
    devices?: devicesOmit
    organizations?: organizationsOmit
    codec12_commands?: codec12_commandsOmit
    telemetry?: telemetryOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type AssetsCountOutputType
   */

  export type AssetsCountOutputType = {
    devices: number
  }

  export type AssetsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    devices?: boolean | AssetsCountOutputTypeCountDevicesArgs
  }

  // Custom InputTypes
  /**
   * AssetsCountOutputType without action
   */
  export type AssetsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetsCountOutputType
     */
    select?: AssetsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AssetsCountOutputType without action
   */
  export type AssetsCountOutputTypeCountDevicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: devicesWhereInput
  }


  /**
   * Count Type OrganizationsCountOutputType
   */

  export type OrganizationsCountOutputType = {
    assets: number
    devices: number
    other_organizations: number
  }

  export type OrganizationsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    assets?: boolean | OrganizationsCountOutputTypeCountAssetsArgs
    devices?: boolean | OrganizationsCountOutputTypeCountDevicesArgs
    other_organizations?: boolean | OrganizationsCountOutputTypeCountOther_organizationsArgs
  }

  // Custom InputTypes
  /**
   * OrganizationsCountOutputType without action
   */
  export type OrganizationsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizationsCountOutputType
     */
    select?: OrganizationsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * OrganizationsCountOutputType without action
   */
  export type OrganizationsCountOutputTypeCountAssetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: assetsWhereInput
  }

  /**
   * OrganizationsCountOutputType without action
   */
  export type OrganizationsCountOutputTypeCountDevicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: devicesWhereInput
  }

  /**
   * OrganizationsCountOutputType without action
   */
  export type OrganizationsCountOutputTypeCountOther_organizationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: organizationsWhereInput
  }


  /**
   * Models
   */

  /**
   * Model assets
   */

  export type AggregateAssets = {
    _count: AssetsCountAggregateOutputType | null
    _avg: AssetsAvgAggregateOutputType | null
    _sum: AssetsSumAggregateOutputType | null
    _min: AssetsMinAggregateOutputType | null
    _max: AssetsMaxAggregateOutputType | null
  }

  export type AssetsAvgAggregateOutputType = {
    id: number | null
  }

  export type AssetsSumAggregateOutputType = {
    id: bigint | null
  }

  export type AssetsMinAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    organisation_uuid: string | null
    name: string | null
    asset_type: string | null
    description: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type AssetsMaxAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    organisation_uuid: string | null
    name: string | null
    asset_type: string | null
    description: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type AssetsCountAggregateOutputType = {
    id: number
    uuid: number
    organisation_uuid: number
    name: number
    asset_type: number
    description: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type AssetsAvgAggregateInputType = {
    id?: true
  }

  export type AssetsSumAggregateInputType = {
    id?: true
  }

  export type AssetsMinAggregateInputType = {
    id?: true
    uuid?: true
    organisation_uuid?: true
    name?: true
    asset_type?: true
    description?: true
    created_at?: true
    updated_at?: true
  }

  export type AssetsMaxAggregateInputType = {
    id?: true
    uuid?: true
    organisation_uuid?: true
    name?: true
    asset_type?: true
    description?: true
    created_at?: true
    updated_at?: true
  }

  export type AssetsCountAggregateInputType = {
    id?: true
    uuid?: true
    organisation_uuid?: true
    name?: true
    asset_type?: true
    description?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type AssetsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which assets to aggregate.
     */
    where?: assetsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of assets to fetch.
     */
    orderBy?: assetsOrderByWithRelationInput | assetsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: assetsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` assets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned assets
    **/
    _count?: true | AssetsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AssetsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AssetsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AssetsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AssetsMaxAggregateInputType
  }

  export type GetAssetsAggregateType<T extends AssetsAggregateArgs> = {
        [P in keyof T & keyof AggregateAssets]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAssets[P]>
      : GetScalarType<T[P], AggregateAssets[P]>
  }




  export type assetsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: assetsWhereInput
    orderBy?: assetsOrderByWithAggregationInput | assetsOrderByWithAggregationInput[]
    by: AssetsScalarFieldEnum[] | AssetsScalarFieldEnum
    having?: assetsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AssetsCountAggregateInputType | true
    _avg?: AssetsAvgAggregateInputType
    _sum?: AssetsSumAggregateInputType
    _min?: AssetsMinAggregateInputType
    _max?: AssetsMaxAggregateInputType
  }

  export type AssetsGroupByOutputType = {
    id: bigint
    uuid: string | null
    organisation_uuid: string
    name: string
    asset_type: string | null
    description: string | null
    created_at: Date
    updated_at: Date
    _count: AssetsCountAggregateOutputType | null
    _avg: AssetsAvgAggregateOutputType | null
    _sum: AssetsSumAggregateOutputType | null
    _min: AssetsMinAggregateOutputType | null
    _max: AssetsMaxAggregateOutputType | null
  }

  type GetAssetsGroupByPayload<T extends assetsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AssetsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AssetsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AssetsGroupByOutputType[P]>
            : GetScalarType<T[P], AssetsGroupByOutputType[P]>
        }
      >
    >


  export type assetsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    name?: boolean
    asset_type?: boolean
    description?: boolean
    created_at?: boolean
    updated_at?: boolean
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
    devices?: boolean | assets$devicesArgs<ExtArgs>
    _count?: boolean | AssetsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["assets"]>

  export type assetsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    name?: boolean
    asset_type?: boolean
    description?: boolean
    created_at?: boolean
    updated_at?: boolean
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["assets"]>

  export type assetsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    name?: boolean
    asset_type?: boolean
    description?: boolean
    created_at?: boolean
    updated_at?: boolean
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["assets"]>

  export type assetsSelectScalar = {
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    name?: boolean
    asset_type?: boolean
    description?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type assetsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "organisation_uuid" | "name" | "asset_type" | "description" | "created_at" | "updated_at", ExtArgs["result"]["assets"]>
  export type assetsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
    devices?: boolean | assets$devicesArgs<ExtArgs>
    _count?: boolean | AssetsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type assetsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }
  export type assetsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }

  export type $assetsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "assets"
    objects: {
      organizations: Prisma.$organizationsPayload<ExtArgs>
      devices: Prisma.$devicesPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      uuid: string | null
      organisation_uuid: string
      name: string
      asset_type: string | null
      description: string | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["assets"]>
    composites: {}
  }

  type assetsGetPayload<S extends boolean | null | undefined | assetsDefaultArgs> = $Result.GetResult<Prisma.$assetsPayload, S>

  type assetsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<assetsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AssetsCountAggregateInputType | true
    }

  export interface assetsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['assets'], meta: { name: 'assets' } }
    /**
     * Find zero or one Assets that matches the filter.
     * @param {assetsFindUniqueArgs} args - Arguments to find a Assets
     * @example
     * // Get one Assets
     * const assets = await prisma.assets.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends assetsFindUniqueArgs>(args: SelectSubset<T, assetsFindUniqueArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Assets that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {assetsFindUniqueOrThrowArgs} args - Arguments to find a Assets
     * @example
     * // Get one Assets
     * const assets = await prisma.assets.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends assetsFindUniqueOrThrowArgs>(args: SelectSubset<T, assetsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Assets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {assetsFindFirstArgs} args - Arguments to find a Assets
     * @example
     * // Get one Assets
     * const assets = await prisma.assets.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends assetsFindFirstArgs>(args?: SelectSubset<T, assetsFindFirstArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Assets that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {assetsFindFirstOrThrowArgs} args - Arguments to find a Assets
     * @example
     * // Get one Assets
     * const assets = await prisma.assets.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends assetsFindFirstOrThrowArgs>(args?: SelectSubset<T, assetsFindFirstOrThrowArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Assets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {assetsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Assets
     * const assets = await prisma.assets.findMany()
     * 
     * // Get first 10 Assets
     * const assets = await prisma.assets.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const assetsWithIdOnly = await prisma.assets.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends assetsFindManyArgs>(args?: SelectSubset<T, assetsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Assets.
     * @param {assetsCreateArgs} args - Arguments to create a Assets.
     * @example
     * // Create one Assets
     * const Assets = await prisma.assets.create({
     *   data: {
     *     // ... data to create a Assets
     *   }
     * })
     * 
     */
    create<T extends assetsCreateArgs>(args: SelectSubset<T, assetsCreateArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Assets.
     * @param {assetsCreateManyArgs} args - Arguments to create many Assets.
     * @example
     * // Create many Assets
     * const assets = await prisma.assets.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends assetsCreateManyArgs>(args?: SelectSubset<T, assetsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Assets and returns the data saved in the database.
     * @param {assetsCreateManyAndReturnArgs} args - Arguments to create many Assets.
     * @example
     * // Create many Assets
     * const assets = await prisma.assets.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Assets and only return the `id`
     * const assetsWithIdOnly = await prisma.assets.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends assetsCreateManyAndReturnArgs>(args?: SelectSubset<T, assetsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Assets.
     * @param {assetsDeleteArgs} args - Arguments to delete one Assets.
     * @example
     * // Delete one Assets
     * const Assets = await prisma.assets.delete({
     *   where: {
     *     // ... filter to delete one Assets
     *   }
     * })
     * 
     */
    delete<T extends assetsDeleteArgs>(args: SelectSubset<T, assetsDeleteArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Assets.
     * @param {assetsUpdateArgs} args - Arguments to update one Assets.
     * @example
     * // Update one Assets
     * const assets = await prisma.assets.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends assetsUpdateArgs>(args: SelectSubset<T, assetsUpdateArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Assets.
     * @param {assetsDeleteManyArgs} args - Arguments to filter Assets to delete.
     * @example
     * // Delete a few Assets
     * const { count } = await prisma.assets.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends assetsDeleteManyArgs>(args?: SelectSubset<T, assetsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Assets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {assetsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Assets
     * const assets = await prisma.assets.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends assetsUpdateManyArgs>(args: SelectSubset<T, assetsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Assets and returns the data updated in the database.
     * @param {assetsUpdateManyAndReturnArgs} args - Arguments to update many Assets.
     * @example
     * // Update many Assets
     * const assets = await prisma.assets.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Assets and only return the `id`
     * const assetsWithIdOnly = await prisma.assets.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends assetsUpdateManyAndReturnArgs>(args: SelectSubset<T, assetsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Assets.
     * @param {assetsUpsertArgs} args - Arguments to update or create a Assets.
     * @example
     * // Update or create a Assets
     * const assets = await prisma.assets.upsert({
     *   create: {
     *     // ... data to create a Assets
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Assets we want to update
     *   }
     * })
     */
    upsert<T extends assetsUpsertArgs>(args: SelectSubset<T, assetsUpsertArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Assets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {assetsCountArgs} args - Arguments to filter Assets to count.
     * @example
     * // Count the number of Assets
     * const count = await prisma.assets.count({
     *   where: {
     *     // ... the filter for the Assets we want to count
     *   }
     * })
    **/
    count<T extends assetsCountArgs>(
      args?: Subset<T, assetsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AssetsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Assets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AssetsAggregateArgs>(args: Subset<T, AssetsAggregateArgs>): Prisma.PrismaPromise<GetAssetsAggregateType<T>>

    /**
     * Group by Assets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {assetsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends assetsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: assetsGroupByArgs['orderBy'] }
        : { orderBy?: assetsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, assetsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAssetsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the assets model
   */
  readonly fields: assetsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for assets.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__assetsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    organizations<T extends organizationsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, organizationsDefaultArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    devices<T extends assets$devicesArgs<ExtArgs> = {}>(args?: Subset<T, assets$devicesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the assets model
   */
  interface assetsFieldRefs {
    readonly id: FieldRef<"assets", 'BigInt'>
    readonly uuid: FieldRef<"assets", 'String'>
    readonly organisation_uuid: FieldRef<"assets", 'String'>
    readonly name: FieldRef<"assets", 'String'>
    readonly asset_type: FieldRef<"assets", 'String'>
    readonly description: FieldRef<"assets", 'String'>
    readonly created_at: FieldRef<"assets", 'DateTime'>
    readonly updated_at: FieldRef<"assets", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * assets findUnique
   */
  export type assetsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * Filter, which assets to fetch.
     */
    where: assetsWhereUniqueInput
  }

  /**
   * assets findUniqueOrThrow
   */
  export type assetsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * Filter, which assets to fetch.
     */
    where: assetsWhereUniqueInput
  }

  /**
   * assets findFirst
   */
  export type assetsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * Filter, which assets to fetch.
     */
    where?: assetsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of assets to fetch.
     */
    orderBy?: assetsOrderByWithRelationInput | assetsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for assets.
     */
    cursor?: assetsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` assets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of assets.
     */
    distinct?: AssetsScalarFieldEnum | AssetsScalarFieldEnum[]
  }

  /**
   * assets findFirstOrThrow
   */
  export type assetsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * Filter, which assets to fetch.
     */
    where?: assetsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of assets to fetch.
     */
    orderBy?: assetsOrderByWithRelationInput | assetsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for assets.
     */
    cursor?: assetsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` assets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of assets.
     */
    distinct?: AssetsScalarFieldEnum | AssetsScalarFieldEnum[]
  }

  /**
   * assets findMany
   */
  export type assetsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * Filter, which assets to fetch.
     */
    where?: assetsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of assets to fetch.
     */
    orderBy?: assetsOrderByWithRelationInput | assetsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing assets.
     */
    cursor?: assetsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` assets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` assets.
     */
    skip?: number
    distinct?: AssetsScalarFieldEnum | AssetsScalarFieldEnum[]
  }

  /**
   * assets create
   */
  export type assetsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * The data needed to create a assets.
     */
    data: XOR<assetsCreateInput, assetsUncheckedCreateInput>
  }

  /**
   * assets createMany
   */
  export type assetsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many assets.
     */
    data: assetsCreateManyInput | assetsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * assets createManyAndReturn
   */
  export type assetsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * The data used to create many assets.
     */
    data: assetsCreateManyInput | assetsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * assets update
   */
  export type assetsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * The data needed to update a assets.
     */
    data: XOR<assetsUpdateInput, assetsUncheckedUpdateInput>
    /**
     * Choose, which assets to update.
     */
    where: assetsWhereUniqueInput
  }

  /**
   * assets updateMany
   */
  export type assetsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update assets.
     */
    data: XOR<assetsUpdateManyMutationInput, assetsUncheckedUpdateManyInput>
    /**
     * Filter which assets to update
     */
    where?: assetsWhereInput
    /**
     * Limit how many assets to update.
     */
    limit?: number
  }

  /**
   * assets updateManyAndReturn
   */
  export type assetsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * The data used to update assets.
     */
    data: XOR<assetsUpdateManyMutationInput, assetsUncheckedUpdateManyInput>
    /**
     * Filter which assets to update
     */
    where?: assetsWhereInput
    /**
     * Limit how many assets to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * assets upsert
   */
  export type assetsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * The filter to search for the assets to update in case it exists.
     */
    where: assetsWhereUniqueInput
    /**
     * In case the assets found by the `where` argument doesn't exist, create a new assets with this data.
     */
    create: XOR<assetsCreateInput, assetsUncheckedCreateInput>
    /**
     * In case the assets was found with the provided `where` argument, update it with this data.
     */
    update: XOR<assetsUpdateInput, assetsUncheckedUpdateInput>
  }

  /**
   * assets delete
   */
  export type assetsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    /**
     * Filter which assets to delete.
     */
    where: assetsWhereUniqueInput
  }

  /**
   * assets deleteMany
   */
  export type assetsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which assets to delete
     */
    where?: assetsWhereInput
    /**
     * Limit how many assets to delete.
     */
    limit?: number
  }

  /**
   * assets.devices
   */
  export type assets$devicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    where?: devicesWhereInput
    orderBy?: devicesOrderByWithRelationInput | devicesOrderByWithRelationInput[]
    cursor?: devicesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DevicesScalarFieldEnum | DevicesScalarFieldEnum[]
  }

  /**
   * assets without action
   */
  export type assetsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
  }


  /**
   * Model devices
   */

  export type AggregateDevices = {
    _count: DevicesCountAggregateOutputType | null
    _avg: DevicesAvgAggregateOutputType | null
    _sum: DevicesSumAggregateOutputType | null
    _min: DevicesMinAggregateOutputType | null
    _max: DevicesMaxAggregateOutputType | null
  }

  export type DevicesAvgAggregateOutputType = {
    id: number | null
  }

  export type DevicesSumAggregateOutputType = {
    id: bigint | null
  }

  export type DevicesMinAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    organisation_uuid: string | null
    asset_uuid: string | null
    external_id: string | null
    external_id_type: string | null
    protocol: string | null
    vendor: string | null
    model: string | null
    description: string | null
    registered_at: Date | null
    updated_at: Date | null
  }

  export type DevicesMaxAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    organisation_uuid: string | null
    asset_uuid: string | null
    external_id: string | null
    external_id_type: string | null
    protocol: string | null
    vendor: string | null
    model: string | null
    description: string | null
    registered_at: Date | null
    updated_at: Date | null
  }

  export type DevicesCountAggregateOutputType = {
    id: number
    uuid: number
    organisation_uuid: number
    asset_uuid: number
    external_id: number
    external_id_type: number
    protocol: number
    vendor: number
    model: number
    description: number
    registered_at: number
    updated_at: number
    _all: number
  }


  export type DevicesAvgAggregateInputType = {
    id?: true
  }

  export type DevicesSumAggregateInputType = {
    id?: true
  }

  export type DevicesMinAggregateInputType = {
    id?: true
    uuid?: true
    organisation_uuid?: true
    asset_uuid?: true
    external_id?: true
    external_id_type?: true
    protocol?: true
    vendor?: true
    model?: true
    description?: true
    registered_at?: true
    updated_at?: true
  }

  export type DevicesMaxAggregateInputType = {
    id?: true
    uuid?: true
    organisation_uuid?: true
    asset_uuid?: true
    external_id?: true
    external_id_type?: true
    protocol?: true
    vendor?: true
    model?: true
    description?: true
    registered_at?: true
    updated_at?: true
  }

  export type DevicesCountAggregateInputType = {
    id?: true
    uuid?: true
    organisation_uuid?: true
    asset_uuid?: true
    external_id?: true
    external_id_type?: true
    protocol?: true
    vendor?: true
    model?: true
    description?: true
    registered_at?: true
    updated_at?: true
    _all?: true
  }

  export type DevicesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which devices to aggregate.
     */
    where?: devicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of devices to fetch.
     */
    orderBy?: devicesOrderByWithRelationInput | devicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: devicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` devices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned devices
    **/
    _count?: true | DevicesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DevicesAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DevicesSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DevicesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DevicesMaxAggregateInputType
  }

  export type GetDevicesAggregateType<T extends DevicesAggregateArgs> = {
        [P in keyof T & keyof AggregateDevices]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDevices[P]>
      : GetScalarType<T[P], AggregateDevices[P]>
  }




  export type devicesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: devicesWhereInput
    orderBy?: devicesOrderByWithAggregationInput | devicesOrderByWithAggregationInput[]
    by: DevicesScalarFieldEnum[] | DevicesScalarFieldEnum
    having?: devicesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DevicesCountAggregateInputType | true
    _avg?: DevicesAvgAggregateInputType
    _sum?: DevicesSumAggregateInputType
    _min?: DevicesMinAggregateInputType
    _max?: DevicesMaxAggregateInputType
  }

  export type DevicesGroupByOutputType = {
    id: bigint
    uuid: string | null
    organisation_uuid: string
    asset_uuid: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor: string | null
    model: string | null
    description: string | null
    registered_at: Date
    updated_at: Date
    _count: DevicesCountAggregateOutputType | null
    _avg: DevicesAvgAggregateOutputType | null
    _sum: DevicesSumAggregateOutputType | null
    _min: DevicesMinAggregateOutputType | null
    _max: DevicesMaxAggregateOutputType | null
  }

  type GetDevicesGroupByPayload<T extends devicesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DevicesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DevicesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DevicesGroupByOutputType[P]>
            : GetScalarType<T[P], DevicesGroupByOutputType[P]>
        }
      >
    >


  export type devicesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    asset_uuid?: boolean
    external_id?: boolean
    external_id_type?: boolean
    protocol?: boolean
    vendor?: boolean
    model?: boolean
    description?: boolean
    registered_at?: boolean
    updated_at?: boolean
    assets?: boolean | devices$assetsArgs<ExtArgs>
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["devices"]>

  export type devicesSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    asset_uuid?: boolean
    external_id?: boolean
    external_id_type?: boolean
    protocol?: boolean
    vendor?: boolean
    model?: boolean
    description?: boolean
    registered_at?: boolean
    updated_at?: boolean
    assets?: boolean | devices$assetsArgs<ExtArgs>
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["devices"]>

  export type devicesSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    asset_uuid?: boolean
    external_id?: boolean
    external_id_type?: boolean
    protocol?: boolean
    vendor?: boolean
    model?: boolean
    description?: boolean
    registered_at?: boolean
    updated_at?: boolean
    assets?: boolean | devices$assetsArgs<ExtArgs>
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["devices"]>

  export type devicesSelectScalar = {
    id?: boolean
    uuid?: boolean
    organisation_uuid?: boolean
    asset_uuid?: boolean
    external_id?: boolean
    external_id_type?: boolean
    protocol?: boolean
    vendor?: boolean
    model?: boolean
    description?: boolean
    registered_at?: boolean
    updated_at?: boolean
  }

  export type devicesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "organisation_uuid" | "asset_uuid" | "external_id" | "external_id_type" | "protocol" | "vendor" | "model" | "description" | "registered_at" | "updated_at", ExtArgs["result"]["devices"]>
  export type devicesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    assets?: boolean | devices$assetsArgs<ExtArgs>
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }
  export type devicesIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    assets?: boolean | devices$assetsArgs<ExtArgs>
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }
  export type devicesIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    assets?: boolean | devices$assetsArgs<ExtArgs>
    organizations?: boolean | organizationsDefaultArgs<ExtArgs>
  }

  export type $devicesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "devices"
    objects: {
      assets: Prisma.$assetsPayload<ExtArgs> | null
      organizations: Prisma.$organizationsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      uuid: string | null
      organisation_uuid: string
      asset_uuid: string | null
      external_id: string
      external_id_type: string
      protocol: string
      vendor: string | null
      model: string | null
      description: string | null
      registered_at: Date
      updated_at: Date
    }, ExtArgs["result"]["devices"]>
    composites: {}
  }

  type devicesGetPayload<S extends boolean | null | undefined | devicesDefaultArgs> = $Result.GetResult<Prisma.$devicesPayload, S>

  type devicesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<devicesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DevicesCountAggregateInputType | true
    }

  export interface devicesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['devices'], meta: { name: 'devices' } }
    /**
     * Find zero or one Devices that matches the filter.
     * @param {devicesFindUniqueArgs} args - Arguments to find a Devices
     * @example
     * // Get one Devices
     * const devices = await prisma.devices.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends devicesFindUniqueArgs>(args: SelectSubset<T, devicesFindUniqueArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Devices that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {devicesFindUniqueOrThrowArgs} args - Arguments to find a Devices
     * @example
     * // Get one Devices
     * const devices = await prisma.devices.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends devicesFindUniqueOrThrowArgs>(args: SelectSubset<T, devicesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Devices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {devicesFindFirstArgs} args - Arguments to find a Devices
     * @example
     * // Get one Devices
     * const devices = await prisma.devices.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends devicesFindFirstArgs>(args?: SelectSubset<T, devicesFindFirstArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Devices that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {devicesFindFirstOrThrowArgs} args - Arguments to find a Devices
     * @example
     * // Get one Devices
     * const devices = await prisma.devices.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends devicesFindFirstOrThrowArgs>(args?: SelectSubset<T, devicesFindFirstOrThrowArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Devices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {devicesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Devices
     * const devices = await prisma.devices.findMany()
     * 
     * // Get first 10 Devices
     * const devices = await prisma.devices.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const devicesWithIdOnly = await prisma.devices.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends devicesFindManyArgs>(args?: SelectSubset<T, devicesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Devices.
     * @param {devicesCreateArgs} args - Arguments to create a Devices.
     * @example
     * // Create one Devices
     * const Devices = await prisma.devices.create({
     *   data: {
     *     // ... data to create a Devices
     *   }
     * })
     * 
     */
    create<T extends devicesCreateArgs>(args: SelectSubset<T, devicesCreateArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Devices.
     * @param {devicesCreateManyArgs} args - Arguments to create many Devices.
     * @example
     * // Create many Devices
     * const devices = await prisma.devices.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends devicesCreateManyArgs>(args?: SelectSubset<T, devicesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Devices and returns the data saved in the database.
     * @param {devicesCreateManyAndReturnArgs} args - Arguments to create many Devices.
     * @example
     * // Create many Devices
     * const devices = await prisma.devices.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Devices and only return the `id`
     * const devicesWithIdOnly = await prisma.devices.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends devicesCreateManyAndReturnArgs>(args?: SelectSubset<T, devicesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Devices.
     * @param {devicesDeleteArgs} args - Arguments to delete one Devices.
     * @example
     * // Delete one Devices
     * const Devices = await prisma.devices.delete({
     *   where: {
     *     // ... filter to delete one Devices
     *   }
     * })
     * 
     */
    delete<T extends devicesDeleteArgs>(args: SelectSubset<T, devicesDeleteArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Devices.
     * @param {devicesUpdateArgs} args - Arguments to update one Devices.
     * @example
     * // Update one Devices
     * const devices = await prisma.devices.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends devicesUpdateArgs>(args: SelectSubset<T, devicesUpdateArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Devices.
     * @param {devicesDeleteManyArgs} args - Arguments to filter Devices to delete.
     * @example
     * // Delete a few Devices
     * const { count } = await prisma.devices.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends devicesDeleteManyArgs>(args?: SelectSubset<T, devicesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Devices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {devicesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Devices
     * const devices = await prisma.devices.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends devicesUpdateManyArgs>(args: SelectSubset<T, devicesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Devices and returns the data updated in the database.
     * @param {devicesUpdateManyAndReturnArgs} args - Arguments to update many Devices.
     * @example
     * // Update many Devices
     * const devices = await prisma.devices.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Devices and only return the `id`
     * const devicesWithIdOnly = await prisma.devices.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends devicesUpdateManyAndReturnArgs>(args: SelectSubset<T, devicesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Devices.
     * @param {devicesUpsertArgs} args - Arguments to update or create a Devices.
     * @example
     * // Update or create a Devices
     * const devices = await prisma.devices.upsert({
     *   create: {
     *     // ... data to create a Devices
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Devices we want to update
     *   }
     * })
     */
    upsert<T extends devicesUpsertArgs>(args: SelectSubset<T, devicesUpsertArgs<ExtArgs>>): Prisma__devicesClient<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Devices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {devicesCountArgs} args - Arguments to filter Devices to count.
     * @example
     * // Count the number of Devices
     * const count = await prisma.devices.count({
     *   where: {
     *     // ... the filter for the Devices we want to count
     *   }
     * })
    **/
    count<T extends devicesCountArgs>(
      args?: Subset<T, devicesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DevicesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Devices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DevicesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DevicesAggregateArgs>(args: Subset<T, DevicesAggregateArgs>): Prisma.PrismaPromise<GetDevicesAggregateType<T>>

    /**
     * Group by Devices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {devicesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends devicesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: devicesGroupByArgs['orderBy'] }
        : { orderBy?: devicesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, devicesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDevicesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the devices model
   */
  readonly fields: devicesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for devices.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__devicesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    assets<T extends devices$assetsArgs<ExtArgs> = {}>(args?: Subset<T, devices$assetsArgs<ExtArgs>>): Prisma__assetsClient<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    organizations<T extends organizationsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, organizationsDefaultArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the devices model
   */
  interface devicesFieldRefs {
    readonly id: FieldRef<"devices", 'BigInt'>
    readonly uuid: FieldRef<"devices", 'String'>
    readonly organisation_uuid: FieldRef<"devices", 'String'>
    readonly asset_uuid: FieldRef<"devices", 'String'>
    readonly external_id: FieldRef<"devices", 'String'>
    readonly external_id_type: FieldRef<"devices", 'String'>
    readonly protocol: FieldRef<"devices", 'String'>
    readonly vendor: FieldRef<"devices", 'String'>
    readonly model: FieldRef<"devices", 'String'>
    readonly description: FieldRef<"devices", 'String'>
    readonly registered_at: FieldRef<"devices", 'DateTime'>
    readonly updated_at: FieldRef<"devices", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * devices findUnique
   */
  export type devicesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * Filter, which devices to fetch.
     */
    where: devicesWhereUniqueInput
  }

  /**
   * devices findUniqueOrThrow
   */
  export type devicesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * Filter, which devices to fetch.
     */
    where: devicesWhereUniqueInput
  }

  /**
   * devices findFirst
   */
  export type devicesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * Filter, which devices to fetch.
     */
    where?: devicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of devices to fetch.
     */
    orderBy?: devicesOrderByWithRelationInput | devicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for devices.
     */
    cursor?: devicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` devices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of devices.
     */
    distinct?: DevicesScalarFieldEnum | DevicesScalarFieldEnum[]
  }

  /**
   * devices findFirstOrThrow
   */
  export type devicesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * Filter, which devices to fetch.
     */
    where?: devicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of devices to fetch.
     */
    orderBy?: devicesOrderByWithRelationInput | devicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for devices.
     */
    cursor?: devicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` devices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of devices.
     */
    distinct?: DevicesScalarFieldEnum | DevicesScalarFieldEnum[]
  }

  /**
   * devices findMany
   */
  export type devicesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * Filter, which devices to fetch.
     */
    where?: devicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of devices to fetch.
     */
    orderBy?: devicesOrderByWithRelationInput | devicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing devices.
     */
    cursor?: devicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` devices.
     */
    skip?: number
    distinct?: DevicesScalarFieldEnum | DevicesScalarFieldEnum[]
  }

  /**
   * devices create
   */
  export type devicesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * The data needed to create a devices.
     */
    data: XOR<devicesCreateInput, devicesUncheckedCreateInput>
  }

  /**
   * devices createMany
   */
  export type devicesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many devices.
     */
    data: devicesCreateManyInput | devicesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * devices createManyAndReturn
   */
  export type devicesCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * The data used to create many devices.
     */
    data: devicesCreateManyInput | devicesCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * devices update
   */
  export type devicesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * The data needed to update a devices.
     */
    data: XOR<devicesUpdateInput, devicesUncheckedUpdateInput>
    /**
     * Choose, which devices to update.
     */
    where: devicesWhereUniqueInput
  }

  /**
   * devices updateMany
   */
  export type devicesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update devices.
     */
    data: XOR<devicesUpdateManyMutationInput, devicesUncheckedUpdateManyInput>
    /**
     * Filter which devices to update
     */
    where?: devicesWhereInput
    /**
     * Limit how many devices to update.
     */
    limit?: number
  }

  /**
   * devices updateManyAndReturn
   */
  export type devicesUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * The data used to update devices.
     */
    data: XOR<devicesUpdateManyMutationInput, devicesUncheckedUpdateManyInput>
    /**
     * Filter which devices to update
     */
    where?: devicesWhereInput
    /**
     * Limit how many devices to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * devices upsert
   */
  export type devicesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * The filter to search for the devices to update in case it exists.
     */
    where: devicesWhereUniqueInput
    /**
     * In case the devices found by the `where` argument doesn't exist, create a new devices with this data.
     */
    create: XOR<devicesCreateInput, devicesUncheckedCreateInput>
    /**
     * In case the devices was found with the provided `where` argument, update it with this data.
     */
    update: XOR<devicesUpdateInput, devicesUncheckedUpdateInput>
  }

  /**
   * devices delete
   */
  export type devicesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    /**
     * Filter which devices to delete.
     */
    where: devicesWhereUniqueInput
  }

  /**
   * devices deleteMany
   */
  export type devicesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which devices to delete
     */
    where?: devicesWhereInput
    /**
     * Limit how many devices to delete.
     */
    limit?: number
  }

  /**
   * devices.assets
   */
  export type devices$assetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    where?: assetsWhereInput
  }

  /**
   * devices without action
   */
  export type devicesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
  }


  /**
   * Model organizations
   */

  export type AggregateOrganizations = {
    _count: OrganizationsCountAggregateOutputType | null
    _avg: OrganizationsAvgAggregateOutputType | null
    _sum: OrganizationsSumAggregateOutputType | null
    _min: OrganizationsMinAggregateOutputType | null
    _max: OrganizationsMaxAggregateOutputType | null
  }

  export type OrganizationsAvgAggregateOutputType = {
    id: number | null
    parent_org_id: number | null
  }

  export type OrganizationsSumAggregateOutputType = {
    id: bigint | null
    parent_org_id: bigint | null
  }

  export type OrganizationsMinAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    name: string | null
    description: string | null
    parent_org_id: bigint | null
    maps_api_key: string | null
    can_inherit_key: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type OrganizationsMaxAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    name: string | null
    description: string | null
    parent_org_id: bigint | null
    maps_api_key: string | null
    can_inherit_key: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type OrganizationsCountAggregateOutputType = {
    id: number
    uuid: number
    name: number
    description: number
    parent_org_id: number
    maps_api_key: number
    can_inherit_key: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type OrganizationsAvgAggregateInputType = {
    id?: true
    parent_org_id?: true
  }

  export type OrganizationsSumAggregateInputType = {
    id?: true
    parent_org_id?: true
  }

  export type OrganizationsMinAggregateInputType = {
    id?: true
    uuid?: true
    name?: true
    description?: true
    parent_org_id?: true
    maps_api_key?: true
    can_inherit_key?: true
    created_at?: true
    updated_at?: true
  }

  export type OrganizationsMaxAggregateInputType = {
    id?: true
    uuid?: true
    name?: true
    description?: true
    parent_org_id?: true
    maps_api_key?: true
    can_inherit_key?: true
    created_at?: true
    updated_at?: true
  }

  export type OrganizationsCountAggregateInputType = {
    id?: true
    uuid?: true
    name?: true
    description?: true
    parent_org_id?: true
    maps_api_key?: true
    can_inherit_key?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type OrganizationsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which organizations to aggregate.
     */
    where?: organizationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of organizations to fetch.
     */
    orderBy?: organizationsOrderByWithRelationInput | organizationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: organizationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned organizations
    **/
    _count?: true | OrganizationsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrganizationsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrganizationsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrganizationsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrganizationsMaxAggregateInputType
  }

  export type GetOrganizationsAggregateType<T extends OrganizationsAggregateArgs> = {
        [P in keyof T & keyof AggregateOrganizations]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrganizations[P]>
      : GetScalarType<T[P], AggregateOrganizations[P]>
  }




  export type organizationsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: organizationsWhereInput
    orderBy?: organizationsOrderByWithAggregationInput | organizationsOrderByWithAggregationInput[]
    by: OrganizationsScalarFieldEnum[] | OrganizationsScalarFieldEnum
    having?: organizationsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrganizationsCountAggregateInputType | true
    _avg?: OrganizationsAvgAggregateInputType
    _sum?: OrganizationsSumAggregateInputType
    _min?: OrganizationsMinAggregateInputType
    _max?: OrganizationsMaxAggregateInputType
  }

  export type OrganizationsGroupByOutputType = {
    id: bigint
    uuid: string | null
    name: string
    description: string | null
    parent_org_id: bigint | null
    maps_api_key: string | null
    can_inherit_key: boolean | null
    created_at: Date
    updated_at: Date
    _count: OrganizationsCountAggregateOutputType | null
    _avg: OrganizationsAvgAggregateOutputType | null
    _sum: OrganizationsSumAggregateOutputType | null
    _min: OrganizationsMinAggregateOutputType | null
    _max: OrganizationsMaxAggregateOutputType | null
  }

  type GetOrganizationsGroupByPayload<T extends organizationsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrganizationsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrganizationsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrganizationsGroupByOutputType[P]>
            : GetScalarType<T[P], OrganizationsGroupByOutputType[P]>
        }
      >
    >


  export type organizationsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    name?: boolean
    description?: boolean
    parent_org_id?: boolean
    maps_api_key?: boolean
    can_inherit_key?: boolean
    created_at?: boolean
    updated_at?: boolean
    assets?: boolean | organizations$assetsArgs<ExtArgs>
    devices?: boolean | organizations$devicesArgs<ExtArgs>
    organizations?: boolean | organizations$organizationsArgs<ExtArgs>
    other_organizations?: boolean | organizations$other_organizationsArgs<ExtArgs>
    _count?: boolean | OrganizationsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["organizations"]>

  export type organizationsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    name?: boolean
    description?: boolean
    parent_org_id?: boolean
    maps_api_key?: boolean
    can_inherit_key?: boolean
    created_at?: boolean
    updated_at?: boolean
    organizations?: boolean | organizations$organizationsArgs<ExtArgs>
  }, ExtArgs["result"]["organizations"]>

  export type organizationsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    name?: boolean
    description?: boolean
    parent_org_id?: boolean
    maps_api_key?: boolean
    can_inherit_key?: boolean
    created_at?: boolean
    updated_at?: boolean
    organizations?: boolean | organizations$organizationsArgs<ExtArgs>
  }, ExtArgs["result"]["organizations"]>

  export type organizationsSelectScalar = {
    id?: boolean
    uuid?: boolean
    name?: boolean
    description?: boolean
    parent_org_id?: boolean
    maps_api_key?: boolean
    can_inherit_key?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type organizationsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "name" | "description" | "parent_org_id" | "maps_api_key" | "can_inherit_key" | "created_at" | "updated_at", ExtArgs["result"]["organizations"]>
  export type organizationsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    assets?: boolean | organizations$assetsArgs<ExtArgs>
    devices?: boolean | organizations$devicesArgs<ExtArgs>
    organizations?: boolean | organizations$organizationsArgs<ExtArgs>
    other_organizations?: boolean | organizations$other_organizationsArgs<ExtArgs>
    _count?: boolean | OrganizationsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type organizationsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organizations?: boolean | organizations$organizationsArgs<ExtArgs>
  }
  export type organizationsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organizations?: boolean | organizations$organizationsArgs<ExtArgs>
  }

  export type $organizationsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "organizations"
    objects: {
      assets: Prisma.$assetsPayload<ExtArgs>[]
      devices: Prisma.$devicesPayload<ExtArgs>[]
      organizations: Prisma.$organizationsPayload<ExtArgs> | null
      other_organizations: Prisma.$organizationsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      uuid: string | null
      name: string
      description: string | null
      parent_org_id: bigint | null
      maps_api_key: string | null
      can_inherit_key: boolean | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["organizations"]>
    composites: {}
  }

  type organizationsGetPayload<S extends boolean | null | undefined | organizationsDefaultArgs> = $Result.GetResult<Prisma.$organizationsPayload, S>

  type organizationsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<organizationsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrganizationsCountAggregateInputType | true
    }

  export interface organizationsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['organizations'], meta: { name: 'organizations' } }
    /**
     * Find zero or one Organizations that matches the filter.
     * @param {organizationsFindUniqueArgs} args - Arguments to find a Organizations
     * @example
     * // Get one Organizations
     * const organizations = await prisma.organizations.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends organizationsFindUniqueArgs>(args: SelectSubset<T, organizationsFindUniqueArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Organizations that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {organizationsFindUniqueOrThrowArgs} args - Arguments to find a Organizations
     * @example
     * // Get one Organizations
     * const organizations = await prisma.organizations.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends organizationsFindUniqueOrThrowArgs>(args: SelectSubset<T, organizationsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Organizations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {organizationsFindFirstArgs} args - Arguments to find a Organizations
     * @example
     * // Get one Organizations
     * const organizations = await prisma.organizations.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends organizationsFindFirstArgs>(args?: SelectSubset<T, organizationsFindFirstArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Organizations that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {organizationsFindFirstOrThrowArgs} args - Arguments to find a Organizations
     * @example
     * // Get one Organizations
     * const organizations = await prisma.organizations.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends organizationsFindFirstOrThrowArgs>(args?: SelectSubset<T, organizationsFindFirstOrThrowArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Organizations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {organizationsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Organizations
     * const organizations = await prisma.organizations.findMany()
     * 
     * // Get first 10 Organizations
     * const organizations = await prisma.organizations.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const organizationsWithIdOnly = await prisma.organizations.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends organizationsFindManyArgs>(args?: SelectSubset<T, organizationsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Organizations.
     * @param {organizationsCreateArgs} args - Arguments to create a Organizations.
     * @example
     * // Create one Organizations
     * const Organizations = await prisma.organizations.create({
     *   data: {
     *     // ... data to create a Organizations
     *   }
     * })
     * 
     */
    create<T extends organizationsCreateArgs>(args: SelectSubset<T, organizationsCreateArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Organizations.
     * @param {organizationsCreateManyArgs} args - Arguments to create many Organizations.
     * @example
     * // Create many Organizations
     * const organizations = await prisma.organizations.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends organizationsCreateManyArgs>(args?: SelectSubset<T, organizationsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Organizations and returns the data saved in the database.
     * @param {organizationsCreateManyAndReturnArgs} args - Arguments to create many Organizations.
     * @example
     * // Create many Organizations
     * const organizations = await prisma.organizations.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Organizations and only return the `id`
     * const organizationsWithIdOnly = await prisma.organizations.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends organizationsCreateManyAndReturnArgs>(args?: SelectSubset<T, organizationsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Organizations.
     * @param {organizationsDeleteArgs} args - Arguments to delete one Organizations.
     * @example
     * // Delete one Organizations
     * const Organizations = await prisma.organizations.delete({
     *   where: {
     *     // ... filter to delete one Organizations
     *   }
     * })
     * 
     */
    delete<T extends organizationsDeleteArgs>(args: SelectSubset<T, organizationsDeleteArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Organizations.
     * @param {organizationsUpdateArgs} args - Arguments to update one Organizations.
     * @example
     * // Update one Organizations
     * const organizations = await prisma.organizations.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends organizationsUpdateArgs>(args: SelectSubset<T, organizationsUpdateArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Organizations.
     * @param {organizationsDeleteManyArgs} args - Arguments to filter Organizations to delete.
     * @example
     * // Delete a few Organizations
     * const { count } = await prisma.organizations.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends organizationsDeleteManyArgs>(args?: SelectSubset<T, organizationsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {organizationsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Organizations
     * const organizations = await prisma.organizations.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends organizationsUpdateManyArgs>(args: SelectSubset<T, organizationsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Organizations and returns the data updated in the database.
     * @param {organizationsUpdateManyAndReturnArgs} args - Arguments to update many Organizations.
     * @example
     * // Update many Organizations
     * const organizations = await prisma.organizations.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Organizations and only return the `id`
     * const organizationsWithIdOnly = await prisma.organizations.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends organizationsUpdateManyAndReturnArgs>(args: SelectSubset<T, organizationsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Organizations.
     * @param {organizationsUpsertArgs} args - Arguments to update or create a Organizations.
     * @example
     * // Update or create a Organizations
     * const organizations = await prisma.organizations.upsert({
     *   create: {
     *     // ... data to create a Organizations
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Organizations we want to update
     *   }
     * })
     */
    upsert<T extends organizationsUpsertArgs>(args: SelectSubset<T, organizationsUpsertArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {organizationsCountArgs} args - Arguments to filter Organizations to count.
     * @example
     * // Count the number of Organizations
     * const count = await prisma.organizations.count({
     *   where: {
     *     // ... the filter for the Organizations we want to count
     *   }
     * })
    **/
    count<T extends organizationsCountArgs>(
      args?: Subset<T, organizationsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrganizationsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrganizationsAggregateArgs>(args: Subset<T, OrganizationsAggregateArgs>): Prisma.PrismaPromise<GetOrganizationsAggregateType<T>>

    /**
     * Group by Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {organizationsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends organizationsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: organizationsGroupByArgs['orderBy'] }
        : { orderBy?: organizationsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, organizationsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrganizationsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the organizations model
   */
  readonly fields: organizationsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for organizations.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__organizationsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    assets<T extends organizations$assetsArgs<ExtArgs> = {}>(args?: Subset<T, organizations$assetsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$assetsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    devices<T extends organizations$devicesArgs<ExtArgs> = {}>(args?: Subset<T, organizations$devicesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$devicesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    organizations<T extends organizations$organizationsArgs<ExtArgs> = {}>(args?: Subset<T, organizations$organizationsArgs<ExtArgs>>): Prisma__organizationsClient<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    other_organizations<T extends organizations$other_organizationsArgs<ExtArgs> = {}>(args?: Subset<T, organizations$other_organizationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$organizationsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the organizations model
   */
  interface organizationsFieldRefs {
    readonly id: FieldRef<"organizations", 'BigInt'>
    readonly uuid: FieldRef<"organizations", 'String'>
    readonly name: FieldRef<"organizations", 'String'>
    readonly description: FieldRef<"organizations", 'String'>
    readonly parent_org_id: FieldRef<"organizations", 'BigInt'>
    readonly maps_api_key: FieldRef<"organizations", 'String'>
    readonly can_inherit_key: FieldRef<"organizations", 'Boolean'>
    readonly created_at: FieldRef<"organizations", 'DateTime'>
    readonly updated_at: FieldRef<"organizations", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * organizations findUnique
   */
  export type organizationsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * Filter, which organizations to fetch.
     */
    where: organizationsWhereUniqueInput
  }

  /**
   * organizations findUniqueOrThrow
   */
  export type organizationsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * Filter, which organizations to fetch.
     */
    where: organizationsWhereUniqueInput
  }

  /**
   * organizations findFirst
   */
  export type organizationsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * Filter, which organizations to fetch.
     */
    where?: organizationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of organizations to fetch.
     */
    orderBy?: organizationsOrderByWithRelationInput | organizationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for organizations.
     */
    cursor?: organizationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of organizations.
     */
    distinct?: OrganizationsScalarFieldEnum | OrganizationsScalarFieldEnum[]
  }

  /**
   * organizations findFirstOrThrow
   */
  export type organizationsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * Filter, which organizations to fetch.
     */
    where?: organizationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of organizations to fetch.
     */
    orderBy?: organizationsOrderByWithRelationInput | organizationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for organizations.
     */
    cursor?: organizationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of organizations.
     */
    distinct?: OrganizationsScalarFieldEnum | OrganizationsScalarFieldEnum[]
  }

  /**
   * organizations findMany
   */
  export type organizationsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * Filter, which organizations to fetch.
     */
    where?: organizationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of organizations to fetch.
     */
    orderBy?: organizationsOrderByWithRelationInput | organizationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing organizations.
     */
    cursor?: organizationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` organizations.
     */
    skip?: number
    distinct?: OrganizationsScalarFieldEnum | OrganizationsScalarFieldEnum[]
  }

  /**
   * organizations create
   */
  export type organizationsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * The data needed to create a organizations.
     */
    data: XOR<organizationsCreateInput, organizationsUncheckedCreateInput>
  }

  /**
   * organizations createMany
   */
  export type organizationsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many organizations.
     */
    data: organizationsCreateManyInput | organizationsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * organizations createManyAndReturn
   */
  export type organizationsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * The data used to create many organizations.
     */
    data: organizationsCreateManyInput | organizationsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * organizations update
   */
  export type organizationsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * The data needed to update a organizations.
     */
    data: XOR<organizationsUpdateInput, organizationsUncheckedUpdateInput>
    /**
     * Choose, which organizations to update.
     */
    where: organizationsWhereUniqueInput
  }

  /**
   * organizations updateMany
   */
  export type organizationsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update organizations.
     */
    data: XOR<organizationsUpdateManyMutationInput, organizationsUncheckedUpdateManyInput>
    /**
     * Filter which organizations to update
     */
    where?: organizationsWhereInput
    /**
     * Limit how many organizations to update.
     */
    limit?: number
  }

  /**
   * organizations updateManyAndReturn
   */
  export type organizationsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * The data used to update organizations.
     */
    data: XOR<organizationsUpdateManyMutationInput, organizationsUncheckedUpdateManyInput>
    /**
     * Filter which organizations to update
     */
    where?: organizationsWhereInput
    /**
     * Limit how many organizations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * organizations upsert
   */
  export type organizationsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * The filter to search for the organizations to update in case it exists.
     */
    where: organizationsWhereUniqueInput
    /**
     * In case the organizations found by the `where` argument doesn't exist, create a new organizations with this data.
     */
    create: XOR<organizationsCreateInput, organizationsUncheckedCreateInput>
    /**
     * In case the organizations was found with the provided `where` argument, update it with this data.
     */
    update: XOR<organizationsUpdateInput, organizationsUncheckedUpdateInput>
  }

  /**
   * organizations delete
   */
  export type organizationsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    /**
     * Filter which organizations to delete.
     */
    where: organizationsWhereUniqueInput
  }

  /**
   * organizations deleteMany
   */
  export type organizationsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which organizations to delete
     */
    where?: organizationsWhereInput
    /**
     * Limit how many organizations to delete.
     */
    limit?: number
  }

  /**
   * organizations.assets
   */
  export type organizations$assetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the assets
     */
    select?: assetsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the assets
     */
    omit?: assetsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: assetsInclude<ExtArgs> | null
    where?: assetsWhereInput
    orderBy?: assetsOrderByWithRelationInput | assetsOrderByWithRelationInput[]
    cursor?: assetsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AssetsScalarFieldEnum | AssetsScalarFieldEnum[]
  }

  /**
   * organizations.devices
   */
  export type organizations$devicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the devices
     */
    select?: devicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the devices
     */
    omit?: devicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: devicesInclude<ExtArgs> | null
    where?: devicesWhereInput
    orderBy?: devicesOrderByWithRelationInput | devicesOrderByWithRelationInput[]
    cursor?: devicesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DevicesScalarFieldEnum | DevicesScalarFieldEnum[]
  }

  /**
   * organizations.organizations
   */
  export type organizations$organizationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    where?: organizationsWhereInput
  }

  /**
   * organizations.other_organizations
   */
  export type organizations$other_organizationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
    where?: organizationsWhereInput
    orderBy?: organizationsOrderByWithRelationInput | organizationsOrderByWithRelationInput[]
    cursor?: organizationsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrganizationsScalarFieldEnum | OrganizationsScalarFieldEnum[]
  }

  /**
   * organizations without action
   */
  export type organizationsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the organizations
     */
    select?: organizationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the organizations
     */
    omit?: organizationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: organizationsInclude<ExtArgs> | null
  }


  /**
   * Model codec12_commands
   */

  export type AggregateCodec12_commands = {
    _count: Codec12_commandsCountAggregateOutputType | null
    _avg: Codec12_commandsAvgAggregateOutputType | null
    _sum: Codec12_commandsSumAggregateOutputType | null
    _min: Codec12_commandsMinAggregateOutputType | null
    _max: Codec12_commandsMaxAggregateOutputType | null
  }

  export type Codec12_commandsAvgAggregateOutputType = {
    id: number | null
    retries: number | null
  }

  export type Codec12_commandsSumAggregateOutputType = {
    id: bigint | null
    retries: number | null
  }

  export type Codec12_commandsMinAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    imei: string | null
    command: string | null
    status: string | null
    created_at: Date | null
    updated_at: Date | null
    sent_at: Date | null
    responded_at: Date | null
    response: string | null
    retries: number | null
    comment: string | null
  }

  export type Codec12_commandsMaxAggregateOutputType = {
    id: bigint | null
    uuid: string | null
    imei: string | null
    command: string | null
    status: string | null
    created_at: Date | null
    updated_at: Date | null
    sent_at: Date | null
    responded_at: Date | null
    response: string | null
    retries: number | null
    comment: string | null
  }

  export type Codec12_commandsCountAggregateOutputType = {
    id: number
    uuid: number
    imei: number
    command: number
    status: number
    created_at: number
    updated_at: number
    sent_at: number
    responded_at: number
    response: number
    retries: number
    comment: number
    _all: number
  }


  export type Codec12_commandsAvgAggregateInputType = {
    id?: true
    retries?: true
  }

  export type Codec12_commandsSumAggregateInputType = {
    id?: true
    retries?: true
  }

  export type Codec12_commandsMinAggregateInputType = {
    id?: true
    uuid?: true
    imei?: true
    command?: true
    status?: true
    created_at?: true
    updated_at?: true
    sent_at?: true
    responded_at?: true
    response?: true
    retries?: true
    comment?: true
  }

  export type Codec12_commandsMaxAggregateInputType = {
    id?: true
    uuid?: true
    imei?: true
    command?: true
    status?: true
    created_at?: true
    updated_at?: true
    sent_at?: true
    responded_at?: true
    response?: true
    retries?: true
    comment?: true
  }

  export type Codec12_commandsCountAggregateInputType = {
    id?: true
    uuid?: true
    imei?: true
    command?: true
    status?: true
    created_at?: true
    updated_at?: true
    sent_at?: true
    responded_at?: true
    response?: true
    retries?: true
    comment?: true
    _all?: true
  }

  export type Codec12_commandsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which codec12_commands to aggregate.
     */
    where?: codec12_commandsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of codec12_commands to fetch.
     */
    orderBy?: codec12_commandsOrderByWithRelationInput | codec12_commandsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: codec12_commandsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` codec12_commands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` codec12_commands.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned codec12_commands
    **/
    _count?: true | Codec12_commandsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Codec12_commandsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Codec12_commandsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Codec12_commandsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Codec12_commandsMaxAggregateInputType
  }

  export type GetCodec12_commandsAggregateType<T extends Codec12_commandsAggregateArgs> = {
        [P in keyof T & keyof AggregateCodec12_commands]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCodec12_commands[P]>
      : GetScalarType<T[P], AggregateCodec12_commands[P]>
  }




  export type codec12_commandsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: codec12_commandsWhereInput
    orderBy?: codec12_commandsOrderByWithAggregationInput | codec12_commandsOrderByWithAggregationInput[]
    by: Codec12_commandsScalarFieldEnum[] | Codec12_commandsScalarFieldEnum
    having?: codec12_commandsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Codec12_commandsCountAggregateInputType | true
    _avg?: Codec12_commandsAvgAggregateInputType
    _sum?: Codec12_commandsSumAggregateInputType
    _min?: Codec12_commandsMinAggregateInputType
    _max?: Codec12_commandsMaxAggregateInputType
  }

  export type Codec12_commandsGroupByOutputType = {
    id: bigint
    uuid: string | null
    imei: string
    command: string
    status: string
    created_at: Date
    updated_at: Date
    sent_at: Date | null
    responded_at: Date | null
    response: string | null
    retries: number
    comment: string | null
    _count: Codec12_commandsCountAggregateOutputType | null
    _avg: Codec12_commandsAvgAggregateOutputType | null
    _sum: Codec12_commandsSumAggregateOutputType | null
    _min: Codec12_commandsMinAggregateOutputType | null
    _max: Codec12_commandsMaxAggregateOutputType | null
  }

  type GetCodec12_commandsGroupByPayload<T extends codec12_commandsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Codec12_commandsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Codec12_commandsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Codec12_commandsGroupByOutputType[P]>
            : GetScalarType<T[P], Codec12_commandsGroupByOutputType[P]>
        }
      >
    >


  export type codec12_commandsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    imei?: boolean
    command?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    sent_at?: boolean
    responded_at?: boolean
    response?: boolean
    retries?: boolean
    comment?: boolean
  }, ExtArgs["result"]["codec12_commands"]>

  export type codec12_commandsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    imei?: boolean
    command?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    sent_at?: boolean
    responded_at?: boolean
    response?: boolean
    retries?: boolean
    comment?: boolean
  }, ExtArgs["result"]["codec12_commands"]>

  export type codec12_commandsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    imei?: boolean
    command?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    sent_at?: boolean
    responded_at?: boolean
    response?: boolean
    retries?: boolean
    comment?: boolean
  }, ExtArgs["result"]["codec12_commands"]>

  export type codec12_commandsSelectScalar = {
    id?: boolean
    uuid?: boolean
    imei?: boolean
    command?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    sent_at?: boolean
    responded_at?: boolean
    response?: boolean
    retries?: boolean
    comment?: boolean
  }

  export type codec12_commandsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "imei" | "command" | "status" | "created_at" | "updated_at" | "sent_at" | "responded_at" | "response" | "retries" | "comment", ExtArgs["result"]["codec12_commands"]>

  export type $codec12_commandsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "codec12_commands"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      uuid: string | null
      imei: string
      command: string
      status: string
      created_at: Date
      updated_at: Date
      sent_at: Date | null
      responded_at: Date | null
      response: string | null
      retries: number
      comment: string | null
    }, ExtArgs["result"]["codec12_commands"]>
    composites: {}
  }

  type codec12_commandsGetPayload<S extends boolean | null | undefined | codec12_commandsDefaultArgs> = $Result.GetResult<Prisma.$codec12_commandsPayload, S>

  type codec12_commandsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<codec12_commandsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Codec12_commandsCountAggregateInputType | true
    }

  export interface codec12_commandsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['codec12_commands'], meta: { name: 'codec12_commands' } }
    /**
     * Find zero or one Codec12_commands that matches the filter.
     * @param {codec12_commandsFindUniqueArgs} args - Arguments to find a Codec12_commands
     * @example
     * // Get one Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends codec12_commandsFindUniqueArgs>(args: SelectSubset<T, codec12_commandsFindUniqueArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Codec12_commands that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {codec12_commandsFindUniqueOrThrowArgs} args - Arguments to find a Codec12_commands
     * @example
     * // Get one Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends codec12_commandsFindUniqueOrThrowArgs>(args: SelectSubset<T, codec12_commandsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Codec12_commands that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {codec12_commandsFindFirstArgs} args - Arguments to find a Codec12_commands
     * @example
     * // Get one Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends codec12_commandsFindFirstArgs>(args?: SelectSubset<T, codec12_commandsFindFirstArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Codec12_commands that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {codec12_commandsFindFirstOrThrowArgs} args - Arguments to find a Codec12_commands
     * @example
     * // Get one Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends codec12_commandsFindFirstOrThrowArgs>(args?: SelectSubset<T, codec12_commandsFindFirstOrThrowArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Codec12_commands that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {codec12_commandsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.findMany()
     * 
     * // Get first 10 Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const codec12_commandsWithIdOnly = await prisma.codec12_commands.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends codec12_commandsFindManyArgs>(args?: SelectSubset<T, codec12_commandsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Codec12_commands.
     * @param {codec12_commandsCreateArgs} args - Arguments to create a Codec12_commands.
     * @example
     * // Create one Codec12_commands
     * const Codec12_commands = await prisma.codec12_commands.create({
     *   data: {
     *     // ... data to create a Codec12_commands
     *   }
     * })
     * 
     */
    create<T extends codec12_commandsCreateArgs>(args: SelectSubset<T, codec12_commandsCreateArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Codec12_commands.
     * @param {codec12_commandsCreateManyArgs} args - Arguments to create many Codec12_commands.
     * @example
     * // Create many Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends codec12_commandsCreateManyArgs>(args?: SelectSubset<T, codec12_commandsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Codec12_commands and returns the data saved in the database.
     * @param {codec12_commandsCreateManyAndReturnArgs} args - Arguments to create many Codec12_commands.
     * @example
     * // Create many Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Codec12_commands and only return the `id`
     * const codec12_commandsWithIdOnly = await prisma.codec12_commands.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends codec12_commandsCreateManyAndReturnArgs>(args?: SelectSubset<T, codec12_commandsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Codec12_commands.
     * @param {codec12_commandsDeleteArgs} args - Arguments to delete one Codec12_commands.
     * @example
     * // Delete one Codec12_commands
     * const Codec12_commands = await prisma.codec12_commands.delete({
     *   where: {
     *     // ... filter to delete one Codec12_commands
     *   }
     * })
     * 
     */
    delete<T extends codec12_commandsDeleteArgs>(args: SelectSubset<T, codec12_commandsDeleteArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Codec12_commands.
     * @param {codec12_commandsUpdateArgs} args - Arguments to update one Codec12_commands.
     * @example
     * // Update one Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends codec12_commandsUpdateArgs>(args: SelectSubset<T, codec12_commandsUpdateArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Codec12_commands.
     * @param {codec12_commandsDeleteManyArgs} args - Arguments to filter Codec12_commands to delete.
     * @example
     * // Delete a few Codec12_commands
     * const { count } = await prisma.codec12_commands.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends codec12_commandsDeleteManyArgs>(args?: SelectSubset<T, codec12_commandsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Codec12_commands.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {codec12_commandsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends codec12_commandsUpdateManyArgs>(args: SelectSubset<T, codec12_commandsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Codec12_commands and returns the data updated in the database.
     * @param {codec12_commandsUpdateManyAndReturnArgs} args - Arguments to update many Codec12_commands.
     * @example
     * // Update many Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Codec12_commands and only return the `id`
     * const codec12_commandsWithIdOnly = await prisma.codec12_commands.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends codec12_commandsUpdateManyAndReturnArgs>(args: SelectSubset<T, codec12_commandsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Codec12_commands.
     * @param {codec12_commandsUpsertArgs} args - Arguments to update or create a Codec12_commands.
     * @example
     * // Update or create a Codec12_commands
     * const codec12_commands = await prisma.codec12_commands.upsert({
     *   create: {
     *     // ... data to create a Codec12_commands
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Codec12_commands we want to update
     *   }
     * })
     */
    upsert<T extends codec12_commandsUpsertArgs>(args: SelectSubset<T, codec12_commandsUpsertArgs<ExtArgs>>): Prisma__codec12_commandsClient<$Result.GetResult<Prisma.$codec12_commandsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Codec12_commands.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {codec12_commandsCountArgs} args - Arguments to filter Codec12_commands to count.
     * @example
     * // Count the number of Codec12_commands
     * const count = await prisma.codec12_commands.count({
     *   where: {
     *     // ... the filter for the Codec12_commands we want to count
     *   }
     * })
    **/
    count<T extends codec12_commandsCountArgs>(
      args?: Subset<T, codec12_commandsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Codec12_commandsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Codec12_commands.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Codec12_commandsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Codec12_commandsAggregateArgs>(args: Subset<T, Codec12_commandsAggregateArgs>): Prisma.PrismaPromise<GetCodec12_commandsAggregateType<T>>

    /**
     * Group by Codec12_commands.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {codec12_commandsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends codec12_commandsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: codec12_commandsGroupByArgs['orderBy'] }
        : { orderBy?: codec12_commandsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, codec12_commandsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCodec12_commandsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the codec12_commands model
   */
  readonly fields: codec12_commandsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for codec12_commands.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__codec12_commandsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the codec12_commands model
   */
  interface codec12_commandsFieldRefs {
    readonly id: FieldRef<"codec12_commands", 'BigInt'>
    readonly uuid: FieldRef<"codec12_commands", 'String'>
    readonly imei: FieldRef<"codec12_commands", 'String'>
    readonly command: FieldRef<"codec12_commands", 'String'>
    readonly status: FieldRef<"codec12_commands", 'String'>
    readonly created_at: FieldRef<"codec12_commands", 'DateTime'>
    readonly updated_at: FieldRef<"codec12_commands", 'DateTime'>
    readonly sent_at: FieldRef<"codec12_commands", 'DateTime'>
    readonly responded_at: FieldRef<"codec12_commands", 'DateTime'>
    readonly response: FieldRef<"codec12_commands", 'String'>
    readonly retries: FieldRef<"codec12_commands", 'Int'>
    readonly comment: FieldRef<"codec12_commands", 'String'>
  }
    

  // Custom InputTypes
  /**
   * codec12_commands findUnique
   */
  export type codec12_commandsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * Filter, which codec12_commands to fetch.
     */
    where: codec12_commandsWhereUniqueInput
  }

  /**
   * codec12_commands findUniqueOrThrow
   */
  export type codec12_commandsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * Filter, which codec12_commands to fetch.
     */
    where: codec12_commandsWhereUniqueInput
  }

  /**
   * codec12_commands findFirst
   */
  export type codec12_commandsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * Filter, which codec12_commands to fetch.
     */
    where?: codec12_commandsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of codec12_commands to fetch.
     */
    orderBy?: codec12_commandsOrderByWithRelationInput | codec12_commandsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for codec12_commands.
     */
    cursor?: codec12_commandsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` codec12_commands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` codec12_commands.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of codec12_commands.
     */
    distinct?: Codec12_commandsScalarFieldEnum | Codec12_commandsScalarFieldEnum[]
  }

  /**
   * codec12_commands findFirstOrThrow
   */
  export type codec12_commandsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * Filter, which codec12_commands to fetch.
     */
    where?: codec12_commandsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of codec12_commands to fetch.
     */
    orderBy?: codec12_commandsOrderByWithRelationInput | codec12_commandsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for codec12_commands.
     */
    cursor?: codec12_commandsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` codec12_commands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` codec12_commands.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of codec12_commands.
     */
    distinct?: Codec12_commandsScalarFieldEnum | Codec12_commandsScalarFieldEnum[]
  }

  /**
   * codec12_commands findMany
   */
  export type codec12_commandsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * Filter, which codec12_commands to fetch.
     */
    where?: codec12_commandsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of codec12_commands to fetch.
     */
    orderBy?: codec12_commandsOrderByWithRelationInput | codec12_commandsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing codec12_commands.
     */
    cursor?: codec12_commandsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` codec12_commands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` codec12_commands.
     */
    skip?: number
    distinct?: Codec12_commandsScalarFieldEnum | Codec12_commandsScalarFieldEnum[]
  }

  /**
   * codec12_commands create
   */
  export type codec12_commandsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * The data needed to create a codec12_commands.
     */
    data: XOR<codec12_commandsCreateInput, codec12_commandsUncheckedCreateInput>
  }

  /**
   * codec12_commands createMany
   */
  export type codec12_commandsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many codec12_commands.
     */
    data: codec12_commandsCreateManyInput | codec12_commandsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * codec12_commands createManyAndReturn
   */
  export type codec12_commandsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * The data used to create many codec12_commands.
     */
    data: codec12_commandsCreateManyInput | codec12_commandsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * codec12_commands update
   */
  export type codec12_commandsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * The data needed to update a codec12_commands.
     */
    data: XOR<codec12_commandsUpdateInput, codec12_commandsUncheckedUpdateInput>
    /**
     * Choose, which codec12_commands to update.
     */
    where: codec12_commandsWhereUniqueInput
  }

  /**
   * codec12_commands updateMany
   */
  export type codec12_commandsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update codec12_commands.
     */
    data: XOR<codec12_commandsUpdateManyMutationInput, codec12_commandsUncheckedUpdateManyInput>
    /**
     * Filter which codec12_commands to update
     */
    where?: codec12_commandsWhereInput
    /**
     * Limit how many codec12_commands to update.
     */
    limit?: number
  }

  /**
   * codec12_commands updateManyAndReturn
   */
  export type codec12_commandsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * The data used to update codec12_commands.
     */
    data: XOR<codec12_commandsUpdateManyMutationInput, codec12_commandsUncheckedUpdateManyInput>
    /**
     * Filter which codec12_commands to update
     */
    where?: codec12_commandsWhereInput
    /**
     * Limit how many codec12_commands to update.
     */
    limit?: number
  }

  /**
   * codec12_commands upsert
   */
  export type codec12_commandsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * The filter to search for the codec12_commands to update in case it exists.
     */
    where: codec12_commandsWhereUniqueInput
    /**
     * In case the codec12_commands found by the `where` argument doesn't exist, create a new codec12_commands with this data.
     */
    create: XOR<codec12_commandsCreateInput, codec12_commandsUncheckedCreateInput>
    /**
     * In case the codec12_commands was found with the provided `where` argument, update it with this data.
     */
    update: XOR<codec12_commandsUpdateInput, codec12_commandsUncheckedUpdateInput>
  }

  /**
   * codec12_commands delete
   */
  export type codec12_commandsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
    /**
     * Filter which codec12_commands to delete.
     */
    where: codec12_commandsWhereUniqueInput
  }

  /**
   * codec12_commands deleteMany
   */
  export type codec12_commandsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which codec12_commands to delete
     */
    where?: codec12_commandsWhereInput
    /**
     * Limit how many codec12_commands to delete.
     */
    limit?: number
  }

  /**
   * codec12_commands without action
   */
  export type codec12_commandsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the codec12_commands
     */
    select?: codec12_commandsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the codec12_commands
     */
    omit?: codec12_commandsOmit<ExtArgs> | null
  }


  /**
   * Model telemetry
   */

  export type AggregateTelemetry = {
    _count: TelemetryCountAggregateOutputType | null
    _avg: TelemetryAvgAggregateOutputType | null
    _sum: TelemetrySumAggregateOutputType | null
    _min: TelemetryMinAggregateOutputType | null
    _max: TelemetryMaxAggregateOutputType | null
  }

  export type TelemetryAvgAggregateOutputType = {
    id: number | null
    device_id: number | null
    asset_id: number | null
    organisation_id: number | null
  }

  export type TelemetrySumAggregateOutputType = {
    id: bigint | null
    device_id: bigint | null
    asset_id: bigint | null
    organisation_id: bigint | null
  }

  export type TelemetryMinAggregateOutputType = {
    id: bigint | null
    device_id: bigint | null
    asset_id: bigint | null
    organisation_id: bigint | null
    timestamp: Date | null
    protocol: string | null
    model: string | null
    created_at: Date | null
  }

  export type TelemetryMaxAggregateOutputType = {
    id: bigint | null
    device_id: bigint | null
    asset_id: bigint | null
    organisation_id: bigint | null
    timestamp: Date | null
    protocol: string | null
    model: string | null
    created_at: Date | null
  }

  export type TelemetryCountAggregateOutputType = {
    id: number
    device_id: number
    asset_id: number
    organisation_id: number
    timestamp: number
    protocol: number
    model: number
    telemetry: number
    created_at: number
    _all: number
  }


  export type TelemetryAvgAggregateInputType = {
    id?: true
    device_id?: true
    asset_id?: true
    organisation_id?: true
  }

  export type TelemetrySumAggregateInputType = {
    id?: true
    device_id?: true
    asset_id?: true
    organisation_id?: true
  }

  export type TelemetryMinAggregateInputType = {
    id?: true
    device_id?: true
    asset_id?: true
    organisation_id?: true
    timestamp?: true
    protocol?: true
    model?: true
    created_at?: true
  }

  export type TelemetryMaxAggregateInputType = {
    id?: true
    device_id?: true
    asset_id?: true
    organisation_id?: true
    timestamp?: true
    protocol?: true
    model?: true
    created_at?: true
  }

  export type TelemetryCountAggregateInputType = {
    id?: true
    device_id?: true
    asset_id?: true
    organisation_id?: true
    timestamp?: true
    protocol?: true
    model?: true
    telemetry?: true
    created_at?: true
    _all?: true
  }

  export type TelemetryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which telemetry to aggregate.
     */
    where?: telemetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of telemetries to fetch.
     */
    orderBy?: telemetryOrderByWithRelationInput | telemetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: telemetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` telemetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` telemetries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned telemetries
    **/
    _count?: true | TelemetryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TelemetryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TelemetrySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TelemetryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TelemetryMaxAggregateInputType
  }

  export type GetTelemetryAggregateType<T extends TelemetryAggregateArgs> = {
        [P in keyof T & keyof AggregateTelemetry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTelemetry[P]>
      : GetScalarType<T[P], AggregateTelemetry[P]>
  }




  export type telemetryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: telemetryWhereInput
    orderBy?: telemetryOrderByWithAggregationInput | telemetryOrderByWithAggregationInput[]
    by: TelemetryScalarFieldEnum[] | TelemetryScalarFieldEnum
    having?: telemetryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TelemetryCountAggregateInputType | true
    _avg?: TelemetryAvgAggregateInputType
    _sum?: TelemetrySumAggregateInputType
    _min?: TelemetryMinAggregateInputType
    _max?: TelemetryMaxAggregateInputType
  }

  export type TelemetryGroupByOutputType = {
    id: bigint
    device_id: bigint
    asset_id: bigint | null
    organisation_id: bigint | null
    timestamp: Date
    protocol: string
    model: string | null
    telemetry: JsonValue
    created_at: Date
    _count: TelemetryCountAggregateOutputType | null
    _avg: TelemetryAvgAggregateOutputType | null
    _sum: TelemetrySumAggregateOutputType | null
    _min: TelemetryMinAggregateOutputType | null
    _max: TelemetryMaxAggregateOutputType | null
  }

  type GetTelemetryGroupByPayload<T extends telemetryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TelemetryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TelemetryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TelemetryGroupByOutputType[P]>
            : GetScalarType<T[P], TelemetryGroupByOutputType[P]>
        }
      >
    >


  export type telemetrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    device_id?: boolean
    asset_id?: boolean
    organisation_id?: boolean
    timestamp?: boolean
    protocol?: boolean
    model?: boolean
    telemetry?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["telemetry"]>

  export type telemetrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    device_id?: boolean
    asset_id?: boolean
    organisation_id?: boolean
    timestamp?: boolean
    protocol?: boolean
    model?: boolean
    telemetry?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["telemetry"]>

  export type telemetrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    device_id?: boolean
    asset_id?: boolean
    organisation_id?: boolean
    timestamp?: boolean
    protocol?: boolean
    model?: boolean
    telemetry?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["telemetry"]>

  export type telemetrySelectScalar = {
    id?: boolean
    device_id?: boolean
    asset_id?: boolean
    organisation_id?: boolean
    timestamp?: boolean
    protocol?: boolean
    model?: boolean
    telemetry?: boolean
    created_at?: boolean
  }

  export type telemetryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "device_id" | "asset_id" | "organisation_id" | "timestamp" | "protocol" | "model" | "telemetry" | "created_at", ExtArgs["result"]["telemetry"]>

  export type $telemetryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "telemetry"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      device_id: bigint
      asset_id: bigint | null
      organisation_id: bigint | null
      timestamp: Date
      protocol: string
      model: string | null
      telemetry: Prisma.JsonValue
      created_at: Date
    }, ExtArgs["result"]["telemetry"]>
    composites: {}
  }

  type telemetryGetPayload<S extends boolean | null | undefined | telemetryDefaultArgs> = $Result.GetResult<Prisma.$telemetryPayload, S>

  type telemetryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<telemetryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TelemetryCountAggregateInputType | true
    }

  export interface telemetryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['telemetry'], meta: { name: 'telemetry' } }
    /**
     * Find zero or one Telemetry that matches the filter.
     * @param {telemetryFindUniqueArgs} args - Arguments to find a Telemetry
     * @example
     * // Get one Telemetry
     * const telemetry = await prisma.telemetry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends telemetryFindUniqueArgs>(args: SelectSubset<T, telemetryFindUniqueArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Telemetry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {telemetryFindUniqueOrThrowArgs} args - Arguments to find a Telemetry
     * @example
     * // Get one Telemetry
     * const telemetry = await prisma.telemetry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends telemetryFindUniqueOrThrowArgs>(args: SelectSubset<T, telemetryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Telemetry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {telemetryFindFirstArgs} args - Arguments to find a Telemetry
     * @example
     * // Get one Telemetry
     * const telemetry = await prisma.telemetry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends telemetryFindFirstArgs>(args?: SelectSubset<T, telemetryFindFirstArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Telemetry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {telemetryFindFirstOrThrowArgs} args - Arguments to find a Telemetry
     * @example
     * // Get one Telemetry
     * const telemetry = await prisma.telemetry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends telemetryFindFirstOrThrowArgs>(args?: SelectSubset<T, telemetryFindFirstOrThrowArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Telemetries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {telemetryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Telemetries
     * const telemetries = await prisma.telemetry.findMany()
     * 
     * // Get first 10 Telemetries
     * const telemetries = await prisma.telemetry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const telemetryWithIdOnly = await prisma.telemetry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends telemetryFindManyArgs>(args?: SelectSubset<T, telemetryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Telemetry.
     * @param {telemetryCreateArgs} args - Arguments to create a Telemetry.
     * @example
     * // Create one Telemetry
     * const Telemetry = await prisma.telemetry.create({
     *   data: {
     *     // ... data to create a Telemetry
     *   }
     * })
     * 
     */
    create<T extends telemetryCreateArgs>(args: SelectSubset<T, telemetryCreateArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Telemetries.
     * @param {telemetryCreateManyArgs} args - Arguments to create many Telemetries.
     * @example
     * // Create many Telemetries
     * const telemetry = await prisma.telemetry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends telemetryCreateManyArgs>(args?: SelectSubset<T, telemetryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Telemetries and returns the data saved in the database.
     * @param {telemetryCreateManyAndReturnArgs} args - Arguments to create many Telemetries.
     * @example
     * // Create many Telemetries
     * const telemetry = await prisma.telemetry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Telemetries and only return the `id`
     * const telemetryWithIdOnly = await prisma.telemetry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends telemetryCreateManyAndReturnArgs>(args?: SelectSubset<T, telemetryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Telemetry.
     * @param {telemetryDeleteArgs} args - Arguments to delete one Telemetry.
     * @example
     * // Delete one Telemetry
     * const Telemetry = await prisma.telemetry.delete({
     *   where: {
     *     // ... filter to delete one Telemetry
     *   }
     * })
     * 
     */
    delete<T extends telemetryDeleteArgs>(args: SelectSubset<T, telemetryDeleteArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Telemetry.
     * @param {telemetryUpdateArgs} args - Arguments to update one Telemetry.
     * @example
     * // Update one Telemetry
     * const telemetry = await prisma.telemetry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends telemetryUpdateArgs>(args: SelectSubset<T, telemetryUpdateArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Telemetries.
     * @param {telemetryDeleteManyArgs} args - Arguments to filter Telemetries to delete.
     * @example
     * // Delete a few Telemetries
     * const { count } = await prisma.telemetry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends telemetryDeleteManyArgs>(args?: SelectSubset<T, telemetryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Telemetries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {telemetryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Telemetries
     * const telemetry = await prisma.telemetry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends telemetryUpdateManyArgs>(args: SelectSubset<T, telemetryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Telemetries and returns the data updated in the database.
     * @param {telemetryUpdateManyAndReturnArgs} args - Arguments to update many Telemetries.
     * @example
     * // Update many Telemetries
     * const telemetry = await prisma.telemetry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Telemetries and only return the `id`
     * const telemetryWithIdOnly = await prisma.telemetry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends telemetryUpdateManyAndReturnArgs>(args: SelectSubset<T, telemetryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Telemetry.
     * @param {telemetryUpsertArgs} args - Arguments to update or create a Telemetry.
     * @example
     * // Update or create a Telemetry
     * const telemetry = await prisma.telemetry.upsert({
     *   create: {
     *     // ... data to create a Telemetry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Telemetry we want to update
     *   }
     * })
     */
    upsert<T extends telemetryUpsertArgs>(args: SelectSubset<T, telemetryUpsertArgs<ExtArgs>>): Prisma__telemetryClient<$Result.GetResult<Prisma.$telemetryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Telemetries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {telemetryCountArgs} args - Arguments to filter Telemetries to count.
     * @example
     * // Count the number of Telemetries
     * const count = await prisma.telemetry.count({
     *   where: {
     *     // ... the filter for the Telemetries we want to count
     *   }
     * })
    **/
    count<T extends telemetryCountArgs>(
      args?: Subset<T, telemetryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TelemetryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Telemetry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TelemetryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TelemetryAggregateArgs>(args: Subset<T, TelemetryAggregateArgs>): Prisma.PrismaPromise<GetTelemetryAggregateType<T>>

    /**
     * Group by Telemetry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {telemetryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends telemetryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: telemetryGroupByArgs['orderBy'] }
        : { orderBy?: telemetryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, telemetryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTelemetryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the telemetry model
   */
  readonly fields: telemetryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for telemetry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__telemetryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the telemetry model
   */
  interface telemetryFieldRefs {
    readonly id: FieldRef<"telemetry", 'BigInt'>
    readonly device_id: FieldRef<"telemetry", 'BigInt'>
    readonly asset_id: FieldRef<"telemetry", 'BigInt'>
    readonly organisation_id: FieldRef<"telemetry", 'BigInt'>
    readonly timestamp: FieldRef<"telemetry", 'DateTime'>
    readonly protocol: FieldRef<"telemetry", 'String'>
    readonly model: FieldRef<"telemetry", 'String'>
    readonly telemetry: FieldRef<"telemetry", 'Json'>
    readonly created_at: FieldRef<"telemetry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * telemetry findUnique
   */
  export type telemetryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * Filter, which telemetry to fetch.
     */
    where: telemetryWhereUniqueInput
  }

  /**
   * telemetry findUniqueOrThrow
   */
  export type telemetryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * Filter, which telemetry to fetch.
     */
    where: telemetryWhereUniqueInput
  }

  /**
   * telemetry findFirst
   */
  export type telemetryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * Filter, which telemetry to fetch.
     */
    where?: telemetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of telemetries to fetch.
     */
    orderBy?: telemetryOrderByWithRelationInput | telemetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for telemetries.
     */
    cursor?: telemetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` telemetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` telemetries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of telemetries.
     */
    distinct?: TelemetryScalarFieldEnum | TelemetryScalarFieldEnum[]
  }

  /**
   * telemetry findFirstOrThrow
   */
  export type telemetryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * Filter, which telemetry to fetch.
     */
    where?: telemetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of telemetries to fetch.
     */
    orderBy?: telemetryOrderByWithRelationInput | telemetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for telemetries.
     */
    cursor?: telemetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` telemetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` telemetries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of telemetries.
     */
    distinct?: TelemetryScalarFieldEnum | TelemetryScalarFieldEnum[]
  }

  /**
   * telemetry findMany
   */
  export type telemetryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * Filter, which telemetries to fetch.
     */
    where?: telemetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of telemetries to fetch.
     */
    orderBy?: telemetryOrderByWithRelationInput | telemetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing telemetries.
     */
    cursor?: telemetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` telemetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` telemetries.
     */
    skip?: number
    distinct?: TelemetryScalarFieldEnum | TelemetryScalarFieldEnum[]
  }

  /**
   * telemetry create
   */
  export type telemetryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * The data needed to create a telemetry.
     */
    data: XOR<telemetryCreateInput, telemetryUncheckedCreateInput>
  }

  /**
   * telemetry createMany
   */
  export type telemetryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many telemetries.
     */
    data: telemetryCreateManyInput | telemetryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * telemetry createManyAndReturn
   */
  export type telemetryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * The data used to create many telemetries.
     */
    data: telemetryCreateManyInput | telemetryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * telemetry update
   */
  export type telemetryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * The data needed to update a telemetry.
     */
    data: XOR<telemetryUpdateInput, telemetryUncheckedUpdateInput>
    /**
     * Choose, which telemetry to update.
     */
    where: telemetryWhereUniqueInput
  }

  /**
   * telemetry updateMany
   */
  export type telemetryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update telemetries.
     */
    data: XOR<telemetryUpdateManyMutationInput, telemetryUncheckedUpdateManyInput>
    /**
     * Filter which telemetries to update
     */
    where?: telemetryWhereInput
    /**
     * Limit how many telemetries to update.
     */
    limit?: number
  }

  /**
   * telemetry updateManyAndReturn
   */
  export type telemetryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * The data used to update telemetries.
     */
    data: XOR<telemetryUpdateManyMutationInput, telemetryUncheckedUpdateManyInput>
    /**
     * Filter which telemetries to update
     */
    where?: telemetryWhereInput
    /**
     * Limit how many telemetries to update.
     */
    limit?: number
  }

  /**
   * telemetry upsert
   */
  export type telemetryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * The filter to search for the telemetry to update in case it exists.
     */
    where: telemetryWhereUniqueInput
    /**
     * In case the telemetry found by the `where` argument doesn't exist, create a new telemetry with this data.
     */
    create: XOR<telemetryCreateInput, telemetryUncheckedCreateInput>
    /**
     * In case the telemetry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<telemetryUpdateInput, telemetryUncheckedUpdateInput>
  }

  /**
   * telemetry delete
   */
  export type telemetryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
    /**
     * Filter which telemetry to delete.
     */
    where: telemetryWhereUniqueInput
  }

  /**
   * telemetry deleteMany
   */
  export type telemetryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which telemetries to delete
     */
    where?: telemetryWhereInput
    /**
     * Limit how many telemetries to delete.
     */
    limit?: number
  }

  /**
   * telemetry without action
   */
  export type telemetryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the telemetry
     */
    select?: telemetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the telemetry
     */
    omit?: telemetryOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AssetsScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    organisation_uuid: 'organisation_uuid',
    name: 'name',
    asset_type: 'asset_type',
    description: 'description',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type AssetsScalarFieldEnum = (typeof AssetsScalarFieldEnum)[keyof typeof AssetsScalarFieldEnum]


  export const DevicesScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    organisation_uuid: 'organisation_uuid',
    asset_uuid: 'asset_uuid',
    external_id: 'external_id',
    external_id_type: 'external_id_type',
    protocol: 'protocol',
    vendor: 'vendor',
    model: 'model',
    description: 'description',
    registered_at: 'registered_at',
    updated_at: 'updated_at'
  };

  export type DevicesScalarFieldEnum = (typeof DevicesScalarFieldEnum)[keyof typeof DevicesScalarFieldEnum]


  export const OrganizationsScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    name: 'name',
    description: 'description',
    parent_org_id: 'parent_org_id',
    maps_api_key: 'maps_api_key',
    can_inherit_key: 'can_inherit_key',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type OrganizationsScalarFieldEnum = (typeof OrganizationsScalarFieldEnum)[keyof typeof OrganizationsScalarFieldEnum]


  export const Codec12_commandsScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    imei: 'imei',
    command: 'command',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    sent_at: 'sent_at',
    responded_at: 'responded_at',
    response: 'response',
    retries: 'retries',
    comment: 'comment'
  };

  export type Codec12_commandsScalarFieldEnum = (typeof Codec12_commandsScalarFieldEnum)[keyof typeof Codec12_commandsScalarFieldEnum]


  export const TelemetryScalarFieldEnum: {
    id: 'id',
    device_id: 'device_id',
    asset_id: 'asset_id',
    organisation_id: 'organisation_id',
    timestamp: 'timestamp',
    protocol: 'protocol',
    model: 'model',
    telemetry: 'telemetry',
    created_at: 'created_at'
  };

  export type TelemetryScalarFieldEnum = (typeof TelemetryScalarFieldEnum)[keyof typeof TelemetryScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type assetsWhereInput = {
    AND?: assetsWhereInput | assetsWhereInput[]
    OR?: assetsWhereInput[]
    NOT?: assetsWhereInput | assetsWhereInput[]
    id?: BigIntFilter<"assets"> | bigint | number
    uuid?: UuidNullableFilter<"assets"> | string | null
    organisation_uuid?: UuidFilter<"assets"> | string
    name?: StringFilter<"assets"> | string
    asset_type?: StringNullableFilter<"assets"> | string | null
    description?: StringNullableFilter<"assets"> | string | null
    created_at?: DateTimeFilter<"assets"> | Date | string
    updated_at?: DateTimeFilter<"assets"> | Date | string
    organizations?: XOR<OrganizationsScalarRelationFilter, organizationsWhereInput>
    devices?: DevicesListRelationFilter
  }

  export type assetsOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    organisation_uuid?: SortOrder
    name?: SortOrder
    asset_type?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    organizations?: organizationsOrderByWithRelationInput
    devices?: devicesOrderByRelationAggregateInput
  }

  export type assetsWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    uuid?: string
    AND?: assetsWhereInput | assetsWhereInput[]
    OR?: assetsWhereInput[]
    NOT?: assetsWhereInput | assetsWhereInput[]
    organisation_uuid?: UuidFilter<"assets"> | string
    name?: StringFilter<"assets"> | string
    asset_type?: StringNullableFilter<"assets"> | string | null
    description?: StringNullableFilter<"assets"> | string | null
    created_at?: DateTimeFilter<"assets"> | Date | string
    updated_at?: DateTimeFilter<"assets"> | Date | string
    organizations?: XOR<OrganizationsScalarRelationFilter, organizationsWhereInput>
    devices?: DevicesListRelationFilter
  }, "id" | "uuid">

  export type assetsOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    organisation_uuid?: SortOrder
    name?: SortOrder
    asset_type?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: assetsCountOrderByAggregateInput
    _avg?: assetsAvgOrderByAggregateInput
    _max?: assetsMaxOrderByAggregateInput
    _min?: assetsMinOrderByAggregateInput
    _sum?: assetsSumOrderByAggregateInput
  }

  export type assetsScalarWhereWithAggregatesInput = {
    AND?: assetsScalarWhereWithAggregatesInput | assetsScalarWhereWithAggregatesInput[]
    OR?: assetsScalarWhereWithAggregatesInput[]
    NOT?: assetsScalarWhereWithAggregatesInput | assetsScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"assets"> | bigint | number
    uuid?: UuidNullableWithAggregatesFilter<"assets"> | string | null
    organisation_uuid?: UuidWithAggregatesFilter<"assets"> | string
    name?: StringWithAggregatesFilter<"assets"> | string
    asset_type?: StringNullableWithAggregatesFilter<"assets"> | string | null
    description?: StringNullableWithAggregatesFilter<"assets"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"assets"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"assets"> | Date | string
  }

  export type devicesWhereInput = {
    AND?: devicesWhereInput | devicesWhereInput[]
    OR?: devicesWhereInput[]
    NOT?: devicesWhereInput | devicesWhereInput[]
    id?: BigIntFilter<"devices"> | bigint | number
    uuid?: UuidNullableFilter<"devices"> | string | null
    organisation_uuid?: UuidFilter<"devices"> | string
    asset_uuid?: UuidNullableFilter<"devices"> | string | null
    external_id?: StringFilter<"devices"> | string
    external_id_type?: StringFilter<"devices"> | string
    protocol?: StringFilter<"devices"> | string
    vendor?: StringNullableFilter<"devices"> | string | null
    model?: StringNullableFilter<"devices"> | string | null
    description?: StringNullableFilter<"devices"> | string | null
    registered_at?: DateTimeFilter<"devices"> | Date | string
    updated_at?: DateTimeFilter<"devices"> | Date | string
    assets?: XOR<AssetsNullableScalarRelationFilter, assetsWhereInput> | null
    organizations?: XOR<OrganizationsScalarRelationFilter, organizationsWhereInput>
  }

  export type devicesOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    organisation_uuid?: SortOrder
    asset_uuid?: SortOrderInput | SortOrder
    external_id?: SortOrder
    external_id_type?: SortOrder
    protocol?: SortOrder
    vendor?: SortOrderInput | SortOrder
    model?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    registered_at?: SortOrder
    updated_at?: SortOrder
    assets?: assetsOrderByWithRelationInput
    organizations?: organizationsOrderByWithRelationInput
  }

  export type devicesWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    uuid?: string
    external_id_external_id_type?: devicesExternal_idExternal_id_typeCompoundUniqueInput
    AND?: devicesWhereInput | devicesWhereInput[]
    OR?: devicesWhereInput[]
    NOT?: devicesWhereInput | devicesWhereInput[]
    organisation_uuid?: UuidFilter<"devices"> | string
    asset_uuid?: UuidNullableFilter<"devices"> | string | null
    external_id?: StringFilter<"devices"> | string
    external_id_type?: StringFilter<"devices"> | string
    protocol?: StringFilter<"devices"> | string
    vendor?: StringNullableFilter<"devices"> | string | null
    model?: StringNullableFilter<"devices"> | string | null
    description?: StringNullableFilter<"devices"> | string | null
    registered_at?: DateTimeFilter<"devices"> | Date | string
    updated_at?: DateTimeFilter<"devices"> | Date | string
    assets?: XOR<AssetsNullableScalarRelationFilter, assetsWhereInput> | null
    organizations?: XOR<OrganizationsScalarRelationFilter, organizationsWhereInput>
  }, "id" | "uuid" | "external_id_external_id_type">

  export type devicesOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    organisation_uuid?: SortOrder
    asset_uuid?: SortOrderInput | SortOrder
    external_id?: SortOrder
    external_id_type?: SortOrder
    protocol?: SortOrder
    vendor?: SortOrderInput | SortOrder
    model?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    registered_at?: SortOrder
    updated_at?: SortOrder
    _count?: devicesCountOrderByAggregateInput
    _avg?: devicesAvgOrderByAggregateInput
    _max?: devicesMaxOrderByAggregateInput
    _min?: devicesMinOrderByAggregateInput
    _sum?: devicesSumOrderByAggregateInput
  }

  export type devicesScalarWhereWithAggregatesInput = {
    AND?: devicesScalarWhereWithAggregatesInput | devicesScalarWhereWithAggregatesInput[]
    OR?: devicesScalarWhereWithAggregatesInput[]
    NOT?: devicesScalarWhereWithAggregatesInput | devicesScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"devices"> | bigint | number
    uuid?: UuidNullableWithAggregatesFilter<"devices"> | string | null
    organisation_uuid?: UuidWithAggregatesFilter<"devices"> | string
    asset_uuid?: UuidNullableWithAggregatesFilter<"devices"> | string | null
    external_id?: StringWithAggregatesFilter<"devices"> | string
    external_id_type?: StringWithAggregatesFilter<"devices"> | string
    protocol?: StringWithAggregatesFilter<"devices"> | string
    vendor?: StringNullableWithAggregatesFilter<"devices"> | string | null
    model?: StringNullableWithAggregatesFilter<"devices"> | string | null
    description?: StringNullableWithAggregatesFilter<"devices"> | string | null
    registered_at?: DateTimeWithAggregatesFilter<"devices"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"devices"> | Date | string
  }

  export type organizationsWhereInput = {
    AND?: organizationsWhereInput | organizationsWhereInput[]
    OR?: organizationsWhereInput[]
    NOT?: organizationsWhereInput | organizationsWhereInput[]
    id?: BigIntFilter<"organizations"> | bigint | number
    uuid?: UuidNullableFilter<"organizations"> | string | null
    name?: StringFilter<"organizations"> | string
    description?: StringNullableFilter<"organizations"> | string | null
    parent_org_id?: BigIntNullableFilter<"organizations"> | bigint | number | null
    maps_api_key?: StringNullableFilter<"organizations"> | string | null
    can_inherit_key?: BoolNullableFilter<"organizations"> | boolean | null
    created_at?: DateTimeFilter<"organizations"> | Date | string
    updated_at?: DateTimeFilter<"organizations"> | Date | string
    assets?: AssetsListRelationFilter
    devices?: DevicesListRelationFilter
    organizations?: XOR<OrganizationsNullableScalarRelationFilter, organizationsWhereInput> | null
    other_organizations?: OrganizationsListRelationFilter
  }

  export type organizationsOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    parent_org_id?: SortOrderInput | SortOrder
    maps_api_key?: SortOrderInput | SortOrder
    can_inherit_key?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    assets?: assetsOrderByRelationAggregateInput
    devices?: devicesOrderByRelationAggregateInput
    organizations?: organizationsOrderByWithRelationInput
    other_organizations?: organizationsOrderByRelationAggregateInput
  }

  export type organizationsWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    uuid?: string
    AND?: organizationsWhereInput | organizationsWhereInput[]
    OR?: organizationsWhereInput[]
    NOT?: organizationsWhereInput | organizationsWhereInput[]
    name?: StringFilter<"organizations"> | string
    description?: StringNullableFilter<"organizations"> | string | null
    parent_org_id?: BigIntNullableFilter<"organizations"> | bigint | number | null
    maps_api_key?: StringNullableFilter<"organizations"> | string | null
    can_inherit_key?: BoolNullableFilter<"organizations"> | boolean | null
    created_at?: DateTimeFilter<"organizations"> | Date | string
    updated_at?: DateTimeFilter<"organizations"> | Date | string
    assets?: AssetsListRelationFilter
    devices?: DevicesListRelationFilter
    organizations?: XOR<OrganizationsNullableScalarRelationFilter, organizationsWhereInput> | null
    other_organizations?: OrganizationsListRelationFilter
  }, "id" | "uuid">

  export type organizationsOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    parent_org_id?: SortOrderInput | SortOrder
    maps_api_key?: SortOrderInput | SortOrder
    can_inherit_key?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: organizationsCountOrderByAggregateInput
    _avg?: organizationsAvgOrderByAggregateInput
    _max?: organizationsMaxOrderByAggregateInput
    _min?: organizationsMinOrderByAggregateInput
    _sum?: organizationsSumOrderByAggregateInput
  }

  export type organizationsScalarWhereWithAggregatesInput = {
    AND?: organizationsScalarWhereWithAggregatesInput | organizationsScalarWhereWithAggregatesInput[]
    OR?: organizationsScalarWhereWithAggregatesInput[]
    NOT?: organizationsScalarWhereWithAggregatesInput | organizationsScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"organizations"> | bigint | number
    uuid?: UuidNullableWithAggregatesFilter<"organizations"> | string | null
    name?: StringWithAggregatesFilter<"organizations"> | string
    description?: StringNullableWithAggregatesFilter<"organizations"> | string | null
    parent_org_id?: BigIntNullableWithAggregatesFilter<"organizations"> | bigint | number | null
    maps_api_key?: StringNullableWithAggregatesFilter<"organizations"> | string | null
    can_inherit_key?: BoolNullableWithAggregatesFilter<"organizations"> | boolean | null
    created_at?: DateTimeWithAggregatesFilter<"organizations"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"organizations"> | Date | string
  }

  export type codec12_commandsWhereInput = {
    AND?: codec12_commandsWhereInput | codec12_commandsWhereInput[]
    OR?: codec12_commandsWhereInput[]
    NOT?: codec12_commandsWhereInput | codec12_commandsWhereInput[]
    id?: BigIntFilter<"codec12_commands"> | bigint | number
    uuid?: UuidNullableFilter<"codec12_commands"> | string | null
    imei?: StringFilter<"codec12_commands"> | string
    command?: StringFilter<"codec12_commands"> | string
    status?: StringFilter<"codec12_commands"> | string
    created_at?: DateTimeFilter<"codec12_commands"> | Date | string
    updated_at?: DateTimeFilter<"codec12_commands"> | Date | string
    sent_at?: DateTimeNullableFilter<"codec12_commands"> | Date | string | null
    responded_at?: DateTimeNullableFilter<"codec12_commands"> | Date | string | null
    response?: StringNullableFilter<"codec12_commands"> | string | null
    retries?: IntFilter<"codec12_commands"> | number
    comment?: StringNullableFilter<"codec12_commands"> | string | null
  }

  export type codec12_commandsOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    imei?: SortOrder
    command?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    sent_at?: SortOrderInput | SortOrder
    responded_at?: SortOrderInput | SortOrder
    response?: SortOrderInput | SortOrder
    retries?: SortOrder
    comment?: SortOrderInput | SortOrder
  }

  export type codec12_commandsWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    uuid?: string
    AND?: codec12_commandsWhereInput | codec12_commandsWhereInput[]
    OR?: codec12_commandsWhereInput[]
    NOT?: codec12_commandsWhereInput | codec12_commandsWhereInput[]
    imei?: StringFilter<"codec12_commands"> | string
    command?: StringFilter<"codec12_commands"> | string
    status?: StringFilter<"codec12_commands"> | string
    created_at?: DateTimeFilter<"codec12_commands"> | Date | string
    updated_at?: DateTimeFilter<"codec12_commands"> | Date | string
    sent_at?: DateTimeNullableFilter<"codec12_commands"> | Date | string | null
    responded_at?: DateTimeNullableFilter<"codec12_commands"> | Date | string | null
    response?: StringNullableFilter<"codec12_commands"> | string | null
    retries?: IntFilter<"codec12_commands"> | number
    comment?: StringNullableFilter<"codec12_commands"> | string | null
  }, "id" | "uuid">

  export type codec12_commandsOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrderInput | SortOrder
    imei?: SortOrder
    command?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    sent_at?: SortOrderInput | SortOrder
    responded_at?: SortOrderInput | SortOrder
    response?: SortOrderInput | SortOrder
    retries?: SortOrder
    comment?: SortOrderInput | SortOrder
    _count?: codec12_commandsCountOrderByAggregateInput
    _avg?: codec12_commandsAvgOrderByAggregateInput
    _max?: codec12_commandsMaxOrderByAggregateInput
    _min?: codec12_commandsMinOrderByAggregateInput
    _sum?: codec12_commandsSumOrderByAggregateInput
  }

  export type codec12_commandsScalarWhereWithAggregatesInput = {
    AND?: codec12_commandsScalarWhereWithAggregatesInput | codec12_commandsScalarWhereWithAggregatesInput[]
    OR?: codec12_commandsScalarWhereWithAggregatesInput[]
    NOT?: codec12_commandsScalarWhereWithAggregatesInput | codec12_commandsScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"codec12_commands"> | bigint | number
    uuid?: UuidNullableWithAggregatesFilter<"codec12_commands"> | string | null
    imei?: StringWithAggregatesFilter<"codec12_commands"> | string
    command?: StringWithAggregatesFilter<"codec12_commands"> | string
    status?: StringWithAggregatesFilter<"codec12_commands"> | string
    created_at?: DateTimeWithAggregatesFilter<"codec12_commands"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"codec12_commands"> | Date | string
    sent_at?: DateTimeNullableWithAggregatesFilter<"codec12_commands"> | Date | string | null
    responded_at?: DateTimeNullableWithAggregatesFilter<"codec12_commands"> | Date | string | null
    response?: StringNullableWithAggregatesFilter<"codec12_commands"> | string | null
    retries?: IntWithAggregatesFilter<"codec12_commands"> | number
    comment?: StringNullableWithAggregatesFilter<"codec12_commands"> | string | null
  }

  export type telemetryWhereInput = {
    AND?: telemetryWhereInput | telemetryWhereInput[]
    OR?: telemetryWhereInput[]
    NOT?: telemetryWhereInput | telemetryWhereInput[]
    id?: BigIntFilter<"telemetry"> | bigint | number
    device_id?: BigIntFilter<"telemetry"> | bigint | number
    asset_id?: BigIntNullableFilter<"telemetry"> | bigint | number | null
    organisation_id?: BigIntNullableFilter<"telemetry"> | bigint | number | null
    timestamp?: DateTimeFilter<"telemetry"> | Date | string
    protocol?: StringFilter<"telemetry"> | string
    model?: StringNullableFilter<"telemetry"> | string | null
    telemetry?: JsonFilter<"telemetry">
    created_at?: DateTimeFilter<"telemetry"> | Date | string
  }

  export type telemetryOrderByWithRelationInput = {
    id?: SortOrder
    device_id?: SortOrder
    asset_id?: SortOrderInput | SortOrder
    organisation_id?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    protocol?: SortOrder
    model?: SortOrderInput | SortOrder
    telemetry?: SortOrder
    created_at?: SortOrder
  }

  export type telemetryWhereUniqueInput = Prisma.AtLeast<{
    id_timestamp?: telemetryIdTimestampCompoundUniqueInput
    AND?: telemetryWhereInput | telemetryWhereInput[]
    OR?: telemetryWhereInput[]
    NOT?: telemetryWhereInput | telemetryWhereInput[]
    id?: BigIntFilter<"telemetry"> | bigint | number
    device_id?: BigIntFilter<"telemetry"> | bigint | number
    asset_id?: BigIntNullableFilter<"telemetry"> | bigint | number | null
    organisation_id?: BigIntNullableFilter<"telemetry"> | bigint | number | null
    timestamp?: DateTimeFilter<"telemetry"> | Date | string
    protocol?: StringFilter<"telemetry"> | string
    model?: StringNullableFilter<"telemetry"> | string | null
    telemetry?: JsonFilter<"telemetry">
    created_at?: DateTimeFilter<"telemetry"> | Date | string
  }, "id_timestamp">

  export type telemetryOrderByWithAggregationInput = {
    id?: SortOrder
    device_id?: SortOrder
    asset_id?: SortOrderInput | SortOrder
    organisation_id?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    protocol?: SortOrder
    model?: SortOrderInput | SortOrder
    telemetry?: SortOrder
    created_at?: SortOrder
    _count?: telemetryCountOrderByAggregateInput
    _avg?: telemetryAvgOrderByAggregateInput
    _max?: telemetryMaxOrderByAggregateInput
    _min?: telemetryMinOrderByAggregateInput
    _sum?: telemetrySumOrderByAggregateInput
  }

  export type telemetryScalarWhereWithAggregatesInput = {
    AND?: telemetryScalarWhereWithAggregatesInput | telemetryScalarWhereWithAggregatesInput[]
    OR?: telemetryScalarWhereWithAggregatesInput[]
    NOT?: telemetryScalarWhereWithAggregatesInput | telemetryScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"telemetry"> | bigint | number
    device_id?: BigIntWithAggregatesFilter<"telemetry"> | bigint | number
    asset_id?: BigIntNullableWithAggregatesFilter<"telemetry"> | bigint | number | null
    organisation_id?: BigIntNullableWithAggregatesFilter<"telemetry"> | bigint | number | null
    timestamp?: DateTimeWithAggregatesFilter<"telemetry"> | Date | string
    protocol?: StringWithAggregatesFilter<"telemetry"> | string
    model?: StringNullableWithAggregatesFilter<"telemetry"> | string | null
    telemetry?: JsonWithAggregatesFilter<"telemetry">
    created_at?: DateTimeWithAggregatesFilter<"telemetry"> | Date | string
  }

  export type assetsCreateInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    organizations?: organizationsCreateNestedOneWithoutAssetsInput
    devices?: devicesCreateNestedManyWithoutAssetsInput
  }

  export type assetsUncheckedCreateInput = {
    id?: bigint | number
    uuid?: string | null
    organisation_uuid?: string
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    devices?: devicesUncheckedCreateNestedManyWithoutAssetsInput
  }

  export type assetsUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    organizations?: organizationsUpdateOneRequiredWithoutAssetsNestedInput
    devices?: devicesUpdateManyWithoutAssetsNestedInput
  }

  export type assetsUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    organisation_uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    devices?: devicesUncheckedUpdateManyWithoutAssetsNestedInput
  }

  export type assetsCreateManyInput = {
    id?: bigint | number
    uuid?: string | null
    organisation_uuid?: string
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type assetsUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type assetsUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    organisation_uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type devicesCreateInput = {
    id?: bigint | number
    uuid?: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
    assets?: assetsCreateNestedOneWithoutDevicesInput
    organizations?: organizationsCreateNestedOneWithoutDevicesInput
  }

  export type devicesUncheckedCreateInput = {
    id?: bigint | number
    uuid?: string | null
    organisation_uuid?: string
    asset_uuid?: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
  }

  export type devicesUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUpdateOneWithoutDevicesNestedInput
    organizations?: organizationsUpdateOneRequiredWithoutDevicesNestedInput
  }

  export type devicesUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    organisation_uuid?: StringFieldUpdateOperationsInput | string
    asset_uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type devicesCreateManyInput = {
    id?: bigint | number
    uuid?: string | null
    organisation_uuid?: string
    asset_uuid?: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
  }

  export type devicesUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type devicesUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    organisation_uuid?: StringFieldUpdateOperationsInput | string
    asset_uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type organizationsCreateInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsCreateNestedManyWithoutOrganizationsInput
    devices?: devicesCreateNestedManyWithoutOrganizationsInput
    organizations?: organizationsCreateNestedOneWithoutOther_organizationsInput
    other_organizations?: organizationsCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsUncheckedCreateInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    parent_org_id?: bigint | number | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsUncheckedCreateNestedManyWithoutOrganizationsInput
    devices?: devicesUncheckedCreateNestedManyWithoutOrganizationsInput
    other_organizations?: organizationsUncheckedCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUpdateManyWithoutOrganizationsNestedInput
    devices?: devicesUpdateManyWithoutOrganizationsNestedInput
    organizations?: organizationsUpdateOneWithoutOther_organizationsNestedInput
    other_organizations?: organizationsUpdateManyWithoutOrganizationsNestedInput
  }

  export type organizationsUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    parent_org_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUncheckedUpdateManyWithoutOrganizationsNestedInput
    devices?: devicesUncheckedUpdateManyWithoutOrganizationsNestedInput
    other_organizations?: organizationsUncheckedUpdateManyWithoutOrganizationsNestedInput
  }

  export type organizationsCreateManyInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    parent_org_id?: bigint | number | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type organizationsUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type organizationsUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    parent_org_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type codec12_commandsCreateInput = {
    id?: bigint | number
    uuid?: string | null
    imei: string
    command: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
    sent_at?: Date | string | null
    responded_at?: Date | string | null
    response?: string | null
    retries?: number
    comment?: string | null
  }

  export type codec12_commandsUncheckedCreateInput = {
    id?: bigint | number
    uuid?: string | null
    imei: string
    command: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
    sent_at?: Date | string | null
    responded_at?: Date | string | null
    response?: string | null
    retries?: number
    comment?: string | null
  }

  export type codec12_commandsUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: StringFieldUpdateOperationsInput | string
    command?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sent_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    responded_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    retries?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type codec12_commandsUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: StringFieldUpdateOperationsInput | string
    command?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sent_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    responded_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    retries?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type codec12_commandsCreateManyInput = {
    id?: bigint | number
    uuid?: string | null
    imei: string
    command: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
    sent_at?: Date | string | null
    responded_at?: Date | string | null
    response?: string | null
    retries?: number
    comment?: string | null
  }

  export type codec12_commandsUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: StringFieldUpdateOperationsInput | string
    command?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sent_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    responded_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    retries?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type codec12_commandsUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: StringFieldUpdateOperationsInput | string
    command?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sent_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    responded_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    response?: NullableStringFieldUpdateOperationsInput | string | null
    retries?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type telemetryCreateInput = {
    id?: bigint | number
    device_id: bigint | number
    asset_id?: bigint | number | null
    organisation_id?: bigint | number | null
    timestamp: Date | string
    protocol: string
    model?: string | null
    telemetry: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type telemetryUncheckedCreateInput = {
    id?: bigint | number
    device_id: bigint | number
    asset_id?: bigint | number | null
    organisation_id?: bigint | number | null
    timestamp: Date | string
    protocol: string
    model?: string | null
    telemetry: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type telemetryUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    device_id?: BigIntFieldUpdateOperationsInput | bigint | number
    asset_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    organisation_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    protocol?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    telemetry?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type telemetryUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    device_id?: BigIntFieldUpdateOperationsInput | bigint | number
    asset_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    organisation_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    protocol?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    telemetry?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type telemetryCreateManyInput = {
    id?: bigint | number
    device_id: bigint | number
    asset_id?: bigint | number | null
    organisation_id?: bigint | number | null
    timestamp: Date | string
    protocol: string
    model?: string | null
    telemetry: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type telemetryUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    device_id?: BigIntFieldUpdateOperationsInput | bigint | number
    asset_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    organisation_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    protocol?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    telemetry?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type telemetryUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    device_id?: BigIntFieldUpdateOperationsInput | bigint | number
    asset_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    organisation_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    protocol?: StringFieldUpdateOperationsInput | string
    model?: NullableStringFieldUpdateOperationsInput | string | null
    telemetry?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type OrganizationsScalarRelationFilter = {
    is?: organizationsWhereInput
    isNot?: organizationsWhereInput
  }

  export type DevicesListRelationFilter = {
    every?: devicesWhereInput
    some?: devicesWhereInput
    none?: devicesWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type devicesOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type assetsCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    organisation_uuid?: SortOrder
    name?: SortOrder
    asset_type?: SortOrder
    description?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type assetsAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type assetsMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    organisation_uuid?: SortOrder
    name?: SortOrder
    asset_type?: SortOrder
    description?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type assetsMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    organisation_uuid?: SortOrder
    name?: SortOrder
    asset_type?: SortOrder
    description?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type assetsSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type AssetsNullableScalarRelationFilter = {
    is?: assetsWhereInput | null
    isNot?: assetsWhereInput | null
  }

  export type devicesExternal_idExternal_id_typeCompoundUniqueInput = {
    external_id: string
    external_id_type: string
  }

  export type devicesCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    organisation_uuid?: SortOrder
    asset_uuid?: SortOrder
    external_id?: SortOrder
    external_id_type?: SortOrder
    protocol?: SortOrder
    vendor?: SortOrder
    model?: SortOrder
    description?: SortOrder
    registered_at?: SortOrder
    updated_at?: SortOrder
  }

  export type devicesAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type devicesMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    organisation_uuid?: SortOrder
    asset_uuid?: SortOrder
    external_id?: SortOrder
    external_id_type?: SortOrder
    protocol?: SortOrder
    vendor?: SortOrder
    model?: SortOrder
    description?: SortOrder
    registered_at?: SortOrder
    updated_at?: SortOrder
  }

  export type devicesMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    organisation_uuid?: SortOrder
    asset_uuid?: SortOrder
    external_id?: SortOrder
    external_id_type?: SortOrder
    protocol?: SortOrder
    vendor?: SortOrder
    model?: SortOrder
    description?: SortOrder
    registered_at?: SortOrder
    updated_at?: SortOrder
  }

  export type devicesSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type AssetsListRelationFilter = {
    every?: assetsWhereInput
    some?: assetsWhereInput
    none?: assetsWhereInput
  }

  export type OrganizationsNullableScalarRelationFilter = {
    is?: organizationsWhereInput | null
    isNot?: organizationsWhereInput | null
  }

  export type OrganizationsListRelationFilter = {
    every?: organizationsWhereInput
    some?: organizationsWhereInput
    none?: organizationsWhereInput
  }

  export type assetsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type organizationsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type organizationsCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    name?: SortOrder
    description?: SortOrder
    parent_org_id?: SortOrder
    maps_api_key?: SortOrder
    can_inherit_key?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type organizationsAvgOrderByAggregateInput = {
    id?: SortOrder
    parent_org_id?: SortOrder
  }

  export type organizationsMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    name?: SortOrder
    description?: SortOrder
    parent_org_id?: SortOrder
    maps_api_key?: SortOrder
    can_inherit_key?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type organizationsMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    name?: SortOrder
    description?: SortOrder
    parent_org_id?: SortOrder
    maps_api_key?: SortOrder
    can_inherit_key?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type organizationsSumOrderByAggregateInput = {
    id?: SortOrder
    parent_org_id?: SortOrder
  }

  export type BigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type codec12_commandsCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    imei?: SortOrder
    command?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    sent_at?: SortOrder
    responded_at?: SortOrder
    response?: SortOrder
    retries?: SortOrder
    comment?: SortOrder
  }

  export type codec12_commandsAvgOrderByAggregateInput = {
    id?: SortOrder
    retries?: SortOrder
  }

  export type codec12_commandsMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    imei?: SortOrder
    command?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    sent_at?: SortOrder
    responded_at?: SortOrder
    response?: SortOrder
    retries?: SortOrder
    comment?: SortOrder
  }

  export type codec12_commandsMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    imei?: SortOrder
    command?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    sent_at?: SortOrder
    responded_at?: SortOrder
    response?: SortOrder
    retries?: SortOrder
    comment?: SortOrder
  }

  export type codec12_commandsSumOrderByAggregateInput = {
    id?: SortOrder
    retries?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type telemetryIdTimestampCompoundUniqueInput = {
    id: bigint | number
    timestamp: Date | string
  }

  export type telemetryCountOrderByAggregateInput = {
    id?: SortOrder
    device_id?: SortOrder
    asset_id?: SortOrder
    organisation_id?: SortOrder
    timestamp?: SortOrder
    protocol?: SortOrder
    model?: SortOrder
    telemetry?: SortOrder
    created_at?: SortOrder
  }

  export type telemetryAvgOrderByAggregateInput = {
    id?: SortOrder
    device_id?: SortOrder
    asset_id?: SortOrder
    organisation_id?: SortOrder
  }

  export type telemetryMaxOrderByAggregateInput = {
    id?: SortOrder
    device_id?: SortOrder
    asset_id?: SortOrder
    organisation_id?: SortOrder
    timestamp?: SortOrder
    protocol?: SortOrder
    model?: SortOrder
    created_at?: SortOrder
  }

  export type telemetryMinOrderByAggregateInput = {
    id?: SortOrder
    device_id?: SortOrder
    asset_id?: SortOrder
    organisation_id?: SortOrder
    timestamp?: SortOrder
    protocol?: SortOrder
    model?: SortOrder
    created_at?: SortOrder
  }

  export type telemetrySumOrderByAggregateInput = {
    id?: SortOrder
    device_id?: SortOrder
    asset_id?: SortOrder
    organisation_id?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type organizationsCreateNestedOneWithoutAssetsInput = {
    create?: XOR<organizationsCreateWithoutAssetsInput, organizationsUncheckedCreateWithoutAssetsInput>
    connectOrCreate?: organizationsCreateOrConnectWithoutAssetsInput
    connect?: organizationsWhereUniqueInput
  }

  export type devicesCreateNestedManyWithoutAssetsInput = {
    create?: XOR<devicesCreateWithoutAssetsInput, devicesUncheckedCreateWithoutAssetsInput> | devicesCreateWithoutAssetsInput[] | devicesUncheckedCreateWithoutAssetsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutAssetsInput | devicesCreateOrConnectWithoutAssetsInput[]
    createMany?: devicesCreateManyAssetsInputEnvelope
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
  }

  export type devicesUncheckedCreateNestedManyWithoutAssetsInput = {
    create?: XOR<devicesCreateWithoutAssetsInput, devicesUncheckedCreateWithoutAssetsInput> | devicesCreateWithoutAssetsInput[] | devicesUncheckedCreateWithoutAssetsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutAssetsInput | devicesCreateOrConnectWithoutAssetsInput[]
    createMany?: devicesCreateManyAssetsInputEnvelope
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type organizationsUpdateOneRequiredWithoutAssetsNestedInput = {
    create?: XOR<organizationsCreateWithoutAssetsInput, organizationsUncheckedCreateWithoutAssetsInput>
    connectOrCreate?: organizationsCreateOrConnectWithoutAssetsInput
    upsert?: organizationsUpsertWithoutAssetsInput
    connect?: organizationsWhereUniqueInput
    update?: XOR<XOR<organizationsUpdateToOneWithWhereWithoutAssetsInput, organizationsUpdateWithoutAssetsInput>, organizationsUncheckedUpdateWithoutAssetsInput>
  }

  export type devicesUpdateManyWithoutAssetsNestedInput = {
    create?: XOR<devicesCreateWithoutAssetsInput, devicesUncheckedCreateWithoutAssetsInput> | devicesCreateWithoutAssetsInput[] | devicesUncheckedCreateWithoutAssetsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutAssetsInput | devicesCreateOrConnectWithoutAssetsInput[]
    upsert?: devicesUpsertWithWhereUniqueWithoutAssetsInput | devicesUpsertWithWhereUniqueWithoutAssetsInput[]
    createMany?: devicesCreateManyAssetsInputEnvelope
    set?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    disconnect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    delete?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    update?: devicesUpdateWithWhereUniqueWithoutAssetsInput | devicesUpdateWithWhereUniqueWithoutAssetsInput[]
    updateMany?: devicesUpdateManyWithWhereWithoutAssetsInput | devicesUpdateManyWithWhereWithoutAssetsInput[]
    deleteMany?: devicesScalarWhereInput | devicesScalarWhereInput[]
  }

  export type devicesUncheckedUpdateManyWithoutAssetsNestedInput = {
    create?: XOR<devicesCreateWithoutAssetsInput, devicesUncheckedCreateWithoutAssetsInput> | devicesCreateWithoutAssetsInput[] | devicesUncheckedCreateWithoutAssetsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutAssetsInput | devicesCreateOrConnectWithoutAssetsInput[]
    upsert?: devicesUpsertWithWhereUniqueWithoutAssetsInput | devicesUpsertWithWhereUniqueWithoutAssetsInput[]
    createMany?: devicesCreateManyAssetsInputEnvelope
    set?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    disconnect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    delete?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    update?: devicesUpdateWithWhereUniqueWithoutAssetsInput | devicesUpdateWithWhereUniqueWithoutAssetsInput[]
    updateMany?: devicesUpdateManyWithWhereWithoutAssetsInput | devicesUpdateManyWithWhereWithoutAssetsInput[]
    deleteMany?: devicesScalarWhereInput | devicesScalarWhereInput[]
  }

  export type assetsCreateNestedOneWithoutDevicesInput = {
    create?: XOR<assetsCreateWithoutDevicesInput, assetsUncheckedCreateWithoutDevicesInput>
    connectOrCreate?: assetsCreateOrConnectWithoutDevicesInput
    connect?: assetsWhereUniqueInput
  }

  export type organizationsCreateNestedOneWithoutDevicesInput = {
    create?: XOR<organizationsCreateWithoutDevicesInput, organizationsUncheckedCreateWithoutDevicesInput>
    connectOrCreate?: organizationsCreateOrConnectWithoutDevicesInput
    connect?: organizationsWhereUniqueInput
  }

  export type assetsUpdateOneWithoutDevicesNestedInput = {
    create?: XOR<assetsCreateWithoutDevicesInput, assetsUncheckedCreateWithoutDevicesInput>
    connectOrCreate?: assetsCreateOrConnectWithoutDevicesInput
    upsert?: assetsUpsertWithoutDevicesInput
    disconnect?: assetsWhereInput | boolean
    delete?: assetsWhereInput | boolean
    connect?: assetsWhereUniqueInput
    update?: XOR<XOR<assetsUpdateToOneWithWhereWithoutDevicesInput, assetsUpdateWithoutDevicesInput>, assetsUncheckedUpdateWithoutDevicesInput>
  }

  export type organizationsUpdateOneRequiredWithoutDevicesNestedInput = {
    create?: XOR<organizationsCreateWithoutDevicesInput, organizationsUncheckedCreateWithoutDevicesInput>
    connectOrCreate?: organizationsCreateOrConnectWithoutDevicesInput
    upsert?: organizationsUpsertWithoutDevicesInput
    connect?: organizationsWhereUniqueInput
    update?: XOR<XOR<organizationsUpdateToOneWithWhereWithoutDevicesInput, organizationsUpdateWithoutDevicesInput>, organizationsUncheckedUpdateWithoutDevicesInput>
  }

  export type assetsCreateNestedManyWithoutOrganizationsInput = {
    create?: XOR<assetsCreateWithoutOrganizationsInput, assetsUncheckedCreateWithoutOrganizationsInput> | assetsCreateWithoutOrganizationsInput[] | assetsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: assetsCreateOrConnectWithoutOrganizationsInput | assetsCreateOrConnectWithoutOrganizationsInput[]
    createMany?: assetsCreateManyOrganizationsInputEnvelope
    connect?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
  }

  export type devicesCreateNestedManyWithoutOrganizationsInput = {
    create?: XOR<devicesCreateWithoutOrganizationsInput, devicesUncheckedCreateWithoutOrganizationsInput> | devicesCreateWithoutOrganizationsInput[] | devicesUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutOrganizationsInput | devicesCreateOrConnectWithoutOrganizationsInput[]
    createMany?: devicesCreateManyOrganizationsInputEnvelope
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
  }

  export type organizationsCreateNestedOneWithoutOther_organizationsInput = {
    create?: XOR<organizationsCreateWithoutOther_organizationsInput, organizationsUncheckedCreateWithoutOther_organizationsInput>
    connectOrCreate?: organizationsCreateOrConnectWithoutOther_organizationsInput
    connect?: organizationsWhereUniqueInput
  }

  export type organizationsCreateNestedManyWithoutOrganizationsInput = {
    create?: XOR<organizationsCreateWithoutOrganizationsInput, organizationsUncheckedCreateWithoutOrganizationsInput> | organizationsCreateWithoutOrganizationsInput[] | organizationsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: organizationsCreateOrConnectWithoutOrganizationsInput | organizationsCreateOrConnectWithoutOrganizationsInput[]
    createMany?: organizationsCreateManyOrganizationsInputEnvelope
    connect?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
  }

  export type assetsUncheckedCreateNestedManyWithoutOrganizationsInput = {
    create?: XOR<assetsCreateWithoutOrganizationsInput, assetsUncheckedCreateWithoutOrganizationsInput> | assetsCreateWithoutOrganizationsInput[] | assetsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: assetsCreateOrConnectWithoutOrganizationsInput | assetsCreateOrConnectWithoutOrganizationsInput[]
    createMany?: assetsCreateManyOrganizationsInputEnvelope
    connect?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
  }

  export type devicesUncheckedCreateNestedManyWithoutOrganizationsInput = {
    create?: XOR<devicesCreateWithoutOrganizationsInput, devicesUncheckedCreateWithoutOrganizationsInput> | devicesCreateWithoutOrganizationsInput[] | devicesUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutOrganizationsInput | devicesCreateOrConnectWithoutOrganizationsInput[]
    createMany?: devicesCreateManyOrganizationsInputEnvelope
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
  }

  export type organizationsUncheckedCreateNestedManyWithoutOrganizationsInput = {
    create?: XOR<organizationsCreateWithoutOrganizationsInput, organizationsUncheckedCreateWithoutOrganizationsInput> | organizationsCreateWithoutOrganizationsInput[] | organizationsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: organizationsCreateOrConnectWithoutOrganizationsInput | organizationsCreateOrConnectWithoutOrganizationsInput[]
    createMany?: organizationsCreateManyOrganizationsInputEnvelope
    connect?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type assetsUpdateManyWithoutOrganizationsNestedInput = {
    create?: XOR<assetsCreateWithoutOrganizationsInput, assetsUncheckedCreateWithoutOrganizationsInput> | assetsCreateWithoutOrganizationsInput[] | assetsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: assetsCreateOrConnectWithoutOrganizationsInput | assetsCreateOrConnectWithoutOrganizationsInput[]
    upsert?: assetsUpsertWithWhereUniqueWithoutOrganizationsInput | assetsUpsertWithWhereUniqueWithoutOrganizationsInput[]
    createMany?: assetsCreateManyOrganizationsInputEnvelope
    set?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    disconnect?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    delete?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    connect?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    update?: assetsUpdateWithWhereUniqueWithoutOrganizationsInput | assetsUpdateWithWhereUniqueWithoutOrganizationsInput[]
    updateMany?: assetsUpdateManyWithWhereWithoutOrganizationsInput | assetsUpdateManyWithWhereWithoutOrganizationsInput[]
    deleteMany?: assetsScalarWhereInput | assetsScalarWhereInput[]
  }

  export type devicesUpdateManyWithoutOrganizationsNestedInput = {
    create?: XOR<devicesCreateWithoutOrganizationsInput, devicesUncheckedCreateWithoutOrganizationsInput> | devicesCreateWithoutOrganizationsInput[] | devicesUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutOrganizationsInput | devicesCreateOrConnectWithoutOrganizationsInput[]
    upsert?: devicesUpsertWithWhereUniqueWithoutOrganizationsInput | devicesUpsertWithWhereUniqueWithoutOrganizationsInput[]
    createMany?: devicesCreateManyOrganizationsInputEnvelope
    set?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    disconnect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    delete?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    update?: devicesUpdateWithWhereUniqueWithoutOrganizationsInput | devicesUpdateWithWhereUniqueWithoutOrganizationsInput[]
    updateMany?: devicesUpdateManyWithWhereWithoutOrganizationsInput | devicesUpdateManyWithWhereWithoutOrganizationsInput[]
    deleteMany?: devicesScalarWhereInput | devicesScalarWhereInput[]
  }

  export type organizationsUpdateOneWithoutOther_organizationsNestedInput = {
    create?: XOR<organizationsCreateWithoutOther_organizationsInput, organizationsUncheckedCreateWithoutOther_organizationsInput>
    connectOrCreate?: organizationsCreateOrConnectWithoutOther_organizationsInput
    upsert?: organizationsUpsertWithoutOther_organizationsInput
    disconnect?: organizationsWhereInput | boolean
    delete?: organizationsWhereInput | boolean
    connect?: organizationsWhereUniqueInput
    update?: XOR<XOR<organizationsUpdateToOneWithWhereWithoutOther_organizationsInput, organizationsUpdateWithoutOther_organizationsInput>, organizationsUncheckedUpdateWithoutOther_organizationsInput>
  }

  export type organizationsUpdateManyWithoutOrganizationsNestedInput = {
    create?: XOR<organizationsCreateWithoutOrganizationsInput, organizationsUncheckedCreateWithoutOrganizationsInput> | organizationsCreateWithoutOrganizationsInput[] | organizationsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: organizationsCreateOrConnectWithoutOrganizationsInput | organizationsCreateOrConnectWithoutOrganizationsInput[]
    upsert?: organizationsUpsertWithWhereUniqueWithoutOrganizationsInput | organizationsUpsertWithWhereUniqueWithoutOrganizationsInput[]
    createMany?: organizationsCreateManyOrganizationsInputEnvelope
    set?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    disconnect?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    delete?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    connect?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    update?: organizationsUpdateWithWhereUniqueWithoutOrganizationsInput | organizationsUpdateWithWhereUniqueWithoutOrganizationsInput[]
    updateMany?: organizationsUpdateManyWithWhereWithoutOrganizationsInput | organizationsUpdateManyWithWhereWithoutOrganizationsInput[]
    deleteMany?: organizationsScalarWhereInput | organizationsScalarWhereInput[]
  }

  export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type assetsUncheckedUpdateManyWithoutOrganizationsNestedInput = {
    create?: XOR<assetsCreateWithoutOrganizationsInput, assetsUncheckedCreateWithoutOrganizationsInput> | assetsCreateWithoutOrganizationsInput[] | assetsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: assetsCreateOrConnectWithoutOrganizationsInput | assetsCreateOrConnectWithoutOrganizationsInput[]
    upsert?: assetsUpsertWithWhereUniqueWithoutOrganizationsInput | assetsUpsertWithWhereUniqueWithoutOrganizationsInput[]
    createMany?: assetsCreateManyOrganizationsInputEnvelope
    set?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    disconnect?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    delete?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    connect?: assetsWhereUniqueInput | assetsWhereUniqueInput[]
    update?: assetsUpdateWithWhereUniqueWithoutOrganizationsInput | assetsUpdateWithWhereUniqueWithoutOrganizationsInput[]
    updateMany?: assetsUpdateManyWithWhereWithoutOrganizationsInput | assetsUpdateManyWithWhereWithoutOrganizationsInput[]
    deleteMany?: assetsScalarWhereInput | assetsScalarWhereInput[]
  }

  export type devicesUncheckedUpdateManyWithoutOrganizationsNestedInput = {
    create?: XOR<devicesCreateWithoutOrganizationsInput, devicesUncheckedCreateWithoutOrganizationsInput> | devicesCreateWithoutOrganizationsInput[] | devicesUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: devicesCreateOrConnectWithoutOrganizationsInput | devicesCreateOrConnectWithoutOrganizationsInput[]
    upsert?: devicesUpsertWithWhereUniqueWithoutOrganizationsInput | devicesUpsertWithWhereUniqueWithoutOrganizationsInput[]
    createMany?: devicesCreateManyOrganizationsInputEnvelope
    set?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    disconnect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    delete?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    connect?: devicesWhereUniqueInput | devicesWhereUniqueInput[]
    update?: devicesUpdateWithWhereUniqueWithoutOrganizationsInput | devicesUpdateWithWhereUniqueWithoutOrganizationsInput[]
    updateMany?: devicesUpdateManyWithWhereWithoutOrganizationsInput | devicesUpdateManyWithWhereWithoutOrganizationsInput[]
    deleteMany?: devicesScalarWhereInput | devicesScalarWhereInput[]
  }

  export type organizationsUncheckedUpdateManyWithoutOrganizationsNestedInput = {
    create?: XOR<organizationsCreateWithoutOrganizationsInput, organizationsUncheckedCreateWithoutOrganizationsInput> | organizationsCreateWithoutOrganizationsInput[] | organizationsUncheckedCreateWithoutOrganizationsInput[]
    connectOrCreate?: organizationsCreateOrConnectWithoutOrganizationsInput | organizationsCreateOrConnectWithoutOrganizationsInput[]
    upsert?: organizationsUpsertWithWhereUniqueWithoutOrganizationsInput | organizationsUpsertWithWhereUniqueWithoutOrganizationsInput[]
    createMany?: organizationsCreateManyOrganizationsInputEnvelope
    set?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    disconnect?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    delete?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    connect?: organizationsWhereUniqueInput | organizationsWhereUniqueInput[]
    update?: organizationsUpdateWithWhereUniqueWithoutOrganizationsInput | organizationsUpdateWithWhereUniqueWithoutOrganizationsInput[]
    updateMany?: organizationsUpdateManyWithWhereWithoutOrganizationsInput | organizationsUpdateManyWithWhereWithoutOrganizationsInput[]
    deleteMany?: organizationsScalarWhereInput | organizationsScalarWhereInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedBigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type organizationsCreateWithoutAssetsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    devices?: devicesCreateNestedManyWithoutOrganizationsInput
    organizations?: organizationsCreateNestedOneWithoutOther_organizationsInput
    other_organizations?: organizationsCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsUncheckedCreateWithoutAssetsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    parent_org_id?: bigint | number | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    devices?: devicesUncheckedCreateNestedManyWithoutOrganizationsInput
    other_organizations?: organizationsUncheckedCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsCreateOrConnectWithoutAssetsInput = {
    where: organizationsWhereUniqueInput
    create: XOR<organizationsCreateWithoutAssetsInput, organizationsUncheckedCreateWithoutAssetsInput>
  }

  export type devicesCreateWithoutAssetsInput = {
    id?: bigint | number
    uuid?: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
    organizations?: organizationsCreateNestedOneWithoutDevicesInput
  }

  export type devicesUncheckedCreateWithoutAssetsInput = {
    id?: bigint | number
    uuid?: string | null
    organisation_uuid?: string
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
  }

  export type devicesCreateOrConnectWithoutAssetsInput = {
    where: devicesWhereUniqueInput
    create: XOR<devicesCreateWithoutAssetsInput, devicesUncheckedCreateWithoutAssetsInput>
  }

  export type devicesCreateManyAssetsInputEnvelope = {
    data: devicesCreateManyAssetsInput | devicesCreateManyAssetsInput[]
    skipDuplicates?: boolean
  }

  export type organizationsUpsertWithoutAssetsInput = {
    update: XOR<organizationsUpdateWithoutAssetsInput, organizationsUncheckedUpdateWithoutAssetsInput>
    create: XOR<organizationsCreateWithoutAssetsInput, organizationsUncheckedCreateWithoutAssetsInput>
    where?: organizationsWhereInput
  }

  export type organizationsUpdateToOneWithWhereWithoutAssetsInput = {
    where?: organizationsWhereInput
    data: XOR<organizationsUpdateWithoutAssetsInput, organizationsUncheckedUpdateWithoutAssetsInput>
  }

  export type organizationsUpdateWithoutAssetsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    devices?: devicesUpdateManyWithoutOrganizationsNestedInput
    organizations?: organizationsUpdateOneWithoutOther_organizationsNestedInput
    other_organizations?: organizationsUpdateManyWithoutOrganizationsNestedInput
  }

  export type organizationsUncheckedUpdateWithoutAssetsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    parent_org_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    devices?: devicesUncheckedUpdateManyWithoutOrganizationsNestedInput
    other_organizations?: organizationsUncheckedUpdateManyWithoutOrganizationsNestedInput
  }

  export type devicesUpsertWithWhereUniqueWithoutAssetsInput = {
    where: devicesWhereUniqueInput
    update: XOR<devicesUpdateWithoutAssetsInput, devicesUncheckedUpdateWithoutAssetsInput>
    create: XOR<devicesCreateWithoutAssetsInput, devicesUncheckedCreateWithoutAssetsInput>
  }

  export type devicesUpdateWithWhereUniqueWithoutAssetsInput = {
    where: devicesWhereUniqueInput
    data: XOR<devicesUpdateWithoutAssetsInput, devicesUncheckedUpdateWithoutAssetsInput>
  }

  export type devicesUpdateManyWithWhereWithoutAssetsInput = {
    where: devicesScalarWhereInput
    data: XOR<devicesUpdateManyMutationInput, devicesUncheckedUpdateManyWithoutAssetsInput>
  }

  export type devicesScalarWhereInput = {
    AND?: devicesScalarWhereInput | devicesScalarWhereInput[]
    OR?: devicesScalarWhereInput[]
    NOT?: devicesScalarWhereInput | devicesScalarWhereInput[]
    id?: BigIntFilter<"devices"> | bigint | number
    uuid?: UuidNullableFilter<"devices"> | string | null
    organisation_uuid?: UuidFilter<"devices"> | string
    asset_uuid?: UuidNullableFilter<"devices"> | string | null
    external_id?: StringFilter<"devices"> | string
    external_id_type?: StringFilter<"devices"> | string
    protocol?: StringFilter<"devices"> | string
    vendor?: StringNullableFilter<"devices"> | string | null
    model?: StringNullableFilter<"devices"> | string | null
    description?: StringNullableFilter<"devices"> | string | null
    registered_at?: DateTimeFilter<"devices"> | Date | string
    updated_at?: DateTimeFilter<"devices"> | Date | string
  }

  export type assetsCreateWithoutDevicesInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    organizations?: organizationsCreateNestedOneWithoutAssetsInput
  }

  export type assetsUncheckedCreateWithoutDevicesInput = {
    id?: bigint | number
    uuid?: string | null
    organisation_uuid?: string
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type assetsCreateOrConnectWithoutDevicesInput = {
    where: assetsWhereUniqueInput
    create: XOR<assetsCreateWithoutDevicesInput, assetsUncheckedCreateWithoutDevicesInput>
  }

  export type organizationsCreateWithoutDevicesInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsCreateNestedManyWithoutOrganizationsInput
    organizations?: organizationsCreateNestedOneWithoutOther_organizationsInput
    other_organizations?: organizationsCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsUncheckedCreateWithoutDevicesInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    parent_org_id?: bigint | number | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsUncheckedCreateNestedManyWithoutOrganizationsInput
    other_organizations?: organizationsUncheckedCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsCreateOrConnectWithoutDevicesInput = {
    where: organizationsWhereUniqueInput
    create: XOR<organizationsCreateWithoutDevicesInput, organizationsUncheckedCreateWithoutDevicesInput>
  }

  export type assetsUpsertWithoutDevicesInput = {
    update: XOR<assetsUpdateWithoutDevicesInput, assetsUncheckedUpdateWithoutDevicesInput>
    create: XOR<assetsCreateWithoutDevicesInput, assetsUncheckedCreateWithoutDevicesInput>
    where?: assetsWhereInput
  }

  export type assetsUpdateToOneWithWhereWithoutDevicesInput = {
    where?: assetsWhereInput
    data: XOR<assetsUpdateWithoutDevicesInput, assetsUncheckedUpdateWithoutDevicesInput>
  }

  export type assetsUpdateWithoutDevicesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    organizations?: organizationsUpdateOneRequiredWithoutAssetsNestedInput
  }

  export type assetsUncheckedUpdateWithoutDevicesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    organisation_uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type organizationsUpsertWithoutDevicesInput = {
    update: XOR<organizationsUpdateWithoutDevicesInput, organizationsUncheckedUpdateWithoutDevicesInput>
    create: XOR<organizationsCreateWithoutDevicesInput, organizationsUncheckedCreateWithoutDevicesInput>
    where?: organizationsWhereInput
  }

  export type organizationsUpdateToOneWithWhereWithoutDevicesInput = {
    where?: organizationsWhereInput
    data: XOR<organizationsUpdateWithoutDevicesInput, organizationsUncheckedUpdateWithoutDevicesInput>
  }

  export type organizationsUpdateWithoutDevicesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUpdateManyWithoutOrganizationsNestedInput
    organizations?: organizationsUpdateOneWithoutOther_organizationsNestedInput
    other_organizations?: organizationsUpdateManyWithoutOrganizationsNestedInput
  }

  export type organizationsUncheckedUpdateWithoutDevicesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    parent_org_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUncheckedUpdateManyWithoutOrganizationsNestedInput
    other_organizations?: organizationsUncheckedUpdateManyWithoutOrganizationsNestedInput
  }

  export type assetsCreateWithoutOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    devices?: devicesCreateNestedManyWithoutAssetsInput
  }

  export type assetsUncheckedCreateWithoutOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    devices?: devicesUncheckedCreateNestedManyWithoutAssetsInput
  }

  export type assetsCreateOrConnectWithoutOrganizationsInput = {
    where: assetsWhereUniqueInput
    create: XOR<assetsCreateWithoutOrganizationsInput, assetsUncheckedCreateWithoutOrganizationsInput>
  }

  export type assetsCreateManyOrganizationsInputEnvelope = {
    data: assetsCreateManyOrganizationsInput | assetsCreateManyOrganizationsInput[]
    skipDuplicates?: boolean
  }

  export type devicesCreateWithoutOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
    assets?: assetsCreateNestedOneWithoutDevicesInput
  }

  export type devicesUncheckedCreateWithoutOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    asset_uuid?: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
  }

  export type devicesCreateOrConnectWithoutOrganizationsInput = {
    where: devicesWhereUniqueInput
    create: XOR<devicesCreateWithoutOrganizationsInput, devicesUncheckedCreateWithoutOrganizationsInput>
  }

  export type devicesCreateManyOrganizationsInputEnvelope = {
    data: devicesCreateManyOrganizationsInput | devicesCreateManyOrganizationsInput[]
    skipDuplicates?: boolean
  }

  export type organizationsCreateWithoutOther_organizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsCreateNestedManyWithoutOrganizationsInput
    devices?: devicesCreateNestedManyWithoutOrganizationsInput
    organizations?: organizationsCreateNestedOneWithoutOther_organizationsInput
  }

  export type organizationsUncheckedCreateWithoutOther_organizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    parent_org_id?: bigint | number | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsUncheckedCreateNestedManyWithoutOrganizationsInput
    devices?: devicesUncheckedCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsCreateOrConnectWithoutOther_organizationsInput = {
    where: organizationsWhereUniqueInput
    create: XOR<organizationsCreateWithoutOther_organizationsInput, organizationsUncheckedCreateWithoutOther_organizationsInput>
  }

  export type organizationsCreateWithoutOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsCreateNestedManyWithoutOrganizationsInput
    devices?: devicesCreateNestedManyWithoutOrganizationsInput
    other_organizations?: organizationsCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsUncheckedCreateWithoutOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
    assets?: assetsUncheckedCreateNestedManyWithoutOrganizationsInput
    devices?: devicesUncheckedCreateNestedManyWithoutOrganizationsInput
    other_organizations?: organizationsUncheckedCreateNestedManyWithoutOrganizationsInput
  }

  export type organizationsCreateOrConnectWithoutOrganizationsInput = {
    where: organizationsWhereUniqueInput
    create: XOR<organizationsCreateWithoutOrganizationsInput, organizationsUncheckedCreateWithoutOrganizationsInput>
  }

  export type organizationsCreateManyOrganizationsInputEnvelope = {
    data: organizationsCreateManyOrganizationsInput | organizationsCreateManyOrganizationsInput[]
    skipDuplicates?: boolean
  }

  export type assetsUpsertWithWhereUniqueWithoutOrganizationsInput = {
    where: assetsWhereUniqueInput
    update: XOR<assetsUpdateWithoutOrganizationsInput, assetsUncheckedUpdateWithoutOrganizationsInput>
    create: XOR<assetsCreateWithoutOrganizationsInput, assetsUncheckedCreateWithoutOrganizationsInput>
  }

  export type assetsUpdateWithWhereUniqueWithoutOrganizationsInput = {
    where: assetsWhereUniqueInput
    data: XOR<assetsUpdateWithoutOrganizationsInput, assetsUncheckedUpdateWithoutOrganizationsInput>
  }

  export type assetsUpdateManyWithWhereWithoutOrganizationsInput = {
    where: assetsScalarWhereInput
    data: XOR<assetsUpdateManyMutationInput, assetsUncheckedUpdateManyWithoutOrganizationsInput>
  }

  export type assetsScalarWhereInput = {
    AND?: assetsScalarWhereInput | assetsScalarWhereInput[]
    OR?: assetsScalarWhereInput[]
    NOT?: assetsScalarWhereInput | assetsScalarWhereInput[]
    id?: BigIntFilter<"assets"> | bigint | number
    uuid?: UuidNullableFilter<"assets"> | string | null
    organisation_uuid?: UuidFilter<"assets"> | string
    name?: StringFilter<"assets"> | string
    asset_type?: StringNullableFilter<"assets"> | string | null
    description?: StringNullableFilter<"assets"> | string | null
    created_at?: DateTimeFilter<"assets"> | Date | string
    updated_at?: DateTimeFilter<"assets"> | Date | string
  }

  export type devicesUpsertWithWhereUniqueWithoutOrganizationsInput = {
    where: devicesWhereUniqueInput
    update: XOR<devicesUpdateWithoutOrganizationsInput, devicesUncheckedUpdateWithoutOrganizationsInput>
    create: XOR<devicesCreateWithoutOrganizationsInput, devicesUncheckedCreateWithoutOrganizationsInput>
  }

  export type devicesUpdateWithWhereUniqueWithoutOrganizationsInput = {
    where: devicesWhereUniqueInput
    data: XOR<devicesUpdateWithoutOrganizationsInput, devicesUncheckedUpdateWithoutOrganizationsInput>
  }

  export type devicesUpdateManyWithWhereWithoutOrganizationsInput = {
    where: devicesScalarWhereInput
    data: XOR<devicesUpdateManyMutationInput, devicesUncheckedUpdateManyWithoutOrganizationsInput>
  }

  export type organizationsUpsertWithoutOther_organizationsInput = {
    update: XOR<organizationsUpdateWithoutOther_organizationsInput, organizationsUncheckedUpdateWithoutOther_organizationsInput>
    create: XOR<organizationsCreateWithoutOther_organizationsInput, organizationsUncheckedCreateWithoutOther_organizationsInput>
    where?: organizationsWhereInput
  }

  export type organizationsUpdateToOneWithWhereWithoutOther_organizationsInput = {
    where?: organizationsWhereInput
    data: XOR<organizationsUpdateWithoutOther_organizationsInput, organizationsUncheckedUpdateWithoutOther_organizationsInput>
  }

  export type organizationsUpdateWithoutOther_organizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUpdateManyWithoutOrganizationsNestedInput
    devices?: devicesUpdateManyWithoutOrganizationsNestedInput
    organizations?: organizationsUpdateOneWithoutOther_organizationsNestedInput
  }

  export type organizationsUncheckedUpdateWithoutOther_organizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    parent_org_id?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUncheckedUpdateManyWithoutOrganizationsNestedInput
    devices?: devicesUncheckedUpdateManyWithoutOrganizationsNestedInput
  }

  export type organizationsUpsertWithWhereUniqueWithoutOrganizationsInput = {
    where: organizationsWhereUniqueInput
    update: XOR<organizationsUpdateWithoutOrganizationsInput, organizationsUncheckedUpdateWithoutOrganizationsInput>
    create: XOR<organizationsCreateWithoutOrganizationsInput, organizationsUncheckedCreateWithoutOrganizationsInput>
  }

  export type organizationsUpdateWithWhereUniqueWithoutOrganizationsInput = {
    where: organizationsWhereUniqueInput
    data: XOR<organizationsUpdateWithoutOrganizationsInput, organizationsUncheckedUpdateWithoutOrganizationsInput>
  }

  export type organizationsUpdateManyWithWhereWithoutOrganizationsInput = {
    where: organizationsScalarWhereInput
    data: XOR<organizationsUpdateManyMutationInput, organizationsUncheckedUpdateManyWithoutOrganizationsInput>
  }

  export type organizationsScalarWhereInput = {
    AND?: organizationsScalarWhereInput | organizationsScalarWhereInput[]
    OR?: organizationsScalarWhereInput[]
    NOT?: organizationsScalarWhereInput | organizationsScalarWhereInput[]
    id?: BigIntFilter<"organizations"> | bigint | number
    uuid?: UuidNullableFilter<"organizations"> | string | null
    name?: StringFilter<"organizations"> | string
    description?: StringNullableFilter<"organizations"> | string | null
    parent_org_id?: BigIntNullableFilter<"organizations"> | bigint | number | null
    maps_api_key?: StringNullableFilter<"organizations"> | string | null
    can_inherit_key?: BoolNullableFilter<"organizations"> | boolean | null
    created_at?: DateTimeFilter<"organizations"> | Date | string
    updated_at?: DateTimeFilter<"organizations"> | Date | string
  }

  export type devicesCreateManyAssetsInput = {
    id?: bigint | number
    uuid?: string | null
    organisation_uuid?: string
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
  }

  export type devicesUpdateWithoutAssetsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    organizations?: organizationsUpdateOneRequiredWithoutDevicesNestedInput
  }

  export type devicesUncheckedUpdateWithoutAssetsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    organisation_uuid?: StringFieldUpdateOperationsInput | string
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type devicesUncheckedUpdateManyWithoutAssetsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    organisation_uuid?: StringFieldUpdateOperationsInput | string
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type assetsCreateManyOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    asset_type?: string | null
    description?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type devicesCreateManyOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    asset_uuid?: string | null
    external_id: string
    external_id_type: string
    protocol: string
    vendor?: string | null
    model?: string | null
    description?: string | null
    registered_at?: Date | string
    updated_at?: Date | string
  }

  export type organizationsCreateManyOrganizationsInput = {
    id?: bigint | number
    uuid?: string | null
    name: string
    description?: string | null
    maps_api_key?: string | null
    can_inherit_key?: boolean | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type assetsUpdateWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    devices?: devicesUpdateManyWithoutAssetsNestedInput
  }

  export type assetsUncheckedUpdateWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    devices?: devicesUncheckedUpdateManyWithoutAssetsNestedInput
  }

  export type assetsUncheckedUpdateManyWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    asset_type?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type devicesUpdateWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUpdateOneWithoutDevicesNestedInput
  }

  export type devicesUncheckedUpdateWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    asset_uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type devicesUncheckedUpdateManyWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    asset_uuid?: NullableStringFieldUpdateOperationsInput | string | null
    external_id?: StringFieldUpdateOperationsInput | string
    external_id_type?: StringFieldUpdateOperationsInput | string
    protocol?: StringFieldUpdateOperationsInput | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    registered_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type organizationsUpdateWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUpdateManyWithoutOrganizationsNestedInput
    devices?: devicesUpdateManyWithoutOrganizationsNestedInput
    other_organizations?: organizationsUpdateManyWithoutOrganizationsNestedInput
  }

  export type organizationsUncheckedUpdateWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    assets?: assetsUncheckedUpdateManyWithoutOrganizationsNestedInput
    devices?: devicesUncheckedUpdateManyWithoutOrganizationsNestedInput
    other_organizations?: organizationsUncheckedUpdateManyWithoutOrganizationsNestedInput
  }

  export type organizationsUncheckedUpdateManyWithoutOrganizationsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    uuid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    maps_api_key?: NullableStringFieldUpdateOperationsInput | string | null
    can_inherit_key?: NullableBoolFieldUpdateOperationsInput | boolean | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}