exports.friendsCheck = function (community,  user, arrID, arrPrice, appid = 730) {

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

        if (id == undefined) {
            console.log("No more friend requests to check.");
            clearInterval(int);
        } else {
            community.getUserInventory(id, appid, 2, true, function (err, inventory) {
                if (err) {
                    if ((err.message == "This profile is private.") || (err.message == "Malformed response")) {
                        console.log("Private inventory/has no items, request declined, steamID64: " + id);
                        user.removeFriend(id);
                    }
                    if ((err.message == "HTTP error 429") || (err.message == "HTTP error 403")) {
                        console.log(err.message + " steamID64: " + id + ", will be checked again.");
                        setTimeout(function () {
                            arrID.push(id);
                        }, 5000);
                    }
                }
                if (!err) {
                    invItems = [];
                    itemVal = [];
                    allVal = [];
                    for (var val in obj2 = inventory) {
                        invItems.push(obj2[val].market_name);
                    };
                    for (i = 0; i < invItems.length; i++) {
                        itemVal.push(arrPrice[invItems[i]].slice(-1)[0]);
                    };
                    for (i = 0; i < itemVal.length; i++) {
                        if (itemVal[i] == undefined) {
                            defVal = ["0", 0, "0"]
                            allVal.push(defVal[1]);
                        } else {
                            allVal.push(Math.round(itemVal[i][1]));
                        }
                    };
                    var maxVal = allVal.reduce(function (a, b) {
                        return a + b;
                    }, 0);
                    if (maxVal < 30) {
                        user.removeFriend(id);
                        console.log("Inventory value too small, declined steamID64: " + id);
                    }
                    else {
                        console.log("steamID64: " + id + ", value: " + maxVal + " \u20AC");
                    }
                };
            });
        }
    }, 10000)
}