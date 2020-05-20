"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.Collection = void 0;

var _arangojs = require("arangojs");

var _opentracing = require("opentracing");

var _aggregations = require("./aggregations");

var _arangoListeners = require("./arango-listeners");

var _auth = require("./auth");

var _config = require("./config");

var _dbTypes = require("./db-types");

var _logs = _interopRequireDefault(require("./logs"));

var _slowDetector = require("./slow-detector");

var _tracer = require("./tracer");

var _utils = require("./utils");

var _events = _interopRequireDefault(require("events"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
const INFO_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

function checkUsedAccessKey(usedAccessKey, accessKey, context) {
  if (!accessKey) {
    return usedAccessKey;
  }

  if (usedAccessKey && accessKey !== usedAccessKey) {
    context.multipleAccessKeysDetected = true;
    throw _utils.QError.multipleAccessKeys();
  }

  return accessKey;
}

async function requireGrantedAccess(context, args) {
  const accessKey = context.accessKey || args.accessKey;
  context.usedAccessKey = checkUsedAccessKey(context.usedAccessKey, accessKey, context);
  return context.auth.requireGrantedAccess(accessKey);
}

function mamAccessRequired(context, args) {
  const accessKey = args.accessKey;
  context.usedMamAccessKey = checkUsedAccessKey(context.usedMamAccessKey, accessKey, context);

  if (!accessKey || !context.config.mamAccessKeys.has(accessKey)) {
    throw _auth.Auth.unauthorizedError();
  }
}

const accessGranted = {
  granted: true,
  restrictToAccounts: []
};

class Collection {
  constructor(name, docType, logs, auth, tracer, stats, db, slowDb, isTests) {
    this.name = name;
    this.docType = docType;
    this.info = _config.BLOCKCHAIN_DB.collections[name];
    this.infoRefreshTime = Date.now();
    this.log = logs.create(name);
    this.auth = auth;
    this.tracer = tracer;
    this.db = db;
    this.slowDb = slowDb;
    this.isTests = isTests;
    this.waitForCount = 0;
    this.subscriptionCount = 0;
    this.statDoc = new _tracer.StatsCounter(stats, _config.STATS.doc.count, [`collection:${name}`]);
    this.statQuery = new _tracer.StatsCounter(stats, _config.STATS.query.count, [`collection:${name}`]);
    this.statQueryTime = new _tracer.StatsTiming(stats, _config.STATS.query.time, [`collection:${name}`]);
    this.statQueryActive = new _tracer.StatsGauge(stats, _config.STATS.query.active, [`collection:${name}`]);
    this.statQueryFailed = new _tracer.StatsCounter(stats, _config.STATS.query.failed, [`collection:${name}`]);
    this.statQuerySlow = new _tracer.StatsCounter(stats, _config.STATS.query.slow, [`collection:${name}`]);
    this.statWaitForActive = new _tracer.StatsGauge(stats, _config.STATS.waitFor.active, [`collection:${name}`]);
    this.statSubscriptionActive = new _tracer.StatsGauge(stats, _config.STATS.subscription.active, [`collection:${name}`]);
    this.docInsertOrUpdate = new _events.default();
    this.docInsertOrUpdate.setMaxListeners(0);
    this.queryStats = new Map();
    this.maxQueueSize = 0;
  } // Subscriptions


  onDocumentInsertOrUpdate(doc) {
    this.statDoc.increment();
    this.docInsertOrUpdate.emit('doc', doc);
  }

  subscriptionResolver() {
    return {
      subscribe: async (_, args, context, info) => {
        const accessRights = await requireGrantedAccess(context, args);
        const subscription = new _arangoListeners.DocSubscription(this.name, this.docType, accessRights, args.filter || {}, (0, _dbTypes.parseSelectionSet)(info.operation.selectionSet, this.name));

        const eventListener = doc => {
          subscription.pushDocument(doc);
        };

        this.docInsertOrUpdate.on('doc', eventListener);
        this.subscriptionCount += 1;

        subscription.onClose = () => {
          this.docInsertOrUpdate.removeListener('doc', eventListener);
          this.subscriptionCount = Math.max(0, this.subscriptionCount - 1);
        };

        return subscription;
      }
    };
  } // Queries


  getAdditionalCondition(accessRights, params) {
    const accounts = accessRights.restrictToAccounts;

    if (accounts.length === 0) {
      return '';
    }

    const condition = accounts.length === 1 ? `== @${params.add(accounts[0])}` : `IN [${accounts.map(x => `@${params.add(x)}`).join(',')}]`;

    switch (this.name) {
      case 'accounts':
        return `doc._key ${condition}`;

      case 'transactions':
        return `doc.account_addr ${condition}`;

      case 'messages':
        return `(doc.src ${condition}) OR (doc.dst ${condition})`;

      default:
        return '';
    }
  }

  buildConditionQL(filter, params, accessRights) {
    const primaryCondition = Object.keys(filter).length > 0 ? this.docType.ql(params, 'doc', filter) : '';
    const additionalCondition = this.getAdditionalCondition(accessRights, params);

    if (primaryCondition === 'false' || additionalCondition === 'false') {
      return null;
    }

    return primaryCondition && additionalCondition ? `(${primaryCondition}) AND (${additionalCondition})` : primaryCondition || additionalCondition;
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _dbTypes.QParams();
    const condition = this.buildConditionQL(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const filterSection = condition ? `FILTER ${condition}` : '';
    const selection = selectionInfo.selections ? (0, _dbTypes.parseSelectionSet)(selectionInfo, this.name) : selectionInfo;
    const orderBy = args.orderBy || [];
    const limit = args.limit || 50;
    const timeout = Number(args.timeout) || 0;
    const orderByText = orderBy.map(field => {
      const direction = field.direction && field.direction.toLowerCase() === 'desc' ? ' DESC' : '';
      return `doc.${field.path.replace(/\bid\b/gi, '_key')}${direction}`;
    }).join(', ');
    const sortSection = orderByText !== '' ? `SORT ${orderByText}` : '';
    const limitText = Math.min(limit, 50);
    const limitSection = `LIMIT ${limitText}`;
    const text = `
            FOR doc IN ${this.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN doc`;
    return {
      filter,
      selection,
      orderBy,
      limit,
      timeout,
      operationId: args.operationId || null,
      text,
      params: params.values,
      accessRights
    };
  }

  async isFastQuery(text, filter, orderBy) {
    await this.checkRefreshInfo();
    let statKey = text;

    if (orderBy && orderBy.length > 0) {
      statKey = `${statKey}${orderBy.map(x => `${x.path} ${x.direction}`).join(' ')}`;
    }

    const existingStat = this.queryStats.get(statKey);

    if (existingStat !== undefined) {
      return existingStat.isFast;
    }

    const stat = {
      isFast: (0, _slowDetector.isFastQuery)(this.info, this.docType, filter, orderBy || [], console)
    };
    this.queryStats.set(statKey, stat);
    return stat.isFast;
  }

  queryResolver() {
    return async (parent, args, context, info) => (0, _utils.wrap)(this.log, 'QUERY', args, async () => {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();

      try {
        const accessRights = await requireGrantedAccess(context, args);
        const q = this.createDatabaseQuery(args, info.operation.selectionSet, accessRights);

        if (!q) {
          this.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);
          return [];
        }

        let isFast = await this.isFastQuery(q.text, q.filter, q.orderBy);

        if (!isFast) {
          this.statQuerySlow.increment();
        }

        const traceParams = {
          filter: q.filter,
          selection: (0, _dbTypes.selectionToString)(q.selection)
        };

        if (q.orderBy.length > 0) {
          traceParams.orderBy = q.orderBy;
        }

        if (q.limit !== 50) {
          traceParams.limit = q.limit;
        }

        if (q.timeout > 0) {
          traceParams.timeout = q.timeout;
        }

        const start = Date.now();
        const result = q.timeout > 0 ? await this.queryWaitFor(q, isFast, traceParams, context.parentSpan) : await this.query(q.text, q.params, isFast, traceParams, context.parentSpan);
        this.log.debug('QUERY', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return result;
      } catch (error) {
        this.statQueryFailed.increment();
        throw error;
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  }

  async query(text, params, isFast, traceParams, parentSpan) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.query`, async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      return this.queryDatabase(text, params, isFast);
    }, parentSpan);
  }

  async queryDatabase(text, params, isFast) {
    const db = isFast ? this.db : this.slowDb;
    const cursor = await db.query(text, params);
    return cursor.all();
  }

  async queryWaitFor(q, isFast, traceParams, parentSpan) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.waitFor`, async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      let waitFor = null;
      let forceTimerId = null;
      let resolvedBy = null;

      try {
        const onQuery = new Promise((resolve, reject) => {
          const check = () => {
            this.queryDatabase(q.text, q.params, isFast).then(docs => {
              if (!resolvedBy) {
                if (docs.length > 0) {
                  forceTimerId = null;
                  resolvedBy = 'query';
                  resolve(docs);
                } else {
                  forceTimerId = setTimeout(check, 5000);
                }
              }
            }, reject);
          };

          check();
        });
        const onChangesFeed = new Promise(resolve => {
          const authFilter = _arangoListeners.DocUpsertHandler.getAuthFilter(this.name, q.accessRights);

          waitFor = doc => {
            if (authFilter && !authFilter(doc)) {
              return;
            }

            if (this.docType.test(null, doc, q.filter)) {
              if (!resolvedBy) {
                resolvedBy = 'listener';
                resolve([doc]);
              }
            }
          };

          this.waitForCount += 1;
          this.docInsertOrUpdate.on('doc', waitFor);
          this.statWaitForActive.increment();
        });
        const onTimeout = new Promise(resolve => {
          setTimeout(() => {
            if (!resolvedBy) {
              resolvedBy = 'timeout';
              resolve([]);
            }
          }, q.timeout);
        });
        const result = await Promise.race([onQuery, onChangesFeed, onTimeout]);
        span.setTag('resolved', resolvedBy);
        return result;
      } finally {
        if (waitFor !== null && waitFor !== undefined) {
          this.waitForCount = Math.max(0, this.waitForCount - 1);
          this.docInsertOrUpdate.removeListener('doc', waitFor);
          waitFor = null;
          this.statWaitForActive.decrement();
        }

        if (forceTimerId !== null) {
          clearTimeout(forceTimerId);
          forceTimerId = null;
        }
      }
    }, parentSpan);
  } //--------------------------------------------------------- Aggregates


  createAggregationQuery(filter, fields, accessRights) {
    const params = new _dbTypes.QParams();
    const condition = this.buildConditionQL(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const query = _aggregations.AggregationHelperFactory.createQuery(this.name, condition || '', fields);

    return {
      text: query.text,
      params: params.values,
      helpers: query.helpers
    };
  }

  async isFastAggregationQuery(text, filter, helpers) {
    for (const h of helpers) {
      const c = h.context;

      if (c.fn === _aggregations.AggregationFn.COUNT) {
        if (!(await this.isFastQuery(text, filter))) {
          return false;
        }
      } else if (c.fn === _aggregations.AggregationFn.MIN || c.fn === _aggregations.AggregationFn.MAX) {
        let path = c.field.path;

        if (path.startsWith('doc.')) {
          path = path.substr('doc.'.length);
        }

        if (!(await this.isFastQuery(text, filter, [{
          path,
          direction: 'ASC'
        }]))) {
          return false;
        }
      }
    }

    return true;
  }

  aggregationResolver() {
    return async (parent, args, context) => (0, _utils.wrap)(this.log, 'AGGREGATE', args, async () => {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();

      try {
        const accessRights = await requireGrantedAccess(context, args);
        const filter = args.filter || {};
        const fields = Array.isArray(args.fields) && args.fields.length > 0 ? args.fields : [{
          field: '',
          fn: _aggregations.AggregationFn.COUNT
        }];
        const q = this.createAggregationQuery(filter, fields, accessRights);

        if (!q) {
          this.log.debug('AGGREGATE', args, 0, 'SKIPPED', context.remoteAddress);
          return [];
        }

        const isFast = await this.isFastAggregationQuery(q.text, filter, q.helpers);
        const start = Date.now();
        const result = await this.query(q.text, q.params, isFast, {
          filter: args.filter,
          aggregate: args.fields
        }, context.parentSpan);
        this.log.debug('AGGREGATE', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return _aggregations.AggregationHelperFactory.convertResults(result[0], q.helpers);
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  } //--------------------------------------------------------- Internals


  dbCollection() {
    return this.db.collection(this.name);
  }

  async checkRefreshInfo() {
    if (this.isTests) {
      return;
    }

    if (Date.now() < this.infoRefreshTime) {
      return;
    }

    this.infoRefreshTime = Date.now() + INFO_REFRESH_INTERVAL;
    const indexes = (await this.dbCollection().indexes()).map(x => ({
      fields: x.fields
    }));

    const sameIndexes = (aIndexes, bIndexes) => {
      const aRest = new Set(aIndexes.map(_dbTypes.indexToString));

      for (const bIndex of bIndexes) {
        const bIndexString = (0, _dbTypes.indexToString)(bIndex);

        if (aRest.has(bIndexString)) {
          aRest.delete(bIndexString);
        } else {
          return false;
        }
      }

      return aRest.size === 0;
    };

    if (!sameIndexes(indexes, this.info.indexes)) {
      this.log.debug('RELOAD_INDEXES', indexes);
      this.info.indexes = indexes;
      this.queryStats.clear();
    }
  }

  async waitForDoc(fieldValue, fieldPath, args) {
    if (!fieldValue) {
      return Promise.resolve(null);
    }

    const queryParams = fieldPath.endsWith('[*]') ? {
      filter: {
        [fieldPath.slice(0, -3)]: {
          any: {
            eq: fieldValue
          }
        }
      },
      text: `FOR doc IN ${this.name} FILTER @v IN doc.${fieldPath} RETURN doc`,
      params: {
        v: fieldValue
      }
    } : {
      filter: {
        id: {
          eq: fieldValue
        }
      },
      text: `FOR doc IN ${this.name} FILTER doc.${fieldPath} == @v RETURN doc`,
      params: {
        v: fieldValue
      }
    };
    const timeout = args.timeout === 0 ? 0 : args.timeout || 40000;

    if (timeout === 0) {
      const docs = await this.queryDatabase(queryParams.text, queryParams.params, true);
      return docs[0];
    }

    const docs = await this.queryWaitFor({
      filter: queryParams.filter,
      selection: [],
      orderBy: [],
      limit: 1,
      timeout,
      operationId: null,
      text: queryParams.text,
      params: queryParams.params,
      accessRights: accessGranted
    }, true, null, null);
    return docs[0];
  }

  async waitForDocs(fieldValues, fieldPath, args) {
    if (!fieldValues || fieldValues.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(fieldValues.map(value => this.waitForDoc(value, fieldPath, args)));
  }

  finishOperations(operationIds) {
    const toClose = []; // TODO: Implement listener cancellation based on operationId
    // for (const listener of this.listeners.items.values()) {
    //     if (listener.operationId && operationIds.has(listener.operationId)) {
    //         toClose.push(listener);
    //     }
    // }
    // toClose.forEach(x => x.close());

    return toClose.length;
  }

}

exports.Collection = Collection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJJTkZPX1JFRlJFU0hfSU5URVJWQUwiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIkNvbGxlY3Rpb24iLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJkb2NUeXBlIiwibG9ncyIsInRyYWNlciIsInN0YXRzIiwiZGIiLCJzbG93RGIiLCJpc1Rlc3RzIiwiaW5mbyIsIkJMT0NLQ0hBSU5fREIiLCJjb2xsZWN0aW9ucyIsImluZm9SZWZyZXNoVGltZSIsIkRhdGUiLCJub3ciLCJsb2ciLCJjcmVhdGUiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJhY2Nlc3NSaWdodHMiLCJEb2NTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50Iiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZENvbmRpdGlvblFMIiwicHJpbWFyeUNvbmRpdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsImFkZGl0aW9uYWxDb25kaXRpb24iLCJjcmVhdGVEYXRhYmFzZVF1ZXJ5Iiwic2VsZWN0aW9uSW5mbyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwic2VsZWN0aW9uIiwic2VsZWN0aW9ucyIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJOdW1iZXIiLCJvcmRlckJ5VGV4dCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwibWluIiwibGltaXRTZWN0aW9uIiwidGV4dCIsIm9wZXJhdGlvbklkIiwidmFsdWVzIiwiaXNGYXN0UXVlcnkiLCJjaGVja1JlZnJlc2hJbmZvIiwic3RhdEtleSIsImV4aXN0aW5nU3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsInN0YXQiLCJjb25zb2xlIiwic2V0IiwicXVlcnlSZXNvbHZlciIsInBhcmVudCIsInN0YXJ0IiwicSIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsInRyYWNlUGFyYW1zIiwicmVzdWx0IiwicXVlcnlXYWl0Rm9yIiwicGFyZW50U3BhbiIsImVycm9yIiwicmVwb3J0IiwiZGVjcmVtZW50IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFRhZyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIkRvY1Vwc2VydEhhbmRsZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiZmllbGRzIiwiQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IiwiY3JlYXRlUXVlcnkiLCJoZWxwZXJzIiwiaXNGYXN0QWdncmVnYXRpb25RdWVyeSIsImgiLCJjIiwiZm4iLCJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJzdGFydHNXaXRoIiwic3Vic3RyIiwiYWdncmVnYXRpb25SZXNvbHZlciIsIkFycmF5IiwiaXNBcnJheSIsImFnZ3JlZ2F0ZSIsImNvbnZlcnRSZXN1bHRzIiwiZGJDb2xsZWN0aW9uIiwiY29sbGVjdGlvbiIsImluZGV4ZXMiLCJzYW1lSW5kZXhlcyIsImFJbmRleGVzIiwiYkluZGV4ZXMiLCJhUmVzdCIsIlNldCIsImluZGV4VG9TdHJpbmciLCJiSW5kZXgiLCJiSW5kZXhTdHJpbmciLCJkZWxldGUiLCJzaXplIiwiY2xlYXIiLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlv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V0FBVyxDQUFDaEksTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUMxQyxhQUFPb0UsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEVBQWhCLENBQVA7QUFDSDs7QUFDRCxXQUFPRCxPQUFPLENBQUNKLEdBQVIsQ0FBWWdFLFdBQVcsQ0FBQzdILEdBQVosQ0FBZ0I4SCxLQUFLLElBQUksS0FBS1osVUFBTCxDQUFnQlksS0FBaEIsRUFBdUJWLFNBQXZCLEVBQWtDdk0sSUFBbEMsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRURrTixFQUFBQSxnQkFBZ0IsQ0FBQ0MsWUFBRCxFQUFvQztBQUNoRCxVQUFNQyxPQUFPLEdBQUcsRUFBaEIsQ0FEZ0QsQ0FFaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsV0FBT0EsT0FBTyxDQUFDcEksTUFBZjtBQUNIOztBQXBqQm1CIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gXCJ0b24tY2xpZW50LWpzL3R5cGVzXCI7XG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tIFwiLi9hZ2dyZWdhdGlvbnNcIjtcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tIFwiLi9hZ2dyZWdhdGlvbnNcIjtcbmltcG9ydCB7IERvY1Vwc2VydEhhbmRsZXIsIERvY1N1YnNjcmlwdGlvbiB9IGZyb20gXCIuL2FyYW5nby1saXN0ZW5lcnNcIjtcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IEJMT0NLQ0hBSU5fREIsIFNUQVRTIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBDb2xsZWN0aW9uSW5mbywgSW5kZXhJbmZvLCBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlUXVlcnksIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHsgaW5kZXhUb1N0cmluZywgcGFyc2VTZWxlY3Rpb25TZXQsIFFQYXJhbXMsIHNlbGVjdGlvblRvU3RyaW5nIH0gZnJvbSBcIi4vZGItdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgeyBpc0Zhc3RRdWVyeSB9IGZyb20gJy4vc2xvdy1kZXRlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gJy4vdHJhY2VyJztcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tIFwiLi90cmFjZXJcIjtcbmltcG9ydCB7IFFFcnJvciwgd3JhcCB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5cbmNvbnN0IElORk9fUkVGUkVTSF9JTlRFUlZBTCA9IDYwICogNjAgKiAxMDAwOyAvLyA2MCBtaW51dGVzXG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVE9OQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkcz86IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG4gICAgaW5mbzogQ29sbGVjdGlvbkluZm87XG4gICAgaW5mb1JlZnJlc2hUaW1lOiBudW1iZXI7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5VGltZTogU3RhdHNUaW1pbmc7XG4gICAgc3RhdFF1ZXJ5RmFpbGVkOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5U2xvdzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuICAgIGlzVGVzdHM6IGJvb2xlYW47XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZG9jVHlwZTogUVR5cGUsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBhdXRoOiBBdXRoLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgc3RhdHM6IElTdGF0cyxcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICAgICBzbG93RGI6IERhdGFiYXNlLFxuICAgICAgICBpc1Rlc3RzOiBib29sZWFuLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuICAgICAgICB0aGlzLmluZm8gPSBCTE9DS0NIQUlOX0RCLmNvbGxlY3Rpb25zW25hbWVdO1xuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG4gICAgICAgIHRoaXMuaXNUZXN0cyA9IGlzVGVzdHM7XG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuZmFpbGVkLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuc2xvdywgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgRG9jU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRDb25kaXRpb25RTChcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RRdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXVxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNoZWNrUmVmcmVzaEluZm8oKTtcbiAgICAgICAgbGV0IHN0YXRLZXkgPSB0ZXh0O1xuICAgICAgICBpZiAob3JkZXJCeSAmJiBvcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHN0YXRLZXkgPSBgJHtzdGF0S2V5fSR7b3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9ICR7eC5kaXJlY3Rpb259YCkuam9pbignICcpfWA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmdTdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldChzdGF0S2V5KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nU3RhdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdTdGF0LmlzRmFzdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeSh0aGlzLmluZm8sIHRoaXMuZG9jVHlwZSwgZmlsdGVyLCBvcmRlckJ5IHx8IFtdLCBjb25zb2xlKSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldChzdGF0S2V5LCBzdGF0KTtcbiAgICAgICAgcmV0dXJuIHN0YXQuaXNGYXN0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIGluZm86IGFueSxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zhc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3BhbilcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZC5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlEYXRhYmFzZSh0ZXh0LCBwYXJhbXMsIGlzRmFzdCk7XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5RGF0YWJhc2UodGV4dDogc3RyaW5nLCBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LCBpc0Zhc3Q6IGJvb2xlYW4pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkYiA9IGlzRmFzdCA/IHRoaXMuZGIgOiB0aGlzLnNsb3dEYjtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkodGV4dCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3F1ZXJ5JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gRG9jVXBzZXJ0SGFuZGxlci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAndGltZW91dCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFnZ3JlZ2F0ZXNcblxuXG4gICAgY3JlYXRlQWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIGZpZWxkczogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/e1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRDb25kaXRpb25RTChmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFt7IHBhdGgsIGRpcmVjdGlvbjogJ0FTQycgfV0sXG4gICAgICAgICAgICAgICAgKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBhZ2dyZWdhdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBBZ2dyZWdhdGlvbkFyZ3MsXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ0FHR1JFR0FURScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IEFycmF5LmlzQXJyYXkoYXJncy5maWVsZHMpICYmIGFyZ3MuZmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhcmdzLmZpZWxkc1xuICAgICAgICAgICAgICAgICAgICA6IFt7IGZpZWxkOiAnJywgZm46IEFnZ3JlZ2F0aW9uRm4uQ09VTlQgfV07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGZpbHRlciwgZmllbGRzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnQUdHUkVHQVRFJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0QWdncmVnYXRpb25RdWVyeShxLnRleHQsIGZpbHRlciwgcS5oZWxwZXJzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBhcmdzLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlOiBhcmdzLmZpZWxkcyxcbiAgICAgICAgICAgICAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY29udmVydFJlc3VsdHMocmVzdWx0WzBdLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyBjaGVja1JlZnJlc2hJbmZvKCkge1xuICAgICAgICBpZiAodGhpcy5pc1Rlc3RzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERhdGUubm93KCkgPCB0aGlzLmluZm9SZWZyZXNoVGltZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5mb1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKSArIElORk9fUkVGUkVTSF9JTlRFUlZBTDtcbiAgICAgICAgY29uc3QgaW5kZXhlcyA9IChhd2FpdCB0aGlzLmRiQ29sbGVjdGlvbigpLmluZGV4ZXMoKSlcbiAgICAgICAgICAgIC5tYXAoeCA9PiAoeyBmaWVsZHM6IHguZmllbGRzIH0pKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogSW5kZXhJbmZvW10sIGJJbmRleGVzOiBJbmRleEluZm9bXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgY29uc3QgYVJlc3QgPSBuZXcgU2V0KGFJbmRleGVzLm1hcChpbmRleFRvU3RyaW5nKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGJJbmRleCBvZiBiSW5kZXhlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJJbmRleFN0cmluZyA9IGluZGV4VG9TdHJpbmcoYkluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAoYVJlc3QuaGFzKGJJbmRleFN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgYVJlc3QuZGVsZXRlKGJJbmRleFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhUmVzdC5zaXplID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoIXNhbWVJbmRleGVzKGluZGV4ZXMsIHRoaXMuaW5mby5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgaW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZm8uaW5kZXhlcyA9IGluZGV4ZXM7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeURhdGFiYXNlKHF1ZXJ5UGFyYW1zLnRleHQsIHF1ZXJ5UGFyYW1zLnBhcmFtcywgdHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcih7XG4gICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbjogW10sXG4gICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICB9LCB0cnVlLCBudWxsLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoXG4gICAgICAgIGZpZWxkVmFsdWVzOiBzdHJpbmdbXSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlcyB8fCBmaWVsZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChmaWVsZFZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53YWl0Rm9yRG9jKHZhbHVlLCBmaWVsZFBhdGgsIGFyZ3MpKSk7XG4gICAgfVxuXG4gICAgZmluaXNoT3BlcmF0aW9ucyhvcGVyYXRpb25JZHM6IFNldDxzdHJpbmc+KTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgbGlzdGVuZXIgY2FuY2VsbGF0aW9uIGJhc2VkIG9uIG9wZXJhdGlvbklkXG4gICAgICAgIC8vIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xuICAgICAgICAvLyAgICAgICAgIHRvQ2xvc2UucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gdG9DbG9zZS5mb3JFYWNoKHggPT4geC5jbG9zZSgpKTtcbiAgICAgICAgcmV0dXJuIHRvQ2xvc2UubGVuZ3RoO1xuICAgIH1cblxufVxuXG4iXX0=