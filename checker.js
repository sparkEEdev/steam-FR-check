exports.friendsCheck = function (community, user, arrID, arrPrice, appid = 730) {

    /*setTimeout(function (i) {
        community.request(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=<<< API KEY HERE >>>&steamids=${id}`, function (err, response, body) {
            var playerZ = JSON.parse(body).response.players;
            for (i = 0; i < playerZ.length; i++) {
                var priv = playerZ[i].communityvisibilitystate;
                if((priv == 1) || (priv == 2)) {
                    client.removeFriend(id);
                    console.log("State 1/2, request declined for id: " + id);
                }
            };
        });
    }, 200 * i);*/

    var int = setInterval(function () {
        var id = arrID.shift();
        community.getUserInventory(id, appid, 2, true, function (err, inventory) {
            if (err) {
                if ((err.message == "This profile is private.") || (err.message == "Malformed response")) {
                    console.log("Private inventory/has no items, request declined, ID64: " + id);
                    user.removeFriend(id);
                }
                if ((err.message == "HTTP error 429") || (err.message == "HTTP error 403")) {
                    console.log(err.message + " ID64: " + id + ", will be checked again.");
                    arrID.push(id);
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
                    return Math.round(i[1]);
                });
                var maxVal = allVal.reduce(function (a, b) {
                    return a + b;
                }, 0);
                if (maxVal < 30) {
                    user.removeFriend(id);
                    console.log("Inventory value too small, declined ID64: " + id);
                } else {
                    console.log("ID64: " + id + ", value: " + maxVal + " \u20AC");
                }
            };
        });
        if (arrID.length == 0) clearInterval(int);
    }, 5000)
}