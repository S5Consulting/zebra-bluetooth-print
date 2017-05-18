var cordova = require('cordova'),
    ZebraBluetoothPrint= require('./ZebraBluetoothPrint');

var PrintPlugin = function() {

    var BluetoothDevice = Windows.Devices.Bluetooth.BluetoothDevice;
    var DeviceInformation = Windows.Devices.Enumeration.DeviceInformation;
    var StreamSocket = Windows.Networking.Sockets.StreamSocket;
    var DataWriter = Windows.Storage.Streams.DataWriter;

    const RFCOMMID = Windows.Devices.Bluetooth.Rfcomm.RfcommServiceId.fromUuid("00001101-0000-1000-8000-00805F9B34FB");
    const CACHEMODE = Windows.Devices.Bluetooth.BluetoothCacheMode.uncached;

    var _successCallback = null;
    var _errorCallback = null;

    this.print = function(successCallback, errorCallback, mac, zpl) {
        if (!successCallback || !errorCallback) {
            throw "Success or Error callback is not defined!";    
        } else {
            _successCallback = successCallback;
            _errorCallback = errorCallback;
        }

        getDeviceInfo(normalize(mac)).then(function(data) {
            getService(data).then(function(service) {
                try {
                    sendZpl(service, zpl);
                } catch (ex) {
                    _errorCallback(ex);
                }                
            }, printError);
        }, printError);
    }

    function printError(error) {
        _errorCallback(error);
    };

    function sendZpl(service, zpl) {
        var socket = new StreamSocket();
        socket.connectAsync(service.connectionHostName, service.connectionServiceName).done(function() {
            var writer = new DataWriter(socket.outputStream);
            writer.writeBytes(unpack(zpl));
            writer.storeAsync().then(function () {
                _successCallback();
                cleanUp(writer, service, socket);
            }, function (error) {
                _errorCallback(error);
                cleanUp(writer, service, socket);
            });
        });
    };

    function getDeviceInfo(mac) {
        return new Promise(function(resolve, reject) {
            // get all paired devices.
            DeviceInformation.findAllAsync(BluetoothDevice.getDeviceSelector(), null).done(function(data) {
                for (var i = 0; i < data.length; i++) {
                    // mac address found in list of paired devices.
                    if (data[i].id.indexOf(mac.toLowerCase()) > -1) {
                        resolve(data[i]);
                        return;
                    }
                }
                reject("Device not found!");
            });            
        });
    };

    function getService(data) {
        return new Promise(function(resolve, reject) {
            BluetoothDevice.fromIdAsync(data.id).done(function(device) {
                if (device) {
                    device.getRfcommServicesForIdAsync(RFCOMMID, CACHEMODE).done(function(result) {
                        if (result.services.length > 0) {
                            resolve(result.services[0]);
                        } else {
                            reject("Could not connect to service");     
                        }
                    });
                } else {
                    reject("Device not found!");
                }
            });
        });
    };

    function cleanUp(writer, service, socket) {
        writer.detachStream();
        service.close();
        socket.close();
    };

    function normalize(str, n = 2) {
        var ret = [], i, len;
        for(i = 0, len = str.length; i < len; i += n) {
            ret.push(str.substr(i, n))
        }
        return ret.join(":");
    };

    function unpack(str) {
        var bytes = [];
        for(var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);   
            bytes.push(char >>> 8, char & 0xff);
        }
        return bytes;
    };
}

var printPlugin = new PrintPlugin();

module.exports = {
    print: function(successCallback, errorCallback, data) {
        printPlugin.print(successCallback, errorCallback, data[0], data[1]);
    }
}

require("cordova/exec/proxy").add("ZebraBluetoothPrint", module.exports);

