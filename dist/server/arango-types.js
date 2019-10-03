"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.struct = struct;
exports.array = array;
exports.join = join;
exports.joinArray = joinArray;
exports.scalar = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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
function qlFields(path, filter, fieldTypes, qlField) {
  var conditions = [];
  Object.entries(filter).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        filterKey = _ref2[0],
        filterValue = _ref2[1];

    var fieldType = fieldTypes[filterKey];

    if (fieldType) {
      conditions.push(qlField(fieldType, path, filterKey, filterValue));
    }
  });
  return qlCombine(conditions, 'AND', 'false');
}

function testFields(value, filter, fieldTypes, testField) {
  var failed = Object.entries(filter).find(function (_ref3) {
    var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
        filterKey = _ref4[0],
        filterValue = _ref4[1];

    var fieldType = fieldTypes[filterKey];
    return !!(fieldType && testField(fieldType, value, filterKey, filterValue));
  });
  return !failed;
}

function combine(path, key) {
  return key !== '' ? "".concat(path, ".").concat(key) : path;
}

function qlOp(path, op, filter) {
  return "".concat(path, " ").concat(op, " ").concat(JSON.stringify(filter));
}

function qlCombine(conditions, op, defaultConditions) {
  if (conditions.length === 0) {
    return defaultConditions;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return '(' + conditions.join(") ".concat(op, " (")) + ')';
}

function qlIn(path, filter) {
  var conditions = filter.map(function (value) {
    return qlOp(path, '==', value);
  });
  return qlCombine(conditions, 'OR', 'false');
} // Scalars


var scalarEq = {
  ql: function ql(path, filter) {
    return qlOp(path, '==', filter);
  },
  test: function test(value, filter) {
    return value === filter;
  }
};
var scalarNe = {
  ql: function ql(path, filter) {
    return qlOp(path, '!=', filter);
  },
  test: function test(value, filter) {
    return value !== filter;
  }
};
var scalarLt = {
  ql: function ql(path, filter) {
    return qlOp(path, '<', filter);
  },
  test: function test(value, filter) {
    return value < filter;
  }
};
var scalarLe = {
  ql: function ql(path, filter) {
    return qlOp(path, '<=', filter);
  },
  test: function test(value, filter) {
    return value <= filter;
  }
};
var scalarGt = {
  ql: function ql(path, filter) {
    return qlOp(path, '>', filter);
  },
  test: function test(value, filter) {
    return value > filter;
  }
};
var scalarGe = {
  ql: function ql(path, filter) {
    return qlOp(path, '>=', filter);
  },
  test: function test(value, filter) {
    return value >= filter;
  }
};
var scalarIn = {
  ql: function ql(path, filter) {
    return qlIn(path, filter);
  },
  test: function test(value, filter) {
    return filter.includes(value);
  }
};
var scalarNotIn = {
  ql: function ql(path, filter) {
    return "NOT (".concat(qlIn(path, filter), ")");
  },
  test: function test(value, filter) {
    return !filter.includes(value);
  }
};

function createScalar() {
  var fields = {
    eq: scalarEq,
    ne: scalarNe,
    lt: scalarLt,
    le: scalarLe,
    gt: scalarGt,
    ge: scalarGe,
    "in": scalarIn,
    notIn: scalarNotIn
  };
  return {
    ql: function ql(path, filter) {
      return qlFields(path, filter, fields, function (op, path, filterKey, filterValue) {
        return op.ql(path, filterValue);
      });
    },
    test: function test(value, filter) {
      return testFields(value, filter, fields, function (op, value, filterKey, filterValue) {
        return op.test(value, filterValue);
      });
    }
  };
}

var scalar = createScalar(); // Structs

exports.scalar = scalar;

function struct(fields, isCollection) {
  return {
    ql: function ql(path, filter) {
      return qlFields(path, filter, fields, function (fieldType, path, filterKey, filterValue) {
        var fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
        return fieldType.ql(combine(path, fieldName), filterValue);
      });
    },
    test: function test(value, filter) {
      if (!value) {
        return false;
      }

      return testFields(value, filter, fields, function (fieldType, value, filterKey, filterValue) {
        var fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
        return fieldType.test(value[fieldName], filterValue);
      });
    }
  };
} // Arrays


function array(itemType) {
  var ops = {
    all: {
      ql: function ql(path, filter) {
        var itemQl = itemType.ql('CURRENT', filter);
        return "LENGTH(".concat(path, "[* FILTER ").concat(itemQl, "]) == LENGTH(").concat(path, ")");
      },
      test: function test(value, filter) {
        var failedIndex = value.findIndex(function (x) {
          return !itemType.test(x, filter);
        });
        return failedIndex < 0;
      }
    },
    any: {
      ql: function ql(path, filter) {
        var itemQl = itemType.ql('CURRENT', filter);
        return "LENGTH(".concat(path, "[* FILTER ").concat(itemQl, "]) > 0");
      },
      test: function test(value, filter) {
        var succeededIndex = value.findIndex(function (x) {
          return itemType.test(x, filter);
        });
        return succeededIndex >= 0;
      }
    }
  };
  return {
    ql: function ql(path, filter) {
      return qlFields(path, filter, ops, function (op, path, filterKey, filterValue) {
        return op.ql(path, filterValue);
      });
    },
    test: function test(value, filter) {
      if (!value) {
        return false;
      }

      return testFields(value, filter, ops, function (op, value, filterKey, filterValue) {
        return op.test(value, filterValue);
      });
    }
  };
} // Joins


function join(onField, refCollection, refType) {
  return {
    ql: function ql(path, filter) {
      var on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      var alias = "".concat(on_path.replace('.', '_'));
      var refQl = refType.ql(alias, filter);
      return "\n                LENGTH(\n                    FOR ".concat(alias, " IN ").concat(refCollection, " \n                    FILTER (").concat(alias, "._key == ").concat(on_path, ") AND (").concat(refQl, ")\n                    LIMIT 1\n                    RETURN 1\n                ) > 0");
    },
    test: refType.test
  };
}

function joinArray(onField, refCollection, refType) {
  return {
    ql: function ql(path, filter) {
      var refFilter = filter.all || filter.any;
      var all = !!filter.all;
      var on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      var alias = "".concat(on_path.replace('.', '_'));
      var refQl = refType.ql(alias, refFilter);
      return "\n                (LENGTH(".concat(on_path, ") > 0)\n                AND (LENGTH(\n                    FOR ").concat(alias, " IN ").concat(refCollection, " \n                    FILTER (").concat(alias, "._key IN ").concat(on_path, ") AND (").concat(refQl, ")\n                    ").concat(!all ? 'LIMIT 1' : '', "\n                    RETURN 1\n                ) ").concat(all ? "== LENGTH(".concat(on_path, ")") : '> 0', ")");
    },
    test: refType.test
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tdHlwZXMuanMiXSwibmFtZXMiOlsicWxGaWVsZHMiLCJwYXRoIiwiZmlsdGVyIiwiZmllbGRUeXBlcyIsInFsRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidmFsdWUiLCJ0ZXN0RmllbGQiLCJmYWlsZWQiLCJmaW5kIiwiY29tYmluZSIsImtleSIsInFsT3AiLCJvcCIsIkpTT04iLCJzdHJpbmdpZnkiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImxlbmd0aCIsImpvaW4iLCJxbEluIiwibWFwIiwic2NhbGFyRXEiLCJxbCIsInRlc3QiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwiY3JlYXRlU2NhbGFyIiwiZmllbGRzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwibm90SW4iLCJzY2FsYXIiLCJzdHJ1Y3QiLCJpc0NvbGxlY3Rpb24iLCJmaWVsZE5hbWUiLCJhcnJheSIsIml0ZW1UeXBlIiwib3BzIiwiYWxsIiwiaXRlbVFsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJ4IiwiYW55Iiwic3VjY2VlZGVkSW5kZXgiLCJvbkZpZWxkIiwicmVmQ29sbGVjdGlvbiIsInJlZlR5cGUiLCJvbl9wYXRoIiwic3BsaXQiLCJzbGljZSIsImNvbmNhdCIsImFsaWFzIiwicmVwbGFjZSIsInJlZlFsIiwiam9pbkFycmF5IiwicmVmRmlsdGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLFNBQVNBLFFBQVQsQ0FDSUMsSUFESixFQUVJQyxNQUZKLEVBR0lDLFVBSEosRUFJSUMsT0FK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QUFNLENBQUN1RCxHQUFQLElBQWN2RCxNQUFNLENBQUM0RCxHQUF2QztBQUNBLFVBQU1MLEdBQUcsR0FBRyxDQUFDLENBQUN2RCxNQUFNLENBQUN1RCxHQUFyQjtBQUNBLFVBQU1VLE9BQU8sR0FBR2xFLElBQUksQ0FBQ21FLEtBQUwsQ0FBVyxHQUFYLEVBQWdCQyxLQUFoQixDQUFzQixDQUF0QixFQUF5QixDQUFDLENBQTFCLEVBQTZCQyxNQUE3QixDQUFvQ04sT0FBcEMsRUFBNkNyQyxJQUE3QyxDQUFrRCxHQUFsRCxDQUFoQjtBQUNBLFVBQU00QyxLQUFLLGFBQU1KLE9BQU8sQ0FBQ0ssT0FBUixDQUFnQixHQUFoQixFQUFxQixHQUFyQixDQUFOLENBQVg7QUFDQSxVQUFNQyxLQUFLLEdBQUdQLE9BQU8sQ0FBQ25DLEVBQVIsQ0FBV3dDLEtBQVgsRUFBa0JJLFNBQWxCLENBQWQ7QUFDQSxpREFDY1IsT0FEZCwyRUFHY0ksS0FIZCxpQkFHMEJOLGFBSDFCLDRDQUlrQk0sS0FKbEIsc0JBSW1DSixPQUpuQyxvQkFJb0RNLEtBSnBELG9DQUtVLENBQUNoQixHQUFELEdBQU8sU0FBUCxHQUFtQixFQUw3QiwrREFPUUEsR0FBRyx1QkFBZ0JVLE9BQWhCLFNBQTZCLEtBUHhDO0FBUUgsS0FmRTtBQWdCSG5DLElBQUFBLElBQUksRUFBRWtDLE9BQU8sQ0FBQ2xDO0FBaEJYLEdBQVA7QUFrQkgiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnR5cGUgUVR5cGUgPSB7XG4gICAgcWw6IChwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG4gICAgdGVzdDogKHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5mdW5jdGlvbiBxbEZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBxbEZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2gocWxGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhblxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICByZXR1cm4gISEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cblxuZnVuY3Rpb24gY29tYmluZShwYXRoOiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4ga2V5ICE9PSAnJyA/IGAke3BhdGh9LiR7a2V5fWAgOiBwYXRoO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtwYXRofSAke29wfSAke0pTT04uc3RyaW5naWZ5KGZpbHRlcil9YDtcbn1cblxuZnVuY3Rpb24gcWxDb21iaW5lKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBxbEluKHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBmaWx0ZXIubWFwKHZhbHVlID0+IHFsT3AocGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLyBTY2FsYXJzXG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc8JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGF0aCwgJz49JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbEluKHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7cWxJbihwYXRoLCBmaWx0ZXIpfSlgO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVTY2FsYXIoKTogUVR5cGUge1xuICAgIGNvbnN0IGZpZWxkcyA9IHtcbiAgICAgICAgZXE6IHNjYWxhckVxLFxuICAgICAgICBuZTogc2NhbGFyTmUsXG4gICAgICAgIGx0OiBzY2FsYXJMdCxcbiAgICAgICAgbGU6IHNjYWxhckxlLFxuICAgICAgICBndDogc2NhbGFyR3QsXG4gICAgICAgIGdlOiBzY2FsYXJHZSxcbiAgICAgICAgaW46IHNjYWxhckluLFxuICAgICAgICBub3RJbjogc2NhbGFyTm90SW4sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIGZpZWxkcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIGZpZWxkcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcblxuLy8gU3RydWN0c1xuXG5mdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUucWwoY29tYmluZShwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBhcnJheShpdGVtVHlwZTogUVR5cGUpOiBRVHlwZSB7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKCdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID09IExFTkdUSCgke3BhdGh9KWA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdCh4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtUWwgPSBpdGVtVHlwZS5xbCgnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdCh4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgb3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gSm9pbnNcblxuZnVuY3Rpb24gam9pbihvbkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVmVHlwZTogUVR5cGUpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZRbCA9IHJlZlR5cGUucWwoYWxpYXMsIGZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn0gXG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiByZWZUeXBlLnRlc3QsXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gam9pbkFycmF5KG9uRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZWZUeXBlOiBRVHlwZSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlciA9IGZpbHRlci5hbGwgfHwgZmlsdGVyLmFueTtcbiAgICAgICAgICAgIGNvbnN0IGFsbCA9ICEhZmlsdGVyLmFsbDtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChhbGlhcywgcmVmRmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgKExFTkdUSCgke29uX3BhdGh9KSA+IDApXG4gICAgICAgICAgICAgICAgQU5EIChMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259IFxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHJlZlR5cGUudGVzdCxcbiAgICB9O1xufVxuXG5leHBvcnQge1xuICAgIHNjYWxhcixcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXlcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlXG59XG5cbiJdfQ==