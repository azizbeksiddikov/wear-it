// Initialize points modal
let pointsModal;

document.addEventListener("DOMContentLoaded", function () {
  pointsModal = new bootstrap.Modal(document.getElementById("pointsModal"));
});

// Toggle status options
function toggleStatusOptions(element) {
  const combobox = element.parentElement;
  combobox.classList.toggle("active");

  // Close other open comboboxes
  document.querySelectorAll(".status-combobox.active").forEach((cb) => {
    if (cb !== combobox) {
      cb.classList.remove("active");
    }
  });
}

// Close status options when clicking outside
document.addEventListener("click", function (event) {
  if (!event.target.closest(".status-combobox")) {
    document.querySelectorAll(".status-combobox.active").forEach((cb) => {
      cb.classList.remove("active");
    });
  }
});

// Update user status
async function updateStatus(userId, newStatus) {
  try {
    const response = await fetch(`/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberStatus: newStatus,
      }),
    });

    if (response.ok) {
      const statusBadge = document.querySelector(
        `tr[data-user-id="${userId}"] .status-badge`
      );
      statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;
      statusBadge.textContent = newStatus;
      statusBadge.parentElement.classList.remove("active");
      showNotification("Status updated successfully", "success");
    } else {
      throw new Error("Failed to update status");
    }
  } catch (error) {
    showNotification("Failed to update status", "error");
  }
}

// Open points update modal
function openPointsPopup(userId, currentPoints) {
  document.getElementById("userId").value = userId;
  document.getElementById("points").value = currentPoints;
  pointsModal.show();
}

// Update user points
async function updatePoints() {
  const userId = document.getElementById("userId").value;
  const newPoints = document.getElementById("points").value;

  if (isNaN(newPoints) || newPoints < 0) {
    showNotification("Please enter a valid number", "error");
    return;
  }

  try {
    const response = await fetch(`/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberPoints: parseInt(newPoints),
      }),
    });

    if (response.ok) {
      const pointsBadge = document.querySelector(
        `tr[data-user-id="${userId}"] .points-badge`
      );
      pointsBadge.textContent = `${newPoints} pts`;
      pointsModal.hide();
      showNotification("Points updated successfully", "success");
    } else {
      throw new Error("Failed to update points");
    }
  } catch (error) {
    showNotification("Failed to update points", "error");
  }
}

// Search functionality
document.getElementById("searchInput").addEventListener("keyup", function () {
  const searchTerm = this.value.toLowerCase();
  const rows = document.querySelectorAll(".table tbody tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
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
