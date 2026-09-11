import axios from "axios";
const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`
});

export const getSubjects = async () => {
  const response = await axios.get(
    `${API}/subjects`,
    authHeader()
  );

  return response.data.subjects;
};

export const getAnalytics = async (subject) => {
  const response = await axios.get(
    `${API}/analytics/${subject}`,
    authHeader()
  );

  return response.data;
};

export async function getDashboard() {
    const response = await axios.get(
        import.meta.env.VITE_API_URL + "/analytics/dashboard",
        {
            headers: authHeader(),
        }
    );

    return response.data;
}