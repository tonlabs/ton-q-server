"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _apolloServerExpress = require("apollo-server-express");

var _subscriptionsTransportWs = require("subscriptions-transport-ws");

var _tonClientNodeJs = require("ton-client-node-js");

var _arango = _interopRequireDefault(require("./arango"));

var _qRpcServer = require("./q-rpc-server");

var _resolversGenerated = require("./resolvers-generated");

var _resolversCustom = require("./resolvers-custom");

var _resolversMam = require("./resolvers-mam");

var _logs = _interopRequireDefault(require("./logs"));

var _tracer = require("./tracer");

var _opentracing = require("opentracing");

var _auth = require("./auth");

var _utils = require("./utils");

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
const v8 = require('v8');

class MemStats {
  constructor(stats) {
    this.stats = stats;
  }

  report() {
    v8.getHeapSpaceStatistics().forEach(space => {
      const spaceName = space.space_name.replace('space_', '').replace('_space', '');

      const gauge = (metric, value) => {
        this.stats.gauge(`heap.space.${spaceName}.${metric}`, value);
      };

      gauge('physical_size', space.physical_space_size);
      gauge('available_size', space.space_available_size);
      gauge('size', space.space_size);
      gauge('used_size', space.space_used_size);
    });
  }

  start() {//TODO: this.checkMemReport();
    //TODO: this.checkGc();
  }

  checkMemReport() {
    setTimeout(() => {
      this.report();
      this.checkMemReport();
    }, 5000);
  }

  checkGc() {
    setTimeout(() => {
      global.gc();
      this.checkGc();
    }, 60000);
  }

}

class TONQServer {
  constructor(options) {
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('server');
    this.shared = new Map();
    this.tracer = _tracer.QTracer.create(options.config);
    this.stats = _tracer.QStats.create(options.config.statsd.server, options.config.statsd.tags);
    this.auth = new _auth.Auth(options.config);
    this.endPoints = [];
    this.app = (0, _express.default)();
    this.server = _http.default.createServer(this.app);
    this.db = new _arango.default(this.config, this.logs, this.auth, this.tracer, this.stats);
    this.memStats = new MemStats(this.stats);
    this.memStats.start();
    this.rpcServer = new _qRpcServer.QRpcServer({
      auth: this.auth,
      db: this.db,
      port: options.config.server.rpcPort
    });
    this.addEndPoint({
      path: '/graphql/mam',
      resolvers: _resolversMam.resolversMam,
      typeDefFileNames: ['type-defs-mam.graphql'],
      supportSubscriptions: false
    });
    this.addEndPoint({
      path: '/graphql',
      resolvers: (0, _resolversCustom.attachCustomResolvers)(this.db, (0, _resolversGenerated.createResolvers)(this.db)),
      typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
      supportSubscriptions: true
    });
  }

  async start() {
    this.client = await _tonClientNodeJs.TONClient.create({
      servers: ['']
    });
    await this.db.start();
    const {
      host,
      port
    } = this.config.server;
    this.server.listen({
      host,
      port
    }, () => {
      this.endPoints.forEach(endPoint => {
        this.log.debug('GRAPHQL', `http://${host}:${port}${endPoint.path}`);
      });
    });
    this.server.setTimeout(2147483647);

    if (this.rpcServer.port) {
      this.rpcServer.start();
    }
  }

  addEndPoint(endPoint) {
    const typeDefs = endPoint.typeDefFileNames.map(x => _fs.default.readFileSync(x, 'utf-8')).join('\n');
    const config = {
      debug: false,
      typeDefs,
      resolvers: endPoint.resolvers,
      subscriptions: {
        keepAlive: this.config.server.keepAlive,

        onConnect(connectionParams, _websocket, _context) {
          return {
            accessKey: connectionParams.accessKey || connectionParams.accesskey
          };
        }

      },
      context: ({
        req,
        connection
      }) => {
        return {
          db: this.db,
          tracer: this.tracer,
          stats: this.stats,
          auth: this.auth,
          client: this.client,
          config: this.config,
          shared: this.shared,
          remoteAddress: req && req.socket && req.socket.remoteAddress || '',
          accessKey: _auth.Auth.extractAccessKey(req, connection),
          parentSpan: _tracer.QTracer.extractParentSpan(this.tracer, connection ? connection : req)
        };
      },
      plugins: [{
        requestDidStart(_requestContext) {
          return {
            willSendResponse(ctx) {
              const context = ctx.context;

              if (context.multipleAccessKeysDetected) {
                throw (0, _utils.createError)(400, 'Request must use the same access key for all queries and mutations');
              }
            }

          };
        }

      }]
    };
    const apollo = new _apolloServerExpress.ApolloServer(config);
    apollo.applyMiddleware({
      app: this.app,
      path: endPoint.path
    });

    if (endPoint.supportSubscriptions) {
      apollo.installSubscriptionHandlers(this.server);
    }

    this.endPoints.push(endPoint);
  }

}

exports.default = TONQServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsidjgiLCJyZXF1aXJlIiwiTWVtU3RhdHMiLCJjb25zdHJ1Y3RvciIsInN0YXRzIiwicmVwb3J0IiwiZ2V0SGVhcFNwYWNlU3RhdGlzdGljcyIsImZvckVhY2giLCJzcGFjZSIsInNwYWNlTmFtZSIsInNwYWNlX25hbWUiLCJyZXBsYWNlIiwiZ2F1Z2UiLCJtZXRyaWMiLCJ2YWx1ZSIsInBoeXNpY2FsX3NwYWNlX3NpemUiLCJzcGFjZV9hdmFpbGFibGVfc2l6ZSIsInNwYWNlX3NpemUiLCJzcGFjZV91c2VkX3NpemUiLCJzdGFydCIsImNoZWNrTWVtUmVwb3J0Iiwic2V0VGltZW91dCIsImNoZWNrR2MiLCJnbG9iYWwiLCJnYyIsIlRPTlFTZXJ2ZXIiLCJvcHRpb25zIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNoYXJlZCIsIk1hcCIsInRyYWNlciIsIlFUcmFjZXIiLCJRU3RhdHMiLCJzdGF0c2QiLCJzZXJ2ZXIiLCJ0YWdzIiwiYXV0aCIsIkF1dGgiLCJlbmRQb2ludHMiLCJhcHAiLCJodHRwIiwiY3JlYXRlU2VydmVyIiwiZGIiLCJBcmFuZ28iLCJtZW1TdGF0cyIsInJwY1NlcnZlciIsIlFScGNTZXJ2ZXIiLCJwb3J0IiwicnBjUG9ydCIsImFkZEVuZFBvaW50IiwicGF0aCIsInJlc29sdmVycyIsInJlc29sdmVyc01hbSIsInR5cGVEZWZGaWxlTmFtZXMiLCJzdXBwb3J0U3Vic2NyaXB0aW9ucyIsImNsaWVudCIsIlRPTkNsaWVudE5vZGVKcyIsInNlcnZlcnMiLCJob3N0IiwibGlzdGVuIiwiZW5kUG9pbnQiLCJkZWJ1ZyIsInR5cGVEZWZzIiwibWFwIiwieCIsImZzIiwicmVhZEZpbGVTeW5jIiwiam9pbiIsInN1YnNjcmlwdGlvbnMiLCJrZWVwQWxpdmUiLCJvbkNvbm5lY3QiLCJjb25uZWN0aW9uUGFyYW1zIiwiX3dlYnNvY2tldCIsIl9jb250ZXh0IiwiYWNjZXNzS2V5IiwiYWNjZXNza2V5IiwiY29udGV4dCIsInJlcSIsImNvbm5lY3Rpb24iLCJyZW1vdGVBZGRyZXNzIiwic29ja2V0IiwiZXh0cmFjdEFjY2Vzc0tleSIsInBhcmVudFNwYW4iLCJleHRyYWN0UGFyZW50U3BhbiIsInBsdWdpbnMiLCJyZXF1ZXN0RGlkU3RhcnQiLCJfcmVxdWVzdENvbnRleHQiLCJ3aWxsU2VuZFJlc3BvbnNlIiwiY3R4IiwibXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQiLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJhcHBseU1pZGRsZXdhcmUiLCJpbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUVBOztBQUNBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUdBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBeENBOzs7Ozs7Ozs7Ozs7Ozs7QUFzREEsTUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUMsSUFBRCxDQUFsQjs7QUFFQSxNQUFNQyxRQUFOLENBQWU7QUFHWEMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQWdCO0FBQ3ZCLFNBQUtBLEtBQUwsR0FBYUEsS0FBYjtBQUNIOztBQUVEQyxFQUFBQSxNQUFNLEdBQUc7QUFDTEwsSUFBQUEsRUFBRSxDQUFDTSxzQkFBSCxHQUE0QkMsT0FBNUIsQ0FBcUNDLEtBQUQsSUFBVztBQUMzQyxZQUFNQyxTQUFTLEdBQUdELEtBQUssQ0FBQ0UsVUFBTixDQUNiQyxPQURhLENBQ0wsUUFESyxFQUNLLEVBREwsRUFFYkEsT0FGYSxDQUVMLFFBRkssRUFFSyxFQUZMLENBQWxCOztBQUdBLFlBQU1DLEtBQUssR0FBRyxDQUFDQyxNQUFELEVBQWlCQyxLQUFqQixLQUFtQztBQUM3QyxhQUFLVixLQUFMLENBQVdRLEtBQVgsQ0FBa0IsY0FBYUgsU0FBVSxJQUFHSSxNQUFPLEVBQW5ELEVBQXNEQyxLQUF0RDtBQUNILE9BRkQ7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QUFnQkQsR0FBakU7QUFWVCxTQUFQO0FBWUgsT0F6QnFDO0FBMEJ0Q08sTUFBQUEsT0FBTyxFQUFFLENBQ0w7QUFDSUMsUUFBQUEsZUFBZSxDQUFDQyxlQUFELEVBQWtCO0FBQzdCLGlCQUFPO0FBQ0hDLFlBQUFBLGdCQUFnQixDQUFDQyxHQUFELEVBQU07QUFDbEIsb0JBQU1aLE9BQThCLEdBQUdZLEdBQUcsQ0FBQ1osT0FBM0M7O0FBQ0Esa0JBQUlBLE9BQU8sQ0FBQ2EsMEJBQVosRUFBd0M7QUFDcEMsc0JBQU0sd0JBQ0YsR0FERSxFQUVGLG9FQUZFLENBQU47QUFJSDtBQUNKOztBQVRFLFdBQVA7QUFXSDs7QUFiTCxPQURLO0FBMUI2QixLQUExQztBQTRDQSxVQUFNQyxNQUFNLEdBQUcsSUFBSUMsaUNBQUosQ0FBaUJuRSxNQUFqQixDQUFmO0FBQ0FrRSxJQUFBQSxNQUFNLENBQUNFLGVBQVAsQ0FBdUI7QUFDbkJyRCxNQUFBQSxHQUFHLEVBQUUsS0FBS0EsR0FEUztBQUVuQlcsTUFBQUEsSUFBSSxFQUFFVSxRQUFRLENBQUNWO0FBRkksS0FBdkI7O0FBSUEsUUFBSVUsUUFBUSxDQUFDTixvQkFBYixFQUFtQztBQUMvQm9DLE1BQUFBLE1BQU0sQ0FBQ0csMkJBQVAsQ0FBbUMsS0FBSzNELE1BQXhDO0FBQ0g7O0FBQ0QsU0FBS0ksU0FBTCxDQUFld0QsSUFBZixDQUFvQmxDLFFBQXBCO0FBQ0g7O0FBaEkyQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuXG5pbXBvcnQge0Fwb2xsb1NlcnZlciwgQXBvbGxvU2VydmVyRXhwcmVzc0NvbmZpZ30gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcbmltcG9ydCB7Q29ubmVjdGlvbkNvbnRleHR9IGZyb20gJ3N1YnNjcmlwdGlvbnMtdHJhbnNwb3J0LXdzJztcbmltcG9ydCB0eXBlIHtUT05DbGllbnR9IGZyb20gXCJ0b24tY2xpZW50LWpzL3R5cGVzXCI7XG5pbXBvcnQge1RPTkNsaWVudCBhcyBUT05DbGllbnROb2RlSnN9IGZyb20gJ3Rvbi1jbGllbnQtbm9kZS1qcyc7XG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcbmltcG9ydCB0eXBlIHtHcmFwaFFMUmVxdWVzdENvbnRleHR9IGZyb20gXCIuL2FyYW5nby1jb2xsZWN0aW9uXCI7XG5pbXBvcnQge1FScGNTZXJ2ZXJ9IGZyb20gJy4vcS1ycGMtc2VydmVyJztcblxuaW1wb3J0IHtjcmVhdGVSZXNvbHZlcnN9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQge2F0dGFjaEN1c3RvbVJlc29sdmVyc30gZnJvbSBcIi4vcmVzb2x2ZXJzLWN1c3RvbVwiO1xuaW1wb3J0IHtyZXNvbHZlcnNNYW19IGZyb20gXCIuL3Jlc29sdmVycy1tYW1cIjtcblxuaW1wb3J0IHR5cGUge1FDb25maWd9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHR5cGUge1FMb2d9IGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgdHlwZSB7SVN0YXRzfSBmcm9tICcuL3RyYWNlcic7XG5pbXBvcnQge1FTdGF0cywgUVRyYWNlcn0gZnJvbSBcIi4vdHJhY2VyXCI7XG5pbXBvcnQge1RyYWNlcn0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQge0F1dGh9IGZyb20gJy4vYXV0aCc7XG5pbXBvcnQge2NyZWF0ZUVycm9yfSBmcm9tIFwiLi91dGlsc1wiO1xuXG50eXBlIFFPcHRpb25zID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBsb2dzOiBRTG9ncyxcbn1cblxudHlwZSBFbmRQb2ludCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcmVzb2x2ZXJzOiBhbnksXG4gICAgdHlwZURlZkZpbGVOYW1lczogc3RyaW5nW10sXG4gICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IGJvb2xlYW4sXG59XG5cbmNvbnN0IHY4ID0gcmVxdWlyZSgndjgnKTtcblxuY2xhc3MgTWVtU3RhdHMge1xuICAgIHN0YXRzOiBJU3RhdHM7XG5cbiAgICBjb25zdHJ1Y3RvcihzdGF0czogSVN0YXRzKSB7XG4gICAgICAgIHRoaXMuc3RhdHMgPSBzdGF0cztcbiAgICB9XG5cbiAgICByZXBvcnQoKSB7XG4gICAgICAgIHY4LmdldEhlYXBTcGFjZVN0YXRpc3RpY3MoKS5mb3JFYWNoKChzcGFjZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3BhY2VOYW1lID0gc3BhY2Uuc3BhY2VfbmFtZVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKCdzcGFjZV8nLCAnJylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgnX3NwYWNlJywgJycpO1xuICAgICAgICAgICAgY29uc3QgZ2F1Z2UgPSAobWV0cmljOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRzLmdhdWdlKGBoZWFwLnNwYWNlLiR7c3BhY2VOYW1lfS4ke21ldHJpY31gLCB2YWx1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZ2F1Z2UoJ3BoeXNpY2FsX3NpemUnLCBzcGFjZS5waHlzaWNhbF9zcGFjZV9zaXplKTtcbiAgICAgICAgICAgIGdhdWdlKCdhdmFpbGFibGVfc2l6ZScsIHNwYWNlLnNwYWNlX2F2YWlsYWJsZV9zaXplKTtcbiAgICAgICAgICAgIGdhdWdlKCdzaXplJywgc3BhY2Uuc3BhY2Vfc2l6ZSk7XG4gICAgICAgICAgICBnYXVnZSgndXNlZF9zaXplJywgc3BhY2Uuc3BhY2VfdXNlZF9zaXplKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIC8vVE9ETzogdGhpcy5jaGVja01lbVJlcG9ydCgpO1xuICAgICAgICAvL1RPRE86IHRoaXMuY2hlY2tHYygpO1xuICAgIH1cblxuICAgIGNoZWNrTWVtUmVwb3J0KCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVwb3J0KCk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrTWVtUmVwb3J0KCk7XG4gICAgICAgIH0sIDUwMDApO1xuICAgIH1cblxuICAgIGNoZWNrR2MoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgZ2xvYmFsLmdjKCk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrR2MoKTtcbiAgICAgICAgfSwgNjAwMDApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBhcHA6IGV4cHJlc3MuQXBwbGljYXRpb247XG4gICAgc2VydmVyOiBhbnk7XG4gICAgZW5kUG9pbnRzOiBFbmRQb2ludFtdO1xuICAgIGRiOiBBcmFuZ287XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc3RhdHM6IElTdGF0cztcbiAgICBjbGllbnQ6IFRPTkNsaWVudDtcbiAgICBhdXRoOiBBdXRoO1xuICAgIG1lbVN0YXRzOiBNZW1TdGF0cztcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT47XG4gICAgcnBjU2VydmVyOiBRUnBjU2VydmVyO1xuXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnc2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IFFUcmFjZXIuY3JlYXRlKG9wdGlvbnMuY29uZmlnKTtcbiAgICAgICAgdGhpcy5zdGF0cyA9IFFTdGF0cy5jcmVhdGUob3B0aW9ucy5jb25maWcuc3RhdHNkLnNlcnZlciwgb3B0aW9ucy5jb25maWcuc3RhdHNkLnRhZ3MpO1xuICAgICAgICB0aGlzLmF1dGggPSBuZXcgQXV0aChvcHRpb25zLmNvbmZpZyk7XG4gICAgICAgIHRoaXMuZW5kUG9pbnRzID0gW107XG4gICAgICAgIHRoaXMuYXBwID0gZXhwcmVzcygpO1xuICAgICAgICB0aGlzLnNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKHRoaXMuYXBwKTtcbiAgICAgICAgdGhpcy5kYiA9IG5ldyBBcmFuZ28odGhpcy5jb25maWcsIHRoaXMubG9ncywgdGhpcy5hdXRoLCB0aGlzLnRyYWNlciwgdGhpcy5zdGF0cyk7XG4gICAgICAgIHRoaXMubWVtU3RhdHMgPSBuZXcgTWVtU3RhdHModGhpcy5zdGF0cyk7XG4gICAgICAgIHRoaXMubWVtU3RhdHMuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5ycGNTZXJ2ZXIgPSBuZXcgUVJwY1NlcnZlcih7XG4gICAgICAgICAgICBhdXRoOiB0aGlzLmF1dGgsXG4gICAgICAgICAgICBkYjogdGhpcy5kYixcbiAgICAgICAgICAgIHBvcnQ6IG9wdGlvbnMuY29uZmlnLnNlcnZlci5ycGNQb3J0LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwvbWFtJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogcmVzb2x2ZXJzTWFtLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtbWFtLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKHRoaXMuZGIsIGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSksXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1nZW5lcmF0ZWQuZ3JhcGhxbCcsICd0eXBlLWRlZnMtY3VzdG9tLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICB0aGlzLmNsaWVudCA9IGF3YWl0IFRPTkNsaWVudE5vZGVKcy5jcmVhdGUoe3NlcnZlcnM6IFsnJ119KTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuICAgICAgICBjb25zdCB7aG9zdCwgcG9ydH0gPSB0aGlzLmNvbmZpZy5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuc2VydmVyLmxpc3Rlbih7XG4gICAgICAgICAgICBob3N0LFxuICAgICAgICAgICAgcG9ydCxcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbmRQb2ludHMuZm9yRWFjaCgoZW5kUG9pbnQ6IEVuZFBvaW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0dSQVBIUUwnLCBgaHR0cDovLyR7aG9zdH06JHtwb3J0fSR7ZW5kUG9pbnQucGF0aH1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIuc2V0VGltZW91dCgyMTQ3NDgzNjQ3KTtcblxuICAgICAgICBpZiAodGhpcy5ycGNTZXJ2ZXIucG9ydCkge1xuICAgICAgICAgICAgdGhpcy5ycGNTZXJ2ZXIuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgYWRkRW5kUG9pbnQoZW5kUG9pbnQ6IEVuZFBvaW50KSB7XG4gICAgICAgIGNvbnN0IHR5cGVEZWZzID0gZW5kUG9pbnQudHlwZURlZkZpbGVOYW1lc1xuICAgICAgICAgICAgLm1hcCh4ID0+IGZzLnJlYWRGaWxlU3luYyh4LCAndXRmLTgnKSlcbiAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICAgICAgY29uc3QgY29uZmlnOiBBcG9sbG9TZXJ2ZXJFeHByZXNzQ29uZmlnID0ge1xuICAgICAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnM6IGVuZFBvaW50LnJlc29sdmVycyxcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBrZWVwQWxpdmU6IHRoaXMuY29uZmlnLnNlcnZlci5rZWVwQWxpdmUsXG4gICAgICAgICAgICAgICAgb25Db25uZWN0KGNvbm5lY3Rpb25QYXJhbXM6IE9iamVjdCwgX3dlYnNvY2tldDogV2ViU29ja2V0LCBfY29udGV4dDogQ29ubmVjdGlvbkNvbnRleHQpOiBhbnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXNzS2V5OiBjb25uZWN0aW9uUGFyYW1zLmFjY2Vzc0tleSB8fCBjb25uZWN0aW9uUGFyYW1zLmFjY2Vzc2tleSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGV4dDogKHtyZXEsIGNvbm5lY3Rpb259KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZGI6IHRoaXMuZGIsXG4gICAgICAgICAgICAgICAgICAgIHRyYWNlcjogdGhpcy50cmFjZXIsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzOiB0aGlzLnN0YXRzLFxuICAgICAgICAgICAgICAgICAgICBhdXRoOiB0aGlzLmF1dGgsXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudDogdGhpcy5jbGllbnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZDogdGhpcy5zaGFyZWQsXG4gICAgICAgICAgICAgICAgICAgIHJlbW90ZUFkZHJlc3M6IChyZXEgJiYgcmVxLnNvY2tldCAmJiByZXEuc29ja2V0LnJlbW90ZUFkZHJlc3MpIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NLZXk6IEF1dGguZXh0cmFjdEFjY2Vzc0tleShyZXEsIGNvbm5lY3Rpb24pLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRTcGFuOiBRVHJhY2VyLmV4dHJhY3RQYXJlbnRTcGFuKHRoaXMudHJhY2VyLCBjb25uZWN0aW9uID8gY29ubmVjdGlvbiA6IHJlcSksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGlkU3RhcnQoX3JlcXVlc3RDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGxTZW5kUmVzcG9uc2UoY3R4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IGN0eC5jb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dC5tdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdSZXF1ZXN0IG11c3QgdXNlIHRoZSBzYW1lIGFjY2VzcyBrZXkgZm9yIGFsbCBxdWVyaWVzIGFuZCBtdXRhdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoY29uZmlnKTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7XG4gICAgICAgICAgICBhcHA6IHRoaXMuYXBwLFxuICAgICAgICAgICAgcGF0aDogZW5kUG9pbnQucGF0aCxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChlbmRQb2ludC5zdXBwb3J0U3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyh0aGlzLnNlcnZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmRQb2ludHMucHVzaChlbmRQb2ludCk7XG4gICAgfVxuXG5cbn1cblxuIl19