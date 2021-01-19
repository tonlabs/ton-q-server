"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QTracer = exports.StatsTiming = exports.StatsGauge = exports.StatsCounter = exports.QStats = void 0;

var _config = require("./config");

var _noop = require("opentracing/lib/noop");

var _nodeStatsd = _interopRequireDefault(require("node-statsd"));

var _opentracing = require("opentracing");

var _jaegerClient = require("jaeger-client");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dummy(stat, value, sampleRate, tags) {}

function logStatsError(error) {
  console.log(`StatsD send failed: ${error.message}`);
}

const dummyStats = {
  configuredTags: [],
  increment: dummy,
  decrement: dummy,
  histogram: dummy,
  gauge: dummy,
  set: dummy,
  timing: dummy
};

class QStats {
  static create(server, configuredTags) {
    if (!server) {
      return dummyStats;
    }

    const hostPort = server.split(':');
    let stats = null;

    const withStats = f => {
      try {
        f(stats || (() => {
          const newStats = new _nodeStatsd.default(hostPort[0], hostPort[1], _config.STATS.prefix);
          newStats.socket.on("error", err => {
            logStatsError(err);
            stats = null;
          });
          stats = newStats;
          return newStats;
        })());
      } catch (e) {
        logStatsError(e);
        stats = null;
      }
    };

    return {
      increment(stat, value, sampleRate, tags) {
        withStats(stats => stats.increment(stat, value, sampleRate, tags));
      },

      decrement(stat, value, sampleRate, tags) {
        withStats(stats => stats.decrement(stat, value, sampleRate, tags));
      },

      histogram(stat, value, sampleRate, tags) {
        withStats(stats => stats.histogram(stat, value, sampleRate, tags));
      },

      gauge(stat, value, sampleRate, tags) {
        withStats(stats => stats.gauge(stat, value, sampleRate, tags));
      },

      set(stat, value, sampleRate, tags) {
        withStats(stats => stats.set(stat, value, sampleRate, tags));
      },

      timing(stat, value, sampleRate, tags) {
        withStats(stats => stats.timing(stat, value, sampleRate, tags));
      },

      configuredTags
    };
  }

  static combineTags(stats, tags) {
    return stats && stats.configuredTags && stats.configuredTags.length > 0 ? stats.configuredTags.concat(tags) : tags;
  }

}

exports.QStats = QStats;

class StatsCounter {
  constructor(stats, name, tags) {
    this.stats = stats;
    this.name = name;
    this.tags = QStats.combineTags(stats, tags);
  }

  increment() {
    this.stats.increment(this.name, 1, this.tags);
  }

}

exports.StatsCounter = StatsCounter;

class StatsGauge {
  constructor(stats, name, tags) {
    this.stats = stats;
    this.name = name;
    this.tags = QStats.combineTags(stats, tags);
    this.value = 0;
  }

  set(value) {
    this.value = value;
    this.stats.gauge(this.name, this.value, this.tags);
  }

  increment(delta = 1) {
    this.set(this.value + delta);
  }

  decrement(delta = 1) {
    this.set(this.value - delta);
  }

}

exports.StatsGauge = StatsGauge;

class StatsTiming {
  constructor(stats, name, tags) {
    this.stats = stats;
    this.name = name;
    this.tags = QStats.combineTags(stats, tags);
  }

  report(value) {
    this.stats.timing(this.name, value, this.tags);
  }

  start() {
    const start = Date.now();
    return () => {
      this.report(Date.now() - start);
    };
  }

}

exports.StatsTiming = StatsTiming;

function parseUrl(url) {
  const protocolSeparatorPos = url.indexOf('://');
  const protocolEnd = protocolSeparatorPos >= 0 ? protocolSeparatorPos + 3 : 0;
  const questionPos = url.indexOf('?', protocolEnd);
  const queryStart = questionPos >= 0 ? questionPos + 1 : url.length;
  const pathEnd = questionPos >= 0 ? questionPos : url.length;
  const pathSeparatorPos = url.indexOf('/', protocolEnd); // eslint-disable-next-line no-nested-ternary

  const pathStart = pathSeparatorPos >= 0 ? pathSeparatorPos < pathEnd ? pathSeparatorPos : pathEnd : questionPos >= 0 ? questionPos : url.length;
  const hostPort = url.substring(protocolEnd, pathStart).split(':');
  return {
    protocol: url.substring(0, protocolEnd),
    host: hostPort[0],
    port: hostPort[1] || '',
    path: url.substring(pathStart, pathEnd),
    query: url.substring(queryStart)
  };
}

class QTracer {
  static getJaegerConfig(config) {
    const endpoint = config.endpoint;

    if (!endpoint) {
      return null;
    }

    const parts = parseUrl(endpoint);
    return parts.protocol === '' ? {
      serviceName: config.service,
      sampler: {
        type: 'const',
        param: 1
      },
      reporter: {
        logSpans: true,
        agentHost: parts.host,
        agentPort: Number(parts.port)
      }
    } : {
      serviceName: config.service,
      sampler: {
        type: 'const',
        param: 1
      },
      reporter: {
        logSpans: true,
        collectorEndpoint: endpoint
      }
    };
  }

  static create(config) {
    QTracer.config = config;
    const jaegerConfig = QTracer.getJaegerConfig(config.jaeger);

    if (!jaegerConfig) {
      return _noop.tracer;
    }

    return (0, _jaegerClient.initTracerFromEnv)(jaegerConfig, {
      logger: {
        info(msg) {
          console.log('INFO ', msg);
        },

        error(msg) {
          console.log('ERROR', msg);
        }

      }
    });
  }

  static messageRootSpanContext(messageId) {
    if (!messageId) {
      return null;
    }

    const traceId = messageId.substr(0, 16);
    const spanId = messageId.substr(16, 16);
    return _jaegerClient.SpanContext.fromString(`${traceId}:${spanId}:0:1`);
  }

  static extractParentSpan(tracer, req) {
    let ctx_src, ctx_frm;

    if (req.headers) {
      ctx_src = req.headers;
      ctx_frm = _opentracing.FORMAT_TEXT_MAP;
    } else {
      ctx_src = req.context;
      ctx_frm = _opentracing.FORMAT_BINARY;
    }

    return tracer.extract(ctx_frm, ctx_src);
  }

  static getParentSpan(tracer, context) {
    return context.tracerParentSpan;
  }

  static failed(tracer, span, error) {
    span.log({
      event: 'failed',
      payload: (0, _utils.toLog)(error)
    });
  }

  static async trace(tracer, name, f, parentSpan) {
    const span = tracer.startSpan(name, {
      childOf: parentSpan
    });

    try {
      span.setTag(_opentracing.Tags.SPAN_KIND, 'server');
      Object.entries(QTracer.config.jaeger.tags).forEach(([name, value]) => {
        if (name) {
          span.setTag(name, value);
        }
      });
      const result = await f(span);

      if (result !== undefined) {
        span.setTag('result', (0, _utils.toLog)(result));
      }

      span.finish();
      return result;
    } catch (error) {
      const cleaned = (0, _utils.cleanError)(error);
      QTracer.failed(tracer, span, cleaned);
      span.finish();
      throw cleaned;
    }
  }

}

exports.QTracer = QTracer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2ZXIvdHJhY2VyLmpzIl0sIm5hbWVzIjpbImR1bW15Iiwic3RhdCIsInZhbHVlIiwic2FtcGxlUmF0ZSIsInRhZ3MiLCJsb2dTdGF0c0Vycm9yIiwiZXJyb3IiLCJjb25zb2xlIiwibG9nIiwibWVzc2FnZSIsImR1bW15U3RhdHMiLCJjb25maWd1cmVkVGFncyIsImluY3JlbWVudCIsImRlY3JlbWVudCIsImhpc3RvZ3JhbSIsImdhdWdlIiwic2V0IiwidGltaW5nIiwiUVN0YXRzIiwiY3JlYXRlIiwic2VydmVyIiwiaG9zdFBvcnQiLCJzcGxpdCIsInN0YXRzIiwid2l0aFN0YXRzIiwiZiIsIm5ld1N0YXRzIiwiU3RhdHNEIiwiU1RBVFMiLCJwcmVmaXgiLCJzb2NrZXQiLCJvbiIsImVyciIsImUiLCJjb21iaW5lVGFncyIsImxlbmd0aCIsImNvbmNhdCIsIlN0YXRzQ291bnRlciIsImNvbnN0cnVjdG9yIiwibmFtZSIsIlN0YXRzR2F1Z2UiLCJkZWx0YSIsIlN0YXRzVGltaW5nIiwicmVwb3J0Iiwic3RhcnQiLCJEYXRlIiwibm93IiwicGFyc2VVcmwiLCJ1cmwiLCJwcm90b2NvbFNlcGFyYXRvclBvcyIsImluZGV4T2YiLCJwcm90b2NvbEVuZCIsInF1ZXN0aW9uUG9zIiwicXVlcnlTdGFydCIsInBhdGhFbmQiLCJwYXRoU2VwYXJhdG9yUG9zIiwicGF0aFN0YXJ0Iiwic3Vic3RyaW5nIiwicHJvdG9jb2wiLCJob3N0IiwicG9ydCIsInBhdGgiLCJxdWVyeSIsIlFUcmFjZXIiLCJnZXRKYWVnZXJDb25maWciLCJjb25maWciLCJlbmRwb2ludCIsInBhcnRzIiwic2VydmljZU5hbWUiLCJzZXJ2aWNlIiwic2FtcGxlciIsInR5cGUiLCJwYXJhbSIsInJlcG9ydGVyIiwibG9nU3BhbnMiLCJhZ2VudEhvc3QiLCJhZ2VudFBvcnQiLCJOdW1iZXIiLCJjb2xsZWN0b3JFbmRwb2ludCIsImphZWdlckNvbmZpZyIsImphZWdlciIsIm5vb3BUcmFjZXIiLCJsb2dnZXIiLCJpbmZvIiwibXNnIiwibWVzc2FnZVJvb3RTcGFuQ29udGV4dCIsIm1lc3NhZ2VJZCIsInRyYWNlSWQiLCJzdWJzdHIiLCJzcGFuSWQiLCJKYWVnZXJTcGFuQ29udGV4dCIsImZyb21TdHJpbmciLCJleHRyYWN0UGFyZW50U3BhbiIsInRyYWNlciIsInJlcSIsImN0eF9zcmMiLCJjdHhfZnJtIiwiaGVhZGVycyIsIkZPUk1BVF9URVhUX01BUCIsImNvbnRleHQiLCJGT1JNQVRfQklOQVJZIiwiZXh0cmFjdCIsImdldFBhcmVudFNwYW4iLCJ0cmFjZXJQYXJlbnRTcGFuIiwiZmFpbGVkIiwic3BhbiIsImV2ZW50IiwicGF5bG9hZCIsInRyYWNlIiwicGFyZW50U3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJzZXRUYWciLCJUYWdzIiwiU1BBTl9LSU5EIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJyZXN1bHQiLCJ1bmRlZmluZWQiLCJmaW5pc2giLCJjbGVhbmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBSUE7Ozs7QUFrQkEsU0FBU0EsS0FBVCxDQUFlQyxJQUFmLEVBQTZCQyxLQUE3QixFQUE2Q0MsVUFBN0MsRUFBNkVDLElBQTdFLEVBQThGLENBQzdGOztBQUVELFNBQVNDLGFBQVQsQ0FBdUJDLEtBQXZCLEVBQW1DO0FBQy9CQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSx1QkFBc0JGLEtBQUssQ0FBQ0csT0FBUSxFQUFqRDtBQUNIOztBQUVELE1BQU1DLFVBQWtCLEdBQUc7QUFDdkJDLEVBQUFBLGNBQWMsRUFBRSxFQURPO0FBRXZCQyxFQUFBQSxTQUFTLEVBQUVaLEtBRlk7QUFHdkJhLEVBQUFBLFNBQVMsRUFBRWIsS0FIWTtBQUl2QmMsRUFBQUEsU0FBUyxFQUFFZCxLQUpZO0FBS3ZCZSxFQUFBQSxLQUFLLEVBQUVmLEtBTGdCO0FBTXZCZ0IsRUFBQUEsR0FBRyxFQUFFaEIsS0FOa0I7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QUFsQjtBQUNIO0FBQ0osT0FKRDtBQUtBLFlBQU1vSCxNQUFNLEdBQUcsTUFBTTdGLENBQUMsQ0FBQ2dGLElBQUQsQ0FBdEI7O0FBQ0EsVUFBSWEsTUFBTSxLQUFLQyxTQUFmLEVBQTBCO0FBQ3RCZCxRQUFBQSxJQUFJLENBQUNPLE1BQUwsQ0FBWSxRQUFaLEVBQXNCLGtCQUFNTSxNQUFOLENBQXRCO0FBQ0g7O0FBQ0RiLE1BQUFBLElBQUksQ0FBQ2UsTUFBTDtBQUNBLGFBQU9GLE1BQVA7QUFDSCxLQWJELENBYUUsT0FBT2hILEtBQVAsRUFBYztBQUNaLFlBQU1tSCxPQUFPLEdBQUcsdUJBQVduSCxLQUFYLENBQWhCO0FBQ0F5RCxNQUFBQSxPQUFPLENBQUN5QyxNQUFSLENBQWVYLE1BQWYsRUFBdUJZLElBQXZCLEVBQTZCZ0IsT0FBN0I7QUFDQWhCLE1BQUFBLElBQUksQ0FBQ2UsTUFBTDtBQUNBLFlBQU1DLE9BQU47QUFDSDtBQUNKOztBQXJIZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuXG5pbXBvcnQgeyBTVEFUUyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgdHJhY2VyIGFzIG5vb3BUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmcvbGliL25vb3BcIjtcbmltcG9ydCBTdGF0c0QgZnJvbSAnbm9kZS1zdGF0c2QnO1xuaW1wb3J0IHsgVHJhY2VyLCBUYWdzLCBGT1JNQVRfVEVYVF9NQVAsIEZPUk1BVF9CSU5BUlksIFNwYW4sIFNwYW5Db250ZXh0IH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5cbmltcG9ydCB7XG4gICAgaW5pdFRyYWNlckZyb21FbnYgYXMgaW5pdEphZWdlclRyYWNlcixcbiAgICBTcGFuQ29udGV4dCBhcyBKYWVnZXJTcGFuQ29udGV4dCxcbn0gZnJvbSAnamFlZ2VyLWNsaWVudCc7XG5pbXBvcnQgeyBjbGVhbkVycm9yLCB0b0xvZyB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVN0YXRzIHtcbiAgICBjb25maWd1cmVkVGFnczogc3RyaW5nW10sXG5cbiAgICBpbmNyZW1lbnQoc3RhdDogc3RyaW5nLCB2YWx1ZT86IG51bWJlciwgc2FtcGxlUmF0ZT86IG51bWJlciB8IHN0cmluZ1tdLCB0YWdzPzogc3RyaW5nW10pOiB2b2lkLFxuXG4gICAgZGVjcmVtZW50KHN0YXQ6IHN0cmluZywgdmFsdWU/OiBudW1iZXIsIHNhbXBsZVJhdGU/OiBudW1iZXIgfCBzdHJpbmdbXSwgdGFncz86IHN0cmluZ1tdKTogdm9pZCxcblxuICAgIGhpc3RvZ3JhbShzdGF0OiBzdHJpbmcsIHZhbHVlOiBudW1iZXIsIHNhbXBsZVJhdGU/OiBudW1iZXIgfCBzdHJpbmdbXSwgdGFncz86IHN0cmluZ1tdKTogdm9pZCxcblxuICAgIGdhdWdlKHN0YXQ6IHN0cmluZywgdmFsdWU6IG51bWJlciwgc2FtcGxlUmF0ZT86IG51bWJlciB8IHN0cmluZ1tdLCB0YWdzPzogc3RyaW5nW10pOiB2b2lkLFxuXG4gICAgc2V0KHN0YXQ6IHN0cmluZywgdmFsdWU6IG51bWJlciwgc2FtcGxlUmF0ZT86IG51bWJlciB8IHN0cmluZ1tdLCB0YWdzPzogc3RyaW5nW10pOiB2b2lkLFxuXG4gICAgdGltaW5nKHN0YXQ6IHN0cmluZywgdmFsdWU6IG51bWJlciwgc2FtcGxlUmF0ZT86IG51bWJlciB8IHN0cmluZ1tdLCB0YWdzPzogc3RyaW5nW10pOiB2b2lkLFxufVxuXG5mdW5jdGlvbiBkdW1teShzdGF0OiBzdHJpbmcsIHZhbHVlPzogbnVtYmVyLCBzYW1wbGVSYXRlPzogbnVtYmVyIHwgc3RyaW5nW10sIHRhZ3M/OiBzdHJpbmdbXSkge1xufVxuXG5mdW5jdGlvbiBsb2dTdGF0c0Vycm9yKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhgU3RhdHNEIHNlbmQgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG59XG5cbmNvbnN0IGR1bW15U3RhdHM6IElTdGF0cyA9IHtcbiAgICBjb25maWd1cmVkVGFnczogW10sXG4gICAgaW5jcmVtZW50OiBkdW1teSxcbiAgICBkZWNyZW1lbnQ6IGR1bW15LFxuICAgIGhpc3RvZ3JhbTogZHVtbXksXG4gICAgZ2F1Z2U6IGR1bW15LFxuICAgIHNldDogZHVtbXksXG4gICAgdGltaW5nOiBkdW1teSxcbn07XG5cbmV4cG9ydCBjbGFzcyBRU3RhdHMge1xuICAgIHN0YXRpYyBjcmVhdGUoc2VydmVyOiBzdHJpbmcsIGNvbmZpZ3VyZWRUYWdzOiBzdHJpbmdbXSk6IElTdGF0cyB7XG4gICAgICAgIGlmICghc2VydmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZHVtbXlTdGF0cztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBob3N0UG9ydCA9IHNlcnZlci5zcGxpdCgnOicpO1xuICAgICAgICBsZXQgc3RhdHM6ID9JU3RhdHMgPSBudWxsO1xuICAgICAgICBjb25zdCB3aXRoU3RhdHMgPSAoZjogKHN0YXRzOiBJU3RhdHMpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZihzdGF0cyB8fCAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdTdGF0cyA9IG5ldyBTdGF0c0QoaG9zdFBvcnRbMF0sIGhvc3RQb3J0WzFdLCBTVEFUUy5wcmVmaXgpO1xuICAgICAgICAgICAgICAgICAgICBuZXdTdGF0cy5zb2NrZXQub24oXCJlcnJvclwiLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dTdGF0c0Vycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdGF0cyA9IG5ld1N0YXRzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3U3RhdHM7XG4gICAgICAgICAgICAgICAgfSkoKSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgbG9nU3RhdHNFcnJvcihlKTtcbiAgICAgICAgICAgICAgICBzdGF0cyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5jcmVtZW50KHN0YXQ6IHN0cmluZywgdmFsdWU/OiBudW1iZXIsIHNhbXBsZVJhdGU/OiBudW1iZXIgfCBzdHJpbmdbXSwgdGFncz86IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgd2l0aFN0YXRzKHN0YXRzID0+IHN0YXRzLmluY3JlbWVudChzdGF0LCB2YWx1ZSwgc2FtcGxlUmF0ZSwgdGFncykpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZGVjcmVtZW50KHN0YXQ6IHN0cmluZywgdmFsdWU/OiBudW1iZXIsIHNhbXBsZVJhdGU/OiBudW1iZXIgfCBzdHJpbmdbXSwgdGFncz86IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgd2l0aFN0YXRzKHN0YXRzID0+IHN0YXRzLmRlY3JlbWVudChzdGF0LCB2YWx1ZSwgc2FtcGxlUmF0ZSwgdGFncykpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaGlzdG9ncmFtKHN0YXQ6IHN0cmluZywgdmFsdWU6IG51bWJlciwgc2FtcGxlUmF0ZT86IG51bWJlciB8IHN0cmluZ1tdLCB0YWdzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgICAgICAgICAgICAgICB3aXRoU3RhdHMoc3RhdHMgPT4gc3RhdHMuaGlzdG9ncmFtKHN0YXQsIHZhbHVlLCBzYW1wbGVSYXRlLCB0YWdzKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnYXVnZShzdGF0OiBzdHJpbmcsIHZhbHVlOiBudW1iZXIsIHNhbXBsZVJhdGU/OiBudW1iZXIgfCBzdHJpbmdbXSwgdGFncz86IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgd2l0aFN0YXRzKHN0YXRzID0+IHN0YXRzLmdhdWdlKHN0YXQsIHZhbHVlLCBzYW1wbGVSYXRlLCB0YWdzKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBzZXQoc3RhdDogc3RyaW5nLCB2YWx1ZTogbnVtYmVyLCBzYW1wbGVSYXRlPzogbnVtYmVyIHwgc3RyaW5nW10sIHRhZ3M/OiBzdHJpbmdbXSk6IHZvaWQge1xuICAgICAgICAgICAgICAgIHdpdGhTdGF0cyhzdGF0cyA9PiBzdGF0cy5zZXQoc3RhdCwgdmFsdWUsIHNhbXBsZVJhdGUsIHRhZ3MpKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRpbWluZyhzdGF0OiBzdHJpbmcsIHZhbHVlOiBudW1iZXIsIHNhbXBsZVJhdGU/OiBudW1iZXIgfCBzdHJpbmdbXSwgdGFncz86IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgd2l0aFN0YXRzKHN0YXRzID0+IHN0YXRzLnRpbWluZyhzdGF0LCB2YWx1ZSwgc2FtcGxlUmF0ZSwgdGFncykpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbmZpZ3VyZWRUYWdzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHN0YXRpYyBjb21iaW5lVGFncyhzdGF0czogSVN0YXRzLCB0YWdzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIChzdGF0cyAmJiBzdGF0cy5jb25maWd1cmVkVGFncyAmJiBzdGF0cy5jb25maWd1cmVkVGFncy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgPyBzdGF0cy5jb25maWd1cmVkVGFncy5jb25jYXQodGFncylcbiAgICAgICAgICAgIDogdGFncztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdGF0c0NvdW50ZXIge1xuICAgIHN0YXRzOiBJU3RhdHM7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHRhZ3M6IHN0cmluZ1tdO1xuXG4gICAgY29uc3RydWN0b3Ioc3RhdHM6IElTdGF0cywgbmFtZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSkge1xuICAgICAgICB0aGlzLnN0YXRzID0gc3RhdHM7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMudGFncyA9IFFTdGF0cy5jb21iaW5lVGFncyhzdGF0cywgdGFncyk7XG4gICAgfVxuXG4gICAgaW5jcmVtZW50KCkge1xuICAgICAgICB0aGlzLnN0YXRzLmluY3JlbWVudCh0aGlzLm5hbWUsIDEsIHRoaXMudGFncyk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RhdHNHYXVnZSB7XG4gICAgc3RhdHM6IElTdGF0cztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdGFnczogc3RyaW5nW107XG4gICAgdmFsdWU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHN0YXRzOiBJU3RhdHMsIG5hbWU6IHN0cmluZywgdGFnczogc3RyaW5nW10pIHtcbiAgICAgICAgdGhpcy5zdGF0cyA9IHN0YXRzO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnRhZ3MgPSBRU3RhdHMuY29tYmluZVRhZ3Moc3RhdHMsIHRhZ3MpO1xuICAgICAgICB0aGlzLnZhbHVlID0gMDtcbiAgICB9XG5cbiAgICBzZXQodmFsdWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuc3RhdHMuZ2F1Z2UodGhpcy5uYW1lLCB0aGlzLnZhbHVlLCB0aGlzLnRhZ3MpO1xuICAgIH1cblxuICAgIGluY3JlbWVudChkZWx0YTogbnVtYmVyID0gMSkge1xuICAgICAgICB0aGlzLnNldCh0aGlzLnZhbHVlICsgZGVsdGEpO1xuICAgIH1cblxuICAgIGRlY3JlbWVudChkZWx0YTogbnVtYmVyID0gMSkge1xuICAgICAgICB0aGlzLnNldCh0aGlzLnZhbHVlIC0gZGVsdGEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0YXRzVGltaW5nIHtcbiAgICBzdGF0czogSVN0YXRzO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB0YWdzOiBzdHJpbmdbXTtcblxuICAgIGNvbnN0cnVjdG9yKHN0YXRzOiBJU3RhdHMsIG5hbWU6IHN0cmluZywgdGFnczogc3RyaW5nW10pIHtcbiAgICAgICAgdGhpcy5zdGF0cyA9IHN0YXRzO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnRhZ3MgPSBRU3RhdHMuY29tYmluZVRhZ3Moc3RhdHMsIHRhZ3MpO1xuICAgIH1cblxuICAgIHJlcG9ydCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuc3RhdHMudGltaW5nKHRoaXMubmFtZSwgdmFsdWUsIHRoaXMudGFncyk7XG4gICAgfVxuXG4gICAgc3RhcnQoKTogKCkgPT4gdm9pZCB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlVXJsKHVybDogc3RyaW5nKToge1xuICAgIHByb3RvY29sOiBzdHJpbmcsXG4gICAgaG9zdDogc3RyaW5nLFxuICAgIHBvcnQ6IHN0cmluZyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcXVlcnk6IHN0cmluZyxcbn0ge1xuICAgIGNvbnN0IHByb3RvY29sU2VwYXJhdG9yUG9zID0gdXJsLmluZGV4T2YoJzovLycpO1xuICAgIGNvbnN0IHByb3RvY29sRW5kID0gcHJvdG9jb2xTZXBhcmF0b3JQb3MgPj0gMCA/IHByb3RvY29sU2VwYXJhdG9yUG9zICsgMyA6IDA7XG4gICAgY29uc3QgcXVlc3Rpb25Qb3MgPSB1cmwuaW5kZXhPZignPycsIHByb3RvY29sRW5kKTtcbiAgICBjb25zdCBxdWVyeVN0YXJ0ID0gcXVlc3Rpb25Qb3MgPj0gMCA/IHF1ZXN0aW9uUG9zICsgMSA6IHVybC5sZW5ndGg7XG4gICAgY29uc3QgcGF0aEVuZCA9IHF1ZXN0aW9uUG9zID49IDAgPyBxdWVzdGlvblBvcyA6IHVybC5sZW5ndGg7XG4gICAgY29uc3QgcGF0aFNlcGFyYXRvclBvcyA9IHVybC5pbmRleE9mKCcvJywgcHJvdG9jb2xFbmQpO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXN0ZWQtdGVybmFyeVxuICAgIGNvbnN0IHBhdGhTdGFydCA9IHBhdGhTZXBhcmF0b3JQb3MgPj0gMFxuICAgICAgICA/IChwYXRoU2VwYXJhdG9yUG9zIDwgcGF0aEVuZCA/IHBhdGhTZXBhcmF0b3JQb3MgOiBwYXRoRW5kKVxuICAgICAgICA6IChxdWVzdGlvblBvcyA+PSAwID8gcXVlc3Rpb25Qb3MgOiB1cmwubGVuZ3RoKTtcbiAgICBjb25zdCBob3N0UG9ydCA9IHVybC5zdWJzdHJpbmcocHJvdG9jb2xFbmQsIHBhdGhTdGFydCkuc3BsaXQoJzonKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm90b2NvbDogdXJsLnN1YnN0cmluZygwLCBwcm90b2NvbEVuZCksXG4gICAgICAgIGhvc3Q6IGhvc3RQb3J0WzBdLFxuICAgICAgICBwb3J0OiBob3N0UG9ydFsxXSB8fCAnJyxcbiAgICAgICAgcGF0aDogdXJsLnN1YnN0cmluZyhwYXRoU3RhcnQsIHBhdGhFbmQpLFxuICAgICAgICBxdWVyeTogdXJsLnN1YnN0cmluZyhxdWVyeVN0YXJ0KSxcbiAgICB9O1xufVxuXG50eXBlIEphZWdlckNvbmZpZyA9IHtcbiAgICBzZXJ2aWNlTmFtZTogc3RyaW5nLFxuICAgIGRpc2FibGU/OiBib29sZWFuLFxuICAgIHNhbXBsZXI6IHtcbiAgICAgICAgdHlwZTogc3RyaW5nLFxuICAgICAgICBwYXJhbTogbnVtYmVyLFxuICAgICAgICBob3N0UG9ydD86IHN0cmluZyxcbiAgICAgICAgaG9zdD86IHN0cmluZyxcbiAgICAgICAgcG9ydD86IG51bWJlcixcbiAgICAgICAgcmVmcmVzaEludGVydmFsTXM/OiBudW1iZXIsXG4gICAgfSxcbiAgICByZXBvcnRlcjoge1xuICAgICAgICBsb2dTcGFuczogYm9vbGVhbixcbiAgICAgICAgYWdlbnRIb3N0Pzogc3RyaW5nLFxuICAgICAgICBhZ2VudFBvcnQ/OiBudW1iZXIsXG4gICAgICAgIGFnZW50U29ja2V0VHlwZT86IHN0cmluZyxcbiAgICAgICAgY29sbGVjdG9yRW5kcG9pbnQ/OiBzdHJpbmcsXG4gICAgICAgIHVzZXJuYW1lPzogc3RyaW5nLFxuICAgICAgICBwYXNzd29yZD86IHN0cmluZyxcbiAgICAgICAgZmx1c2hJbnRlcnZhbE1zPzogbnVtYmVyLFxuICAgIH0sXG4gICAgdGhyb3R0bGVyPzoge1xuICAgICAgICBob3N0OiBzdHJpbmcsXG4gICAgICAgIHBvcnQ6IG51bWJlcixcbiAgICAgICAgcmVmcmVzaEludGVydmFsTXM6IG51bWJlcixcbiAgICB9LFxufVxuXG5leHBvcnQgY2xhc3MgUVRyYWNlciB7XG4gICAgc3RhdGljIGNvbmZpZzogUUNvbmZpZztcblxuICAgIHN0YXRpYyBnZXRKYWVnZXJDb25maWcoY29uZmlnOiB7XG4gICAgICAgIGVuZHBvaW50OiBzdHJpbmcsXG4gICAgICAgIHNlcnZpY2U6IHN0cmluZyxcbiAgICAgICAgdGFnczogeyBbc3RyaW5nXTogc3RyaW5nIH1cbiAgICB9KTogP0phZWdlckNvbmZpZyB7XG4gICAgICAgIGNvbnN0IGVuZHBvaW50ID0gY29uZmlnLmVuZHBvaW50O1xuICAgICAgICBpZiAoIWVuZHBvaW50KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJ0cyA9IHBhcnNlVXJsKGVuZHBvaW50KTtcbiAgICAgICAgcmV0dXJuIChwYXJ0cy5wcm90b2NvbCA9PT0gJycpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlTmFtZTogY29uZmlnLnNlcnZpY2UsXG4gICAgICAgICAgICAgICAgc2FtcGxlcjoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29uc3QnLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbTogMSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlcG9ydGVyOiB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ1NwYW5zOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhZ2VudEhvc3Q6IHBhcnRzLmhvc3QsXG4gICAgICAgICAgICAgICAgICAgIGFnZW50UG9ydDogTnVtYmVyKHBhcnRzLnBvcnQpXG4gICAgICAgICAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgc2VydmljZU5hbWU6IGNvbmZpZy5zZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHNhbXBsZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NvbnN0JyxcbiAgICAgICAgICAgICAgICAgICAgcGFyYW06IDEsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXBvcnRlcjoge1xuICAgICAgICAgICAgICAgICAgICBsb2dTcGFuczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdG9yRW5kcG9pbnQ6IGVuZHBvaW50LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGUoY29uZmlnOiBRQ29uZmlnKTogVHJhY2VyIHtcbiAgICAgICAgUVRyYWNlci5jb25maWcgPSBjb25maWc7XG4gICAgICAgIGNvbnN0IGphZWdlckNvbmZpZyA9IFFUcmFjZXIuZ2V0SmFlZ2VyQ29uZmlnKGNvbmZpZy5qYWVnZXIpO1xuICAgICAgICBpZiAoIWphZWdlckNvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuIG5vb3BUcmFjZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluaXRKYWVnZXJUcmFjZXIoamFlZ2VyQ29uZmlnLCB7XG4gICAgICAgICAgICBsb2dnZXI6IHtcbiAgICAgICAgICAgICAgICBpbmZvKG1zZykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSU5GTyAnLCBtc2cpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3IobXNnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFUlJPUicsIG1zZyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBtZXNzYWdlUm9vdFNwYW5Db250ZXh0KG1lc3NhZ2VJZDogc3RyaW5nKTogP1NwYW5Db250ZXh0IHtcbiAgICAgICAgaWYgKCFtZXNzYWdlSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRyYWNlSWQgPSBtZXNzYWdlSWQuc3Vic3RyKDAsIDE2KTtcbiAgICAgICAgY29uc3Qgc3BhbklkID0gbWVzc2FnZUlkLnN1YnN0cigxNiwgMTYpO1xuICAgICAgICByZXR1cm4gSmFlZ2VyU3BhbkNvbnRleHQuZnJvbVN0cmluZyhgJHt0cmFjZUlkfToke3NwYW5JZH06MDoxYCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dHJhY3RQYXJlbnRTcGFuKHRyYWNlcjogVHJhY2VyLCByZXE6IGFueSk6IGFueSB7XG4gICAgICAgIGxldCBjdHhfc3JjLFxuICAgICAgICAgICAgY3R4X2ZybTtcbiAgICAgICAgaWYgKHJlcS5oZWFkZXJzKSB7XG4gICAgICAgICAgICBjdHhfc3JjID0gcmVxLmhlYWRlcnM7XG4gICAgICAgICAgICBjdHhfZnJtID0gRk9STUFUX1RFWFRfTUFQO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3R4X3NyYyA9IHJlcS5jb250ZXh0O1xuICAgICAgICAgICAgY3R4X2ZybSA9IEZPUk1BVF9CSU5BUlk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRyYWNlci5leHRyYWN0KGN0eF9mcm0sIGN0eF9zcmMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRQYXJlbnRTcGFuKHRyYWNlcjogVHJhY2VyLCBjb250ZXh0OiBhbnkpOiAoU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBjb250ZXh0LnRyYWNlclBhcmVudFNwYW47XG4gICAgfVxuXG4gICAgc3RhdGljIGZhaWxlZCh0cmFjZXI6IFRyYWNlciwgc3BhbjogU3BhbiwgZXJyb3I6IGFueSkge1xuICAgICAgICBzcGFuLmxvZyh7XG4gICAgICAgICAgICBldmVudDogJ2ZhaWxlZCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB0b0xvZyhlcnJvciksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBhc3luYyB0cmFjZTxUPihcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZjogKHNwYW46IFNwYW4pID0+IFByb21pc2U8VD4sXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IHRyYWNlci5zdGFydFNwYW4obmFtZSwgeyBjaGlsZE9mOiBwYXJlbnRTcGFuIH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3Bhbi5zZXRUYWcoVGFncy5TUEFOX0tJTkQsICdzZXJ2ZXInKTtcbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKFFUcmFjZXIuY29uZmlnLmphZWdlci50YWdzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcobmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZihzcGFuKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXN1bHQnLCB0b0xvZyhyZXN1bHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgUVRyYWNlci5mYWlsZWQodHJhY2VyLCBzcGFuLCBjbGVhbmVkKTtcbiAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICB0aHJvdyBjbGVhbmVkO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19