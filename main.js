const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");

import { io } from "socket.io-client";

const socket = io("wss://codemagic-webrtc-server.herokuapp.com");
// const socket = io("ws://localhost:8000");

socket.on("hello", (message) => {
  console.log(message);
});

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
const peerconnection = new RTCPeerConnection(configuration);
let rtcSender;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((localstream) => {
    localVideo.srcObject = localstream;
    localstream.getTracks().forEach((track) => {
      rtcSender = peerconnection.addTrack(track, localstream);
    });
  });

peerconnection.addEventListener("track", async (e) => {
  const [remoteStream] = e.streams;
  remoteVideo.srcObject = remoteStream;
});

socket.on("answer", async (message) => {
  console.log("ANS-REMOTE-DESC: ", message);
  const remoteDescription = new RTCSessionDescription(message);
  await peerconnection.setRemoteDescription(remoteDescription);
});

socket.on("offer", async (message) => {
  const remoteDescription = new RTCSessionDescription(message);
  await peerconnection.setRemoteDescription(remoteDescription);
  const answer = await peerconnection.createAnswer();
  await peerconnection.setLocalDescription(answer);
  console.log("OFFER-REMOTE-DESC: ", message);
  socket.emit("answer", answer);
});

peerconnection.addEventListener("icecandidate", (e) => {
  if (e.candidate) {
    socket.emit("ice", e.candidate);
  }
});

socket.on("ice", async (message) => {
  try {
    await peerconnection.addIceCandidate(message);
  } catch (error) {
    console.log(error);
  }
});

async function makeCall() {
  const offer = await peerconnection.createOffer();
  await peerconnection.setLocalDescription(offer);
  socket.emit("offer", offer);
}

function endCall() {
  peerconnection.removeTrack(rtcSender);
  peerconnection.close();
  remoteVideo.srcObject = null;
}

startBtn.onclick = () => makeCall();
endBtn.onclick = () => endCall();

peerconnection.addEventListener("connectionstatechange", (e) => {
  switch (peerconnection.connectionState) {
    case "new":
    case "checking":
      console.log("Connecting…");
      break;
    case "connected":
      console.log("Online");
      break;
    case "disconnected":
      console.log("Disconnecting…");
      remoteVideo.srcObject = null;
      break;
    case "closed":
      console.log("Offline");
      break;
    case "failed":
      console.log("Error");
      break;
    default:
      console.log("Unknown");
      break;
  }
});

peerconnection.addEventListener("icegatheringstatechange", (e) => {
  switch (peerconnection.iceGatheringState) {
    case "new":
      console.log("NEW ICE");
      break;
    case "gathering":
      console.log("GATHERING ICE");
      break;
    case "complete":
      console.log("COMPLETE ICE");
      break;
  }
});
