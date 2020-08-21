"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolversMam = void 0;

var _data = _interopRequireDefault(require("../data/data"));

var _collection = require("../data/collection");

var _dataProvider = require("../data/data-provider");

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  version
} = (0, _utils.packageJson)();

// Query
function info() {
  return {
    version
  };
}

function stat(_parent, args, context) {
  (0, _collection.mamAccessRequired)(context, args);
  const data = context.data;
  let totalWaitForCount = 0;
  let totalSubscriptionCount = 0;
  const collections = data.collections.map(collection => {
    totalWaitForCount += collection.waitForCount;
    totalSubscriptionCount += collection.subscriptionCount;
    return {
      name: collection.name,
      subscriptionCount: collection.subscriptionCount,
      waitForCount: collection.waitForCount,
      maxQueueSize: collection.maxQueueSize,
      subscriptions: [],
      waitFor: []
    };
  });
  return {
    waitForCount: totalWaitForCount,
    subscriptionCount: totalSubscriptionCount,
    collections
  };
}

async function getCollections(_parent, args, context) {
  (0, _collection.mamAccessRequired)(context, args);
  const data = context.data;
  const collections = [];

  for (const collection of data.collections) {
    const indexes = [];

    for (const index of await collection.getIndexes()) {
      indexes.push(index.fields.join(', '));
    }

    collections.push({
      name: collection.name,
      count: 0,
      indexes
    });
  }

  return collections;
}

async function dropCachedDbInfo(_parent, args, context) {
  (0, _collection.mamAccessRequired)(context, args);
  context.data.dropCachedDbInfo();
  return true;
} // Mutation


const resolversMam = {
  Query: {
    info,
    getCollections,
    stat
  },
  Mutation: {
    dropCachedDbInfo
  }
};
exports.resolversMam = resolversMam;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZ3JhcGhxbC9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbInZlcnNpb24iLCJpbmZvIiwic3RhdCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsImRhdGEiLCJ0b3RhbFdhaXRGb3JDb3VudCIsInRvdGFsU3Vic2NyaXB0aW9uQ291bnQiLCJjb2xsZWN0aW9ucyIsIm1hcCIsImNvbGxlY3Rpb24iLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsIm5hbWUiLCJtYXhRdWV1ZVNpemUiLCJzdWJzY3JpcHRpb25zIiwid2FpdEZvciIsImdldENvbGxlY3Rpb25zIiwiaW5kZXhlcyIsImluZGV4IiwiZ2V0SW5kZXhlcyIsInB1c2giLCJmaWVsZHMiLCJqb2luIiwiY291bnQiLCJkcm9wQ2FjaGVkRGJJbmZvIiwicmVzb2x2ZXJzTWFtIiwiUXVlcnkiLCJNdXRhdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0EsTUFBTTtBQUFDQSxFQUFBQTtBQUFELElBQVkseUJBQWxCOztBQWlDQTtBQUVBLFNBQVNDLElBQVQsR0FBc0I7QUFDbEIsU0FBTztBQUNIRCxJQUFBQTtBQURHLEdBQVA7QUFHSDs7QUFFRCxTQUFTRSxJQUFULENBQWNDLE9BQWQsRUFBNEJDLElBQTVCLEVBQXVDQyxPQUF2QyxFQUErRTtBQUMzRSxxQ0FBa0JBLE9BQWxCLEVBQTJCRCxJQUEzQjtBQUNBLFFBQU1FLElBQVcsR0FBR0QsT0FBTyxDQUFDQyxJQUE1QjtBQUNBLE1BQUlDLGlCQUFpQixHQUFHLENBQXhCO0FBQ0EsTUFBSUMsc0JBQXNCLEdBQUcsQ0FBN0I7QUFDQSxRQUFNQyxXQUFXLEdBQUdILElBQUksQ0FBQ0csV0FBTCxDQUFpQkMsR0FBakIsQ0FBc0JDLFVBQUQsSUFBaUM7QUFDdEVKLElBQUFBLGlCQUFpQixJQUFJSSxVQUFVLENBQUNDLFlBQWhDO0FBQ0FKLElBQUFBLHNCQUFzQixJQUFJRyxVQUFVLENBQUNFLGlCQUFyQztBQUNBLFdBQU87QUFDSEMsTUFBQUEsSUFBSSxFQUFFSCxVQUFVLENBQUNHLElBRGQ7QUFFSEQsTUFBQUEsaUJBQWlCLEVBQUVGLFVBQVUsQ0FBQ0UsaUJBRjNCO0FBR0hELE1BQUFBLFlBQVksRUFBRUQsVUFBVSxDQUFDQyxZQUh0QjtBQUlIRyxNQUFBQSxZQUFZLEVBQUVKLFVBQVUsQ0FBQ0ksWUFKdEI7QUFLSEMsTUFBQUEsYUFBYSxFQUFFLEVBTFo7QUFNSEMsTUFBQUEsT0FBTyxFQUFFO0FBTk4sS0FBUDtBQVFILEdBWG1CLENBQXBCO0FBWUEsU0FBTztBQUNITCxJQUFBQSxZQUFZLEVBQUVMLGlCQURYO0FBRUhNLElBQUFBLGlCQUFpQixFQUFFTCxzQkFGaEI7QUFHSEMsSUFBQUE7QUFIRyxHQUFQO0FBS0g7O0FBRUQsZUFBZVMsY0FBZixDQUE4QmYsT0FBOUIsRUFBNENDLElBQTVDLEVBQXVEQyxPQUF2RCxFQUF1SDtBQUNuSCxxQ0FBa0JBLE9BQWxCLEVBQTJCRCxJQUEzQjtBQUNBLFFBQU1FLElBQVcsR0FBR0QsT0FBTyxDQUFDQyxJQUE1QjtBQUNBLFFBQU1HLFdBQWdDLEdBQUcsRUFBekM7O0FBQ0EsT0FBSyxNQUFNRSxVQUFYLElBQXlCTCxJQUFJLENBQUNHLFdBQTlCLEVBQTJDO0FBQ3ZDLFVBQU1VLE9BQWlCLEdBQUcsRUFBMUI7O0FBQ0EsU0FBSyxNQUFNQyxLQUFYLElBQW9CLE1BQU1ULFVBQVUsQ0FBQ1UsVUFBWCxFQUExQixFQUFtRDtBQUMvQ0YsTUFBQUEsT0FBTyxDQUFDRyxJQUFSLENBQWFGLEtBQUssQ0FBQ0csTUFBTixDQUFhQyxJQUFiLENBQWtCLElBQWxCLENBQWI7QUFDSDs7QUFDRGYsSUFBQUEsV0FBVyxDQUFDYSxJQUFaLENBQWlCO0FBQ2JSLE1BQUFBLElBQUksRUFBRUgsVUFBVSxDQUFDRyxJQURKO0FBRWJXLE1BQUFBLEtBQUssRUFBRSxDQUZNO0FBR2JOLE1BQUFBO0FBSGEsS0FBakI7QUFLSDs7QUFDRCxTQUFPVixXQUFQO0FBQ0g7O0FBRUQsZUFBZWlCLGdCQUFmLENBQWdDdkIsT0FBaEMsRUFBOENDLElBQTlDLEVBQXlEQyxPQUF6RCxFQUE2RztBQUN6RyxxQ0FBa0JBLE9BQWxCLEVBQTJCRCxJQUEzQjtBQUNBQyxFQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYW9CLGdCQUFiO0FBQ0EsU0FBTyxJQUFQO0FBQ0gsQyxDQUVEOzs7QUFFTyxNQUFNQyxZQUFZLEdBQUc7QUFDeEJDLEVBQUFBLEtBQUssRUFBRTtBQUNIM0IsSUFBQUEsSUFERztBQUVIaUIsSUFBQUEsY0FGRztBQUdIaEIsSUFBQUE7QUFIRyxHQURpQjtBQU14QjJCLEVBQUFBLFFBQVEsRUFBRTtBQUNOSCxJQUFBQTtBQURNO0FBTmMsQ0FBckIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuXG5pbXBvcnQgUURhdGEgZnJvbSBcIi4uL2RhdGEvZGF0YVwiO1xuaW1wb3J0IHsgUURhdGFDb2xsZWN0aW9uLCBtYW1BY2Nlc3NSZXF1aXJlZCB9IGZyb20gXCIuLi9kYXRhL2NvbGxlY3Rpb25cIjtcbmltcG9ydCB7IGRhdGFTZWdtZW50IH0gZnJvbSAnLi4vZGF0YS9kYXRhLXByb3ZpZGVyJztcbmltcG9ydCB0eXBlIHsgR3JhcGhRTFJlcXVlc3RDb250ZXh0RXggfSBmcm9tIFwiLi9yZXNvbHZlcnMtY3VzdG9tXCI7XG5pbXBvcnQge3BhY2thZ2VKc29ufSBmcm9tICcuLi91dGlscyc7XG5jb25zdCB7dmVyc2lvbn0gPSBwYWNrYWdlSnNvbigpO1xuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIExpc3RlbmVyU3RhdCA9IHtcbiAgICBmaWx0ZXI6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IHN0cmluZyxcbiAgICBxdWV1ZVNpemU6IG51bWJlcixcbiAgICBldmVudENvdW50OiBudW1iZXIsXG4gICAgc2Vjb25kc0FjdGl2ZTogbnVtYmVyLFxufVxuXG50eXBlIENvbGxlY3Rpb25TdGF0ID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyLFxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyLFxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyLFxuICAgIHN1YnNjcmlwdGlvbnM6IExpc3RlbmVyU3RhdFtdLFxuICAgIHdhaXRGb3I6IExpc3RlbmVyU3RhdFtdLFxufVxuXG50eXBlIFN0YXQgPSB7XG4gICAgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdGF0W11cbn1cblxudHlwZSBDb2xsZWN0aW9uU3VtbWFyeSA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBpbmRleGVzOiBzdHJpbmdbXSxcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHN0YXQoX3BhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogU3RhdCB7XG4gICAgbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dCwgYXJncyk7XG4gICAgY29uc3QgZGF0YTogUURhdGEgPSBjb250ZXh0LmRhdGE7XG4gICAgbGV0IHRvdGFsV2FpdEZvckNvdW50ID0gMDtcbiAgICBsZXQgdG90YWxTdWJzY3JpcHRpb25Db3VudCA9IDA7XG4gICAgY29uc3QgY29sbGVjdGlvbnMgPSBkYXRhLmNvbGxlY3Rpb25zLm1hcCgoY29sbGVjdGlvbjogUURhdGFDb2xsZWN0aW9uKSA9PiB7XG4gICAgICAgIHRvdGFsV2FpdEZvckNvdW50ICs9IGNvbGxlY3Rpb24ud2FpdEZvckNvdW50O1xuICAgICAgICB0b3RhbFN1YnNjcmlwdGlvbkNvdW50ICs9IGNvbGxlY3Rpb24uc3Vic2NyaXB0aW9uQ291bnQ7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25Db3VudDogY29sbGVjdGlvbi5zdWJzY3JpcHRpb25Db3VudCxcbiAgICAgICAgICAgIHdhaXRGb3JDb3VudDogY29sbGVjdGlvbi53YWl0Rm9yQ291bnQsXG4gICAgICAgICAgICBtYXhRdWV1ZVNpemU6IGNvbGxlY3Rpb24ubWF4UXVldWVTaXplLFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uczogW10sXG4gICAgICAgICAgICB3YWl0Rm9yOiBbXSxcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHdhaXRGb3JDb3VudDogdG90YWxXYWl0Rm9yQ291bnQsXG4gICAgICAgIHN1YnNjcmlwdGlvbkNvdW50OiB0b3RhbFN1YnNjcmlwdGlvbkNvdW50LFxuICAgICAgICBjb2xsZWN0aW9ucyxcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRDb2xsZWN0aW9ucyhfcGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPENvbGxlY3Rpb25TdW1tYXJ5W10+IHtcbiAgICBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0LCBhcmdzKTtcbiAgICBjb25zdCBkYXRhOiBRRGF0YSA9IGNvbnRleHQuZGF0YTtcbiAgICBjb25zdCBjb2xsZWN0aW9uczogQ29sbGVjdGlvblN1bW1hcnlbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY29sbGVjdGlvbiBvZiBkYXRhLmNvbGxlY3Rpb25zKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaW5kZXggb2YgYXdhaXQgY29sbGVjdGlvbi5nZXRJbmRleGVzKCkpIHtcbiAgICAgICAgICAgIGluZGV4ZXMucHVzaChpbmRleC5maWVsZHMuam9pbignLCAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29sbGVjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICAgIGluZGV4ZXMsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRyb3BDYWNoZWREYkluZm8oX3BhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dCwgYXJncyk7XG4gICAgY29udGV4dC5kYXRhLmRyb3BDYWNoZWREYkluZm8oKTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gTXV0YXRpb25cblxuZXhwb3J0IGNvbnN0IHJlc29sdmVyc01hbSA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRDb2xsZWN0aW9ucyxcbiAgICAgICAgc3RhdFxuICAgIH0sXG4gICAgTXV0YXRpb246IHtcbiAgICAgICAgZHJvcENhY2hlZERiSW5mbyxcbiAgICB9XG59O1xuIl19