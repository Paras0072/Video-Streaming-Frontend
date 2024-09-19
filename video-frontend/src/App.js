import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import VideoCall from "./components/VideoCall";

function App() {
  const [token, setToken] = useState(null);

  return (
    <div className="App">
      {!token ? (
        <div>
          <Login setToken={setToken} />
          <Register />
        </div>
      ) : (
        <VideoCall token={token} />
      )}
    </div>
  );
}

export default App;
