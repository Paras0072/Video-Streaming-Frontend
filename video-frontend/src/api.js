import axios from "axios";

const API_URL = "http://localhost:5000";

export const login = async (username, password) => {
  return axios.post(`${API_URL}/user/login`, { username, password });
};
