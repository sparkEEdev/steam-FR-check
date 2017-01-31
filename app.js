const fs = require('fs');

const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const check = require('./checker').getItemValues;

const cfg = require('./config_parser');

// some settings
var appid = 730; // 730 = CS:GO, 570 = DotA2, 440 = TF2
var priceHist = JSON.parse(fs.readFileSync('itemHistory.json')); // file from which we gather price history for our process: https://github.com/sparkEEgit/steam-item-appraiser << 
var freshReq = []; // array of steamID64 for listening

var accountTradeHandler = function (username, password, sharedSecret) {
    var client = new SteamUser();
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
        community.setCookies(cookies);
        community.startConfirmationChecker(50000, "identitySecret" + username);
    });
    
    client.on('friendRelationship', function (steamID, relationship) {
        if (relationship == SteamUser.Steam.EFriendRelationship.RequestRecipient) {
            var id64 = steamID.getSteamID64()
            console.log("New friend request, checking now..");
            check(id64, community, this, freshReq, priceHist);
        };
    });  

    client.on("friendsList", function () {
        pendingReq = {};
        pendingReq[(cfg.accountNames[this.steamID] || this.steamID)] = [];
        for (var val in obj = this.myFriends) {
            if (obj[val] == 2) {
                pendingReq[(cfg.accountNames[this.steamID] || this.steamID)].push(val);
            } 
        };
        for (var id in pendingReq) {
            pendingReq[id].forEach(function (id64, i) {
                setTimeout(function (i) {
                    check(id64, community, client, pendingReq, priceHist)
                }, 5000 * i)
            })
        }
    });
};

for (i = 0; i < cfg.accountLoginInfos.length; i++) {
    accountTradeHandler(cfg.accountLoginInfos[i][0], cfg.accountLoginInfos[i][1], cfg.accountLoginInfos[i][2]);
}