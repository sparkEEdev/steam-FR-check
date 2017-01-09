const fs = require('fs');

const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');

const cfg = require('./config_parser');

// some settings
var currency = 3; // 3 = euro (see: https://github.com/SteamRE/SteamKit/blob/master/Resources/SteamLanguage/enums.steamd#L696)
var appid = 730; // 730 = CS:GO, 570 = DotA2, 440 = TF2
var priceHist = JSON.parse(fs.readFileSync('itemHistory.json')); 

var accountTradeHandler = function (username, password, sharedSecret) {
    var client = new SteamUser();
    var manager = new TradeOfferManager({
        "steam": client,
        "domain": "somedomain.com",
        "language": "en"
    });
    var community = new SteamCommunity();

    client.logOn({
        "accountName": username,
        "password": password,
        "twoFactorCode": SteamTotp.getAuthCode(sharedSecret)
    });

    client.on("loggedOn", function () {
        client.setPersona(SteamUser.EPersonaState.Online);
        console.log("User " + (cfg.accountNames[this.steamID] || this.steamID) +
            " successfully logged into Steam.");
    });

    client.on('webSession', function (sessionID, cookies) {
        manager.setCookies(cookies, function (err) {
            if (err) {
                console.log(err);
                process.exit(1);
                return;
            }
        });

        community.setCookies(cookies);
        community.startConfirmationChecker(50000, "identitySecret" + username);

    });

    client.on('friendRelationship', function (steamID, relationship) {
        if (relationship == SteamUser.Steam.EFriendRelationship.RequestRecipient) {
            pendingReq.push(steamID.getSteamID64());
        }
        
    });

    client.on("friendsList", function () {
        var pendingReq = [];

        for (var val in obj = this.myFriends) {
            if (obj[val] == 2) pendingReq.push(val);
        }

        pendingReq.forEach(function (id, i) {

            setTimeout(function (i) {
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
            }, 200 * i);
            
            setTimeout(function (i) {
                community.getUserInventory(id, appid, 2, true, function (err, inventory) {
                    if (err) {
                        if ((err.message == "This profile is private.") || (err.message == "Malformed response")) {
                            console.log("Private inventory or has no items, request declined, ID64: " + id);
                            client.removeFriend(id);
                        }
                        if ((err.message == "HTTP error 429") || (err.message == "HTTP error 403")) {
                            console.log(err.message + " ID: " + id);
                        }
                    }
                    if (!err) {
                        invItems = [];
                        itemVal = [];
                        allVal = [];
                        for (var val in obj2 = inventory) {
                            invItems.push(obj2[val].market_name);
                        };
                        for(i=0; i<invItems.length; i++) {
                            itemVal.push(priceHist[invItems[i]].slice(-1)[0]);              
                        };
                        for(i=0; i<itemVal.length; i++) {
                            if(itemVal[i] == undefined) {
                                defVal = ["0", 0, "0"]
                                allVal.push(defVal[1]);
                            } else {
                                allVal.push(itemVal[i][1]);
                            }
                        };
                        var maxVal = allVal.reduce(function(a,b) {
                            return a + b;
                        },0);
                        if (maxVal < 30) {
                            client.removeFriend(id);
                            console.log("Inventory value too small, declined: " + id);
                        } 
                        else console.log("ID : " + id + " value: " + maxVal);
                    };
                });
            }, i * 10000)
        });
    })
}

for (i = 0; i < cfg.accountLoginInfos.length; i++) {
    accountTradeHandler(cfg.accountLoginInfos[i][0], cfg.accountLoginInfos[i][1], cfg.accountLoginInfos[i][2]);
}