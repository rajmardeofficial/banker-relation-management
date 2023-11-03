function handleAction(adminId, action) {
  // Send a POST request to the server
  fetch("/admin/approveAdmin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Include any additional headers or authentication tokens if needed
    },
    body: JSON.stringify({ adminId, action }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Handle the response from the server
      console.log(data.message);

      // Optionally update the UI based on the server response
      if (data.admin && action === "approve") {
        // Update the UI to indicate approval
        window.location.href = "/admin";
      } else if (action === "reject") {
        // Handle UI update for rejection if needed
        console.log(`${data.message}`);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      // Handle errors, e.g., show an error message to the user
    });
}
