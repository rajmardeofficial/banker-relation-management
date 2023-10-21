// JavaScript code in admin.js
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
});

function filterProductRows(filterValue) {
  // Get all product rows
  const productRows = document.querySelectorAll(".products-row");

  // Loop through each product row
  productRows.forEach(function (row) {
      // Get the status cell in this row
      const statusCell = row.querySelector(".status-cell .status");

      console.log("Status Text:", statusCell.textContent.trim().toLowerCase()); // Debugging line

      if (
          filterValue === "all" ||
          filterValue.toLowerCase() === statusCell.textContent.trim().toLowerCase()
      ) {
          // Show the row
          row.style.display = "flex";
      } else {
          // Hide the row
          row.style.display = "none";
      }
  });
}
