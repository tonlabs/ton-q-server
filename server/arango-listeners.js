import { $$asyncIterator } from "iterall";
import type { AccessRights } from "./auth";
import type { QType } from "./db-types";
import type { FieldSelection } from "./utils";
import { RegistryMap, selectFields } from "./utils";

export class CollectionListener {
    collectionName: string;
    docType: QType;
    listeners: RegistryMap<CollectionListener>;
    id: ?number;
    filter: any;
    authFilter: ?((doc: any) => boolean);
    selection: FieldSelection[];
    startTime: number;

    constructor(
        collectionName: string,
        docType: QType,
        listeners: RegistryMap<CollectionListener>,
        accessRights: AccessRights,
        filter: any,
        selection: FieldSelection[]
    ) {
        this.collectionName = collectionName;
        this.docType = docType;
        this.listeners = listeners;
        this.authFilter = CollectionListener.getAuthFilter(collectionName, accessRights);
        this.filter = filter;
        this.selection = selection;
        this.id = listeners.add(this);
        this.startTime = Date.now();
    }

    static getAuthFilter(collectionName: string, accessRights: AccessRights): ?((doc: any) => boolean) {
        if (accessRights.restrictToAccounts.length === 0) {
            return null;
        }
        const accounts = new Set(accessRights.restrictToAccounts);
        switch (collectionName) {
        case 'accounts':
            return (doc) => accounts.has(doc._key);
        case 'transactions':
            return (doc) => accounts.has(doc.account_addr);
        case 'messages':
            return (doc) => accounts.has(doc.src) || accounts.has(doc.dst);
        default:
            return (_) => false;
        }
    }

    close() {
        const id = this.id;
        if (id !== null && id !== undefined) {
            this.id = null;
            this.listeners.remove(id);
        }
    }

    isFiltered(doc: any): boolean {
        if (this.authFilter && !this.authFilter(doc)) {
            return false;
        }
        return this.docType.test(null, doc, this.filter);
    }

    onDocumentInsertOrUpdate(doc: any) {
    }

    getEventCount(): number {
        return 0;
    }
}

export class WaitForListener extends CollectionListener {
    onInsertOrUpdate: (doc: any) => void;

    constructor(
        collectionName: string,
        docType: QType,
        listeners: RegistryMap<CollectionListener>,
        accessRights: AccessRights,
        filter: any,
        selection: FieldSelection[],
        onInsertOrUpdate: (doc: any) => void
    ) {
        super(collectionName, docType, listeners, accessRights, filter, selection);
        this.onInsertOrUpdate = onInsertOrUpdate;
    }

    onDocumentInsertOrUpdate(doc: any) {
        this.onInsertOrUpdate(doc);
    }
}

export class SubscriptionListener extends CollectionListener implements AsyncIterator<any> {
    eventCount: number;
    pullQueue: ((value: any) => void)[];
    pushQueue: any[];
    running: boolean;

    constructor(
        collectionName: string,
        docType: QType,
        listeners: RegistryMap<CollectionListener>,
        accessRights: AccessRights,
        filter: any,
        selection: FieldSelection[]
    ) {
        super(collectionName, docType, listeners, accessRights, filter, selection);

        this.eventCount = 0;
        this.pullQueue = [];
        this.pushQueue = [];
        this.running = true;
    }

    onDocumentInsertOrUpdate(doc: any) {
        if (!this.isQueueOverflow()) {
            this.pushValue({ [this.collectionName]: selectFields(doc, this.selection) });
        }
    }

    isQueueOverflow(): boolean {
        return this.getQueueSize() >= 10;
    }

    getEventCount(): number {
        return this.eventCount;
    }

    getQueueSize(): number {
        return this.pushQueue.length + this.pullQueue.length;
    }

    pushValue(value: any) {
        this.eventCount += 1;
        if (this.pullQueue.length !== 0) {
            this.pullQueue.shift()(this.running
                ? { value, done: false }
                : { value: undefined, done: true },
            );
        } else {
            this.pushQueue.push(value);
        }
    }

    async next(): Promise<any> {
        return new Promise((resolve) => {
            if (this.pushQueue.length !== 0) {
                resolve(this.running
                    ? { value: this.pushQueue.shift(), done: false }
                    : { value: undefined, done: true },
                );
            } else {
                this.pullQueue.push(resolve);
            }
        });
    }

    async return(): Promise<any> {
        this.close();
        await this.emptyQueue();
        return { value: undefined, done: true };
    }

    async throw(error?: any): Promise<any> {
        this.close();
        await this.emptyQueue();
        return Promise.reject(error);
    }

    //$FlowFixMe
    [$$asyncIterator]() {
        return this;
    }

    async emptyQueue() {
        if (this.running) {
            this.running = false;
            this.pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
            this.pullQueue = [];
            this.pushQueue = [];
        }
    }

}
