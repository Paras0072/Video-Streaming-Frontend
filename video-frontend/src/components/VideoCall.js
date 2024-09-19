import React, { useState, useEffect, useRef } from "react";

const { roomCreation } = require("../api");
const { joining } = require("../api");
const VideoCall = ({ token }) => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
 
  const [localStream, setLocalStream] = useState(null);
  const remoteStream = useRef(new MediaStream());

  useEffect(() => {
    // Create WebSocket connection to the signaling server
   
    const ws = new WebSocket("ws://localhost:5000");
    setSocket(ws);

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      handleSignalingData(data);
    };

    // Get local media (camera/microphone)
 initLocalStream();
   

    return () => {
      if (ws) ws.close();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop()); // Stop all tracks
      }
    };
  }, []);
  // Function to show notification
  const showNotification = (title, body) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body: body,
        icon: "/path/to/icon.png", // Optional: Set your notification icon
      });

      notification.onclick = () => {
        window.focus(); // Focus the window if the notification is clicked
      };
    } else {
      console.error("Notifications are not enabled or permission was denied.");
    }
  };

  // Request Notification permission (ensure permission is granted)
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission().then((permission) => {
          if (permission !== "granted") {
            console.error("Permission for notifications was denied.");
          }
        });
      }
    }
  }, []);

  // Function to initialize the local media (camera/microphone)
  const initLocalStream = async () => {
    try {
      // Notify the user before accessing camera and microphone
      showNotification(
        "Camera & Microphone",
        "Requesting access to your camera and microphone."
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Success: Notify user that access was granted
      showNotification(
        "Access Granted",
        "Successfully accessed your camera and microphone!"
      );

      // Set the stream and attach it to the video element
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;

      console.log("Local stream initialized");
      // Initialize peer connection after local stream is set
      createPeerConnection();
    } catch (error) {
      // Error: Notify user that access was denied
      showNotification(
        "Access Denied",
        "Failed to access your camera and microphone."
      );
      console.error("Error accessing media devices.", error);
    }
  };
 
  const handleSignalingData = async (data) => {
    switch (data.type) {
      case "offer":
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        sendSignalingData({ type: "answer", answer });
        break;
      case "answer":
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        break;
      case "candidate":
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
        break;
      default:
        break;
    }
  };

  const sendSignalingData = (data) => {
    socket.send(JSON.stringify({ ...data, roomId }));
  };

  const createPeerConnection = () => {
    if (!localStream.current) {
      console.error("Local stream is not initialized");
      return;
    }

    // Initialize RTCPeerConnection
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    // Add local tracks to the peer connection
    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });
    // Handle track events
    peerConnection.current.ontrack = (event) => {
      remoteStream.current.addTrack(event.track);
      remoteVideoRef.current.srcObject = remoteStream.current;
    };
    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingData({ type: "candidate", candidate: event.candidate });
      }
    };
  };

  // API call to create a room
  const createRoom = async (e) => {
    e.preventDefault();
    console.log("Sending create room request...");
    try {
      // const token = localStorage.getItem("token");
      const response = await roomCreation(token);
      console.log("Room created with ID:", response.roomId);
      setRoomId(response.roomId);
      setInRoom(true);
    } catch (error) {
      console.error("Failed to create room:", error.message);
    }

   
  };

  // API call to join a room
  const joinRoom = async (e) => {
    
    e.preventDefault();
    console.log("Sending join room request...");
    try {
      const response = await joining(token, roomId);

      if (response.roomId) {
        setInRoom(true);
        createPeerConnection();
        socket.send(JSON.stringify({ type: "join-room", roomId }));
      } else {
        console.error("Room not found");
      }
    } catch (error) {
      console.error("Failed to join room:", error.message);
    }
  };

  const startCall = async () => {
    createPeerConnection();
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    sendSignalingData({ type: "offer", offer });
  };

  return (
    <div>
      <h1> Video Call</h1>
      <div>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter a room ID to join"
        />
        <button onClick={createRoom} disabled={inRoom}>
          Create Room
        </button>
        <button onClick={joinRoom} disabled={inRoom}>
          Join Room
        </button>
      </div>
      <div>{inRoom && <button onClick={startCall}>Start Call</button>}</div>
      <div>
        <h2>Local Video</h2>
        <video ref={localVideoRef} autoPlay playsInline muted></video>
      </div>
      <div>
        <h2>Remote Video</h2>
        <video ref={remoteVideoRef} autoPlay playsInline></video>
      </div>
    </div>
  );
};



export default VideoCall;
