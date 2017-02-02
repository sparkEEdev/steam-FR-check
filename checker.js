exports.checker = function (id, community, user, arrID, arrPrice, appid = 730) {
    community.getUserInventory(id, appid, 2, true, function (err, inventory) {
        if (err) {
            if ((err.message == "This profile is private.") || (err.message == "Malformed response")) {
                console.log("Private inventory/has no items, request declined, ID64: " + id);
                user.removeFriend(id);
            } else if ((err.message == "HTTP error 429") || (err.message == "HTTP error 403")) {
                console.log(err.message + " ID64: " + id + ", will be checked again.");
                return arrID.push(id); // find better way of handling. 
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
            if (maxVal < 30) {
                user.removeFriend(id);
                console.log("Inventory value too small, declined ID64: " + id);
            } else {
                console.log("ID64: " + id + ", value: " + maxVal.toFixed(2) + " \u20AC");
            }
        };
    });
}