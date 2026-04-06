import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Float "mo:base/Float";
import Char "mo:base/Char";
import Nat32 "mo:base/Nat32";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import HttpOutcalls "http-outcalls/outcall";

actor {
  stable let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = { name : Text };
  type User = { nickname : Text; passwordHash : Text };
  type Session = { nickname : Text };
  type CryptoAddress = { currency : Text; address : Text; amount : Text };
  type PaymentRequest = { nickname : Text; currency : Text; txHash : Text; var status : Text; submittedAt : Int };

  type PdfEntryOld = { id : Text; blockId : Text; filename : Text; hash : Text; uploadedAt : Int };
  type PdfEntry = { id : Text; blockId : Text; filename : Text; base64Data : Text; uploadedAt : Int };

  public type TxCheckResult = {
    amount : Text;
    currency : Text;
    timestamp : Text;
    toAddress : Text;
    addressMatch : Bool;
    eurAmount : ?Float;
    errorMsg : ?Text;
  };

  let users = Map.empty<Text, User>();
  let sessions = Map.empty<Text, Session>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  stable var visitorCount : Nat = 0;
  let adminPassword : Text = "WotanClan44!";

  let activeVisitors = Map.empty<Text, Int>();
  let cryptoAddresses = Map.empty<Text, CryptoAddress>();
  let paymentRequests = Map.empty<Text, PaymentRequest>();
  let musterschreibenAccess = Map.empty<Text, Bool>();
  let pdfEntries = Map.empty<Text, PdfEntryOld>();
  stable var pdfEntryCounter : Nat = 0;
  let pdfEntriesNew = Map.empty<Text, PdfEntry>();
  let allowedUsers : [Text] = ["wotan", "Michael"];

  type HardcodedUser = { nickname : Text; passwordHash : Text };
  let hardcodedCredentials : [HardcodedUser] = [
    { nickname = "wotan";   passwordHash = "bcb15f821479b4d5772bd0ca866c00ad5f926e3580720659cc80d39c9d09802a" },
    { nickname = "Michael"; passwordHash = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
  ];

  func findHardcodedUser(nickname : Text) : ?HardcodedUser {
    for (u in hardcodedCredentials.vals()) {
      if (u.nickname == nickname) return ?u;
    };
    null;
  };

  func isAllowedUser(nickname : Text) : Bool {
    switch (findHardcodedUser(nickname)) {
      case (?_) true;
      case (null) { users.containsKey(nickname) };
    };
  };

  func getAllNewPdfEntries() : [PdfEntry] {
    pdfEntriesNew.values().toArray();
  };

  // Known receive addresses (must match ZahlungPage.tsx)
  let knownAddresses : [(Text, Text)] = [
    ("BTC", "bc1qzt9eeuh35jc9746z0jk73dmj77gd5sp6fuc9wd"),
    ("ETH", "0x3c2726B86B4BB25Eb39Cd58636b8f8f6a5286ae3"),
    ("XRP", "rNxb49FgcRQVDjioZ6Jfk6vky5ViByNkW9"),
    ("SOL", "kjFvmwSexVSufg4wu859rY7SuiqeoThQzPamPef2QLR"),
    ("ICP", "a34140f39e2ee1a1cbea4485e921060ab9b9f2afe5e595711516f665a0c6c326"),
  ];

  func getKnownAddress(currency : Text) : ?Text {
    for ((cur, addr) in knownAddresses.vals()) {
      if (cur == currency) return ?addr;
    };
    switch (cryptoAddresses.get(currency)) {
      case (?ca) ?ca.address;
      case (null) null;
    };
  };

  func toLower(t : Text) : Text {
    var result = "";
    for (c in t.chars()) {
      let n = Nat32.toNat(Char.toNat32(c));
      let lc : Char = if (n >= 65 and n <= 90) { Char.fromNat32(Nat32.fromNat(n + 32)) } else { c };
      result := result # Text.fromChar(lc);
    };
    result;
  };

  func trimAddr(t : Text) : Text {
    // Strip whitespace AND quotes (ASCII 34=double-quote, 39=single-quote, 92=backslash)
    t.trim(#predicate(func(c : Char) : Bool {
      let n = Nat32.toNat(Char.toNat32(c));
      c == ' ' or n == 9 or n == 10 or n == 13 or n == 34 or n == 39 or n == 92
    }));
  };

  func addressMatchesCurrency(currency : Text, toAddr : Text) : Bool {
    switch (getKnownAddress(currency)) {
      case (null) false;
      case (?known) { toLower(trimAddr(known)) == toLower(trimAddr(toAddr)) };
    };
  };

  // Simple JSON field extractor: finds "field": value and returns value as Text
  func extractJsonField(json : Text, field : Text) : ?Text {
    let needle = "\"" # field # "\"";
    let parts = json.split(#text needle).toArray();
    if (parts.size() < 2) return null;
    let after = parts[1];
    // Find colon and extract value after it
    let colonParts = after.split(#text ":").toArray();
    if (colonParts.size() < 2) return null;
    var valueStr = colonParts[1];
    // trim leading whitespace
    valueStr := valueStr.trimStart(#predicate(func(c : Char) : Bool { c == ' ' or c == '\t' or c == '\n' or c == '\r' }));
    if (valueStr.size() == 0) return null;
    // Check if string value (starts with ")
    if (valueStr.startsWith(#text "\"")) {
      let inner = valueStr.trimStart(#text "\"");
      let strParts = inner.split(#text "\"").toArray();
      if (strParts.size() > 0) { ?strParts[0] } else { null };
    } else {
      // numeric or bool: read until delimiter
      var numStr = "";
      for (c in valueStr.chars()) {
        if (c == ',' or c == '}' or c == ']' or c == '\n' or c == '\r') { /* stop */ }
        else if (c != ' ') { numStr := numStr # Text.fromChar(c); };
      };
      if (numStr == "") null else ?numStr;
    };
  };

  // Extract the Nth occurrence (0-based) of a JSON field value
  func extractJsonFieldNth(json : Text, field : Text, n : Nat) : ?Text {
    let needle = "\"" # field # "\"";
    let parts = json.split(#text needle).toArray();
    // parts[0] is before first occurrence, parts[1] is after first, etc.
    // The Nth occurrence is at index n+1
    if (parts.size() < n + 2) return null;
    let after = parts[n + 1];
    let colonParts = after.split(#text ":").toArray();
    if (colonParts.size() < 2) return null;
    var valueStr = colonParts[1];
    valueStr := valueStr.trimStart(#predicate(func(c : Char) : Bool { c == ' ' or c == '\t' or c == '\n' or c == '\r' }));
    if (valueStr.size() == 0) return null;
    if (valueStr.startsWith(#text "\"")) {
      let inner = valueStr.trimStart(#text "\"");
      let strParts = inner.split(#text "\"").toArray();
      if (strParts.size() > 0) { ?strParts[0] } else { null };
    } else {
      var numStr = "";
      for (c in valueStr.chars()) {
        if (c == ',' or c == '}' or c == ']' or c == '\n' or c == '\r') { }
        else if (c != ' ') { numStr := numStr # Text.fromChar(c); };
      };
      if (numStr == "") null else ?numStr;
    };
  };

  // Extract a JSON field value only from within a subsection that appears after a marker string
  func extractJsonFieldInSection(json : Text, sectionMarker : Text, field : Text) : ?Text {
    let sectionParts = json.split(#text sectionMarker).toArray();
    if (sectionParts.size() < 2) return null;
    extractJsonField(sectionParts[1], field);
  };

  func textToFloat(t : Text) : ?Float {
    var intPart : Float = 0.0;
    var fracPart : Float = 0.0;
    var fracDiv : Float = 1.0;
    var inFrac = false;
    var negative = false;
    var valid = false;
    for (c in t.chars()) {
      if (c == '-' and not valid and not inFrac) {
        negative := true;
      } else if (c == '.') {
        inFrac := true;
      } else if (c >= '0' and c <= '9') {
        valid := true;
        let d : Float = Float.fromInt(Nat32.toNat(Char.toNat32(c)) - 48);
        if (inFrac) {
          fracDiv := fracDiv * 10.0;
          fracPart := fracPart + d / fracDiv;
        } else {
          intPart := intPart * 10.0 + d;
        };
      };
    };
    if (not valid) return null;
    let r = intPart + fracPart;
    ?(if (negative) -r else r);
  };

  func hexCharVal(c : Char) : Int {
    let n = Nat32.toNat(Char.toNat32(c));
    if (n >= 48 and n <= 57) { n - 48 }          // '0'-'9'
    else if (n >= 97 and n <= 102) { n - 87 }     // 'a'-'f'
    else if (n >= 65 and n <= 70) { n - 55 }      // 'A'-'F'
    else 0;
  };

  func hexToInt(hex : Text) : Int {
    var h = hex;
    if (h.startsWith(#text "0x") or h.startsWith(#text "0X")) {
      let parts = h.split(#text "x").toArray();
      if (parts.size() >= 2) { h := parts[1] };
    };
    var result : Int = 0;
    for (c in h.chars()) { result := result * 16 + hexCharVal(c); };
    result;
  };

  func formatDateForCoinGecko(unixSecs : Int) : Text {
    let secondsPerDay : Int = 86400;
    var d = unixSecs / secondsPerDay;
    var y : Int = 1970;
    label yearLoop loop {
      let diy : Int = if ((y % 4 == 0 and y % 100 != 0) or y % 400 == 0) 366 else 365;
      if (d < diy) break yearLoop;
      d := d - diy;
      y := y + 1;
    };
    let isLeap = (y % 4 == 0 and y % 100 != 0) or y % 400 == 0;
    let mdays : [Int] = [31, if (isLeap) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var m : Int = 1;
    label monthLoop loop {
      if (m > 12) break monthLoop;
      let md = mdays[Int.abs(m - 1)];
      if (d < md) break monthLoop;
      d := d - md;
      m := m + 1;
    };
    let day = d + 1;
    let ds = if (day < 10) "0" # day.toText() else day.toText();
    let ms2 = if (m < 10) "0" # m.toText() else m.toText();
    ds # "-" # ms2 # "-" # y.toText();
  };

  func coinGeckoId(currency : Text) : Text {
    if (currency == "BTC") "bitcoin"
    else if (currency == "ETH") "ethereum"
    else if (currency == "SOL") "solana"
    else if (currency == "XRP") "ripple"
    else if (currency == "ICP") "internet-computer"
    else "bitcoin";
  };

  type TxData = { amount : Text; timestamp : Text; toAddress : Text };

  func fetchTxData(currency : Text, txHash : Text) : async { #ok : TxData; #error : Text } {
    try {
      if (currency == "BTC") {
        // blockchain.info/rawtx/ response structure:
        // { "inputs": [{"prev_out": {"addr": "SENDER"}}], "out": [{"addr": "RECEIVER", "value": ...}], "time": ..., "hash": ... }
        // The first "addr" is inside "inputs" (sender). We need the "addr" inside "out" (receiver).
        // We extract the section after "out" first, then find "addr" in it.
        let url = "https://blockchain.info/rawtx/" # txHash;
        let body = await HttpOutcalls.httpGetRequest(url, [], transform);
        // Get timestamp and total output value from top level
        let tsStr = switch (extractJsonField(body, "time")) { case (?t) t; case (null) "0" };
        // Find the "out" section and extract the first "addr" and "value" from it
        let toAddr = switch (extractJsonFieldInSection(body, "\"out\"", "addr")) {
          case (?a) a;
          case (null) {
            // fallback: try second occurrence of "addr" (skip the sender in inputs)
            switch (extractJsonFieldNth(body, "addr", 1)) { case (?a) a; case (null) "" };
          };
        };
        // For BTC amount: sum of output values is complex; use the first output value as approximation
        let satStr = switch (extractJsonFieldInSection(body, "\"out\"", "value")) { case (?v) v; case (null) "0" };
        let btcAmt = switch (textToFloat(satStr)) {
          case (?s) Float.format(#fix 8, s / 100_000_000.0);
          case (null) satStr;
        };
        #ok({ amount = btcAmt; timestamp = tsStr; toAddress = toAddr });

      } else if (currency == "ETH") {
        // Etherscan eth_getTransactionByHash returns: {"result": {"from": "SENDER", "to": "RECEIVER", ...}}
        // "to" in the result object is the receiver address. This is correct.
        // Use the standard transaction endpoint
        let url = "https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=" # txHash;
        let body = await HttpOutcalls.httpGetRequest(url, [], transform);
        // Extract "to" from the result section (skip any "to" that might appear in other context)
        let toAddr = switch (extractJsonFieldInSection(body, "\"result\"", "to")) {
          case (?a) a;
          case (null) {
            switch (extractJsonField(body, "to")) { case (?a) a; case (null) "" };
          };
        };
        let blockNumHex = switch (extractJsonField(body, "blockNumber")) { case (?b) b; case (null) "0x0" };
        let valueHex = switch (extractJsonField(body, "value")) { case (?v) v; case (null) "0x0" };
        let blockUrl = "https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=" # blockNumHex # "&boolean=false";
        let blockBody = await HttpOutcalls.httpGetRequest(blockUrl, [], transform);
        let tsHex = switch (extractJsonField(blockBody, "timestamp")) { case (?t) t; case (null) "0x0" };
        let tsInt = hexToInt(tsHex);
        let weiFloat = Float.fromInt(hexToInt(valueHex));
        let ethAmt = Float.format(#fix 8, weiFloat / 1_000_000_000_000_000_000.0);
        #ok({ amount = ethAmt; timestamp = tsInt.toText(); toAddress = toAddr });

      } else if (currency == "XRP") {
        // xrpscan API: {"Destination": "RECEIVER", "Account": "SENDER", ...}
        // "Destination" is the correct receiver field for XRP payments
        let url = "https://api.xrpscan.com/api/v1/tx/" # txHash;
        let body = await HttpOutcalls.httpGetRequest(url, [], transform);
        let toAddr = switch (extractJsonField(body, "Destination")) {
          case (?a) a;
          case (null) { switch (extractJsonField(body, "destination")) { case (?a) a; case (null) "" }; };
        };
        let dateField = switch (extractJsonField(body, "date")) { case (?d) d; case (null) "0" };
        let rippleEpoch : Int = 946684800;
        let xrpTs : Int = switch (Int.fromText(dateField)) {
          case (?d) d + rippleEpoch;
          case (null) 0;
        };
        let amtField = switch (extractJsonField(body, "Amount")) {
          case (?a) a;
          case (null) { switch (extractJsonField(body, "amount")) { case (?a) a; case (null) "0" }; };
        };
        let xrpAmt = switch (textToFloat(amtField)) {
          case (?drops) Float.format(#fix 6, drops / 1_000_000.0);
          case (null) amtField;
        };
        #ok({ amount = xrpAmt; timestamp = xrpTs.toText(); toAddress = toAddr });

      } else if (currency == "SOL") {
        // Solana getTransaction response (json encoding):
        // result.transaction.message.accountKeys: [sender, receiver, ...]
        // result.meta.postBalances, result.transaction.message.instructions[].parsed.info.destination
        // "destination" in parsed.info is the receiver for SOL transfers
        let url = "https://api.mainnet-beta.solana.com";
        let reqBody = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTransaction\",\"params\":[\"" # txHash # "\",{\"encoding\":\"jsonParsed\",\"maxSupportedTransactionVersion\":0}]}";
        let solHeaders : [HttpOutcalls.Header] = [{ name = "Content-Type"; value = "application/json" }];
        let body = await HttpOutcalls.httpPostRequest(url, solHeaders, reqBody, transform);
        // In jsonParsed format, SOL transfer instruction has info.destination = receiver
        let toAddr = switch (extractJsonFieldInSection(body, "\"info\"", "destination")) {
          case (?a) a;
          case (null) {
            // fallback: "destination" field anywhere
            switch (extractJsonField(body, "destination")) {
              case (?a) a;
              case (null) { switch (extractJsonField(body, "toUserAccount")) { case (?a) a; case (null) "" }; };
            };
          };
        };
        let blockTime = switch (extractJsonField(body, "blockTime")) { case (?t) t; case (null) "0" };
        let lamportStr = switch (extractJsonFieldInSection(body, "\"info\"", "lamports")) { case (?l) l; case (null) {
          switch (extractJsonField(body, "lamports")) { case (?l) l; case (null) "0" };
        }};
        let solAmt = switch (textToFloat(lamportStr)) {
          case (?l) Float.format(#fix 9, l / 1_000_000_000.0);
          case (null) lamportStr;
        };
        #ok({ amount = solAmt; timestamp = blockTime; toAddress = toAddr });

      } else if (currency == "ICP") {
        // Rosetta API search/transactions response for ICP transfers:
        // operations array contains two entries: sender (TRANSACTION, negative amount) and receiver (TRANSACTION, positive amount)
        // Each operation has: "account": {"address": "..."}, "amount": {"value": "..."}
        // The receiver is the operation with positive value (second operation, index 1)
        let searchUrl = "https://rosetta-api.internetcomputer.org/search/transactions";
        let reqBody = "{\"network_identifier\":{\"blockchain\":\"Internet Computer\",\"network\":\"00000000000000020101\"},\"transaction_identifier\":{\"hash\":\"" # txHash # "\"}}";
        let icpHeaders : [HttpOutcalls.Header] = [{ name = "Content-Type"; value = "application/json" }];
        let body = await HttpOutcalls.httpPostRequest(searchUrl, icpHeaders, reqBody, transform);
        // The receiver address is the second "address" occurrence (index 1)
        // First "address" = sender, second "address" = receiver
        let toAddr = switch (extractJsonFieldNth(body, "address", 1)) {
          case (?a) a;
          case (null) { switch (extractJsonField(body, "address")) { case (?a) a; case (null) "" }; };
        };
        let tsMs = switch (extractJsonField(body, "timestamp")) { case (?t) t; case (null) "0" };
        let tsSec : Int = switch (Int.fromText(tsMs)) {
          case (?t) t / 1000;
          case (null) 0;
        };
        // Use second "value" occurrence (positive, receiver amount) — skip first which may be negative
        let amtStr = switch (extractJsonFieldNth(body, "value", 1)) {
          case (?v) v;
          case (null) { switch (extractJsonField(body, "value")) { case (?v) v; case (null) "0" }; };
        };
        let icpAmt = switch (textToFloat(amtStr)) {
          case (?e8s) {
            let absE8s = if (e8s < 0.0) -e8s else e8s;
            Float.format(#fix 8, absE8s / 100_000_000.0);
          };
          case (null) amtStr;
        };
        #ok({ amount = icpAmt; timestamp = tsSec.toText(); toAddress = toAddr });

      } else {
        #error("Unbekannte Kryptow\u{E4}hrung");
      };
    } catch (_) {
      #error("API-Fehler beim Abrufen der Transaktionsdaten");
    };
  };

  public shared ({ caller }) func checkTransaction(
    adminPw : Text,
    currency : Text,
    txHash : Text
  ) : async { #ok : TxCheckResult; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");

    let txResult = await fetchTxData(currency, txHash);
    switch (txResult) {
      case (#error(e)) {
        return #ok({
          amount = "";
          currency;
          timestamp = "";
          toAddress = "";
          addressMatch = false;
          eurAmount = null;
          errorMsg = ?("Transaktion nicht gefunden: " # e);
        });
      };
      case (#ok(txData)) {
        let addrMatch = addressMatchesCurrency(currency, txData.toAddress);

        let unixSecs : Int = switch (Int.fromText(txData.timestamp)) {
          case (?s) s;
          case (null) 0;
        };
        let dateStr = if (unixSecs > 0) formatDateForCoinGecko(unixSecs) else "01-01-2024";
        let cgId = coinGeckoId(currency);
        let cgUrl = "https://api.coingecko.com/api/v3/coins/" # cgId # "/history?date=" # dateStr # "&localization=false";

        let eurRate : ?Float = try {
          let cgResp = await HttpOutcalls.httpGetRequest(cgUrl, [], transform);
          switch (extractJsonField(cgResp, "eur")) {
            case (null) null;
            case (?rStr) textToFloat(rStr);
          };
        } catch (_) { null };

        let eurAmount : ?Float = switch (eurRate, textToFloat(txData.amount)) {
          case (?rate, ?amt) ?(rate * amt);
          case _ null;
        };

        // Always return eurAmount and timestamp regardless of address match
        // Frontend will display warning if address doesn't match
        let errorNote : ?Text =
          if (not addrMatch) ?("Falsche Empfangsadresse!")
          else if (eurAmount == null) ?("Historischer Kurs nicht verf\u{FC}gbar")
          else null;

        #ok({
          amount = txData.amount;
          currency;
          timestamp = txData.timestamp;
          toAddress = txData.toAddress;
          addressMatch = addrMatch;
          eurAmount = eurAmount;  // Always return eurAmount, even if address doesn't match
          errorMsg = errorNote;
        });
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile { userProfiles.get(caller) };
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile { userProfiles.get(user) };
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () { userProfiles.add(caller, profile) };

  public shared ({ caller }) func register(nickname : Text, passwordHash : Text) : async { #ok; #error : Text } {
    if (users.containsKey(nickname)) return #error("Nickname already taken");
    users.add(nickname, { nickname = nickname; passwordHash = passwordHash });
    #ok;
  };

  public shared ({ caller }) func login(nickname : Text, passwordHash : Text) : async { #ok : Text; #error : Text } {
    switch (findHardcodedUser(nickname)) {
      case (?hUser) {
        if (hUser.passwordHash != passwordHash) return #error("Invalid credentials");
        let sessionToken = nickname # "-" # visitorCount.toText();
        sessions.add(sessionToken, { nickname = nickname });
        return #ok(sessionToken);
      };
      case (null) {};
    };
    switch (users.get(nickname)) {
      case (null) { #error("Invalid credentials") };
      case (?user) {
        if (user.passwordHash != passwordHash) { #error("Invalid credentials") }
        else {
          let sessionToken = nickname # "-" # visitorCount.toText();
          sessions.add(sessionToken, { nickname = nickname });
          #ok(sessionToken);
        };
      };
    };
  };

  public shared ({ caller }) func incrementVisitorCount() : async () { visitorCount += 1 };

  public query ({ caller }) func getVisitorCount(adminPasswordAttempt : Text) : async { #ok : Nat; #error : Text } {
    if (adminPasswordAttempt != adminPassword) return #error("Unauthorized: Invalid admin password");
    #ok(visitorCount);
  };

  public shared ({ caller }) func recordHeartbeat(sessionToken : Text) : async () {
    activeVisitors.add(sessionToken, Time.now());
  };

  public query func getActiveVisitorCount(adminPasswordAttempt : Text) : async { #ok : Nat; #error : Text } {
    if (adminPasswordAttempt != adminPassword) return #error("Unauthorized");
    let now = Time.now();
    let fiveMinutes : Int = 5 * 60 * 1_000_000_000;
    var count : Nat = 0;
    for (ts in activeVisitors.values()) {
      if (now - ts < fiveMinutes) { count += 1 };
    };
    #ok(count);
  };

  public query func getMusterschreibenCount(adminPasswordAttempt : Text) : async { #ok : Nat; #error : Text } {
    if (adminPasswordAttempt != adminPassword) return #error("Unauthorized");
    var count : Nat = 0;
    for (hasAccess in musterschreibenAccess.values()) {
      if (hasAccess) { count += 1 };
    };
    #ok(count);
  };

  public query ({ caller }) func getCurrentUser(sessionToken : Text) : async { #ok : Text; #error : Text } {
    switch (sessions.get(sessionToken)) {
      case (null) { #error("Invalid session token") };
      case (?session) { #ok(session.nickname) };
    };
  };

  public query ({ caller }) func isRegistered() : async Bool { userProfiles.containsKey(caller) };
  public query ({ caller }) func getAllProfiles() : async [UserProfile] { userProfiles.values().toArray() };

  public shared ({ caller }) func setCryptoAddress(adminPw : Text, currency : Text, address : Text, amount : Text) : async { #ok; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    cryptoAddresses.add(currency, { currency; address; amount });
    #ok;
  };

  public query func getCryptoAddresses() : async [CryptoAddress] { cryptoAddresses.values().toArray() };

  public shared ({ caller }) func submitPaymentProof(nickname : Text, currency : Text, txHash : Text) : async { #ok; #error : Text } {
    if (not isAllowedUser(nickname)) return #error("User not found");
    switch (musterschreibenAccess.get(nickname)) {
      case (?true) { return #error("Already has access") };
      case (_) {};
    };
    paymentRequests.add(nickname, { nickname; currency; txHash; var status = "pending"; submittedAt = Time.now() });
    #ok;
  };

  public query func getMyPaymentStatus(nickname : Text) : async ?{ nickname : Text; currency : Text; txHash : Text; status : Text; submittedAt : Int } {
    switch (paymentRequests.get(nickname)) {
      case (null) null;
      case (?r) ?{ nickname = r.nickname; currency = r.currency; txHash = r.txHash; status = r.status; submittedAt = r.submittedAt };
    };
  };

  public query func getAllPaymentRequests(adminPw : Text) : async { #ok : [{ nickname : Text; currency : Text; txHash : Text; status : Text; submittedAt : Int }]; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    let result = paymentRequests.values().toArray().map(
      func(r : PaymentRequest) : { nickname : Text; currency : Text; txHash : Text; status : Text; submittedAt : Int } {
        { nickname = r.nickname; currency = r.currency; txHash = r.txHash; status = r.status; submittedAt = r.submittedAt }
      }
    );
    #ok(result);
  };

  public shared ({ caller }) func approvePayment(adminPw : Text, nickname : Text) : async { #ok; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    switch (paymentRequests.get(nickname)) {
      case (null) { #error("Payment request not found") };
      case (?req) { req.status := "confirmed"; musterschreibenAccess.add(nickname, true); #ok };
    };
  };

  public shared ({ caller }) func rejectPayment(adminPw : Text, nickname : Text) : async { #ok; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    switch (paymentRequests.get(nickname)) {
      case (null) { #error("Payment request not found") };
      case (?req) { req.status := "rejected"; #ok };
    };
  };

  public query func hasMusterschreibenAccess(nickname : Text) : async Bool {
    switch (musterschreibenAccess.get(nickname)) {
      case (?true) true;
      case (_) false;
    };
  };

  public shared ({ caller }) func grantMusterschreibenAccess(adminPw : Text, nickname : Text) : async { #ok; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    musterschreibenAccess.add(nickname, true);
    #ok;
  };

  public shared ({ caller }) func revokeMusterschreibenAccess(adminPw : Text, nickname : Text) : async { #ok; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    musterschreibenAccess.add(nickname, false);
    #ok;
  };

  public shared ({ caller }) func addPdfEntry(adminPw : Text, blockId : Text, filename : Text, base64Data : Text) : async { #ok : Text; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    pdfEntryCounter += 1;
    let entryId = "odt-" # pdfEntryCounter.toText();
    pdfEntriesNew.add(entryId, { id = entryId; blockId; filename; base64Data; uploadedAt = Time.now() });
    #ok(entryId);
  };

  public shared ({ caller }) func deletePdfEntry(adminPw : Text, entryId : Text) : async { #ok; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    switch (pdfEntriesNew.get(entryId)) {
      case (null) { #error("Entry not found") };
      case (?_) { pdfEntriesNew.remove(entryId); #ok };
    };
  };

  public shared func getPdfEntriesByBlock(blockId : Text) : async [{ id : Text; blockId : Text; filename : Text; base64Data : Text; uploadedAt : Int }] {
    let all = getAllNewPdfEntries();
    let filtered = all.filter(func(e : PdfEntry) : Bool { e.blockId == blockId });
    filtered.map(func(e : PdfEntry) : { id : Text; blockId : Text; filename : Text; base64Data : Text; uploadedAt : Int } {
      { id = e.id; blockId = e.blockId; filename = e.filename; base64Data = e.base64Data; uploadedAt = e.uploadedAt }
    });
  };

  public shared func getAllPdfEntries(adminPw : Text) : async { #ok : [{ id : Text; blockId : Text; filename : Text; base64Data : Text; uploadedAt : Int }]; #error : Text } {
    if (adminPw != adminPassword) return #error("Unauthorized");
    let all = getAllNewPdfEntries();
    let mapped = all.map(func(e : PdfEntry) : { id : Text; blockId : Text; filename : Text; base64Data : Text; uploadedAt : Int } {
      { id = e.id; blockId = e.blockId; filename = e.filename; base64Data = e.base64Data; uploadedAt = e.uploadedAt }
    });
    #ok(mapped);
  };

  public query func transform(input : HttpOutcalls.TransformationInput) : async HttpOutcalls.TransformationOutput {
    HttpOutcalls.transform(input);
  };

  public shared ({ caller }) func verifyBTCTransaction(txHash : Text, nickname : Text) : async { #confirmed; #pending; #error : Text } {
    let btcAddress = switch (cryptoAddresses.get("BTC")) {
      case (null) { return #error("BTC address not configured") };
      case (?addr) { addr.address };
    };
    switch (paymentRequests.get(nickname)) {
      case (null) { return #error("No payment request found") };
      case (?req) { if (req.status == "confirmed") return #confirmed };
    };
    let url = "https://blockchain.info/rawtx/" # txHash;
    let response = await HttpOutcalls.httpGetRequest(url, [], transform);
    if (response.contains(#text btcAddress)) {
      switch (paymentRequests.get(nickname)) {
        case (?req) { req.status := "confirmed"; musterschreibenAccess.add(nickname, true) };
        case (null) {};
      };
      #confirmed;
    } else if (response.contains(#text "\"hash\"")) {
      #pending;
    } else {
      #error("Transaction not found");
    };
  };
};
