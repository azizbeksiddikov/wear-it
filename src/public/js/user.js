// Toggle edit mode
function toggleEditMode() {
  const form = document.getElementById("userForm");
  const detailsView = document.querySelector(".details-view");
  const btnEdit = document.querySelector(".btn-edit");

  if (form.style.display === "none") {
    form.style.display = "block";
    detailsView.style.display = "none";
    btnEdit.innerHTML = '<i class="fas fa-times"></i> Cancel';
  } else {
    form.style.display = "none";
    detailsView.style.display = "block";
    btnEdit.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
  }
}

// Handle form submission
document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const userId = window.location.pathname.split("/").pop();

  try {
    const response = await fetch(`/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    if (response.ok) {
      // Show success message
      showNotification("Profile updated successfully", "success");
      // Refresh the page to show updated data
      window.location.reload();
    } else {
      throw new Error("Failed to update profile");
    }
  } catch (error) {
    showNotification("Failed to update profile", "error");
  }
});

// Filter orders by status
document.getElementById("orderStatusFilter").addEventListener("change", (e) => {
  const status = e.target.value;
  const orders = document.querySelectorAll(".order-card");

  orders.forEach((order) => {
    if (
      !status ||
      order.querySelector(".order-status").textContent.trim() === status
    ) {
      order.style.display = "block";
    } else {
      order.style.display = "none";
    }
  });

  // Show/hide no orders message
  const visibleOrders = document.querySelectorAll(
    '.order-card[style="display: block"]'
  );
  const noOrders = document.querySelector(".no-orders");

  if (visibleOrders.length === 0) {
    noOrders.style.display = "block";
  } else {
    noOrders.style.display = "none";
  }
});

// Show notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Add styles dynamically
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;

  if (type === "success") {
    notification.style.backgroundColor = "#28a745";
  } else {
    notification.style.backgroundColor = "#dc3545";
  }

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
