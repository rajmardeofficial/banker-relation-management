document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("signup-form");

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const nameInput = document.getElementById("name");
        const name = nameInput.value;

        // Store the name in localStorage
        localStorage.setItem("user_name", name);

        // Redirect to another page (display.html)
        window.location.href = "display.html";
    });
});




document.addEventListener("DOMContentLoaded", function() {
    const displayName = document.getElementById("display-name");

    // Retrieve the name from localStorage
    const storedName = localStorage.getItem("user_name");

    if (storedName) {
        displayName.textContent = storedName;
    } else {
        displayName.textContent = "User";
    }
});
