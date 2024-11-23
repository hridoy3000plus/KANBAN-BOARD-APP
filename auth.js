function getUsers() {
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// Register functionality
if (document.getElementById("register-form")) {
  const registerForm = document.getElementById("register-form");
  const registerError = document.getElementById("register-error");

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const users = getUsers();

    if (users.find((user) => user.email === email)) {
      registerError.textContent = "Email already registered";
      registerError.style.display = "block";
      return;
    }

    users.push({
      id: Date.now().toString(),
      name,
      email,
      password,
    });

    saveUsers(users);
    window.location.href = "login.html";
  });
}

// Login functionality
if (document.getElementById("login-form")) {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const users = getUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
        })
      );
      window.location.href = "index.html";
    } else {
      loginError.textContent = "Invalid email or password";
      loginError.style.display = "block";
    }
  });
}
