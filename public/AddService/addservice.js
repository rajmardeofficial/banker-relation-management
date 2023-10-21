document.addEventListener("DOMContentLoaded", function() {
    const serviceForm = document.getElementById("add-service-form");
    const serviceList = document.getElementById("service-list");
    const addButton = document.getElementById("add-button");
  
    addButton.addEventListener("click", function() {
      const serviceInput = document.getElementById("service");
      const paymentInput = document.getElementById("payment");
  
      const service = serviceInput.value;
      const payment = paymentInput.value;
  
      if (service && payment) {
        // Create a new list item to display the service and payment
        const listItem = document.createElement("li");
        listItem.textContent = `${service}: $${payment}`;
  
        // Append the list item to the service list
        serviceList.appendChild(listItem);
  
        // Clear the input fields
        serviceInput.value = "";
        paymentInput.value = "";
      }
    });
  });
  