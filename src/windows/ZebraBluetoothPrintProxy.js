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
        debugger;
        if (!successCallback || !errorCallback) {
            throw "Success or Error callback is not defined!";    
        } else if (!mac || mac.length !== 12) {
            throw "MAC address is not defined or invalid!";    
        } else if (!zpl) {
            throw "zpl is empty!";
        } else {
            _successCallback = successCallback;
            _errorCallback = errorCallback;
        }

        getDeviceInfo(normalize(mac, 2)).then(function(data) {
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

    function normalize(str, n) {
        var ret = [];
        for(var i = 0, len = str.length; i < len; i += n) {
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
        try {
            printPlugin.print(successCallback, errorCallback, data[0], data[1]);
        } catch (ex) {
            errorCallback(ex);
        }        
    }
}

require("cordova/exec/proxy").add("ZebraBluetoothPrint", module.exports);

