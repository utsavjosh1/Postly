
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
 * Model Profile
 * 
 */
export type Profile = $Result.DefaultSelection<Prisma.$ProfilePayload>
/**
 * Model OAuthConnection
 * 
 */
export type OAuthConnection = $Result.DefaultSelection<Prisma.$OAuthConnectionPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Profiles
 * const profiles = await prisma.profile.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
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
   * // Fetch zero or more Profiles
   * const profiles = await prisma.profile.findMany()
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
   * `prisma.profile`: Exposes CRUD operations for the **Profile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Profiles
    * const profiles = await prisma.profile.findMany()
    * ```
    */
  get profile(): Prisma.ProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.oAuthConnection`: Exposes CRUD operations for the **OAuthConnection** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OAuthConnections
    * const oAuthConnections = await prisma.oAuthConnection.findMany()
    * ```
    */
  get oAuthConnection(): Prisma.OAuthConnectionDelegate<ExtArgs, ClientOptions>;
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
   * Prisma Client JS version: 6.13.0
   * Query Engine version: 361e86d0ea4987e9f53a565309b3eed797a6bcbd
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
    Profile: 'Profile',
    OAuthConnection: 'OAuthConnection'
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
      modelProps: "profile" | "oAuthConnection"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Profile: {
        payload: Prisma.$ProfilePayload<ExtArgs>
        fields: Prisma.ProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          findFirst: {
            args: Prisma.ProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          findMany: {
            args: Prisma.ProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          create: {
            args: Prisma.ProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          createMany: {
            args: Prisma.ProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          delete: {
            args: Prisma.ProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          update: {
            args: Prisma.ProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          deleteMany: {
            args: Prisma.ProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          upsert: {
            args: Prisma.ProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          aggregate: {
            args: Prisma.ProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProfile>
          }
          groupBy: {
            args: Prisma.ProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProfileCountArgs<ExtArgs>
            result: $Utils.Optional<ProfileCountAggregateOutputType> | number
          }
        }
      }
      OAuthConnection: {
        payload: Prisma.$OAuthConnectionPayload<ExtArgs>
        fields: Prisma.OAuthConnectionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OAuthConnectionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OAuthConnectionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>
          }
          findFirst: {
            args: Prisma.OAuthConnectionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OAuthConnectionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>
          }
          findMany: {
            args: Prisma.OAuthConnectionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>[]
          }
          create: {
            args: Prisma.OAuthConnectionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>
          }
          createMany: {
            args: Prisma.OAuthConnectionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OAuthConnectionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>[]
          }
          delete: {
            args: Prisma.OAuthConnectionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>
          }
          update: {
            args: Prisma.OAuthConnectionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>
          }
          deleteMany: {
            args: Prisma.OAuthConnectionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OAuthConnectionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OAuthConnectionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>[]
          }
          upsert: {
            args: Prisma.OAuthConnectionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OAuthConnectionPayload>
          }
          aggregate: {
            args: Prisma.OAuthConnectionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOAuthConnection>
          }
          groupBy: {
            args: Prisma.OAuthConnectionGroupByArgs<ExtArgs>
            result: $Utils.Optional<OAuthConnectionGroupByOutputType>[]
          }
          count: {
            args: Prisma.OAuthConnectionCountArgs<ExtArgs>
            result: $Utils.Optional<OAuthConnectionCountAggregateOutputType> | number
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
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
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
    profile?: ProfileOmit
    oAuthConnection?: OAuthConnectionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

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
   * Models
   */

  /**
   * Model Profile
   */

  export type AggregateProfile = {
    _count: ProfileCountAggregateOutputType | null
    _min: ProfileMinAggregateOutputType | null
    _max: ProfileMaxAggregateOutputType | null
  }

  export type ProfileMinAggregateOutputType = {
    id: string | null
    updated_at: Date | null
    username: string | null
    full_name: string | null
    avatar_url: string | null
    website: string | null
    email: string | null
    password_hash: string | null
    created_at: Date | null
  }

  export type ProfileMaxAggregateOutputType = {
    id: string | null
    updated_at: Date | null
    username: string | null
    full_name: string | null
    avatar_url: string | null
    website: string | null
    email: string | null
    password_hash: string | null
    created_at: Date | null
  }

  export type ProfileCountAggregateOutputType = {
    id: number
    updated_at: number
    username: number
    full_name: number
    avatar_url: number
    website: number
    email: number
    password_hash: number
    created_at: number
    _all: number
  }


  export type ProfileMinAggregateInputType = {
    id?: true
    updated_at?: true
    username?: true
    full_name?: true
    avatar_url?: true
    website?: true
    email?: true
    password_hash?: true
    created_at?: true
  }

  export type ProfileMaxAggregateInputType = {
    id?: true
    updated_at?: true
    username?: true
    full_name?: true
    avatar_url?: true
    website?: true
    email?: true
    password_hash?: true
    created_at?: true
  }

  export type ProfileCountAggregateInputType = {
    id?: true
    updated_at?: true
    username?: true
    full_name?: true
    avatar_url?: true
    website?: true
    email?: true
    password_hash?: true
    created_at?: true
    _all?: true
  }

  export type ProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Profile to aggregate.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Profiles
    **/
    _count?: true | ProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProfileMaxAggregateInputType
  }

  export type GetProfileAggregateType<T extends ProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProfile[P]>
      : GetScalarType<T[P], AggregateProfile[P]>
  }




  export type ProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProfileWhereInput
    orderBy?: ProfileOrderByWithAggregationInput | ProfileOrderByWithAggregationInput[]
    by: ProfileScalarFieldEnum[] | ProfileScalarFieldEnum
    having?: ProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProfileCountAggregateInputType | true
    _min?: ProfileMinAggregateInputType
    _max?: ProfileMaxAggregateInputType
  }

  export type ProfileGroupByOutputType = {
    id: string
    updated_at: Date | null
    username: string | null
    full_name: string | null
    avatar_url: string | null
    website: string | null
    email: string
    password_hash: string | null
    created_at: Date
    _count: ProfileCountAggregateOutputType | null
    _min: ProfileMinAggregateOutputType | null
    _max: ProfileMaxAggregateOutputType | null
  }

  type GetProfileGroupByPayload<T extends ProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProfileGroupByOutputType[P]>
            : GetScalarType<T[P], ProfileGroupByOutputType[P]>
        }
      >
    >


  export type ProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    updated_at?: boolean
    username?: boolean
    full_name?: boolean
    avatar_url?: boolean
    website?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    updated_at?: boolean
    username?: boolean
    full_name?: boolean
    avatar_url?: boolean
    website?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    updated_at?: boolean
    username?: boolean
    full_name?: boolean
    avatar_url?: boolean
    website?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectScalar = {
    id?: boolean
    updated_at?: boolean
    username?: boolean
    full_name?: boolean
    avatar_url?: boolean
    website?: boolean
    email?: boolean
    password_hash?: boolean
    created_at?: boolean
  }

  export type ProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "updated_at" | "username" | "full_name" | "avatar_url" | "website" | "email" | "password_hash" | "created_at", ExtArgs["result"]["profile"]>

  export type $ProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Profile"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      updated_at: Date | null
      username: string | null
      full_name: string | null
      avatar_url: string | null
      website: string | null
      email: string
      password_hash: string | null
      created_at: Date
    }, ExtArgs["result"]["profile"]>
    composites: {}
  }

  type ProfileGetPayload<S extends boolean | null | undefined | ProfileDefaultArgs> = $Result.GetResult<Prisma.$ProfilePayload, S>

  type ProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProfileCountAggregateInputType | true
    }

  export interface ProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Profile'], meta: { name: 'Profile' } }
    /**
     * Find zero or one Profile that matches the filter.
     * @param {ProfileFindUniqueArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProfileFindUniqueArgs>(args: SelectSubset<T, ProfileFindUniqueArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Profile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProfileFindUniqueOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, ProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Profile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProfileFindFirstArgs>(args?: SelectSubset<T, ProfileFindFirstArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Profile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, ProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Profiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Profiles
     * const profiles = await prisma.profile.findMany()
     * 
     * // Get first 10 Profiles
     * const profiles = await prisma.profile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const profileWithIdOnly = await prisma.profile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProfileFindManyArgs>(args?: SelectSubset<T, ProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Profile.
     * @param {ProfileCreateArgs} args - Arguments to create a Profile.
     * @example
     * // Create one Profile
     * const Profile = await prisma.profile.create({
     *   data: {
     *     // ... data to create a Profile
     *   }
     * })
     * 
     */
    create<T extends ProfileCreateArgs>(args: SelectSubset<T, ProfileCreateArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Profiles.
     * @param {ProfileCreateManyArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProfileCreateManyArgs>(args?: SelectSubset<T, ProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Profiles and returns the data saved in the database.
     * @param {ProfileCreateManyAndReturnArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Profiles and only return the `id`
     * const profileWithIdOnly = await prisma.profile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, ProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Profile.
     * @param {ProfileDeleteArgs} args - Arguments to delete one Profile.
     * @example
     * // Delete one Profile
     * const Profile = await prisma.profile.delete({
     *   where: {
     *     // ... filter to delete one Profile
     *   }
     * })
     * 
     */
    delete<T extends ProfileDeleteArgs>(args: SelectSubset<T, ProfileDeleteArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Profile.
     * @param {ProfileUpdateArgs} args - Arguments to update one Profile.
     * @example
     * // Update one Profile
     * const profile = await prisma.profile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProfileUpdateArgs>(args: SelectSubset<T, ProfileUpdateArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Profiles.
     * @param {ProfileDeleteManyArgs} args - Arguments to filter Profiles to delete.
     * @example
     * // Delete a few Profiles
     * const { count } = await prisma.profile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProfileDeleteManyArgs>(args?: SelectSubset<T, ProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProfileUpdateManyArgs>(args: SelectSubset<T, ProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Profiles and returns the data updated in the database.
     * @param {ProfileUpdateManyAndReturnArgs} args - Arguments to update many Profiles.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Profiles and only return the `id`
     * const profileWithIdOnly = await prisma.profile.updateManyAndReturn({
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
    updateManyAndReturn<T extends ProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, ProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Profile.
     * @param {ProfileUpsertArgs} args - Arguments to update or create a Profile.
     * @example
     * // Update or create a Profile
     * const profile = await prisma.profile.upsert({
     *   create: {
     *     // ... data to create a Profile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Profile we want to update
     *   }
     * })
     */
    upsert<T extends ProfileUpsertArgs>(args: SelectSubset<T, ProfileUpsertArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileCountArgs} args - Arguments to filter Profiles to count.
     * @example
     * // Count the number of Profiles
     * const count = await prisma.profile.count({
     *   where: {
     *     // ... the filter for the Profiles we want to count
     *   }
     * })
    **/
    count<T extends ProfileCountArgs>(
      args?: Subset<T, ProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ProfileAggregateArgs>(args: Subset<T, ProfileAggregateArgs>): Prisma.PrismaPromise<GetProfileAggregateType<T>>

    /**
     * Group by Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileGroupByArgs} args - Group by arguments.
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
      T extends ProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProfileGroupByArgs['orderBy'] }
        : { orderBy?: ProfileGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Profile model
   */
  readonly fields: ProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Profile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Profile model
   */
  interface ProfileFieldRefs {
    readonly id: FieldRef<"Profile", 'String'>
    readonly updated_at: FieldRef<"Profile", 'DateTime'>
    readonly username: FieldRef<"Profile", 'String'>
    readonly full_name: FieldRef<"Profile", 'String'>
    readonly avatar_url: FieldRef<"Profile", 'String'>
    readonly website: FieldRef<"Profile", 'String'>
    readonly email: FieldRef<"Profile", 'String'>
    readonly password_hash: FieldRef<"Profile", 'String'>
    readonly created_at: FieldRef<"Profile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Profile findUnique
   */
  export type ProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile findUniqueOrThrow
   */
  export type ProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile findFirst
   */
  export type ProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
  }

  /**
   * Profile findFirstOrThrow
   */
  export type ProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
  }

  /**
   * Profile findMany
   */
  export type ProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Filter, which Profiles to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
  }

  /**
   * Profile create
   */
  export type ProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data needed to create a Profile.
     */
    data: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>
  }

  /**
   * Profile createMany
   */
  export type ProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Profile createManyAndReturn
   */
  export type ProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Profile update
   */
  export type ProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data needed to update a Profile.
     */
    data: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>
    /**
     * Choose, which Profile to update.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile updateMany
   */
  export type ProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to update.
     */
    limit?: number
  }

  /**
   * Profile updateManyAndReturn
   */
  export type ProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to update.
     */
    limit?: number
  }

  /**
   * Profile upsert
   */
  export type ProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The filter to search for the Profile to update in case it exists.
     */
    where: ProfileWhereUniqueInput
    /**
     * In case the Profile found by the `where` argument doesn't exist, create a new Profile with this data.
     */
    create: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>
    /**
     * In case the Profile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>
  }

  /**
   * Profile delete
   */
  export type ProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Filter which Profile to delete.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile deleteMany
   */
  export type ProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Profiles to delete
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to delete.
     */
    limit?: number
  }

  /**
   * Profile without action
   */
  export type ProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
  }


  /**
   * Model OAuthConnection
   */

  export type AggregateOAuthConnection = {
    _count: OAuthConnectionCountAggregateOutputType | null
    _min: OAuthConnectionMinAggregateOutputType | null
    _max: OAuthConnectionMaxAggregateOutputType | null
  }

  export type OAuthConnectionMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    provider: string | null
    provider_id: string | null
    access_token: string | null
    refresh_token: string | null
    expires_at: Date | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type OAuthConnectionMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    provider: string | null
    provider_id: string | null
    access_token: string | null
    refresh_token: string | null
    expires_at: Date | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type OAuthConnectionCountAggregateOutputType = {
    id: number
    user_id: number
    provider: number
    provider_id: number
    access_token: number
    refresh_token: number
    expires_at: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type OAuthConnectionMinAggregateInputType = {
    id?: true
    user_id?: true
    provider?: true
    provider_id?: true
    access_token?: true
    refresh_token?: true
    expires_at?: true
    created_at?: true
    updated_at?: true
  }

  export type OAuthConnectionMaxAggregateInputType = {
    id?: true
    user_id?: true
    provider?: true
    provider_id?: true
    access_token?: true
    refresh_token?: true
    expires_at?: true
    created_at?: true
    updated_at?: true
  }

  export type OAuthConnectionCountAggregateInputType = {
    id?: true
    user_id?: true
    provider?: true
    provider_id?: true
    access_token?: true
    refresh_token?: true
    expires_at?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type OAuthConnectionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OAuthConnection to aggregate.
     */
    where?: OAuthConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OAuthConnections to fetch.
     */
    orderBy?: OAuthConnectionOrderByWithRelationInput | OAuthConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OAuthConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OAuthConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OAuthConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OAuthConnections
    **/
    _count?: true | OAuthConnectionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OAuthConnectionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OAuthConnectionMaxAggregateInputType
  }

  export type GetOAuthConnectionAggregateType<T extends OAuthConnectionAggregateArgs> = {
        [P in keyof T & keyof AggregateOAuthConnection]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOAuthConnection[P]>
      : GetScalarType<T[P], AggregateOAuthConnection[P]>
  }




  export type OAuthConnectionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OAuthConnectionWhereInput
    orderBy?: OAuthConnectionOrderByWithAggregationInput | OAuthConnectionOrderByWithAggregationInput[]
    by: OAuthConnectionScalarFieldEnum[] | OAuthConnectionScalarFieldEnum
    having?: OAuthConnectionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OAuthConnectionCountAggregateInputType | true
    _min?: OAuthConnectionMinAggregateInputType
    _max?: OAuthConnectionMaxAggregateInputType
  }

  export type OAuthConnectionGroupByOutputType = {
    id: string
    user_id: string
    provider: string
    provider_id: string
    access_token: string | null
    refresh_token: string | null
    expires_at: Date | null
    created_at: Date
    updated_at: Date
    _count: OAuthConnectionCountAggregateOutputType | null
    _min: OAuthConnectionMinAggregateOutputType | null
    _max: OAuthConnectionMaxAggregateOutputType | null
  }

  type GetOAuthConnectionGroupByPayload<T extends OAuthConnectionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OAuthConnectionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OAuthConnectionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OAuthConnectionGroupByOutputType[P]>
            : GetScalarType<T[P], OAuthConnectionGroupByOutputType[P]>
        }
      >
    >


  export type OAuthConnectionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_id?: boolean
    access_token?: boolean
    refresh_token?: boolean
    expires_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["oAuthConnection"]>

  export type OAuthConnectionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_id?: boolean
    access_token?: boolean
    refresh_token?: boolean
    expires_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["oAuthConnection"]>

  export type OAuthConnectionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_id?: boolean
    access_token?: boolean
    refresh_token?: boolean
    expires_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["oAuthConnection"]>

  export type OAuthConnectionSelectScalar = {
    id?: boolean
    user_id?: boolean
    provider?: boolean
    provider_id?: boolean
    access_token?: boolean
    refresh_token?: boolean
    expires_at?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type OAuthConnectionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "provider" | "provider_id" | "access_token" | "refresh_token" | "expires_at" | "created_at" | "updated_at", ExtArgs["result"]["oAuthConnection"]>

  export type $OAuthConnectionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OAuthConnection"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      provider: string
      provider_id: string
      access_token: string | null
      refresh_token: string | null
      expires_at: Date | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["oAuthConnection"]>
    composites: {}
  }

  type OAuthConnectionGetPayload<S extends boolean | null | undefined | OAuthConnectionDefaultArgs> = $Result.GetResult<Prisma.$OAuthConnectionPayload, S>

  type OAuthConnectionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OAuthConnectionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OAuthConnectionCountAggregateInputType | true
    }

  export interface OAuthConnectionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OAuthConnection'], meta: { name: 'OAuthConnection' } }
    /**
     * Find zero or one OAuthConnection that matches the filter.
     * @param {OAuthConnectionFindUniqueArgs} args - Arguments to find a OAuthConnection
     * @example
     * // Get one OAuthConnection
     * const oAuthConnection = await prisma.oAuthConnection.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OAuthConnectionFindUniqueArgs>(args: SelectSubset<T, OAuthConnectionFindUniqueArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OAuthConnection that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OAuthConnectionFindUniqueOrThrowArgs} args - Arguments to find a OAuthConnection
     * @example
     * // Get one OAuthConnection
     * const oAuthConnection = await prisma.oAuthConnection.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OAuthConnectionFindUniqueOrThrowArgs>(args: SelectSubset<T, OAuthConnectionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OAuthConnection that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OAuthConnectionFindFirstArgs} args - Arguments to find a OAuthConnection
     * @example
     * // Get one OAuthConnection
     * const oAuthConnection = await prisma.oAuthConnection.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OAuthConnectionFindFirstArgs>(args?: SelectSubset<T, OAuthConnectionFindFirstArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OAuthConnection that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OAuthConnectionFindFirstOrThrowArgs} args - Arguments to find a OAuthConnection
     * @example
     * // Get one OAuthConnection
     * const oAuthConnection = await prisma.oAuthConnection.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OAuthConnectionFindFirstOrThrowArgs>(args?: SelectSubset<T, OAuthConnectionFindFirstOrThrowArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OAuthConnections that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OAuthConnectionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OAuthConnections
     * const oAuthConnections = await prisma.oAuthConnection.findMany()
     * 
     * // Get first 10 OAuthConnections
     * const oAuthConnections = await prisma.oAuthConnection.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const oAuthConnectionWithIdOnly = await prisma.oAuthConnection.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OAuthConnectionFindManyArgs>(args?: SelectSubset<T, OAuthConnectionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OAuthConnection.
     * @param {OAuthConnectionCreateArgs} args - Arguments to create a OAuthConnection.
     * @example
     * // Create one OAuthConnection
     * const OAuthConnection = await prisma.oAuthConnection.create({
     *   data: {
     *     // ... data to create a OAuthConnection
     *   }
     * })
     * 
     */
    create<T extends OAuthConnectionCreateArgs>(args: SelectSubset<T, OAuthConnectionCreateArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OAuthConnections.
     * @param {OAuthConnectionCreateManyArgs} args - Arguments to create many OAuthConnections.
     * @example
     * // Create many OAuthConnections
     * const oAuthConnection = await prisma.oAuthConnection.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OAuthConnectionCreateManyArgs>(args?: SelectSubset<T, OAuthConnectionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many OAuthConnections and returns the data saved in the database.
     * @param {OAuthConnectionCreateManyAndReturnArgs} args - Arguments to create many OAuthConnections.
     * @example
     * // Create many OAuthConnections
     * const oAuthConnection = await prisma.oAuthConnection.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many OAuthConnections and only return the `id`
     * const oAuthConnectionWithIdOnly = await prisma.oAuthConnection.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OAuthConnectionCreateManyAndReturnArgs>(args?: SelectSubset<T, OAuthConnectionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a OAuthConnection.
     * @param {OAuthConnectionDeleteArgs} args - Arguments to delete one OAuthConnection.
     * @example
     * // Delete one OAuthConnection
     * const OAuthConnection = await prisma.oAuthConnection.delete({
     *   where: {
     *     // ... filter to delete one OAuthConnection
     *   }
     * })
     * 
     */
    delete<T extends OAuthConnectionDeleteArgs>(args: SelectSubset<T, OAuthConnectionDeleteArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OAuthConnection.
     * @param {OAuthConnectionUpdateArgs} args - Arguments to update one OAuthConnection.
     * @example
     * // Update one OAuthConnection
     * const oAuthConnection = await prisma.oAuthConnection.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OAuthConnectionUpdateArgs>(args: SelectSubset<T, OAuthConnectionUpdateArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OAuthConnections.
     * @param {OAuthConnectionDeleteManyArgs} args - Arguments to filter OAuthConnections to delete.
     * @example
     * // Delete a few OAuthConnections
     * const { count } = await prisma.oAuthConnection.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OAuthConnectionDeleteManyArgs>(args?: SelectSubset<T, OAuthConnectionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OAuthConnections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OAuthConnectionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OAuthConnections
     * const oAuthConnection = await prisma.oAuthConnection.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OAuthConnectionUpdateManyArgs>(args: SelectSubset<T, OAuthConnectionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OAuthConnections and returns the data updated in the database.
     * @param {OAuthConnectionUpdateManyAndReturnArgs} args - Arguments to update many OAuthConnections.
     * @example
     * // Update many OAuthConnections
     * const oAuthConnection = await prisma.oAuthConnection.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more OAuthConnections and only return the `id`
     * const oAuthConnectionWithIdOnly = await prisma.oAuthConnection.updateManyAndReturn({
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
    updateManyAndReturn<T extends OAuthConnectionUpdateManyAndReturnArgs>(args: SelectSubset<T, OAuthConnectionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one OAuthConnection.
     * @param {OAuthConnectionUpsertArgs} args - Arguments to update or create a OAuthConnection.
     * @example
     * // Update or create a OAuthConnection
     * const oAuthConnection = await prisma.oAuthConnection.upsert({
     *   create: {
     *     // ... data to create a OAuthConnection
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OAuthConnection we want to update
     *   }
     * })
     */
    upsert<T extends OAuthConnectionUpsertArgs>(args: SelectSubset<T, OAuthConnectionUpsertArgs<ExtArgs>>): Prisma__OAuthConnectionClient<$Result.GetResult<Prisma.$OAuthConnectionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OAuthConnections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OAuthConnectionCountArgs} args - Arguments to filter OAuthConnections to count.
     * @example
     * // Count the number of OAuthConnections
     * const count = await prisma.oAuthConnection.count({
     *   where: {
     *     // ... the filter for the OAuthConnections we want to count
     *   }
     * })
    **/
    count<T extends OAuthConnectionCountArgs>(
      args?: Subset<T, OAuthConnectionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OAuthConnectionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OAuthConnection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OAuthConnectionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends OAuthConnectionAggregateArgs>(args: Subset<T, OAuthConnectionAggregateArgs>): Prisma.PrismaPromise<GetOAuthConnectionAggregateType<T>>

    /**
     * Group by OAuthConnection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OAuthConnectionGroupByArgs} args - Group by arguments.
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
      T extends OAuthConnectionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OAuthConnectionGroupByArgs['orderBy'] }
        : { orderBy?: OAuthConnectionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, OAuthConnectionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOAuthConnectionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OAuthConnection model
   */
  readonly fields: OAuthConnectionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OAuthConnection.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OAuthConnectionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the OAuthConnection model
   */
  interface OAuthConnectionFieldRefs {
    readonly id: FieldRef<"OAuthConnection", 'String'>
    readonly user_id: FieldRef<"OAuthConnection", 'String'>
    readonly provider: FieldRef<"OAuthConnection", 'String'>
    readonly provider_id: FieldRef<"OAuthConnection", 'String'>
    readonly access_token: FieldRef<"OAuthConnection", 'String'>
    readonly refresh_token: FieldRef<"OAuthConnection", 'String'>
    readonly expires_at: FieldRef<"OAuthConnection", 'DateTime'>
    readonly created_at: FieldRef<"OAuthConnection", 'DateTime'>
    readonly updated_at: FieldRef<"OAuthConnection", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * OAuthConnection findUnique
   */
  export type OAuthConnectionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * Filter, which OAuthConnection to fetch.
     */
    where: OAuthConnectionWhereUniqueInput
  }

  /**
   * OAuthConnection findUniqueOrThrow
   */
  export type OAuthConnectionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * Filter, which OAuthConnection to fetch.
     */
    where: OAuthConnectionWhereUniqueInput
  }

  /**
   * OAuthConnection findFirst
   */
  export type OAuthConnectionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * Filter, which OAuthConnection to fetch.
     */
    where?: OAuthConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OAuthConnections to fetch.
     */
    orderBy?: OAuthConnectionOrderByWithRelationInput | OAuthConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OAuthConnections.
     */
    cursor?: OAuthConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OAuthConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OAuthConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OAuthConnections.
     */
    distinct?: OAuthConnectionScalarFieldEnum | OAuthConnectionScalarFieldEnum[]
  }

  /**
   * OAuthConnection findFirstOrThrow
   */
  export type OAuthConnectionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * Filter, which OAuthConnection to fetch.
     */
    where?: OAuthConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OAuthConnections to fetch.
     */
    orderBy?: OAuthConnectionOrderByWithRelationInput | OAuthConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OAuthConnections.
     */
    cursor?: OAuthConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OAuthConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OAuthConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OAuthConnections.
     */
    distinct?: OAuthConnectionScalarFieldEnum | OAuthConnectionScalarFieldEnum[]
  }

  /**
   * OAuthConnection findMany
   */
  export type OAuthConnectionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * Filter, which OAuthConnections to fetch.
     */
    where?: OAuthConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OAuthConnections to fetch.
     */
    orderBy?: OAuthConnectionOrderByWithRelationInput | OAuthConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OAuthConnections.
     */
    cursor?: OAuthConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OAuthConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OAuthConnections.
     */
    skip?: number
    distinct?: OAuthConnectionScalarFieldEnum | OAuthConnectionScalarFieldEnum[]
  }

  /**
   * OAuthConnection create
   */
  export type OAuthConnectionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * The data needed to create a OAuthConnection.
     */
    data: XOR<OAuthConnectionCreateInput, OAuthConnectionUncheckedCreateInput>
  }

  /**
   * OAuthConnection createMany
   */
  export type OAuthConnectionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OAuthConnections.
     */
    data: OAuthConnectionCreateManyInput | OAuthConnectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OAuthConnection createManyAndReturn
   */
  export type OAuthConnectionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * The data used to create many OAuthConnections.
     */
    data: OAuthConnectionCreateManyInput | OAuthConnectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OAuthConnection update
   */
  export type OAuthConnectionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * The data needed to update a OAuthConnection.
     */
    data: XOR<OAuthConnectionUpdateInput, OAuthConnectionUncheckedUpdateInput>
    /**
     * Choose, which OAuthConnection to update.
     */
    where: OAuthConnectionWhereUniqueInput
  }

  /**
   * OAuthConnection updateMany
   */
  export type OAuthConnectionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OAuthConnections.
     */
    data: XOR<OAuthConnectionUpdateManyMutationInput, OAuthConnectionUncheckedUpdateManyInput>
    /**
     * Filter which OAuthConnections to update
     */
    where?: OAuthConnectionWhereInput
    /**
     * Limit how many OAuthConnections to update.
     */
    limit?: number
  }

  /**
   * OAuthConnection updateManyAndReturn
   */
  export type OAuthConnectionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * The data used to update OAuthConnections.
     */
    data: XOR<OAuthConnectionUpdateManyMutationInput, OAuthConnectionUncheckedUpdateManyInput>
    /**
     * Filter which OAuthConnections to update
     */
    where?: OAuthConnectionWhereInput
    /**
     * Limit how many OAuthConnections to update.
     */
    limit?: number
  }

  /**
   * OAuthConnection upsert
   */
  export type OAuthConnectionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * The filter to search for the OAuthConnection to update in case it exists.
     */
    where: OAuthConnectionWhereUniqueInput
    /**
     * In case the OAuthConnection found by the `where` argument doesn't exist, create a new OAuthConnection with this data.
     */
    create: XOR<OAuthConnectionCreateInput, OAuthConnectionUncheckedCreateInput>
    /**
     * In case the OAuthConnection was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OAuthConnectionUpdateInput, OAuthConnectionUncheckedUpdateInput>
  }

  /**
   * OAuthConnection delete
   */
  export type OAuthConnectionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
    /**
     * Filter which OAuthConnection to delete.
     */
    where: OAuthConnectionWhereUniqueInput
  }

  /**
   * OAuthConnection deleteMany
   */
  export type OAuthConnectionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OAuthConnections to delete
     */
    where?: OAuthConnectionWhereInput
    /**
     * Limit how many OAuthConnections to delete.
     */
    limit?: number
  }

  /**
   * OAuthConnection without action
   */
  export type OAuthConnectionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OAuthConnection
     */
    select?: OAuthConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OAuthConnection
     */
    omit?: OAuthConnectionOmit<ExtArgs> | null
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


  export const ProfileScalarFieldEnum: {
    id: 'id',
    updated_at: 'updated_at',
    username: 'username',
    full_name: 'full_name',
    avatar_url: 'avatar_url',
    website: 'website',
    email: 'email',
    password_hash: 'password_hash',
    created_at: 'created_at'
  };

  export type ProfileScalarFieldEnum = (typeof ProfileScalarFieldEnum)[keyof typeof ProfileScalarFieldEnum]


  export const OAuthConnectionScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    provider: 'provider',
    provider_id: 'provider_id',
    access_token: 'access_token',
    refresh_token: 'refresh_token',
    expires_at: 'expires_at',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type OAuthConnectionScalarFieldEnum = (typeof OAuthConnectionScalarFieldEnum)[keyof typeof OAuthConnectionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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


  /**
   * Field references
   */


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
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type ProfileWhereInput = {
    AND?: ProfileWhereInput | ProfileWhereInput[]
    OR?: ProfileWhereInput[]
    NOT?: ProfileWhereInput | ProfileWhereInput[]
    id?: UuidFilter<"Profile"> | string
    updated_at?: DateTimeNullableFilter<"Profile"> | Date | string | null
    username?: StringNullableFilter<"Profile"> | string | null
    full_name?: StringNullableFilter<"Profile"> | string | null
    avatar_url?: StringNullableFilter<"Profile"> | string | null
    website?: StringNullableFilter<"Profile"> | string | null
    email?: StringFilter<"Profile"> | string
    password_hash?: StringNullableFilter<"Profile"> | string | null
    created_at?: DateTimeFilter<"Profile"> | Date | string
  }

  export type ProfileOrderByWithRelationInput = {
    id?: SortOrder
    updated_at?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    full_name?: SortOrderInput | SortOrder
    avatar_url?: SortOrderInput | SortOrder
    website?: SortOrderInput | SortOrder
    email?: SortOrder
    password_hash?: SortOrderInput | SortOrder
    created_at?: SortOrder
  }

  export type ProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    username?: string
    email?: string
    AND?: ProfileWhereInput | ProfileWhereInput[]
    OR?: ProfileWhereInput[]
    NOT?: ProfileWhereInput | ProfileWhereInput[]
    updated_at?: DateTimeNullableFilter<"Profile"> | Date | string | null
    full_name?: StringNullableFilter<"Profile"> | string | null
    avatar_url?: StringNullableFilter<"Profile"> | string | null
    website?: StringNullableFilter<"Profile"> | string | null
    password_hash?: StringNullableFilter<"Profile"> | string | null
    created_at?: DateTimeFilter<"Profile"> | Date | string
  }, "id" | "username" | "email">

  export type ProfileOrderByWithAggregationInput = {
    id?: SortOrder
    updated_at?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    full_name?: SortOrderInput | SortOrder
    avatar_url?: SortOrderInput | SortOrder
    website?: SortOrderInput | SortOrder
    email?: SortOrder
    password_hash?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: ProfileCountOrderByAggregateInput
    _max?: ProfileMaxOrderByAggregateInput
    _min?: ProfileMinOrderByAggregateInput
  }

  export type ProfileScalarWhereWithAggregatesInput = {
    AND?: ProfileScalarWhereWithAggregatesInput | ProfileScalarWhereWithAggregatesInput[]
    OR?: ProfileScalarWhereWithAggregatesInput[]
    NOT?: ProfileScalarWhereWithAggregatesInput | ProfileScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Profile"> | string
    updated_at?: DateTimeNullableWithAggregatesFilter<"Profile"> | Date | string | null
    username?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    full_name?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    avatar_url?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    website?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    email?: StringWithAggregatesFilter<"Profile"> | string
    password_hash?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"Profile"> | Date | string
  }

  export type OAuthConnectionWhereInput = {
    AND?: OAuthConnectionWhereInput | OAuthConnectionWhereInput[]
    OR?: OAuthConnectionWhereInput[]
    NOT?: OAuthConnectionWhereInput | OAuthConnectionWhereInput[]
    id?: UuidFilter<"OAuthConnection"> | string
    user_id?: UuidFilter<"OAuthConnection"> | string
    provider?: StringFilter<"OAuthConnection"> | string
    provider_id?: StringFilter<"OAuthConnection"> | string
    access_token?: StringNullableFilter<"OAuthConnection"> | string | null
    refresh_token?: StringNullableFilter<"OAuthConnection"> | string | null
    expires_at?: DateTimeNullableFilter<"OAuthConnection"> | Date | string | null
    created_at?: DateTimeFilter<"OAuthConnection"> | Date | string
    updated_at?: DateTimeFilter<"OAuthConnection"> | Date | string
  }

  export type OAuthConnectionOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_id?: SortOrder
    access_token?: SortOrderInput | SortOrder
    refresh_token?: SortOrderInput | SortOrder
    expires_at?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type OAuthConnectionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    provider_provider_id?: OAuthConnectionProviderProvider_idCompoundUniqueInput
    AND?: OAuthConnectionWhereInput | OAuthConnectionWhereInput[]
    OR?: OAuthConnectionWhereInput[]
    NOT?: OAuthConnectionWhereInput | OAuthConnectionWhereInput[]
    user_id?: UuidFilter<"OAuthConnection"> | string
    provider?: StringFilter<"OAuthConnection"> | string
    provider_id?: StringFilter<"OAuthConnection"> | string
    access_token?: StringNullableFilter<"OAuthConnection"> | string | null
    refresh_token?: StringNullableFilter<"OAuthConnection"> | string | null
    expires_at?: DateTimeNullableFilter<"OAuthConnection"> | Date | string | null
    created_at?: DateTimeFilter<"OAuthConnection"> | Date | string
    updated_at?: DateTimeFilter<"OAuthConnection"> | Date | string
  }, "id" | "provider_provider_id">

  export type OAuthConnectionOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_id?: SortOrder
    access_token?: SortOrderInput | SortOrder
    refresh_token?: SortOrderInput | SortOrder
    expires_at?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: OAuthConnectionCountOrderByAggregateInput
    _max?: OAuthConnectionMaxOrderByAggregateInput
    _min?: OAuthConnectionMinOrderByAggregateInput
  }

  export type OAuthConnectionScalarWhereWithAggregatesInput = {
    AND?: OAuthConnectionScalarWhereWithAggregatesInput | OAuthConnectionScalarWhereWithAggregatesInput[]
    OR?: OAuthConnectionScalarWhereWithAggregatesInput[]
    NOT?: OAuthConnectionScalarWhereWithAggregatesInput | OAuthConnectionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"OAuthConnection"> | string
    user_id?: UuidWithAggregatesFilter<"OAuthConnection"> | string
    provider?: StringWithAggregatesFilter<"OAuthConnection"> | string
    provider_id?: StringWithAggregatesFilter<"OAuthConnection"> | string
    access_token?: StringNullableWithAggregatesFilter<"OAuthConnection"> | string | null
    refresh_token?: StringNullableWithAggregatesFilter<"OAuthConnection"> | string | null
    expires_at?: DateTimeNullableWithAggregatesFilter<"OAuthConnection"> | Date | string | null
    created_at?: DateTimeWithAggregatesFilter<"OAuthConnection"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"OAuthConnection"> | Date | string
  }

  export type ProfileCreateInput = {
    id?: string
    updated_at?: Date | string | null
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    website?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
  }

  export type ProfileUncheckedCreateInput = {
    id?: string
    updated_at?: Date | string | null
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    website?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
  }

  export type ProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    full_name?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    website?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    full_name?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    website?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProfileCreateManyInput = {
    id?: string
    updated_at?: Date | string | null
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    website?: string | null
    email: string
    password_hash?: string | null
    created_at?: Date | string
  }

  export type ProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    full_name?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    website?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    full_name?: NullableStringFieldUpdateOperationsInput | string | null
    avatar_url?: NullableStringFieldUpdateOperationsInput | string | null
    website?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password_hash?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OAuthConnectionCreateInput = {
    id?: string
    user_id: string
    provider: string
    provider_id: string
    access_token?: string | null
    refresh_token?: string | null
    expires_at?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type OAuthConnectionUncheckedCreateInput = {
    id?: string
    user_id: string
    provider: string
    provider_id: string
    access_token?: string | null
    refresh_token?: string | null
    expires_at?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type OAuthConnectionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_id?: StringFieldUpdateOperationsInput | string
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OAuthConnectionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_id?: StringFieldUpdateOperationsInput | string
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OAuthConnectionCreateManyInput = {
    id?: string
    user_id: string
    provider: string
    provider_id: string
    access_token?: string | null
    refresh_token?: string | null
    expires_at?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type OAuthConnectionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_id?: StringFieldUpdateOperationsInput | string
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OAuthConnectionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    provider_id?: StringFieldUpdateOperationsInput | string
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProfileCountOrderByAggregateInput = {
    id?: SortOrder
    updated_at?: SortOrder
    username?: SortOrder
    full_name?: SortOrder
    avatar_url?: SortOrder
    website?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    created_at?: SortOrder
  }

  export type ProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    updated_at?: SortOrder
    username?: SortOrder
    full_name?: SortOrder
    avatar_url?: SortOrder
    website?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    created_at?: SortOrder
  }

  export type ProfileMinOrderByAggregateInput = {
    id?: SortOrder
    updated_at?: SortOrder
    username?: SortOrder
    full_name?: SortOrder
    avatar_url?: SortOrder
    website?: SortOrder
    email?: SortOrder
    password_hash?: SortOrder
    created_at?: SortOrder
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

  export type OAuthConnectionProviderProvider_idCompoundUniqueInput = {
    provider: string
    provider_id: string
  }

  export type OAuthConnectionCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_id?: SortOrder
    access_token?: SortOrder
    refresh_token?: SortOrder
    expires_at?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type OAuthConnectionMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_id?: SortOrder
    access_token?: SortOrder
    refresh_token?: SortOrder
    expires_at?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type OAuthConnectionMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    provider?: SortOrder
    provider_id?: SortOrder
    access_token?: SortOrder
    refresh_token?: SortOrder
    expires_at?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
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