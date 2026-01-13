document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const registerForm = document.getElementById("register-form");
  const messageDiv = document.getElementById("message");
  const modal = document.getElementById("registration-modal");
  const closeModal = document.querySelector(".close-modal");
  const btnCancel = document.querySelector(".btn-cancel");
  const emailInput = document.getElementById("email");
  const selectedCapabilityInput = document.getElementById("selected-capability");

  // Function to open registration modal
  function openRegistrationModal(capabilityName) {
    selectedCapabilityInput.value = capabilityName;
    modal.classList.remove("hidden");
    emailInput.focus();
  }

  // Function to close registration modal
  function closeRegistrationModal() {
    modal.classList.add("hidden");
    registerForm.reset();
    selectedCapabilityInput.value = "";
  }

  // Close modal event listeners
  closeModal.addEventListener("click", closeRegistrationModal);
  btnCancel.addEventListener("click", closeRegistrationModal);
  
  // Close modal when clicking outside
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeRegistrationModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeRegistrationModal();
    }
  });

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();

      // Clear loading message
      capabilitiesList.innerHTML = "";

      // Populate capabilities list
      Object.entries(capabilities).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";

        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultants ? details.consultants.length : 0;

        // Create consultants HTML with delete icons
        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<div class="consultants-section">
              <h5>Registered Consultants (${currentConsultants}):</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(
                    (email) =>
                      `<li><span class="consultant-email">${email}</span><button class="delete-btn" data-capability="${name}" data-email="${email}" title="Unregister consultant">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p class="no-consultants"><em>No consultants registered yet</em></p>`;

        // Determine practice badge color based on practice area
        const practiceAreaClass = details.practice_area ? details.practice_area.toLowerCase().replace(/\s+/g, '-') : 'default';

        capabilityCard.innerHTML = `
          <h4>
            ${name}
            <span class="practice-badge ${practiceAreaClass}">${details.practice_area || 'General'}</span>
          </h4>
          <p class="description">${details.description}</p>
          <div class="capability-info">
            ${details.industry_verticals && details.industry_verticals.length > 0 
              ? `<span class="info-badge"><strong>Industries:</strong> ${details.industry_verticals.join(', ')}</span>` 
              : ''}
            <span class="info-badge"><strong>Capacity:</strong> ${availableCapacity}h/week</span>
            <span class="info-badge"><strong>Team:</strong> ${currentConsultants} consultants</span>
          </div>
          <div class="consultants-container">
            ${consultantsHTML}
          </div>
          <button class="btn-register-capability" data-capability="${name}">
            Register Expertise
          </button>
        `;

        capabilitiesList.appendChild(capabilityCard);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".btn-register-capability").forEach((button) => {
        button.addEventListener("click", (event) => {
          const capabilityName = event.target.getAttribute("data-capability");
          openRegistrationModal(capabilityName);
        });
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      capabilitiesList.innerHTML =
        "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");

    if (!confirm(`Are you sure you want to unregister ${email} from ${capability}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        
        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const capability = selectedCapabilityInput.value;

    if (!capability) {
      showMessage("Please select a capability", "error");
      return;
    }

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/register?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModal();
        
        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to register. Please try again.", "error");
      console.error("Error registering:", error);
    }
  });

  // Helper function to show messages
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Initialize app
  fetchCapabilities();
});
