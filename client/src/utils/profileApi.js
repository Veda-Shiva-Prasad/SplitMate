import API from "./api";

// Get the logged-in user's latest profile from MongoDB.
export const getProfile = async () => {
  const response = await API.get("/auth/me");
  return response.data.user;
};

// Update profile details and profile photo.
export const updateProfile = async (profileData) => {
  const response = await API.put("/auth/profile", profileData);
  return response.data;
};

// Change the logged-in user's password.
export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await API.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });

  return response.data;
};
