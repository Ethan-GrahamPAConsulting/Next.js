import axios from "axios";

export { isAxiosError } from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;