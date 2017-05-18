var ZebraBluetoothPrint = {
    print: function (successCallback, errorCallback, mac, zpl) {
        cordova.exec(successCallback, errorCallback, "ZebraBluetoothPrint", "print", [mac, zpl]);
    }
}

module.exports = ZebraBluetoothPrint;
