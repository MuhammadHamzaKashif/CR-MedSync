document.addEventListener("DOMContentLoaded", () => {
    // Tab Switching
    const tabButtons = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach((btn) => btn.classList.remove("active"))
            tabContents.forEach((content) => content.classList.remove("active"))

            // Add active class to clicked button and corresponding content
            button.classList.add("active")
            const tabId = button.getAttribute("data-tab")
            document.getElementById(tabId).classList.add("active")
        })
    })

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById("mobile-menu-btn")
    const mobileMenu = document.getElementById("mobile-menu")

    mobileMenuBtn.addEventListener("click", () => {
        mobileMenu.classList.toggle("active")
        // Toggle icon
        const icon = mobileMenuBtn.querySelector("i")
        if (mobileMenu.classList.contains("active")) {
            icon.classList.remove("fa-bars")
            icon.classList.add("fa-times")
        } else {
            icon.classList.remove("fa-times")
            icon.classList.add("fa-bars")
        }
    })

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
        if (
            !mobileMenu.contains(e.target) &&
            !mobileMenuBtn.contains(e.target) &&
            mobileMenu.classList.contains("active")
        ) {
            mobileMenu.classList.remove("active")
            const icon = mobileMenuBtn.querySelector("i")
            icon.classList.remove("fa-times")
            icon.classList.add("fa-bars")
        }
    })



    // Set minimum date for appointment to today
    const appointmentDateInput = document.getElementById("appointment-date")
    if (appointmentDateInput) {
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, "0")
        const dd = String(today.getDate()).padStart(2, "0")
        const formattedDate = `${yyyy}-${mm}-${dd}`
        appointmentDateInput.min = formattedDate
    }







    // Function to add a new appointment to the list
    function addNewAppointment(doctor, date, time, reason) {
        const appointmentsList = document.getElementById("upcoming-appointments-list")
        if (!appointmentsList) return

        // Parse the date
        const dateObj = new Date(date)
        const month = dateObj.toLocaleString("default", { month: "short" })
        const day = dateObj.getDate()

        // Format the time
        const timeObj = new Date(`2000-01-01T${time}`)
        const formattedTime = timeObj.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })

        // Create the appointment item
        const appointmentItem = document.createElement("div")
        appointmentItem.className = "appointment-item"
        appointmentItem.innerHTML = `
              <div class="appointment-date">
                  <div class="date-box">
                      <span class="month">${month}</span>
                      <span class="day">${day}</span>
                  </div>
                  <span class="time">${formattedTime}</span>
              </div>
              <div class="appointment-details">
                  <h4>${doctor}</h4>
                  <p>${doctor.split(" ")[0] === "Dr." ? "Doctor" : "Specialist"}</p>
                  <p class="reason">Reason: ${reason}</p>
              </div>
              <div class="appointment-actions">
                  <button class="btn btn-small btn-outline">Reschedule</button>
                  <button class="btn btn-small btn-outline cancel-btn">Cancel</button>
              </div>
          `

        // Add to the list
        appointmentsList.prepend(appointmentItem)

        // Add event listeners to the new buttons
        const cancelBtn = appointmentItem.querySelector(".cancel-btn")
        cancelBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to cancel this appointment?")) {
                appointmentItem.remove()
            }
        })
    }

    // Doctor Search and Filter
    const specialityFilter = document.getElementById("speciality-filter")
    const doctorSearch = document.getElementById("doctor-search")
    const searchBtn = document.getElementById("search-btn")
    const doctorsList = document.getElementById("doctors-list")

    if (searchBtn && doctorsList) {
        searchBtn.addEventListener("click", filterDoctors)
    }

    if (doctorSearch) {
        doctorSearch.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                filterDoctors()
            }
        })
    }

    function filterDoctors() {
        const speciality = specialityFilter ? specialityFilter.value.toLowerCase() : ""
        const searchName = doctorSearch ? doctorSearch.value.toLowerCase() : ""
        doctorsList.innerHTML = "";

        fetch(`/patient/search_doctor/${searchName}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                if (!data) {
                    //document.querySelectorAll(".doctor-card").style.display = "none"
                    console.log("NONE FOUND");
                }
                else {
                    data.forEach((doctor) => {
                        doctorsList.innerHTML += `<div class="doctor-card">
                                        <div class="doctor-info">
                                            <img src="${doctor.pic}" alt="${doctor.name}">
                                            <div>
                                                <h3>${doctor.name}</h3>
                                                <p class="speciality">${doctor.speciality}</p>
                                                <div class="rating">
                                                    <i class="fas fa-star"></i>
                                                    <i class="fas fa-star"></i>
                                                    <i class="fas fa-star"></i>
                                                    <i class="fas fa-star"></i>
                                                    <i class="fas fa-star-half-alt"></i>
                                                    <span>(${doctor.rating})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="doctor-availability">
                                            <p>Available: Mon-Fri, ${doctor.timing}</p>
                                            <button class="btn btn-small book-appointment" data-doctor="${doctor.name}">Book Appointment</button>
                                        </div>
                                    </div>`


                    })
                    // Appointment Booking

                    const closeModal = document.querySelector(".close-modal")
                    const cancelAppointment = document.getElementById("cancel-appointment")
                    const appointmentForm = document.getElementById("appointment-form")
                    const bookButtons = document.querySelectorAll(".book-appointment");
                    const appointmentModal = document.getElementById("appointment-modal");
                    const modalDoctorName = document.getElementById("modal-doctor-name");
                    bookButtons.forEach((button) => {
                        button.addEventListener("click", () => {
                            const doctorName = button.getAttribute("data-doctor")
                            modalDoctorName.textContent = doctorName
                            document.getElementById('dname').value = doctorName
                            appointmentModal.classList.add("active")
                            document.body.style.overflow = "hidden" // Prevent scrolling when modal is open
                        })
                    })

                    if (closeModal) {
                        closeModal.addEventListener("click", () => {
                            appointmentModal.classList.remove("active")
                            document.body.style.overflow = "" // Re-enable scrolling
                        })
                    }

                    if (cancelAppointment) {
                        cancelAppointment.addEventListener("click", () => {
                            appointmentModal.classList.remove("active")
                            document.body.style.overflow = "" // Re-enable scrolling
                        })
                    }

                    // Close modal when clicking outside
                    window.addEventListener("click", (e) => {
                        if (e.target === appointmentModal) {
                            appointmentModal.classList.remove("active")
                            document.body.style.overflow = "" // Re-enable scrolling
                        }
                    })

                    if (appointmentForm) {
                        appointmentForm.addEventListener("submit", () => {
                           // e.preventDefault()

                            // Get form values
                            const date = document.getElementById("appointment-date").value
                            const time = document.getElementById("appointment-time").value
                            const reason = document.getElementById("appointment-reason").value
                            const doctor = modalDoctorName.textContent

                            // In a real application, you would send this data to the server
                            // For demo purposes, we'll just show an alert
                            alert(`Appointment booked successfully with ${doctor} on ${date} at ${time}`)

                            // Add the appointment to the list (for demo purposes)
                            addNewAppointment(doctor, date, time, reason)

                            // Close the modal
                            appointmentModal.classList.remove("active")
                            document.body.style.overflow = "" // Re-enable scrolling

                            // Reset the form
                            appointmentForm.reset()
                        })
                    }



                }
            })


    }

    //   const doctorCards = doctorsList.querySelectorAll(".doctor-card")


    //   doctorCards.forEach((card) => {
    //     const doctorName = card.querySelector("h3").textContent.toLowerCase()
    //     const doctorspeciality = card.querySelector(".speciality").textContent.toLowerCase()

    //     const matchesspeciality = speciality === "" || doctorspeciality.includes(speciality)
    //     const matchesSearch = searchTerm === "" || doctorName.includes(searchTerm)

    //     if (matchesspeciality && matchesSearch) {
    //       card.style.display = "flex"
    //     } else {
    //       card.style.display = "none"
    //     }
    //   })

    // Star Rating System
    const starRating = document.querySelector(".star-rating")
    const ratingValue = document.getElementById("rating-value")

    if (starRating && ratingValue) {
        const stars = starRating.querySelectorAll("i")

        function highlightStars(rating) {
            stars.forEach((star) => {
                const starRating = star.getAttribute("data-rating")
                if (starRating <= rating) {
                    star.classList.remove("far")
                    star.classList.add("fas")
                } else {
                    star.classList.remove("fas")
                    star.classList.add("far")
                }
            })
        }

        stars.forEach((star) => {
            star.addEventListener("mouseover", function () {
                const rating = this.getAttribute("data-rating")
                highlightStars(rating)
            })

            star.addEventListener("mouseout", () => {
                const currentRating = ratingValue.value
                highlightStars(currentRating)
            })

            star.addEventListener("click", function () {
                const rating = this.getAttribute("data-rating")
                ratingValue.value = rating
                highlightStars(rating)
            })
        })
    }

    // Review Form Submission
    const reviewForm = document.getElementById("review-form")

    if (reviewForm) {
        reviewForm.addEventListener("submit", (e) => {
            e.preventDefault()

            const doctor = document.getElementById("review-doctor").value
            const rating = document.getElementById("rating-value").value
            const reviewText = document.getElementById("review-text").value

            if (rating === "0") {
                alert("Please select a rating")
                return
            }

            // In a real application, you would send this data to the server
            // For demo purposes, we'll just show an alert and add the review to the list
            alert(`Review submitted successfully for ${doctor}`)

            // Add the review to the list (for demo purposes)
            addNewReview(doctor, rating, reviewText)

            // Reset the form
            reviewForm.reset()
            highlightStars(0)
        })
    }

    // Function to add a new review to the list
    function addNewReview(doctor, rating, reviewText) {
        const reviewList = document.querySelector(".review-list")
        if (!reviewList) return

        // Get doctor speciality
        let speciality = ""
        if (doctor.includes("Sarah")) {
            speciality = "Cardiologist"
        } else if (doctor.includes("Imran")) {
            speciality = "Neurologist"
        } else if (doctor.includes("Ayesha")) {
            speciality = "Dermatologist"
        }

        // Get current date
        const today = new Date()
        const formattedDate = today.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })

        // Create the review item
        const reviewItem = document.createElement("div")
        reviewItem.className = "review-item"
        reviewItem.innerHTML = `
              <div class="review-header">
                  <div class="doctor-info">
                      <img src="https://via.placeholder.com/50" alt="${doctor}">
                      <div>
                          <h4>${doctor}</h4>
                          <p>${speciality}</p>
                      </div>
                  </div>
                  <div class="review-date">
                      <span>Reviewed on: ${formattedDate}</span>
                  </div>
              </div>
              <div class="review-rating">
                  <div class="rating">
                      ${generateStarRating(rating)}
                      <span>(${rating}.0)</span>
                  </div>
              </div>
              <div class="review-content">
                  <p>${reviewText}</p>
              </div>
              <div class="review-actions">
                  <button class="btn btn-small btn-outline">Edit Review</button>
                  <button class="btn btn-small btn-outline delete-btn">Delete</button>
              </div>
          `

        // Add to the list
        reviewList.prepend(reviewItem)

        // Add event listeners to the new buttons
        const deleteBtn = reviewItem.querySelector(".delete-btn")
        deleteBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete this review?")) {
                reviewItem.remove()
            }
        })
    }

    // Function to generate star rating HTML
    function generateStarRating(rating) {
        let starsHtml = ""
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star"></i>'
            } else if (i - 0.5 <= rating) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>'
            } else {
                starsHtml += '<i class="far fa-star"></i>'
            }
        }
        return starsHtml
    }

    // Cancel appointment buttons
    const cancelButtons = document.querySelectorAll(".cancel-btn")

    cancelButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const appointmentItem = this.closest(".appointment-item")
            if (confirm("Are you sure you want to cancel this appointment?")) {
                appointmentItem.remove()
            }
        })
    })

    // Filter medical records and prescriptions
    const dateFilter = document.getElementById("date-filter")
    const doctorFilter = document.getElementById("doctor-filter")
    const prescriptionDateFilter = document.getElementById("prescription-date-filter")
    const prescriptionStatusFilter = document.getElementById("prescription-status-filter")

    if (dateFilter && doctorFilter) {
        dateFilter.addEventListener("change", filterMedicalRecords)
        doctorFilter.addEventListener("change", filterMedicalRecords)
    }

    if (prescriptionDateFilter && prescriptionStatusFilter) {
        prescriptionDateFilter.addEventListener("change", filterPrescriptions)
        prescriptionStatusFilter.addEventListener("change", filterPrescriptions)
    }

    function filterMedicalRecords() {
        const dateValue = dateFilter.value
        const doctorValue = doctorFilter.value

        const recordItems = document.querySelectorAll(".record-item")

        recordItems.forEach((item) => {
            const recordDate = new Date(item.querySelector(".date").textContent)
            const recordDoctor = item.querySelector(".doctor").textContent

            let showByDate = true
            let showByDoctor = true

            // Filter by date
            if (dateValue !== "all") {
                const today = new Date()
                const compareDate = new Date()

                if (dateValue === "month") {
                    compareDate.setMonth(today.getMonth() - 1)
                } else if (dateValue === "6months") {
                    compareDate.setMonth(today.getMonth() - 6)
                } else if (dateValue === "year") {
                    compareDate.setFullYear(today.getFullYear() - 1)
                }

                showByDate = recordDate >= compareDate
            }

            // Filter by doctor
            if (doctorValue !== "all") {
                showByDoctor = recordDoctor === doctorValue
            }

            if (showByDate && showByDoctor) {
                item.style.display = "block"
            } else {
                item.style.display = "none"
            }
        })
    }

    function filterPrescriptions() {
        const dateValue = prescriptionDateFilter.value
        const statusValue = prescriptionStatusFilter.value

        const prescriptionItems = document.querySelectorAll(".prescription-item")

        prescriptionItems.forEach((item) => {
            const prescriptionDateText = item.querySelector(".prescription-meta span:first-child").textContent
            const prescriptionDate = new Date(prescriptionDateText.replace('<i class="fas fa-calendar"></i> ', ""))
            const prescriptionStatus = item.querySelector(".status").classList.contains(statusValue) || statusValue === "all"

            let showByDate = true

            // Filter by date
            if (dateValue !== "all") {
                const today = new Date()
                const compareDate = new Date()

                if (dateValue === "month") {
                    compareDate.setMonth(today.getMonth() - 1)
                } else if (dateValue === "6months") {
                    compareDate.setMonth(today.getMonth() - 6)
                } else if (dateValue === "year") {
                    compareDate.setFullYear(today.getFullYear() - 1)
                }

                showByDate = prescriptionDate >= compareDate
            }

            if (showByDate && prescriptionStatus) {
                item.style.display = "block"
            } else {
                item.style.display = "none"
            }
        })
    }

    // View prescription details buttons
    const viewPrescriptionButtons = document.querySelectorAll(".prescription-actions .btn:not(.btn-outline)")

    viewPrescriptionButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const prescriptionItem = this.closest(".prescription-item")
            const prescriptionDetails = prescriptionItem.querySelector(".prescription-details")

            if (prescriptionDetails.style.display === "none" || prescriptionDetails.style.display === "") {
                prescriptionDetails.style.display = "block"
                this.textContent = "Hide Details"
            } else {
                prescriptionDetails.style.display = "none"
                this.textContent = "View Details"
            }
        })
    })

    // Initialize - hide prescription details initially
    document.querySelectorAll(".prescription-details").forEach((details) => {
        details.style.display = "none"
    })
})
