var ZebraBluetoothPrint = {
    print: function (successCallback, errorCallback, mac, zpl) {
    	debugger;
        cordova.exec(successCallback, errorCallback, "ZebraBluetoothPrint", "print", [mac, zpl]);
    }
}

module.exports = ZebraBluetoothPrint;
