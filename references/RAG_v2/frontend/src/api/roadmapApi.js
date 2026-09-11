import axios from "axios";
const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
});

export const getRoadmap = async (subject) => {
    const res = await axios.get(
        `${API}/roadmap/${subject}`,
        authHeader()
    );
    return res.data;
};

export const completeTopic = async (
    subject,
    week,
    topic_name
) => {
    await axios.put(
        `${API}/roadmap/${subject}/complete-topic`,
        {
            week,
            topic_name,
        },
        authHeader()
    );
};

export const extendRoadmap = async (
    subject,
    new_target_date
) => {
    await axios.put(
        `${API}/roadmap/${subject}/extend`,
        {
            new_target_date,
        },
        authHeader()
    );
};