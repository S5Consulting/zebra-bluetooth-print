var ZebraBluetoothPrint = {
    print: function (successCallback, errorCallback, mac, data) {
        cordova.exec(successCallback, errorCallback, "ZebraBluetoothPrint", "print", [mac, data]);
    }
}

module.exports = ZebraBluetoothPrint;
