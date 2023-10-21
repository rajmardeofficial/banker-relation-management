document.addEventListener("DOMContentLoaded", function() {
    const display = document.getElementById("user_profile_details");

    const user_profile_details = {
        name: "Devanshi Tegwal",
        Pan_Number: "BZPTL43442L",
        Relationship_Manager: "Admin",
        Bank_Details: "Bank Of India"
    };

    document.getElementById("name").textContent = user_profile_details.name;
    document.getElementById("Pan_Number").textContent = user_profile_details.Pan_Number;
    document.getElementById("Relationship_Manager").textContent = user_profile_details.Relationship_Manager;
    document.getElementById("Bank_Details").textContent = user_profile_details.Bank_Details;

    const userDetailsDiv = document.getElementById("user-details");
    const changePasswordButton = document.getElementById("change-password-button");
    const passwordChangeForm = document.getElementById("change-password-form"); // Change the ID here

    // Initially, hide the password change form
    passwordChangeForm.style.display = "none";

    changePasswordButton.addEventListener("click", function() {
        // Toggle the display of the password change form
        if (passwordChangeForm.style.display === "none") {
            passwordChangeForm.style.display = "block";
        } else {
            passwordChangeForm.style.display = "none";
        }
    });

    const passwordForm = document.getElementById("Password_Change");
    passwordForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const oldPassword = document.getElementById("old_password").value;
        const newPassword = document.getElementById("new_password").value;

        // In a real application, you would send this data to a server to change the password
        // For this demonstration, you can alert a message
        alert(`Changing password:\nOld Password: ${oldPassword}\nNew Password: ${newPassword}`);
    });
});
