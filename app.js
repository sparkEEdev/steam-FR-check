const fs = require('fs');

const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const getInvValue = require('./checker').checker;

const cfg = require('./config_parser');

// some settings
var appid = 730; // 730 = CS:GO, 570 = DotA2, 440 = TF2
var priceHist = JSON.parse(fs.readFileSync('itemHistory.json')); // file from which we gather price history for our process: https://github.com/sparkEEgit/steam-item-appraiser << 
freshReq = []; // useless for now.

var accountTradeHandler = function (username, password, sharedSecret) {
    var client = new SteamUser();
    var community = new SteamCommunity();

    function theLoop(i, arr) {
        setTimeout(function () {
            var id64 = arr.pop();
            getInvValue(id64, community, client, arr, priceHist, appid);
            var i = arr.length;
            if (i != 0) {
                theLoop(i, arr);
            }
        }, 5000)
    }

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
            var id64= steamID.getSteamID64();
            console.log("New friend request, checking now..");
            getInvValue(id64, community, client, freshReq, priceHist, appid);
        }
    });

    client.on("friendsList", function () {
        pendingReq = {};
        var acc = this._logOnDetails.account_name;
        pendingReq[acc] = [];
        for (var val in obj = this.myFriends) {
            if (obj[val] == 2) {
                pendingReq[acc].push(val);
            } 
        };
        var ids = pendingReq[acc];
        var times = pendingReq[acc].length;
        theLoop(times, ids);
    });
}

for (i = 0; i < cfg.accountLoginInfos.length; i++) {
    accountTradeHandler(cfg.accountLoginInfos[i][0], cfg.accountLoginInfos[i][1], cfg.accountLoginInfos[i][2]);
}