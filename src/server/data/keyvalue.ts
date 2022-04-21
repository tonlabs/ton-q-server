import { $$asyncIterator } from "iterall"

export interface KVProvider {
    get<T>(key: string): Promise<T | null | undefined>

    subscribe<T>(
        key: string,
        handler: (
            data: T | undefined,
            error: Error | undefined,
        ) => Promise<void>,
    ): Promise<string>

    unsubscribe(handle: string): Promise<void>
}

export const emptyKVProvider: KVProvider = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async get<T>(_key: string): Promise<T | null | undefined> {
        return undefined
    },

    subscribe<T>(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _key: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _handler: (
            data: T | undefined,
            error: Error | undefined,
        ) => Promise<void>,
    ): Promise<string> {
        return Promise.resolve("")
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unsubscribe(_handle: string): Promise<void> {
        return Promise.resolve()
    },
}

export type ValuesWithDelays<T> = {
    values: T[]
    lengths: {
        delay: number
        length: number
    }[]
}

export function parseValuesWithDelays<T>(
    source: (T | number)[],
): ValuesWithDelays<T> {
    const values = []
    const lengths = []
    let delay = 0

    for (const item of source) {
        if (typeof item === "number") {
            delay = item
        } else {
            if (delay > 0) {
                lengths.push({
                    delay,
                    length: values.length,
                })
                delay = 0
            }
            values.push(item)
        }
    }
    lengths.push({
        delay,
        length: values.length,
    })
    return {
        values,
        lengths,
    }
}

// export function mockKVProvider<T>(source: {
//     [key: string]: ValuesWithDelays
// }): KVProvider {
//     const overriddenValues = new Map<string, T[]>()
//     return {
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         async get<T>(key: string): Promise<T[] | null | undefined> {
//             const overridden = overriddenValues.get(key)
//             if (overridden) {
//                 return overridden
//             }
//             return source[key]?.values
//         },
//
//         subscribe<T>(
//             // eslint-disable-next-line @typescript-eslint/no-unused-vars
//             _key: string,
//             // eslint-disable-next-line @typescript-eslint/no-unused-vars
//             _handler: (
//                 data: T | undefined,
//                 error: Error | undefined,
//             ) => Promise<void>,
//         ): Promise<string> {
//             return Promise.resolve("")
//         },
//
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         unsubscribe(_handle: string): Promise<void> {
//             return Promise.resolve()
//         },
//     }
// }

export class KVIterator<T> implements AsyncIterator<T> {
    pullQueue: ((result: IteratorResult<T>) => void)[]
    pushQueue: T[]
    running: boolean
    onClose: (() => void) | null

    constructor() {
        this.pullQueue = []
        this.pushQueue = []
        this.running = true
        this.onClose = null
    }

    push(value: T) {
        if (!this.isQueueOverflow()) {
            this.internalPush(value)
        }
    }

    isQueueOverflow(): boolean {
        return this.getQueueSize() >= 10
    }

    getQueueSize(): number {
        return this.pushQueue.length + this.pullQueue.length
    }

    internalPush(item: T) {
        if (this.pullQueue.length !== 0) {
            this.pullQueue.shift()?.(
                !this.running
                    ? {
                          value: item,
                          done: true,
                      }
                    : {
                          value: item,
                          done: false,
                      },
            )
        } else {
            this.pushQueue.push(item)
        }
    }

    async next(): Promise<IteratorResult<T>> {
        return new Promise(resolve => {
            const dequeued = this.pushQueue.shift()
            if (dequeued !== undefined) {
                const item: IteratorResult<T> = this.running
                    ? {
                          value: dequeued,
                          done: false,
                      }
                    : {
                          value: undefined,
                          done: true,
                      }
                resolve(item)
            } else {
                this.pullQueue.push(resolve)
            }
        })
    }

    async return(): Promise<IteratorResult<T>> {
        if (this.onClose) {
            this.onClose()
        }
        await this.emptyQueue()
        return {
            value: undefined,
            done: true,
        }
    }

    async throw(error?: Error): Promise<IteratorResult<T>> {
        if (this.onClose) {
            this.onClose()
        }
        await this.emptyQueue()
        return Promise.reject(error)
    }

    [$$asyncIterator]() {
        return this
    }

    async emptyQueue() {
        if (this.running) {
            this.running = false
            this.pullQueue.forEach(resolve =>
                resolve({
                    value: undefined,
                    done: true,
                }),
            )
            this.pullQueue = []
            this.pushQueue = []
        }
    }

    static async startOnProviderWithDataAndChangesKeys<T>(
        provider: KVProvider,
        dataKey: string,
        changesKey: string,
    ): Promise<KVIterator<T>> {
        const iterator = new KVIterator<T>()
        let pushedCount = 0

        async function pushNext() {
            const data = await provider.get<T[]>(dataKey)
            if (data !== null && data !== undefined) {
                while (pushedCount < data.length) {
                    iterator.push(data[pushedCount])
                    pushedCount += 1
                }
            }
        }

        await pushNext()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await provider.subscribe(changesKey, async (_data, error) => {
            if (!error) {
                await pushNext()
            }
        })
        return iterator
    }
}
