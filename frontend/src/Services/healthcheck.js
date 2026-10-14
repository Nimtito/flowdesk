
import api from "./api";

export async function checkBackend() {
  const response = await api.get("/dashboard/");
  return response.data;
}
