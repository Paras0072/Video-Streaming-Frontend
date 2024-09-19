import axios from "axios";

const API_URL = "http://localhost:5000";

export const login = async (username, password) => {
  return axios.post(`${API_URL}/user/login`, { username, password });
};
export const register = async (username, password) => {
  return axios.post(`${API_URL}/user/register`, {
    username,
    password,
  });
};
export const roomCreation = async (token) => {
  //return axios.post(`${API_URL}/room/create-room`,{},  { headers: {"x-auth-token":token}} );
  try {
    const response = await axios.post(
      `${API_URL}/room/create-room`,
      {},
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data; // Return the response data directly
  } catch (error) {
    console.error(
      "Error creating room:",
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};
export const joining = async (token, roomId) => {
  try {
    const response = await axios.post(
      `${API_URL}/room/join-room`,
      { roomId },
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data; // Return the response data directly
  } catch (error) {
    console.error(
      "Error joining room:",
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};