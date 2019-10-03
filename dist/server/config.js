"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _os = _interopRequireDefault(require("os"));

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
var program = require('commander');

function getIp() {
  var ipv4 = Object.values(_os["default"].networkInterfaces()).flatMap(function (x) {
    return x;
  }).find(function (x) {
    return x.family === 'IPv4' && !x.internal;
  });
  return ipv4 && ipv4.address;
}

var MODE = {
  production: 'production',
  development: 'development'
};
program.option('-h, --host <host>', 'listening address', process.env.Q_SERVER_HOST || getIp()).option('-p, --port <port>', 'listening port', process.env.Q_SERVER_PORT || '4000').option('-d, --db-server <address>', 'database server:port', process.env.Q_DATABASE_SERVER || 'arangodb:8529').option('-n, --db-name <name>', 'database name', process.env.Q_DATABASE_NAME || 'blockchain').parse(process.argv);
var options = program;
var env = {
  ssl: (process.env.Q_SSL || '') === 'true',
  database_server: options.dbServer,
  database_name: options.dbName,
  server_host: options.host,
  server_port: options.port
};
var config = {
  server: {
    host: env.server_host,
    port: Number.parseInt(env.server_port),
    ssl: env.ssl ? {
      port: 4001,
      key: 'server/ssl/server.key',
      cert: 'server/ssl/server.crt'
    } : null
  },
  database: {
    server: env.database_server,
    name: env.database_name
  },
  listener: {
    restartTimeout: 1000
  }
};
console.log('Using config:', config);
var _default = config;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jb25maWcuanMiXSwibmFtZXMiOlsicHJvZ3JhbSIsInJlcXVpcmUiLCJnZXRJcCIsImlwdjQiLCJPYmplY3QiLCJ2YWx1ZXMiLCJvcyIsIm5ldHdvcmtJbnRlcmZhY2VzIiwiZmxhdE1hcCIsIngiLCJmaW5kIiwiZmFtaWx5IiwiaW50ZXJuYWwiLCJhZGRyZXNzIiwiTU9ERSIsInByb2R1Y3Rpb24iLCJkZXZlbG9wbWVudCIsIm9wdGlvbiIsInByb2Nlc3MiLCJlbnYiLCJRX1NFUlZFUl9IT1NUIiwiUV9TRVJWRVJfUE9SVCIsIlFfREFUQUJBU0VfU0VSVkVSIiwiUV9EQVRBQkFTRV9OQU1FIiwicGFyc2UiLCJhcmd2Iiwib3B0aW9ucyIsInNzbCIsIlFfU1NMIiwiZGF0YWJhc2Vfc2VydmVyIiwiZGJTZXJ2ZXIiLCJkYXRhYmFzZV9uYW1lIiwiZGJOYW1lIiwic2VydmVyX2hvc3QiLCJob3N0Iiwic2VydmVyX3BvcnQiLCJwb3J0IiwiY29uZmlnIiwic2VydmVyIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJrZXkiLCJjZXJ0IiwiZGF0YWJhc2UiLCJuYW1lIiwibGlzdGVuZXIiLCJyZXN0YXJ0VGltZW91dCIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWlCQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxJQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBQyxXQUFELENBQXZCOztBQUVBLFNBQVNDLEtBQVQsR0FBeUI7QUFDckIsTUFBTUMsSUFBSSxHQUFJQyxNQUFNLENBQUNDLE1BQVAsQ0FBY0MsZUFBR0MsaUJBQUgsRUFBZCxDQUFELENBQ1JDLE9BRFEsQ0FDQSxVQUFBQyxDQUFDO0FBQUEsV0FBSUEsQ0FBSjtBQUFBLEdBREQsRUFFUkMsSUFGUSxDQUVILFVBQUFELENBQUM7QUFBQSxXQUFJQSxDQUFDLENBQUNFLE1BQUYsS0FBYSxNQUFiLElBQXVCLENBQUNGLENBQUMsQ0FBQ0csUUFBOUI7QUFBQSxHQUZFLENBQWI7QUFHQSxTQUFPVCxJQUFJLElBQUlBLElBQUksQ0FBQ1UsT0FBcEI7QUFDSDs7QUFFRCxJQUFNQyxJQUFJLEdBQUc7QUFDVEMsRUFBQUEsVUFBVSxFQUFFLFlBREg7QUFFVEMsRUFBQUEsV0FBVyxFQUFFO0FBRkosQ0FBYjtBQVlBaEIsT0FBTyxDQUNGaUIsTUFETCxDQUNZLG1CQURaLEVBQ2lDLG1CQURqQyxFQUVRQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsYUFBWixJQUE2QmxCLEtBQUssRUFGMUMsRUFHS2UsTUFITCxDQUdZLG1CQUhaLEVBR2lDLGdCQUhqQyxFQUlRQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUUsYUFBWixJQUE2QixNQUpyQyxFQUtLSixNQUxMLENBS1ksMkJBTFosRUFLeUMsc0JBTHpDLEVBTVFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRyxpQkFBWixJQUFpQyxlQU56QyxFQU9LTCxNQVBMLENBT1ksc0JBUFosRUFPb0MsZUFQcEMsRUFRUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlJLGVBQVosSUFBK0IsWUFSdkMsRUFTS0MsS0FUTCxDQVNXTixPQUFPLENBQUNPLElBVG5CO0FBV0EsSUFBTUMsT0FBdUIsR0FBRzFCLE9BQWhDO0FBRUEsSUFBTW1CLEdBQUcsR0FBRztBQUNSUSxFQUFBQSxHQUFHLEVBQUUsQ0FBQ1QsT0FBTyxDQUFDQyxHQUFSLENBQVlTLEtBQVosSUFBcUIsRUFBdEIsTUFBOEIsTUFEM0I7QUFFUkMsRUFBQUEsZUFBZSxFQUFFSCxPQUFPLENBQUNJLFFBRmpCO0FBR1JDLEVBQUFBLGFBQWEsRUFBRUwsT0FBTyxDQUFDTSxNQUhmO0FBSVJDLEVBQUFBLFdBQVcsRUFBRVAsT0FBTyxDQUFDUSxJQUpiO0FBS1JDLEVBQUFBLFdBQVcsRUFBRVQsT0FBTyxDQUFDVTtBQUxiLENBQVo7QUEyQkEsSUFBTUMsTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkosSUFBQUEsSUFBSSxFQUFFZixHQUFHLENBQUNjLFdBRE47QUFFSkcsSUFBQUEsSUFBSSxFQUFFRyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JyQixHQUFHLENBQUNnQixXQUFwQixDQUZGO0FBR0pSLElBQUFBLEdBQUcsRUFBRVIsR0FBRyxDQUFDUSxHQUFKLEdBQ0M7QUFDRVMsTUFBQUEsSUFBSSxFQUFFLElBRFI7QUFFRUssTUFBQUEsR0FBRyxFQUFFLHVCQUZQO0FBR0VDLE1BQUFBLElBQUksRUFBRTtBQUhSLEtBREQsR0FNQztBQVRGLEdBRFk7QUFZcEJDLEVBQUFBLFFBQVEsRUFBRTtBQUNOTCxJQUFBQSxNQUFNLEVBQUVuQixHQUFHLENBQUNVLGVBRE47QUFFTmUsSUFBQUEsSUFBSSxFQUFFekIsR0FBRyxDQUFDWTtBQUZKLEdBWlU7QUFnQnBCYyxFQUFBQSxRQUFRLEVBQUU7QUFDTkMsSUFBQUEsY0FBYyxFQUFFO0FBRFY7QUFoQlUsQ0FBeEI7QUFxQkFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGVBQVosRUFBNkJYLE1BQTdCO2VBQ2VBLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuY29uc3QgcHJvZ3JhbSA9IHJlcXVpcmUoJ2NvbW1hbmRlcicpO1xuXG5mdW5jdGlvbiBnZXRJcCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGlwdjQgPSAoT2JqZWN0LnZhbHVlcyhvcy5uZXR3b3JrSW50ZXJmYWNlcygpKTogYW55KVxuICAgICAgICAuZmxhdE1hcCh4ID0+IHgpXG4gICAgICAgIC5maW5kKHggPT4geC5mYW1pbHkgPT09ICdJUHY0JyAmJiAheC5pbnRlcm5hbCk7XG4gICAgcmV0dXJuIGlwdjQgJiYgaXB2NC5hZGRyZXNzO1xufVxuXG5jb25zdCBNT0RFID0ge1xuICAgIHByb2R1Y3Rpb246ICdwcm9kdWN0aW9uJyxcbiAgICBkZXZlbG9wbWVudDogJ2RldmVsb3BtZW50Jyxcbn07XG5cbnR5cGUgUHJvZ3JhbU9wdGlvbnMgPSB7XG4gICAgZGJTZXJ2ZXI6IHN0cmluZyxcbiAgICBkYk5hbWU6IHN0cmluZyxcbiAgICBob3N0OiBzdHJpbmcsXG4gICAgcG9ydDogc3RyaW5nLFxufVxuXG5wcm9ncmFtXG4gICAgLm9wdGlvbignLWgsIC0taG9zdCA8aG9zdD4nLCAnbGlzdGVuaW5nIGFkZHJlc3MnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9IT1NUIHx8IGdldElwKCkpXG4gICAgLm9wdGlvbignLXAsIC0tcG9ydCA8cG9ydD4nLCAnbGlzdGVuaW5nIHBvcnQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9QT1JUIHx8ICc0MDAwJylcbiAgICAub3B0aW9uKCctZCwgLS1kYi1zZXJ2ZXIgPGFkZHJlc3M+JywgJ2RhdGFiYXNlIHNlcnZlcjpwb3J0JyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9EQVRBQkFTRV9TRVJWRVIgfHwgJ2FyYW5nb2RiOjg1MjknKVxuICAgIC5vcHRpb24oJy1uLCAtLWRiLW5hbWUgPG5hbWU+JywgJ2RhdGFiYXNlIG5hbWUnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX05BTUUgfHwgJ2Jsb2NrY2hhaW4nKVxuICAgIC5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuXG5jb25zdCBvcHRpb25zOiBQcm9ncmFtT3B0aW9ucyA9IHByb2dyYW07XG5cbmNvbnN0IGVudiA9IHtcbiAgICBzc2w6IChwcm9jZXNzLmVudi5RX1NTTCB8fCAnJykgPT09ICd0cnVlJyxcbiAgICBkYXRhYmFzZV9zZXJ2ZXI6IG9wdGlvbnMuZGJTZXJ2ZXIsXG4gICAgZGF0YWJhc2VfbmFtZTogb3B0aW9ucy5kYk5hbWUsXG4gICAgc2VydmVyX2hvc3Q6IG9wdGlvbnMuaG9zdCxcbiAgICBzZXJ2ZXJfcG9ydDogb3B0aW9ucy5wb3J0LFxufTtcblxuZXhwb3J0IHR5cGUgUUNvbmZpZyA9IHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgaG9zdDogc3RyaW5nLFxuICAgICAgICBwb3J0OiBudW1iZXIsXG4gICAgICAgIHNzbDogP3tcbiAgICAgICAgICAgIHBvcnQ6IG51bWJlcixcbiAgICAgICAgICAgIGtleTogc3RyaW5nLFxuICAgICAgICAgICAgY2VydDogc3RyaW5nLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGF0YWJhc2U6IHtcbiAgICAgICAgc2VydmVyOiBzdHJpbmcsXG4gICAgICAgIG5hbWU6IHN0cmluZ1xuICAgIH0sXG4gICAgbGlzdGVuZXI6IHtcbiAgICAgICAgcmVzdGFydFRpbWVvdXQ6IG51bWJlclxuICAgIH1cbn1cblxuY29uc3QgY29uZmlnOiBRQ29uZmlnID0ge1xuICAgIHNlcnZlcjoge1xuICAgICAgICBob3N0OiBlbnYuc2VydmVyX2hvc3QsXG4gICAgICAgIHBvcnQ6IE51bWJlci5wYXJzZUludChlbnYuc2VydmVyX3BvcnQpLFxuICAgICAgICBzc2w6IGVudi5zc2xcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIHBvcnQ6IDQwMDEsXG4gICAgICAgICAgICAgICAga2V5OiAnc2VydmVyL3NzbC9zZXJ2ZXIua2V5JyxcbiAgICAgICAgICAgICAgICBjZXJ0OiAnc2VydmVyL3NzbC9zZXJ2ZXIuY3J0JyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogbnVsbCxcbiAgICB9LFxuICAgIGRhdGFiYXNlOiB7XG4gICAgICAgIHNlcnZlcjogZW52LmRhdGFiYXNlX3NlcnZlcixcbiAgICAgICAgbmFtZTogZW52LmRhdGFiYXNlX25hbWUsXG4gICAgfSxcbiAgICBsaXN0ZW5lcjoge1xuICAgICAgICByZXN0YXJ0VGltZW91dDogMTAwMFxuICAgIH1cbn07XG5cbmNvbnNvbGUubG9nKCdVc2luZyBjb25maWc6JywgY29uZmlnKTtcbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdfQ==