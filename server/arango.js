/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

// @flow

import arangochair from 'arangochair';
import { Database } from 'arangojs';
import { Collection} from "./arango-collection";
import { Auth } from "./auth";
import type { QConfig, QDbConfig } from './config'
import { ensureProtocol } from './config';
import type { QLog } from './logs';
import QLogs from './logs'
import type { QType } from './db-types';
import { Account, Block, BlockSignatures, Message, Transaction } from './resolvers-generated';
import { Tracer } from "opentracing";
import { wrap } from "./utils";


export default class Arango {
    config: QConfig;
    log: QLog;
    serverAddress: string;
    databaseName: string;
    db: Database;

    auth: Auth;
    tracer: Tracer;

    transactions: Collection;
    messages: Collection;
    accounts: Collection;
    blocks: Collection;
    blocks_signatures: Collection;

    collections: Collection[];
    collectionsByName: Map<string, Collection>;

    listener: any;

    constructor(
        config: QConfig,
        logs: QLogs,
        auth: Auth,
        tracer: Tracer,
    ) {
        this.config = config;
        this.log = logs.create('db');
        this.auth = auth;
        this.serverAddress = config.database.server;
        this.databaseName = config.database.name;
        this.tracer = tracer;

        const createDb = (config: QDbConfig): Database => {
            const db = new Database({
                url: `${ensureProtocol(config.server, 'http')}`,
                agentOptions: {
                    maxSockets: config.maxSockets,
                },
            });
            db.useDatabase(config.name);
            if (config.auth) {
                const authParts = config.auth.split(':');
                db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
            }
            return db;
        };

        this.db = createDb(config.database);
        const slowDb = createDb(config.slowDatabase);

        this.collections = [];
        this.collectionsByName = new Map();

        const addCollection = (name: string, docType: QType) => {
            const collection = new Collection(
                name,
                docType,
                logs,
                this.auth,
                this.tracer,
                this.db,
                slowDb,
            );
            this.collections.push(collection);
            this.collectionsByName.set(name, collection);
            return collection;
        };

        this.transactions = addCollection('transactions', Transaction);
        this.messages = addCollection('messages', Message);
        this.accounts = addCollection('accounts', Account);
        this.blocks = addCollection('blocks', Block);
        this.blocks_signatures = addCollection('blocks_signatures', BlockSignatures);
    }

    start() {
        const listenerUrl = `${ensureProtocol(this.serverAddress, 'http')}/${this.databaseName}`;
        this.listener = new arangochair(listenerUrl);

        if (this.config.database.auth) {
            const userPassword = Buffer.from(this.config.database.auth).toString('base64');
            this.listener.req.opts.headers['Authorization'] = `Basic ${userPassword}`;
        }

        this.collections.forEach(collection => {
            const name = collection.name;
            this.listener.subscribe({ collection: name });
            this.listener.on(name, (docJson, type) => {
                if (type === 'insert/update') {
                    this.onDocumentInsertOrUpdate(name, JSON.parse(docJson));
                }
            });
        });
        this.listener.start();
        this.log.debug('LISTEN', listenerUrl);
        this.listener.on('error', (err) => {
            this.log.error('FAILED', 'LISTEN', `${err}`);
            setTimeout(() => this.listener.start(), this.config.listener.restartTimeout);
        });
    }

    onDocumentInsertOrUpdate(name: string, doc: any) {
        const collection: (Collection | typeof undefined) = this.collectionsByName.get(name);
        if (collection) {
            collection.onDocumentInsertOrUpdate(doc);
        }
    }


    async query(query: any, bindVars: any) {
        return wrap(this.log, 'QUERY', { query, bindVars }, async () => {
            const cursor = await this.db.query({ query, bindVars });
            return cursor.all();
        });
    }
}
