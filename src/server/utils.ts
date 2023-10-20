import type { QLog } from "./logs"
import fs from "fs"
import path from "path"
import { createHash } from "crypto"
import { $$asyncIterator } from "iterall"
import { ValidationError } from "apollo-server-express"

export function packageJson(): Record<string, unknown> {
    let testPath = path.resolve(__dirname)
    const packagePath = () => path.resolve(testPath, "package.json")
    while (testPath !== "" && !fs.existsSync(packagePath())) {
        testPath = path.dirname(testPath)
    }
    return JSON.parse(fs.readFileSync(packagePath(), "utf8"))
}

export function cleanError(
    error: Error & {
        ArangoError?: Error
        request?: unknown
        response?: unknown
    },
): Error {
    if (error.ArangoError !== undefined) {
        return error.ArangoError
    }
    delete error.request
    delete error.response
    return error
}

enum QErrorCode {
    MESSAGE_EXPIRED = 10001,
    QUERY_TERMINATED_ON_TIMEOUT = 10006,
    INVALID_CONFIG = 10007,
    INVALID_QUERY = 10008,
}

export class QError extends Error {
    source: string
    code: number
    data?: Record<string, unknown>

    constructor(code: number, message: string, data?: Record<string, unknown>) {
        super(message)
        this.source = "graphql"
        this.code = code
        if (data !== undefined) {
            this.data = data
        }
    }

    static messageExpired(id: string, expiredAt: number): Error {
        return QError.create(QErrorCode.MESSAGE_EXPIRED, "Message expired", {
            id,
            expiredAt,
            now: Date.now(),
        })
    }

    static queryTerminatedOnTimeout(): Error {
        return QError.create(
            QErrorCode.QUERY_TERMINATED_ON_TIMEOUT,
            "Query terminated on timeout",
            {
                now: Date.now(),
            },
        )
    }

    static create(
        code: number,
        message: string,
        data?: Record<string, unknown>,
    ): Error {
        return new QError(code, message, data)
    }

    static internalServerError() {
        return QError.create(500, "Internal Server Error")
    }

    static serviceUnavailable() {
        return QError.create(503, "Service Unavailable")
    }

    static invalidConfigValue(option: string, message: string) {
        return QError.create(
            QErrorCode.INVALID_CONFIG,
            `Invalid ${option}: ${message}`,
        )
    }

    static invalidConfig(message: string) {
        return QError.create(QErrorCode.INVALID_CONFIG, message)
    }

    static invalidQuery(message: string) {
        return new ValidationError(message)
    }
}

export function isSystemError(
    error: Error & {
        type?: string
        errno?: unknown
        syscall?: unknown
    },
): boolean {
    if (error.type === "system") {
        return true
    }
    return error.errno !== undefined && error.syscall !== undefined
}

export async function wrap<R>(
    log: QLog,
    op: string,
    args: unknown,
    fetch: () => Promise<R>,
) {
    try {
        return await fetch()
    } catch (err: any) {
        let cleaned = cleanError(err)
        log.error(`${op}_FAILED`, args, err)
        if (isSystemError(err)) {
            cleaned = QError.internalServerError()
        }
        throw cleaned
    }
}

export function toJSON(value: unknown): string {
    try {
        return JSON.stringify(toLog(value))
    } catch (error) {
        return JSON.stringify(`${value}`)
    }
}

export function toLog(value: unknown, objs?: unknown[]): unknown {
    switch (typeof value) {
        case "undefined":
        case "boolean":
        case "number":
        case "bigint":
        case "symbol":
            return value
        case "string":
            if (value.length > 80) {
                return `${value.substr(0, 50)}… [${value.length}]`
            }
            return value
        case "function":
            return undefined
        default: {
            if (value === null) {
                return value
            }
            if (objs !== undefined && objs.includes(value)) {
                return undefined
            }
            const newObjs = objs !== undefined ? [...objs, value] : [value]
            if (Array.isArray(value)) {
                return value.map(x => toLog(x, newObjs))
            }
            const valueToLog: Record<string, unknown> = {}
            Object.entries(value as Record<string, unknown>).forEach(
                ([n, v]) => {
                    const propertyValueToLog = toLog(v, newObjs)
                    if (propertyValueToLog !== undefined) {
                        valueToLog[n] = propertyValueToLog
                    }
                },
            )
            return valueToLog
        }
    }
}

export function hash(...keys: string[]): string {
    return createHash("md5").update(keys.join("")).digest("hex")
}

export function httpUrl(address: string): string {
    const http = "http"
    return `${http}://${address}`
}

export function isObject(test: unknown): boolean {
    return (
        test !== null &&
        test !== undefined &&
        typeof test === "object" &&
        !Array.isArray(test)
    )
}

export function assignDeep(
    target: Record<string, unknown>,
    source: Record<string, unknown> | undefined,
) {
    if (!source) {
        return
    }
    for (const [name, value] of Object.entries(source)) {
        if (isObject(value) && isObject(target[name])) {
            assignDeep(
                target[name] as Record<string, unknown>,
                value as Record<string, unknown>,
            )
        } else {
            target[name] = value
        }
    }
}

export function cloneDeep(
    source: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
    if (source === undefined) {
        return undefined
    }
    const clone: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(source)) {
        if (isObject(value)) {
            clone[name] = cloneDeep(value as Record<string, unknown>)
        } else {
            clone[name] = value
        }
    }
    return clone
}

export function cloneValue(
    source: any,
    convert?: (path: string, value: unknown) => unknown,
    path?: string,
): any {
    if (Array.isArray(source)) {
        return source.map(x => cloneValue(x, convert, path))
    }
    if (isObject(source)) {
        const clone: Record<string, unknown> = {}
        for (const [name, value] of Object.entries(source)) {
            const fieldPath = path && path !== "" ? `${path}.${name}` : name
            clone[name] = cloneValue(value, convert, fieldPath)
        }
        return clone
    }
    return convert ? convert(path ?? "", source) : source
}

export function required<T>(value: T | undefined): T {
    if (value !== undefined) {
        return value
    }
    throw QError.serviceUnavailable()
}

export function setHasIntersections<T>(a: Set<T>, b: Set<T>): boolean {
    const [c, d] = a.size < b.size ? [a, b] : [b, a]
    for (const x of c) {
        if (d.has(x)) {
            return true
        }
    }
    return false
}

export function arraysAreEqual<T>(a: Array<T>, b: Array<T>): boolean {
    if (a.length != b.length) {
        return false
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] != b[i]) {
            return false
        }
    }
    return true
}

export function toU64String(value: number | bigint): string {
    const hex = value.toString(16)
    return `${(hex.length - 1).toString(16)}${hex}`
}

export type RequestWithHeaders = {
    headers?: {
        [name: string]: string
    }
}

export type GraphQLConnection = {
    context?: {
        [name: string]: string
    }
}

function tryExtractHeader(
    req: RequestWithHeaders | undefined,
    connection: GraphQLConnection | undefined,
    name: string,
): string | undefined {
    return req?.headers?.[name] ?? connection?.context?.[name]
}

export function extractHeader(
    req: RequestWithHeaders | undefined,
    connection: GraphQLConnection | undefined,
    name: string,
    def: string,
): string {
    return (
        tryExtractHeader(req, connection, name) ??
        tryExtractHeader(req, connection, name.toLowerCase()) ??
        def
    )
}

export class QAsyncIterator<T> implements AsyncIterator<T> {
    private isClosed = false
    private closedWith = new Deferred<IteratorResult<T>>()
    constructor(
        private upstream: AsyncIterator<T>,
        private onNext?: (next: T) => void | Promise<void>,
        private onClose?: () => void,
    ) { }

    public async next() {
        if (this.isClosed) {
            return { value: undefined, done: true as const }
        }
        const next = (await safeRace([
            this.upstream.next(),
            this.closedWith.promise,
        ])) as IteratorResult<T, any>

        if (!next.done && this.onNext) {
            await this.onNext(next.value)
        }
        return next
    }

    public async return() {
        this.closedWith.resolve({ value: undefined, done: true as const })
        this.onClose?.()
        this.isClosed = true
        return (
            this.upstream.return?.() ??
            Promise.resolve({ value: undefined, done: true as const })
        )
    }

    public throw(error: any) {
        this.closedWith.reject(error)
        this.onClose?.()
        this.isClosed = true
        return this.upstream.throw?.() ?? Promise.reject(error)
    }

    public [$$asyncIterator]() {
        return this
    }
}

export class Deferred<T> {
    promise: Promise<T>
    // Resolve and reject are reentrant:
    // https://262.ecma-international.org/6.0/#sec-promise-resolve-functions
    resolve: (value: T | PromiseLike<T>) => void
    // https://262.ecma-international.org/6.0/#sec-promise-reject-functions
    reject: (reason?: any) => void
    constructor() {
        let cResolve = undefined
        let cReject = undefined
        this.promise = new Promise((resolve, reject) => {
            cResolve = resolve
            cReject = reject
        })
        if (!cResolve || !cReject) {
            // Expected to be impossible:
            // https://262.ecma-international.org/6.0/#sec-promise-constructor
            throw new Error("Invalid Promise constructor")
        }
        this.resolve = cResolve
        this.reject = cReject
    }
}

function isPrimitive(value: any) {
    return (
        value === null ||
        (typeof value !== "object" && typeof value !== "function")
    )
}
/*
 * This code was copied from https://github.com/digitalloggers/race-as-promised
 */
const wm = new WeakMap()
export function safeRace(contenders: any): Promise<unknown> {
    let deferred: {
        resolve: (value: unknown) => void
        reject: (reason?: any) => void
    }
    const result = new Promise((resolve, reject) => {
        deferred = { resolve, reject }
        for (const contender of contenders) {
            if (isPrimitive(contender)) {
                // If the contender is a primitive, attempting to use it as a key in the
                // weakmap would throw an error. Luckily, it is safe to call
                // `Promise.resolve(contender).then` on a primitive value multiple times
                // because the promise fulfills immediately.
                Promise.resolve(contender).then(resolve, reject)
                continue
            }

            let record = wm.get(contender)
            if (record === undefined) {
                record = { deferreds: new Set([deferred]), settled: false }
                wm.set(contender, record)
                // This call to `then` happens once for the lifetime of the value.
                Promise.resolve(contender).then(
                    value => {
                        for (const { resolve } of record.deferreds) {
                            resolve(value)
                        }

                        record.deferreds.clear()
                        record.settled = true
                    },
                    err => {
                        for (const { reject } of record.deferreds) {
                            reject(err)
                        }

                        record.deferreds.clear()
                        record.settled = true
                    },
                )
            } else if (record.settled) {
                // If the value has settled, it is safe to call
                // `Promise.resolve(contender).then` on it.
                Promise.resolve(contender).then(resolve, reject)
            } else {
                record.deferreds.add(deferred)
            }
        }
    })

    // The finally callback executes when any value settles, preventing any of
    // the unresolved values from retaining a reference to the resolved value.
    return result.finally(() => {
        for (const contender of contenders) {
            if (!isPrimitive(contender)) {
                const record = wm.get(contender)
                record.deferreds.delete(deferred)
            }
        }
    })
}
