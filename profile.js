// Profile functionality
if (document.getElementById("profile-form")) {
  const profileForm = document.getElementById("profile-form");
  const profileError = document.getElementById("profile-error");
  const profileSuccess = document.getElementById("profile-success");

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    throw new Error("Not logged in");
  }

  // Fill form with current user data
  document.getElementById("name").value = currentUser.name;
  document.getElementById("email").value = currentUser.email;

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newName = document.getElementById("name").value.trim();
    const newPassword = document.getElementById("new-password").value;

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u) => u.id === currentUser.id);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      // Update user information
      users[userIndex].name = newName;
      if (newPassword) {
        users[userIndex].password = newPassword;
      }

      // Save updated users array
      localStorage.setItem("users", JSON.stringify(users));

      // Update current user in localStorage
      const updatedCurrentUser = {
        ...currentUser,
        name: newName,
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));

      // Show success message
      profileSuccess.textContent = "Profile updated successfully";
      profileSuccess.style.display = "block";
      profileError.style.display = "none";

      // Clear password field
      document.getElementById("new-password").value = "";

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      profileError.textContent = error.message || "Failed to update profile";
      profileError.style.display = "block";
      profileSuccess.style.display = "none";
    }
  });
}
