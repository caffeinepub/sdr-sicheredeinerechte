import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Int "mo:core/Int";
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

  stable let users = Map.empty<Text, User>();
  stable let sessions = Map.empty<Text, Session>();
  stable let userProfiles = Map.empty<Principal, UserProfile>();
  stable var visitorCount : Nat = 0;
  let adminPassword : Text = "WotanClan44!";

  stable let activeVisitors = Map.empty<Text, Int>();
  stable let cryptoAddresses = Map.empty<Text, CryptoAddress>();
  stable let paymentRequests = Map.empty<Text, PaymentRequest>();
  stable let musterschreibenAccess = Map.empty<Text, Bool>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile { userProfiles.get(caller) };
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile { userProfiles.get(user) };
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () { userProfiles.add(caller, profile) };

  public shared ({ caller }) func register(nickname : Text, passwordHash : Text) : async { #ok; #error : Text } {
    if (users.containsKey(nickname)) return #error("Nickname already taken");
    users.add(nickname, { nickname = nickname; passwordHash = passwordHash });
    #ok;
  };

  public shared ({ caller }) func login(nickname : Text, passwordHash : Text) : async { #ok : Text; #error : Text } {
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
    if (not users.containsKey(nickname)) return #error("User not found");
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
