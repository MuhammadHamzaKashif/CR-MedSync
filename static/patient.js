document.addEventListener("DOMContentLoaded", () => {
    // Tab Switching
    const tabButtons = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")
    const upcomingAppointments = document.getElementById("upcoming-appointments-list")
    const pcnic = document.getElementById('patient-cnic').textContent

    async function loadUpcomingAppointments(pcnic) {
        const response = await fetch(`/appointments/${pcnic}`);
        const data = await response.json();

        if (!data) {
            const res = document.createElement('h2');
            res.textContent = "No upcoming appointments"
            upcomingAppointments.appendChild(res)
        }
        else {
            for (const appointment of data) {
                const name = appointment.dname;
                upcomingAppointments.innerHTML += `<div class="appointment-item">
                                            <div class="appointment-date">
                                                <div class="date-box">
                                                    <span class="month">${getMonthName(new Date(appointment.date))}</span>
                                                    <span class="day">${new Date(appointment.date).getDate()}</span>
                                                </div>
                                                <span class="time">${appointment.time}</span>
                                            </div>
                                            <div class="appointment-details">
                                                <h4>${name}</h4>
                                            </div>
                                            <div class="appointment-actions">
                                                <button class="btn btn-small btn-outline">Reschedule</button>
                                                <button class="btn btn-small btn-outline cancel-btn">Cancel</button>
                                            </div>
                                        </div>`
            }

        }
    }
    function loadPreviousReviews(pcnic) {
        fetch(`/patient/${pcnic}/prev_reviews`)
            .then(response => response.json())
            .then(async data => {
                const reviewList = document.querySelector('.review-list');
                reviewList.innerHTML = ''; // clear existing reviews

                for (const review of data) {
                    // Fetch doctor details (like name and specialization)
                    //console.log("dcnic:   ", review.dcnic)
                    //const dname = await getNameByCnic(review.doctor_cnic);
                    //console.log("dname:   ", review.dname)
                    //const doctorData = await dname.json();

                    const rating = parseFloat(review.rating);
                    const fullStars = Math.floor(rating);
                    const halfStar = rating % 1 >= 0.5;

                    let starIcons = '';
                    for (let i = 0; i < fullStars; i++) {
                        starIcons += `<i class="fas fa-star"></i>`;
                    }
                    if (halfStar) {
                        starIcons += `<i class="fas fa-star-half-alt"></i>`;
                    }
                    while (starIcons.split('<i').length - 1 < 5) {
                        starIcons += `<i class="far fa-star"></i>`;
                    }

                    const reviewHTML = `
                                <div class="review-item">
                                    <div class="review-header">
                                        <div class="doctor-info">
                                            <img src="${review.pic}" alt="${review.dname}">
                                            <div>
                                                <h4>${review.dname}</h4>
                                                
                                            </div>
                                        </div>
                                        <div class="review-date">
                                            <span>Reviewed on: ${new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}</span>
                                        </div>
                                    </div>
                                    <div class="review-rating">
                                        <div class="rating">
                                            ${starIcons}
                                            <span>(${rating.toFixed(1)})</span>
                                        </div>
                                    </div>
                                    <div class="review-content">
                                        <p>${review.review}</p>
                                    </div>
                                    <div class="review-actions">
                                        <button class="btn btn-small btn-outline">Edit Review</button>
                                        <button class="btn btn-small btn-outline delete-btn">Delete</button>
                                    </div>
                                </div>
                            `;

                    reviewList.innerHTML += reviewHTML;
                }
            })
            .catch(error => {
                console.error('Failed to load previous reviews:', error);
            });
    }
    async function loadReports(pcnic) {
        const response = await fetch(`/reports/${pcnic}`);
        const reports = await response.json();

        const container = document.querySelector(".medical-records");
        container.innerHTML = ""; // clear previous content

        reports.forEach(report => {
            const record = document.createElement("div");
            record.className = "record-item";
            record.innerHTML = `
                        <div class="record-date">
                            <span class="date">${formatDate(report.date)}</span>
                            <span class="doctor">${report.dname}</span>
                        </div>
                        <div class="record-details">
                            <h4>${report.disease} Checkup</h4>
                            <div class="diagnosis">
                                <span class="label">Diagnosis:</span>
                                <span>${report.diagnosis}</span>
                            </div>
                        </div>
                        <div class="record-actions">
                            <button class="btn btn-small">View Full Report</button>
                            <button class="btn btn-small btn-outline">Download PDF</button>
                        </div>
                    `;
            container.appendChild(record);
        });
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
    function parseDosage(dosageStr) {
        // Split the string based on known keywords
        const [baseDosage, freqPart, durPart] = dosageStr.split(/Frequency:|Duration:/).map(s => s.trim());

        return {
            dosage: baseDosage,               // "100mg"
            frequency: freqPart || "N/A",     // "twice"
            duration: durPart ? `${durPart} days` : "N/A" // "7 days"
        };
    }
    async function loadPrescriptions(pcnic) {
        const response = await fetch(`/prescriptions/${pcnic}`);
        const data = await response.json();
        const container = document.getElementById('prescriptions-container');
        container.innerHTML = '';

        data.forEach(prescription => {
            const prescDiv = document.createElement('div');
            prescDiv.className = 'prescription-item active';

            let medicineHTML = '';
            for (let i = 0; i < prescription.medicines.length; i++) {
                const parsed = parseDosage(prescription.dosages[i]);
                medicineHTML += `
                      <div class="medicine-item">
                        <div class="medicine-name">${prescription.medicines[i]}</div>
                        <div class="medicine-dosage">${parsed.dosage}</div>
                        <div class="medicine-frequency">${parsed.frequency}</div>
                        <div class="medicine-duration">${parsed.duration}</div>
                      </div>
                    `;
            }

            prescDiv.innerHTML = `
                    <div class="prescription-header">
                      <div class="prescription-info">
                        <h4>${prescription.name}</h4>
                        <div class="prescription-meta">
                          <span><i class="fas fa-calendar"></i>${prescription.date}</span>
                          <span><i class="fas fa-user-md"></i>${prescription.dname}</span>
                          <span class="status active">Active</span>
                        </div>
                      </div>
                      <div class="prescription-actions">
                        <button class="btn btn-small">View Details</button>
                        <button class="btn btn-small btn-outline">Download</button>
                      </div>
                    </div>
                    <div class="prescription-details">
                      <div class="medicine-list">
                        ${medicineHTML}
                      </div>
                      <div class="prescription-notes">
                        <p><strong>Special Instructions:</strong> Not available</p>
                      </div>
                    </div>
                  `;

            container.appendChild(prescDiv);
        });
    }



    loadUpcomingAppointments(pcnic);
    populateDoctorSelect(pcnic);
    loadPreviousReviews(pcnic);
    loadReports(pcnic);
    loadPrescriptions(pcnic);


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
    // function addNewAppointment(doctor, date, time, reason) {
    //     const appointmentsList = document.getElementById("upcoming-appointments-list")
    //     if (!appointmentsList) return

    //     // Parse the date
    //     const dateParts = date.split("/");
    // const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // YYYY-MM-DD

    // // Parse the formatted date
    // const dateObj = new Date(formattedDate);
    //     const month = dateObj.toLocaleString("default", { month: "short" })
    //     const day = dateObj.getDate()

    //     // Format the time
    //    // const timeObj = new Date(`2000-01-01T${time}`)
    //     //const formattedTime = timeObj.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })

    //     const timeRegex = /^(\d{1,2}):(\d{2})(AM|PM)$/i;
    //     const timeMatch = time.match(timeRegex);

    //     if (!timeMatch) {
    //         console.error("Invalid time format:", time);
    //         return;
    //     }

    //     let hours = parseInt(timeMatch[1], 10);
    //     const minutes = timeMatch[2];
    //     const ampm = timeMatch[3].toUpperCase();

    //     if (ampm === "PM" && hours < 12) hours += 12;
    //     if (ampm === "AM" && hours === 12) hours = 0;

    //     // Create the formatted time (use a default date to ensure proper formatting)
    //     const timeObj = new Date(2000, 0, 1, hours, minutes);
    //     const formattedTime = timeObj.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });

    //     // Create the appointment item
    //     const appointmentItem = document.createElement("div")
    //     appointmentItem.className = "appointment-item"
    //     appointmentItem.innerHTML = `
    //           <div class="appointment-date">
    //               <div class="date-box">
    //                   <span class="month">${month}</span>
    //                   <span class="day">${day}</span>
    //               </div>
    //               <span class="time">${formattedTime}</span>
    //           </div>
    //           <div class="appointment-details">
    //               <h4>${doctor}</h4>
    //               <p>${doctor.split(" ")[0] === "Dr." ? "Doctor" : "Specialist"}</p>
    //               <p class="reason">Reason: ${reason}</p>
    //           </div>
    //           <div class="appointment-actions">
    //               <button class="btn btn-small btn-outline">Reschedule</button>
    //               <button class="btn btn-small btn-outline cancel-btn">Cancel</button>
    //           </div>
    //       `

    //     // Add to the list
    //     appointmentsList.prepend(appointmentItem)

    //     // Add event listeners to the new buttons
    //     const cancelBtn = appointmentItem.querySelector(".cancel-btn")
    //     cancelBtn.addEventListener("click", () => {
    //         if (confirm("Are you sure you want to cancel this appointment?")) {
    //             appointmentItem.remove()
    //         }
    //     })
    // }

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
                                            <p>Available: Mon-Fri, </p><p id = "dtiming">${doctor.timing}</p>
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
                            const doctorTiming = document.getElementById("dtiming").textContent;
                            const [start, end] = doctorTiming.split(" - ").map(t => t.padStart(5, '0')); // Ensures 09:00 format
                            generateTimeSlots(start, end);


                            function generateTimeSlots(startTimeStr, endTimeStr) {
                                const timeSelect = document.getElementById("appointment-time");
                                timeSelect.innerHTML = '<option value="">Select a time slot</option>'; // Reset

                                const toMinutes = (timeStr) => {
                                    const [hours, minutes] = timeStr.split(':').map(Number);
                                    return hours * 60 + minutes;
                                };

                                const toTimeString = (minutes) => {
                                    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
                                    const m = (minutes % 60).toString().padStart(2, '0');
                                    return `${h}:${m}`;
                                };

                                const startMins = toMinutes(startTimeStr);
                                const endMins = toMinutes(endTimeStr);

                                for (let mins = startMins; mins < endMins; mins += 30) {
                                    const timeStr = toTimeString(mins);
                                    const formatted = new Date(`1970-01-01T${timeStr}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const option = document.createElement("option");
                                    option.value = timeStr;
                                    option.textContent = formatted;
                                    timeSelect.appendChild(option);
                                }
                            }
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

    // if (reviewForm) {
    //     reviewForm.addEventListener("submit", () => {
    //         //e.preventDefault()

    //         const doctor = document.getElementById("review-doctor").value
    //         const rating = document.getElementById("rating-value").value
    //         const reviewText = document.getElementById("review-text").value

    //         if (rating === "0") {
    //             alert("Please select a rating")
    //             return
    //         }

    //         // In a real application, you would send this data to the server
    //         // For demo purposes, we'll just show an alert and add the review to the list
    //         //alert(`Review submitted successfully for ${doctor}`)

    //         // Add the review to the list (for demo purposes)
    //         addNewReview(doctor, rating, reviewText)

    //         // Reset the form
    //         reviewForm.reset()
    //         highlightStars(0)
    //     })
    // }

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
    const form = document.getElementById("review-form");
    const select = document.getElementById("review-doctor");

    form.addEventListener("submit", function (e) {
        if (!select.value) {
            e.preventDefault();
            alert("Please wait for the doctor list to load or select a doctor.");
        }
    });

    const rev_select = document.getElementById('review-doctor')
    rev_select.addEventListener('change', () => {
        console.log("Selected dcnic: ", this.value);
    })
    //rev_select
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
function getMonthName(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    //const date = new Date(date);
    return months[date.getMonth()];
}
async function getNameByCnic(cnic) {
    const res = await fetch(`/doctorByCnic/${cnic}`);
    const data = await res.json();
    return data.name; // or whatever the correct property is
}

async function populateDoctorSelect(patientCnic) {
    const response = await fetch(`/appointments/${patientCnic}`);
    const appointments = await response.json();

    const seenDoctors = new Set();
    const select = document.getElementById("review-doctor");
    const history_select = document.getElementById("doctor-filter")

    for (const appointment of appointments) {
        const dcnic = appointment.dcnic;
        if (!seenDoctors.has(dcnic)) {
            seenDoctors.add(dcnic);

            //console.log("going ti get name for select of cnic ",dcnic)
            const dname = appointment.dname;
            //console.log("got the name ",dname);
            select.innerHTML += `<option value="${dcnic}">${dname}</option>`;
            history_select.innerHTML += `<option value="${dname}">${dname}</option>`;
        }
    }
}
