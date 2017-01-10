const fs = require('fs');

const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const check = require('./checker').friendsCheck;

const cfg = require('./config_parser');

// some settings
var appid = 730; // 730 = CS:GO, 570 = DotA2, 440 = TF2
var priceHist = JSON.parse(fs.readFileSync('itemHistory.json')); // file from which we gather price history for our process: https://github.com/sparkEEgit/steam-item-appraiser << 
var pendingReq = []; // array of friend requests(steamID64)

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
            pendingReq.push(steamID.getSteamID64());
            console.log("New friend request, checking now..");
            check(community, this, pendingReq, priceHist);
        };
    });

    client.on("friendsList", function () {
        for (var val in obj = this.myFriends) {
            if (obj[val] == 2) pendingReq.push(val);
        };
        check(community, this, pendingReq, priceHist);
    });
};

for (i = 0; i < cfg.accountLoginInfos.length; i++) {
    accountTradeHandler(cfg.accountLoginInfos[i][0], cfg.accountLoginInfos[i][1], cfg.accountLoginInfos[i][2]);
}