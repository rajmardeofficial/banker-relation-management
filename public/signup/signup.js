document.addEventListener("DOMContentLoaded", function() {
    const userForm = document.getElementById("signup-form");

    userForm.addEventListener("submit", function(event){
        event.preventDefault();

        const name = document.getElementById("name").value;
        const mobile = document.getElementById("mobile").value;
        const email = document.getElementById("email").value;
        const pan = document.getElementById("pan_number").value;
        // const otp = document.getElementById("otp").value;
        const password = document.getElementById("password").value;

        alert(`User registration successful!);
    })
})