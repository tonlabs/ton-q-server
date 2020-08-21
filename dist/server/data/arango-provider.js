"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ArangoProvider = void 0;

var _arangochair = _interopRequireDefault(require("arangochair"));

var _arangojs = require("arangojs");

var _events = _interopRequireDefault(require("events"));

var _config = require("../config");

var _dataProvider = require("./data-provider");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DATA_EVENT = 'data';

class ArangoProvider {
  constructor(log, segment, config) {
    this.log = log;
    this.segment = segment;
    this.config = config;
    this.started = false;
    this.arango = new _arangojs.Database({
      url: `${(0, _config.ensureProtocol)(config.server, 'http')}`,
      agentOptions: {
        maxSockets: config.maxSockets
      }
    });
    this.arango.useDatabase(config.name);

    if (config.auth) {
      const authParts = config.auth.split(':');
      this.arango.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
    }

    this.listener = this.createListener();
    this.listenerSubscribers = new _events.default();
    this.listenerSubscribers.setMaxListeners(0);
    this.listenerStarted = false;
  }

  start() {
    this.checkStartListener();
  }

  getCollectionIndexes(collection) {
    return this.arango.collection(collection).indexes();
  }

  async query(text, vars) {
    const cursor = await this.arango.query(text, vars);
    return cursor.all();
  }

  async subscribe(collection, listener) {
    var _this$listenerSubscri;

    (_this$listenerSubscri = this.listenerSubscribers) === null || _this$listenerSubscri === void 0 ? void 0 : _this$listenerSubscri.on(DATA_EVENT, listener);
    this.checkStartListener();
    return listener;
  }

  unsubscribe(subscription) {
    var _this$listenerSubscri2;

    (_this$listenerSubscri2 = this.listenerSubscribers) === null || _this$listenerSubscri2 === void 0 ? void 0 : _this$listenerSubscri2.removeListener(DATA_EVENT, subscription);
  } // Internals


  checkStartListener() {
    const hasSubscribers = this.listenerSubscribers.listenerCount(DATA_EVENT) > 0;

    if (this.started && !this.listenerStarted && hasSubscribers) {
      this.listenerStarted = true;
      this.listener.start();
    }
  }

  createListener() {
    const {
      server,
      name,
      auth
    } = this.config;
    const listenerUrl = `${(0, _config.ensureProtocol)(server, 'http')}/${name}`;
    const listener = new _arangochair.default(listenerUrl);

    if (this.config.auth) {
      const userPassword = Buffer.from(auth).toString('base64');
      listener.req.opts.headers['Authorization'] = `Basic ${userPassword}`;
    }

    Object.values(_dataProvider.dataCollectionInfo).forEach(value => {
      const collectionInfo = value;
      const collectionName = collectionInfo.name;
      listener.subscribe({
        collection: collectionName
      });
      listener.on(name, (docJson, type) => {
        if (type === 'insert/update' || type === 'insert' || type === 'update') {
          this.onDataEvent(type, collectionName, docJson);
        }
      });
    });
    listener.on('error', (err, status, headers, body) => {
      let error = err;

      try {
        error = JSON.parse(body);
      } catch {}

      this.log.error('FAILED', 'LISTEN', `${err}`, error);
      setTimeout(() => listener.start(), this.config.listenerRestartTimeout || 1000);
    });
    return listener;
  }

  onDataEvent(event, collection, doc) {
    var _this$listenerSubscri3;

    (_this$listenerSubscri3 = this.listenerSubscribers) === null || _this$listenerSubscri3 === void 0 ? void 0 : _this$listenerSubscri3.emit(collection, doc, event);
  }

}

exports.ArangoProvider = ArangoProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9hcmFuZ28tcHJvdmlkZXIuanMiXSwibmFtZXMiOlsiREFUQV9FVkVOVCIsIkFyYW5nb1Byb3ZpZGVyIiwiY29uc3RydWN0b3IiLCJsb2ciLCJzZWdtZW50IiwiY29uZmlnIiwic3RhcnRlZCIsImFyYW5nbyIsIkRhdGFiYXNlIiwidXJsIiwic2VydmVyIiwiYWdlbnRPcHRpb25zIiwibWF4U29ja2V0cyIsInVzZURhdGFiYXNlIiwibmFtZSIsImF1dGgiLCJhdXRoUGFydHMiLCJzcGxpdCIsInVzZUJhc2ljQXV0aCIsInNsaWNlIiwiam9pbiIsImxpc3RlbmVyIiwiY3JlYXRlTGlzdGVuZXIiLCJsaXN0ZW5lclN1YnNjcmliZXJzIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwibGlzdGVuZXJTdGFydGVkIiwic3RhcnQiLCJjaGVja1N0YXJ0TGlzdGVuZXIiLCJnZXRDb2xsZWN0aW9uSW5kZXhlcyIsImNvbGxlY3Rpb24iLCJpbmRleGVzIiwicXVlcnkiLCJ0ZXh0IiwidmFycyIsImN1cnNvciIsImFsbCIsInN1YnNjcmliZSIsIm9uIiwidW5zdWJzY3JpYmUiLCJzdWJzY3JpcHRpb24iLCJyZW1vdmVMaXN0ZW5lciIsImhhc1N1YnNjcmliZXJzIiwibGlzdGVuZXJDb3VudCIsImxpc3RlbmVyVXJsIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsIk9iamVjdCIsInZhbHVlcyIsImRhdGFDb2xsZWN0aW9uSW5mbyIsImZvckVhY2giLCJ2YWx1ZSIsImNvbGxlY3Rpb25JbmZvIiwiY29sbGVjdGlvbk5hbWUiLCJkb2NKc29uIiwidHlwZSIsIm9uRGF0YUV2ZW50IiwiZXJyIiwic3RhdHVzIiwiYm9keSIsImVycm9yIiwiSlNPTiIsInBhcnNlIiwic2V0VGltZW91dCIsImxpc3RlbmVyUmVzdGFydFRp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eUIsR0FBRCxFQUFNQyxNQUFOLEVBQWNaLE9BQWQsRUFBdUJhLElBQXZCLEtBQWdDO0FBQ2pELFVBQUlDLEtBQUssR0FBR0gsR0FBWjs7QUFDQSxVQUFJO0FBQ0FHLFFBQUFBLEtBQUssR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdILElBQVgsQ0FBUjtBQUNILE9BRkQsQ0FFRSxNQUFNLENBQ1A7O0FBQ0QsV0FBSzlELEdBQUwsQ0FBUytELEtBQVQsQ0FBZSxRQUFmLEVBQXlCLFFBQXpCLEVBQW9DLEdBQUVILEdBQUksRUFBMUMsRUFBNkNHLEtBQTdDO0FBQ0FHLE1BQUFBLFVBQVUsQ0FBQyxNQUFNaEQsUUFBUSxDQUFDTSxLQUFULEVBQVAsRUFBeUIsS0FBS3RCLE1BQUwsQ0FBWWlFLHNCQUFaLElBQXNDLElBQS9ELENBQVY7QUFDSCxLQVJEO0FBU0EsV0FBT2pELFFBQVA7QUFDSDs7QUFFRHlDLEVBQUFBLFdBQVcsQ0FBQ1MsS0FBRCxFQUFvQnpDLFVBQXBCLEVBQXdDMEMsR0FBeEMsRUFBbUQ7QUFBQTs7QUFDMUQsbUNBQUtqRCxtQkFBTCxrRkFBMEJrRCxJQUExQixDQUErQjNDLFVBQS9CLEVBQTJDMEMsR0FBM0MsRUFBZ0RELEtBQWhEO0FBQ0g7O0FBN0dnRCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFBcmFuZ29Db25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgeyBkYXRhQ29sbGVjdGlvbkluZm8gfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHR5cGUgeyBRRGF0YUV2ZW50LCBRRGF0YVByb3ZpZGVyLCBRRGF0YVNlZ21lbnQsIFFEb2MsIFFDb2xsZWN0aW9uSW5mbywgUUluZGV4SW5mbyB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5cbmNvbnN0IERBVEFfRVZFTlQgPSAnZGF0YSc7XG5cbnR5cGUgQXJhbmdvRXZlbnRIYW5kbGVyID0gKGVycjogYW55LCBzdGF0dXM6IHN0cmluZywgaGVhZGVyczogeyBbc3RyaW5nXTogYW55IH0sIGJvZHk6IHN0cmluZykgPT4gdm9pZDtcblxuaW50ZXJmYWNlIEFyYW5nb0xpc3RlbmVyIHtcbiAgICByZXE6IHtcbiAgICAgICAgb3B0czoge1xuICAgICAgICAgICAgaGVhZGVyczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb24oZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogQXJhbmdvRXZlbnRIYW5kbGVyKTogdm9pZDtcblxuICAgIHN1YnNjcmliZShwYXJhbXM6IHsgY29sbGVjdGlvbjogc3RyaW5nIH0pOiB2b2lkO1xuXG4gICAgc3RhcnQoKTogdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIEFyYW5nb1Byb3ZpZGVyIGltcGxlbWVudHMgUURhdGFQcm92aWRlciB7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlZ21lbnQ6IFFEYXRhU2VnbWVudDtcbiAgICBjb25maWc6IFFBcmFuZ29Db25maWc7XG5cbiAgICBzdGFydGVkOiBib29sZWFuO1xuICAgIGFyYW5nbzogRGF0YWJhc2U7XG4gICAgbGlzdGVuZXI6IEFyYW5nb0xpc3RlbmVyO1xuICAgIGxpc3RlbmVyU3Vic2NyaWJlcnM6IEV2ZW50RW1pdHRlcjtcbiAgICBsaXN0ZW5lclN0YXJ0ZWQ6IGJvb2xlYW47XG5cblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBsb2c6IFFMb2csXG4gICAgICAgIHNlZ21lbnQ6IFFEYXRhU2VnbWVudCxcbiAgICAgICAgY29uZmlnOiBRQXJhbmdvQ29uZmlnLFxuICAgICkge1xuICAgICAgICB0aGlzLmxvZyA9IGxvZztcbiAgICAgICAgdGhpcy5zZWdtZW50ID0gc2VnbWVudDtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG5cbiAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXJhbmdvID0gbmV3IERhdGFiYXNlKHtcbiAgICAgICAgICAgIHVybDogYCR7ZW5zdXJlUHJvdG9jb2woY29uZmlnLnNlcnZlciwgJ2h0dHAnKX1gLFxuICAgICAgICAgICAgYWdlbnRPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgbWF4U29ja2V0czogY29uZmlnLm1heFNvY2tldHMsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hcmFuZ28udXNlRGF0YWJhc2UoY29uZmlnLm5hbWUpO1xuICAgICAgICBpZiAoY29uZmlnLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGF1dGhQYXJ0cyA9IGNvbmZpZy5hdXRoLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB0aGlzLmFyYW5nby51c2VCYXNpY0F1dGgoYXV0aFBhcnRzWzBdLCBhdXRoUGFydHMuc2xpY2UoMSkuam9pbignOicpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVyID0gdGhpcy5jcmVhdGVMaXN0ZW5lcigpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyU3Vic2NyaWJlcnMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJTdWJzY3JpYmVycy5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJTdGFydGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIHRoaXMuY2hlY2tTdGFydExpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgZ2V0Q29sbGVjdGlvbkluZGV4ZXMoY29sbGVjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxRSW5kZXhJbmZvW10+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJhbmdvLmNvbGxlY3Rpb24oY29sbGVjdGlvbikuaW5kZXhlcygpO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KHRleHQ6IHN0cmluZywgdmFyczogeyBbc3RyaW5nXTogYW55IH0pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmFyYW5nby5xdWVyeSh0ZXh0LCB2YXJzKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICB9XG5cbiAgICBhc3luYyBzdWJzY3JpYmUoY29sbGVjdGlvbjogc3RyaW5nLCBsaXN0ZW5lcjogKGRvYzogYW55LCBldmVudDogUURhdGFFdmVudCkgPT4gdm9pZCk6IGFueSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJTdWJzY3JpYmVycz8ub24oREFUQV9FVkVOVCwgbGlzdGVuZXIpO1xuICAgICAgICB0aGlzLmNoZWNrU3RhcnRMaXN0ZW5lcigpO1xuICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgfVxuXG5cbiAgICB1bnN1YnNjcmliZShzdWJzY3JpcHRpb246IGFueSkge1xuICAgICAgICB0aGlzLmxpc3RlbmVyU3Vic2NyaWJlcnM/LnJlbW92ZUxpc3RlbmVyKERBVEFfRVZFTlQsIHN1YnNjcmlwdGlvbik7XG4gICAgfVxuXG4gICAgLy8gSW50ZXJuYWxzXG5cbiAgICBjaGVja1N0YXJ0TGlzdGVuZXIoKSB7XG4gICAgICAgIGNvbnN0IGhhc1N1YnNjcmliZXJzID0gdGhpcy5saXN0ZW5lclN1YnNjcmliZXJzLmxpc3RlbmVyQ291bnQoREFUQV9FVkVOVCkgPiAwO1xuICAgICAgICBpZiAodGhpcy5zdGFydGVkICYmICF0aGlzLmxpc3RlbmVyU3RhcnRlZCAmJiBoYXNTdWJzY3JpYmVycykge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lclN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3JlYXRlTGlzdGVuZXIoKTogQXJhbmdvTGlzdGVuZXIge1xuICAgICAgICBjb25zdCB7IHNlcnZlciwgbmFtZSwgYXV0aCB9ID0gdGhpcy5jb25maWc7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyVXJsID0gYCR7ZW5zdXJlUHJvdG9jb2woc2VydmVyLCAnaHR0cCcpfS8ke25hbWV9YDtcblxuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJQYXNzd29yZCA9IEJ1ZmZlci5mcm9tKGF1dGgpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgICAgIGxpc3RlbmVyLnJlcS5vcHRzLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IGBCYXNpYyAke3VzZXJQYXNzd29yZH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LnZhbHVlcyhkYXRhQ29sbGVjdGlvbkluZm8pLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uSW5mbyA9ICgodmFsdWU6IGFueSk6IFFDb2xsZWN0aW9uSW5mbyk7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb25JbmZvLm5hbWU7XG4gICAgICAgICAgICBsaXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uTmFtZSB9KTtcbiAgICAgICAgICAgIGxpc3RlbmVyLm9uKG5hbWUsIChkb2NKc29uLCB0eXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdpbnNlcnQvdXBkYXRlJyB8fCB0eXBlID09PSAnaW5zZXJ0JyB8fCB0eXBlID09PSAndXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRGF0YUV2ZW50KHR5cGUsIGNvbGxlY3Rpb25OYW1lLCBkb2NKc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcblxuICAgICAgICBsaXN0ZW5lci5vbignZXJyb3InLCAoZXJyLCBzdGF0dXMsIGhlYWRlcnMsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIGxldCBlcnJvciA9IGVycjtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRkFJTEVEJywgJ0xJU1RFTicsIGAke2Vycn1gLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyUmVzdGFydFRpbWVvdXQgfHwgMTAwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgfVxuXG4gICAgb25EYXRhRXZlbnQoZXZlbnQ6IFFEYXRhRXZlbnQsIGNvbGxlY3Rpb246IHN0cmluZywgZG9jOiBRRG9jKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJTdWJzY3JpYmVycz8uZW1pdChjb2xsZWN0aW9uLCBkb2MsIGV2ZW50KTtcbiAgICB9XG5cbn1cbiJdfQ==