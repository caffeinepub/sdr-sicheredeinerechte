import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  stable let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type required by the frontend
  public type UserProfile = {
    name : Text;
  };

  // User data for the SDR system
  type User = {
    nickname : Text;
    passwordHash : Text;
  };

  type Session = {
    nickname : Text;
  };

  // Storage - stable so data persists across upgrades/deployments
  stable let users = Map.empty<Text, User>();
  stable let sessions = Map.empty<Text, Session>();
  stable let userProfiles = Map.empty<Principal, UserProfile>();
  stable var visitorCount : Nat = 0;
  let adminPassword : Text = "admin123";

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func register(nickname : Text, passwordHash : Text) : async { #ok; #error : Text } {
    if (users.containsKey(nickname)) {
      return #error("Nickname already taken");
    };
    let user : User = {
      nickname = nickname;
      passwordHash = passwordHash;
    };
    users.add(nickname, user);
    #ok;
  };

  public shared ({ caller }) func login(nickname : Text, passwordHash : Text) : async { #ok : Text; #error : Text } {
    switch (users.get(nickname)) {
      case (null) { #error("Invalid credentials") };
      case (?user) {
        if (user.passwordHash != passwordHash) {
          #error("Invalid credentials");
        } else {
          let sessionToken = nickname # "-" # visitorCount.toText();
          sessions.add(sessionToken, { nickname = nickname });
          #ok(sessionToken);
        };
      };
    };
  };

  public shared ({ caller }) func incrementVisitorCount() : async () {
    visitorCount += 1;
  };

  public query ({ caller }) func getVisitorCount(adminPasswordAttempt : Text) : async { #ok : Nat; #error : Text } {
    if (adminPasswordAttempt != adminPassword) {
      return #error("Unauthorized: Invalid admin password");
    };
    #ok(visitorCount);
  };

  public query ({ caller }) func getCurrentUser(sessionToken : Text) : async { #ok : Text; #error : Text } {
    switch (sessions.get(sessionToken)) {
      case (null) { #error("Invalid session token") };
      case (?session) { #ok(session.nickname) };
    };
  };

  public query ({ caller }) func isRegistered() : async Bool {
    userProfiles.containsKey(caller);
  };

  public query ({ caller }) func getAllProfiles() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all profiles");
    };
    userProfiles.values().toArray();
  };
};
