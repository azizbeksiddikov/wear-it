document.addEventListener("DOMContentLoaded", function () {
  // Initialize all features
  initCarousel();
  initProductHandlers();
  initVariantHandlers();

  function initProductHandlers() {
    // Product status toggles
    const productId = document.getElementById("productId")?.value;

    document.querySelectorAll(".product-status-toggle").forEach((toggle) => {
      toggle.addEventListener("change", () =>
        updateProduct({
          _id: productId,
          [toggle.getAttribute("data-field")]: toggle.checked,
        })
      );
    });

    // Description editor
    const editBtn = document.getElementById("product-desc-edit-btn");
    const saveBtn = document.getElementById("product-desc-save-btn");
    const cancelBtn = document.getElementById("product-desc-cancel-btn");
    const displayEl = document.getElementById("product-desc-display");
    const editEl = document.getElementById("product-desc-edit-container");
    const textarea = document.getElementById("product-desc-textarea");

    if (editBtn && saveBtn && cancelBtn) {
      editBtn.addEventListener("click", () => {
        displayEl.style.display = "none";
        editEl.style.display = "block";
        textarea.focus();
      });

      saveBtn.addEventListener("click", () => {
        const newDesc = textarea.value.trim();
        displayEl.querySelector("p").textContent =
          newDesc || "No description available";
        displayEl.style.display = "block";
        editEl.style.display = "none";
        updateProduct({ _id: productId, productDesc: newDesc });
      });

      cancelBtn.addEventListener("click", () => {
        const currentText = displayEl.querySelector("p").textContent;
        textarea.value =
          currentText === "No description available" ? "" : currentText;
        displayEl.style.display = "block";
        editEl.style.display = "none";
      });
    }

    // Product deletion
    const deleteBtn = document.getElementById("product-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async function () {
        if (
          !this.disabled &&
          confirm("Are you sure you want to delete this product?")
        ) {
          this.disabled = true;
          try {
            await axios.post("/admin/product/delete", { id: productId });
            showNotification("Product deleted successfully", "success");
            setTimeout(
              () => (window.location.href = "/admin/product/all"),
              1500
            );
          } catch (error) {
            console.error("Error:", error);
            showNotification("Error deleting product", "error");
            this.disabled = false;
          }
        }
      });
    }
  }

  function initVariantHandlers() {
    const $variantForm = $("#addVariantForm");
    const $modal = $("#addVariantModal");
    const $submitBtn = $modal.find('button[type="submit"]');
    const $variantsTable = $(".variants-table tbody");
    const $noVariantsMessage = $(".no-variants-message");

    // Show modal
    $("#create-variant-btn").on("click", () => {
      $variantForm[0].reset();
      $modal.modal("show");
    });

    // Form submission
    $variantForm.on("submit", async function (e) {
      e.preventDefault();
      if ($submitBtn.prop("disabled")) return;

      const formData = getFormData($(this));
      const error = validateVariantData(formData);

      if (error) {
        showNotification(error, "error");
        return;
      }

      console.log("****** 1 *****");
      $submitBtn.prop("disabled", true);
      try {
        const response = await axios.post(
          $(this).attr("action"),
          processFormData(formData)
        );

        const variant = response.data.productVariant;

        // Add new row to table
        const newRow = createVariantRow(variant);
        $variantsTable.append(newRow);

        // Hide "no variants" message if it exists
        $noVariantsMessage.hide();

        // Initialize event handlers for new row
        initializeRowHandlers(newRow);

        $modal.modal("hide");
        $variantForm[0].reset();
        showNotification("Variant created successfully", "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification(
          error.response?.data?.message || "Error creating variant",
          "error"
        );
      } finally {
        $submitBtn.prop("disabled", false);
      }
    });

    // Edit variants
    document.querySelectorAll(".btn-edit-variant").forEach((btn) => {
      btn.addEventListener("click", function () {
        const row = this.closest("tr");
        updateVariant({
          _id: row.dataset.variantId,
          size: row.querySelector('[data-field="size"] input').value,
          color: row.querySelector('[data-field="color"] input').value,
          stockQuantity: parseInt(
            row.querySelector('[data-field="stockQuantity"] input').value
          ),
          productPrice: parseFloat(
            row.querySelector('[data-field="productPrice"] input').value
          ),
          salePrice:
            parseFloat(
              row.querySelector('[data-field="salePrice"] input').value
            ) || null,
        });
      });
    });

    // Delete variants
    document.querySelectorAll(".btn-delete-variant").forEach((btn) => {
      btn.addEventListener("click", async function () {
        if (
          this.disabled ||
          !confirm("Are you sure you want to delete this variant?")
        )
          return;

        this.disabled = true;
        const row = this.closest("tr");
        try {
          await axios.post("/admin/product-variant/delete", {
            id: row.dataset.variantId,
          });
          row.remove();
          showNotification("Variant deleted successfully", "success");
        } catch (error) {
          console.error("Error:", error);
          showNotification("Error deleting variant", "error");
          this.disabled = false;
        }
      });
    });
  }

  // Helper function to create a new variant row
  function createVariantRow(variant) {
    return `
      <tr data-variant-id="${variant._id}">
        <td class="editable-cell" data-field="size">
          <input type="text" class="form-control edit-input" value="${variant.size.toUpperCase()}"/>
        </td>
        <td class="editable-cell" data-field="color">
          <input type="text" class="form-control edit-input" value="${capitalizeWord(variant.color)}"/>
        </td>
        <td class="editable-cell" data-field="stockQuantity">
          <input type="number" class="form-control edit-input" min="0" step="5" value="${
            variant.stockQuantity
          }"/>
        </td>
        <td class="editable-cell" data-field="productPrice">
          <input type="number" class="form-control edit-input" min="0" step="5" value="${
            variant.productPrice
          }"/>
        </td>
        <td class="editable-cell" data-field="salePrice">
          <input type="number" class="form-control edit-input" min="0" step="5" value="${
            variant.salePrice || ""
          }"/>
        </td>
        <td class="actions-cell">
          <button class="btn-edit-variant" title="Edit variant">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn-delete-variant" title="Delete variant">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }

  function capitalizeWord(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Helper function to initialize event handlers for new row
  function initializeRowHandlers($row) {
    $row = $($row);

    // Edit handler
    $row.find(".btn-edit-variant").on("click", function () {
      const data = {
        _id: $row.data("variant-id"),
        size: $row.find('[data-field="size"] input').val(),
        color: $row.find('[data-field="color"] input').val(),
        stockQuantity: parseInt(
          $row.find('[data-field="stockQuantity"] input').val()
        ),
        productPrice: parseFloat(
          $row.find('[data-field="productPrice"] input').val()
        ),
        salePrice:
          parseFloat($row.find('[data-field="salePrice"] input').val()) || null,
      };
      updateVariant(data);
    });

    // Delete handler
    $row.find(".btn-delete-variant").on("click", async function () {
      if (
        $(this).prop("disabled") ||
        !confirm("Are you sure you want to delete this variant?")
      )
        return;

      $(this).prop("disabled", true);
      try {
        await axios.post("/admin/product-variant/delete", {
          id: $row.data("variant-id"),
        });
        $row.fadeOut(() => {
          $row.remove();
          if ($(".variants-table tbody tr").length === 0) {
            $(".no-variants-message").show();
          }
        });
        showNotification("Variant deleted successfully", "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification("Error deleting variant", "error");
        $(this).prop("disabled", false);
      }
    });
  }

  // Helper functions
  function getFormData($form) {
    return $form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value.trim();
      return obj;
    }, {});
  }

  function processFormData(data) {
    return {
      ...data,
      size: data.size.toUpperCase(),
      color: data.color.charAt(0).toUpperCase() + data.color.slice(1).toLowerCase(),
      stockQuantity: parseInt(data.stockQuantity),
      productPrice: parseFloat(data.productPrice),
      salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
    };
  function validateVariantData(data) {
    if (!data.size) return "Size is required";
    if (!data.color) return "Color is required";
    if (!data.stockQuantity) return "Stock quantity is required";
    if (!data.productPrice) return "Price is required";

    if (isNaN(data.stockQuantity) || parseInt(data.stockQuantity) < 0) {
      return "Stock quantity must be a positive number";
    }

    if (isNaN(data.productPrice) || parseFloat(data.productPrice) <= 0) {
      return "Price must be greater than 0";
    }

    if (data.salePrice) {
      if (isNaN(data.salePrice) || parseFloat(data.salePrice) <= 0) {
        return "Sale price must be greater than 0";
      }
      if (parseFloat(data.salePrice) >= parseFloat(data.productPrice)) {
        return "Sale price must be less than regular price";
      }
    }

    if (!/^[A-Za-z0-9\s-]+$/.test(data.size)) {
      return "Size contains invalid characters";
    }

    if (!/^[A-Za-z\s-]+$/.test(data.color)) {
      return "Color should only contain letters, spaces, and hyphens";
    }

    return null;
  }

  // Simple, clean carousel implementation
  function initCarousel() {
    // Get elements
    const currentImage = document.getElementById("carousel-current-image");
    const prevBtn = document.getElementById("carousel-prev");
    const nextBtn = document.getElementById("carousel-next");
    const currentNumberEl = document.getElementById("carousel-current-number");
    const imageData = document.querySelectorAll(".carousel-image-data");

    // If we don't have the necessary elements, exit
    if (!currentImage || !imageData.length) return;

    // Set up state
    let currentIndex = 0;
    const maxIndex = imageData.length - 1;

    // Function to update the display
    function updateCarousel() {
      // Fade out current image
      currentImage.style.opacity = "0";

      setTimeout(() => {
        // Update image source
        const newSrc = imageData[currentIndex].getAttribute("data-src");
        currentImage.src = newSrc;

        // Update counter if it exists
        if (currentNumberEl) {
          currentNumberEl.textContent = (currentIndex + 1).toString();
        }

        // Fade in new image
        currentImage.style.opacity = "1";
      }, 200);
    }

    // Go to previous image
    function prevImage() {
      currentIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
      updateCarousel();
    }

    // Go to next image
    function nextImage() {
      currentIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
      updateCarousel();
    }

    // Set up event listeners
    if (prevBtn) {
      prevBtn.addEventListener("click", prevImage);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", nextImage);
    }

    // Keyboard navigation
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      }
    });

    // Initial state
    currentImage.style.opacity = "1";
  }

  // API Helpers
  async function updateProduct(data) {
    try {
      await axios.post("/admin/product/edit", data);
      showNotification("Product updated successfully", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error updating product", "error");
    }
  }

  async function updateVariant(data) {
    try {
      await axios.post("/admin/product-variant/edit", data);
      showNotification("Variant updated successfully", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error updating variant", "error");
    }
  }

  // Enhanced notification system
  function showNotification(message, type) {
    const existingNotification = document.querySelector(
      ".product-notification"
    );
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create icon based on type
    let icon;
    switch (type) {
      case "success":
        icon = "fas fa-check-circle";
        break;
      case "error":
        icon = "fas fa-exclamation-circle";
        break;
      case "info":
        icon = "fas fa-info-circle";
        break;
      default:
        icon = "fas fa-bell";
    }

    // Create notification
    const notification = document.createElement("div");
    notification.className = `product-notification ${type}`;
    notification.innerHTML = `
      <div class="product-notification-icon">
        <i class="${icon}"></i>
      </div>
      <div class="product-notification-message">${message}</div>
      <button class="product-notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to DOM
    document.body.appendChild(notification);

    // Add show class after a small delay (for animation)
    setTimeout(() => notification.classList.add("show"), 10);

    // Setup close button
    const closeBtn = notification.querySelector(".product-notification-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
      });
    }

    // Auto-remove after delay
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
});
