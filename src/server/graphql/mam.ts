import {
    QDataCollection,
    mamAccessRequired,
} from "../data/collection";
import type { GraphQLRequestContextEx } from "./context";
import { packageJson } from "../utils";

const { version } = packageJson();

type Info = {
    version: string,
}

type ListenerStat = {
    filter: string,
    selection: string,
    queueSize: number,
    eventCount: number,
    secondsActive: number,
}

type CollectionStat = {
    name: string,
    subscriptionCount: number,
    waitForCount: number,
    maxQueueSize: number,
    subscriptions: ListenerStat[],
    waitFor: ListenerStat[],
}

type Stat = {
    waitForCount: number,
    subscriptionCount: number,
    collections: CollectionStat[]
}

type CollectionSummary = {
    name: string,
    count: number,
    indexes: string[],
}

// Query

function info(): Info {
    return {
        version,
    };
}

function stat(_parent: any, args: any, context: GraphQLRequestContextEx): Stat {
    mamAccessRequired(context, args);
    const data = context.data;
    let totalWaitForCount = 0;
    let totalSubscriptionCount = 0;
    const collections = data.collections.map((collection: QDataCollection) => {
        totalWaitForCount += collection.waitForCount;
        totalSubscriptionCount += collection.subscriptionCount;
        return {
            name: collection.name,
            subscriptionCount: collection.subscriptionCount,
            waitForCount: collection.waitForCount,
            maxQueueSize: collection.maxQueueSize,
            subscriptions: [],
            waitFor: [],
        };
    });
    return {
        waitForCount: totalWaitForCount,
        subscriptionCount: totalSubscriptionCount,
        collections,
    };
}

async function getCollections(_parent: any, args: any, context: GraphQLRequestContextEx): Promise<CollectionSummary[]> {
    mamAccessRequired(context, args);
    const data = context.data;
    const collections: CollectionSummary[] = [];
    for (const collection of data.collections) {
        const indexes: string[] = [];
        for (const index of await collection.getIndexes()) {
            indexes.push(index.fields.join(", "));
        }
        collections.push({
            name: collection.name,
            count: 0,
            indexes,
        });
    }
    return collections;
}

async function dropCachedDbInfo(_parent: any, args: any, context: GraphQLRequestContextEx): Promise<boolean> {
    mamAccessRequired(context, args);
    await context.data.dropCachedDbInfo();
    return true;
}

async function updateConfig(_parent: any, args: any, context: GraphQLRequestContextEx): Promise<boolean> {
    mamAccessRequired(context, args);
    const config = args.config;
    if (config) {
        const { debugLatency } = config;
        if (debugLatency !== undefined) {
            context.data.updateDebugLatency(debugLatency);
        }
    }
    return true;
}

// Mutation

export const mam = {
    Query: {
        info,
        getCollections,
        stat,
    },
    Mutation: {
        dropCachedDbInfo,
        updateConfig,
    },
};
