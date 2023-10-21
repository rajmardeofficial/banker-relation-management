document.addEventListener("DOMContentLoaded", function () {
    // Get all filter links
    const filterLinks = document.querySelectorAll(".dropdown-content a");
  
    // Add click event listeners to filter links
    filterLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default link behavior
  
        // Get the data-value attribute from the clicked link
        const filterValue = this.getAttribute("data-value");
  
        // Call a function to filter the product rows
        filterProductRows(filterValue);
      });
    });
  
    // Add this within your existing JavaScript code or create a new script
    const searchInput = document.getElementById("searchInput");
  
    searchInput.addEventListener("input", function () {
      const searchTerm = searchInput.value.toLowerCase();
      filterProductRowsBySearch(searchTerm);
    });
  });
  
  function filterProductRows(filterValue) {
    // Get all product rows
    const productRows = document.querySelectorAll(".tableView tbody tr");
  
    // Loop through each product row
    productRows.forEach(function (row) {
      // Get the status cell in this row
      const statusCell = row.querySelector(".status");
  
      if (
        filterValue === "all" ||
        filterValue.toLowerCase() === statusCell.textContent.trim().toLowerCase()
      ) {
        // Show the row
        row.style.display = "";
  
        // Apply color styles based on status
        if (statusCell.textContent.trim().toLowerCase() === "completed") {
          statusCell.classList.add("status-paid");
          statusCell.classList.remove("status-due");
        } else if (statusCell.textContent.trim().toLowerCase() === "cancel") {
          // Assuming you have a CSS class for "inprogress" status
          statusCell.classList.add("status-inprogress");
          statusCell.classList.remove("status-paid", "status-due");
        } else if (statusCell.textContent.trim().toLowerCase() === "pending") {
          statusCell.classList.add("status-due");
          statusCell.classList.remove("status-paid");
        } else {
          // Reset styles if neither "paid," "inprogress," nor "due"
          statusCell.classList.remove("status-paid", "status-due", "status-inprogress");
        }
      } else {
        // Hide the row
        row.style.display = "none";
      }
    });
  }
  
  function filterProductRowsBySearch(searchTerm) {
    const productRows = document.querySelectorAll(".tableView tbody tr");
  
    productRows.forEach(function (row) {
      const textContent = row.textContent.toLowerCase();
  
      if (textContent.includes(searchTerm)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }
  