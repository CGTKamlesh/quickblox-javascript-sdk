/*
 * QuickBlox JavaScript SDK
 *
 * WebRTC Module (WebRTC session model)
 *
 */

// Modules
//
var config = require('../../qbConfig');
var RTCPeerConnection = require('./qbRTCPeerConnection');
var Utils = require('../../qbUtils'),
var Helpers = require('./qbWebRTCHelpers'),

// Variables
//
var localStream;


 /**
  * Creates a session
  * @param {number} An ID if the call's initiator
  * @param {array} An array with opponents
  * @param {enum} Type of a call
  */
function WebRTCSession(initiatorID, opponentsIDs, callType) {
  this.ID = generateUUID();
  this.state = this.state.NEW;
  //
  this.initiatorID = initiatorID;
  this.opponentsIDs = opponentsIDs;
  this.callType = callType;
  //
  this.peerConnections = {};
}


/**
 * Gete the user media stream
 * @param {map} A map media stream constrains
 * @param {function} A callback to get a result of the function
 */
WebRTCProxy.prototype.getUserMedia = function(params, callback) {
  var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (!getUserMedia) {
    throw new Error('getUserMedia() is not supported in your browser');
  }
  getUserMedia = getUserMedia.bind(navigator);

  var self = this;

  // Additional parameters for Media Constraints
  // http://tools.ietf.org/html/draft-alvestrand-constraints-resolution-00
  /**********************************************
   * googEchoCancellation: true
   * googAutoGainControl: true
   * googNoiseSuppression: true
   * googHighpassFilter: true
   * minWidth: 640
   * minHeight: 480
   * maxWidth: 1280
   * maxHeight: 720
   * minFrameRate: 60
   * maxAspectRatio: 1.333
  **********************************************/
  getUserMedia(
    {
      audio: params.audio || false,
      video: params.video || false

    },function(stream) {
      self.localStream = stream;

      if (params.elemId){
        self.attachMediaStream(params.elemId, stream, params.options);
      }
      callback(null, stream);

    },function(err) {
      callback(err, null);
    }
  );
};

/**
 * Attach media stream to audio/video element
 * @param {string} The Id of an ellement to attach a stream
 * @param {Object} The steram to attach
 * @param {map} The additional options
 */
WebRTCProxy.prototype.attachMediaStream = function(id, stream, options) {
  var elem = document.getElementById(id);
  if (elem) {
    elem.src = URL.createObjectURL(stream);
    if (options && options.muted) elem.muted = true;
    if (options && options.mirror) {
      elem.style.webkitTransform = 'scaleX(-1)';
      elem.style.transform = 'scaleX(-1)';
    }
    elem.play();
  }
};

/**
 * Initiate a call
 * @param {array} A map with custom parameters
 */
WebRTCSession.prototype.call = function(extension) {
  var self = this;

  // create a peer connection for each opponent
  this.opponentsIDs.forEach(function(item, i, arr) {
    var peer = this._createPeer(item, 'offer', null);
    this.peerConnections[item] = peer;

    peer.getSessionDescription(function(err, localSessioNDescription) {
      if (err) {
        trace("getSessionDescription error: " + err);
      } else {

        // let's send call requests to user
        //
        clearDialingTimerInterval(sessionId);
        var functionToRun = function() {
          self._sendMessage(userIdToCall, extension, 'CALL', callType, userIdsToCall);
        };
        functionToRun(); // run a function for the first time and then each N seconds.
        startDialingTimerInterval(sessionId, functionToRun);
        //
        clearCallTimer(sessionId);
        startCallTimer(sessionId, self._callTimeoutCallback);
        //
        //
      }
    });

  });

  trace('Call, extension: ' + JSON.stringify(extension));
}

/**
 * Accept a call
 * @param {array} A map with custom parameters
 */
WebRTCSession.prototype.accept = function(extension) {
  trace('Accept, extension: ' + JSON.stringify(extension));

  // clearAnswerTimer(sessionId);

  // create a peer connection for each opponent
  this.opponentsIDs.forEach(function(item, i, arr) {
    var peer = this._createPeer(item, 'answer', extension.sdp);
    this.peerConnections[item] = peer;

    // var session = sessions[sessionId];
    // if (session) {
    //   this._createPeer({
    //     sessionID: sessionId,
    //     description: session.sdp
    //   });
    // }

    peer.getSessionDescription(function(err, localSessionDescription) {
      if (err) {
        trace("getSessionDescription error: " + err);
      } else {
        self._sendMessage(userId, extension, 'ACCEPT');
      }
    });

  });
}

/**
 * Reject a call
 * @param {array} A map with custom parameters
 */
WebRTCSession.prototype.reject = function(extension) {
  var extension = extension || {};

  trace('Reject, extension: ' + JSON.stringify(extension));

  // clearAnswerTimer(sessionId);
  //
  // if (sessions[sessionId]) {
  //   delete sessions[sessionId];
  // }
  //
  // this._sendMessage(userId, extension, 'REJECT');
}

/**
 * Stop a call
 * @param {array} A map with custom parameters
 */
WebRTCSession.prototype.stop = function(extension) {
  var extension = extension || {};

  trace('Stop, extension: ' + JSON.stringify(extension));

  // clearAnswerTimer(sessionId);
  // clearDialingTimerInterval(sessionId);
  // clearCallTimer(userId);
  //
  // this._sendMessage(userId, extension, 'STOP');
  // this._close();
  //
  // clearSession(sessionId);
}

/**
 * Update a call
 * @param {array} A map with custom parameters
 */
WebRTCSession.prototype.update = function(extension) {
  var extension = extension || {};
  trace('Update, extension: ' + JSON.stringify(extension));

  // this._sendMessage(userId, extension, 'PARAMETERS_CHANGED');
}

/**
 * MMutes the stream
 * @param {string} what to mute: 'audio' or 'video'
 */
WebRTCSession.prototype.mute = function(type) {
  this._muteStream(0, type);
};

WebRTCSession.prototype.unmute = function(type) {
  this._muteStream(1, type);
};


/**
 * State of a session
 */
WebRTCSession.State = {
  NEW: 'new',
  ACTIVE: 'active',
  HUNGUP: 'hungup',
  REJECTED: 'rejected'
};


//
///////////////////////////////// Static methods ///////////////////////////////
//


/**
 * Creates the new session.
 * @param {number} Initiator ID
 * @param {array} Opponents IDs
 * @param {enum} Call type
 */
WebRTCSession.createNewSession = function(initiatorID, opponentsIDs, callType) {
  var newSession = new WebRTCSession(initiatorID, opponentsIDs, callType);
  return newSession;
}

/**
 * A map with all sessions the user had/have.
 * @type {Object.<string, Object>}
 */
WebRTCSession.sessions = {};

/**
 * Checks is session active or not
 * @param {string} Session ID
 */
WebRTCSession.isSessionActive = function(sessionId){
   var session = WebRTCSession.sessions[sessionId];
   return (session != null && session.state == this.state.ACTIVE);
};


/**
 * Checks is session rejected or not
 * @param {string} Session ID
 */
WebRTCSession.isSessionRejected = function(sessionId){
   var session = WebRTCSession.sessions[sessionId];
   return (session != null && session.state == this.state.REJECTED);
};

/**
 * Checks is session hung up or not
 * @param {string} Session ID
 */
WebRTCSession.isSessionHungUp = function(sessionId){
   var session = WebRTCSession.sessions[sessionId];
   return (session != null && session.state == this.state.HUNGUP);
};


//
/////////////////////////////////// Delegates //////////////////////////////////
//

WebRTCSession.prototype._onRemoteStreamListener = function(userID, stream) {
  if (typeof this.onRemoteStreamListener === 'function'){
    this.onRemoteStreamListener(this, userID, stream);
  }
};

WebRTCSession.prototype._onSessionConnectionStateChangedListener = function(userID, connectionState) {

  if (typeof this.onSessionConnectionStateChangedListener === 'function'){
    this.onSessionConnectionStateChangedListener(this, userID, connectionState);
  }

  if (connectionState === RTCPeerConnection.SessionConnectionState.CLOSED){
    //peer = null;
  }
}


//
//////////////////////////////////// Private ///////////////////////////////////
//


WebRTCSession.prototype._createPeer = function(userID, type, sessionDescription) {
  trace("_createPeer");

  if (!RTCPeerConnection) throw new Error('RTCPeerConnection() is not supported in your browser');

  // Additional parameters for RTCPeerConnection options
  // new RTCPeerConnection(pcConfig, options)
  /**********************************************
   * DtlsSrtpKeyAgreement: true
   * RtpDataChannels: true
  **********************************************/
  var pcConfig = {
    iceServers: config.iceServers
  };
  var peer = new RTCPeerConnection(pcConfig);
  peer.init(this, userID, this.ID, type, sessionDescription);

  return peer;
};

// close peer connection and local stream
WebRTCSession.prototype._close = function() {
  trace("_close");

  for (var key in this.peerConnections) {
    var peer = this.peerConnections[key];
    peer.close();
  }

  if (this.localStream) {
    this.localStream.stop();
    this.localStream = null;
  }
};

WebRTCSession.prototype._muteStream = function(bool, type) {
  if (type === 'audio' && this.localStream.getAudioTracks().length > 0) {
    this.localStream.getAudioTracks().forEach(function (track) {
      track.enabled = !!bool;
    });
    return;
  }

  if (type === 'video' && this.localStream.getVideoTracks().length > 0) {
    this.localStream.getVideoTracks().forEach(function (track) {
      track.enabled = !!bool;
    });
    return;
  }
};

WebRTCSession.prototype.toString = function sessionToString() {
  var ret = 'ID: ' + this.ID + ', initiatorID:  ' + this.initiatorID + ', opponentsIDs: ' +
    this.opponentsIDs + ', state: ' + this.state + ", callType: " + this.callType;
  return ret;
}

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

module.exports = WebRTCSession;