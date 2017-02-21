module.exports = function checker(id, community, user, arrPrice, appid) {

    var msg = ">>> " + user._logOnDetails.account_name + "'s request -> " + "ID64: " + id

    community.getUserInventory(id, appid, 2, true, function (err, inventory) {
        if (err) {
            if ((err.message == "This profile is private.") || (err.message == "Malformed response")) {
                console.log(msg + ", private inventory/has no items, request declined.");
                user.removeFriend(id);
            } else if ((err.message == "HTTP error 429") || (err.message == "HTTP error 403")) {
                console.log(msg + ", " + err.message + ", will be checked again.");
                setTimeout(function () {
                    checker (id, community, user, arrPrice, appid)
                }, 15000);
            }
        } else {
            var invItems = inventory.map(function (i) {
                return i.market_name;
            });
            var itemVal = invItems.map(function (i) {
                return arrPrice[i].slice(-1)[0];
            });
            var allVal = itemVal.map(function (i) {
                if (i == undefined) i = ["0", 0, "0"];
                return i[1]
            });
            var maxVal = allVal.reduce(function (a, b) {
                return a + b;
            }, 0);
            if (maxVal < 35) {
                user.removeFriend(id);
                console.log(msg + ", inventory value too small, request declined.");
            } else {
                console.log(msg + ", value: " + maxVal.toFixed(2) + " \u20AC");
            }
        };
    });
}