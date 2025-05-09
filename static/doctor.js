// Wait for DOM to be fully loaded
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

    // Patient Search Functionality
    const searchBtn = document.getElementById("search-btn")
    const patientCnicInput = document.getElementById("patient-cnic-search")
    const patientResults = document.getElementById("patient-results")
    const noPatientFound = document.getElementById("no-patient-found")
    const reportsList = document.getElementById("reports-list")

    // Mock patient data
    // const patientData = {
    //   name: "Muhammad Ali",
    //   cnic: "37405-1234567-1",
    //   age: 45,
    //   gender: "Male",
    //   contact: "+92 321 1234567",
    //   lastVisit: "15 May 2023",
    //   reports: [
    //     { id: 1, date: "15 May 2023", diagnosis: "Hypertension", prescription: "Amlodipine 5mg" },
    //     { id: 2, date: "10 April 2023", diagnosis: "Chest Pain", prescription: "ECG, Blood tests" },
    //   ],
    // }

    searchBtn.addEventListener("click", () => {
        const searchValue = patientCnicInput.value.trim()
        fetch(`/doctor/search_patient/${searchValue}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    // Patient not found
                    patientResults.classList.add("hidden");
                    noPatientFound.classList.remove("hidden");
                } else {
                    // Patient found
                    patientResults.classList.remove("hidden");
                    noPatientFound.classList.add("hidden");

                    // Update patient information in the DOM
                    document.getElementById("patient-avatar").textContent = data.name[0];
                    document.getElementById("patient-name").textContent = data.name;
                    document.getElementById("patient-cnic-display").textContent = `CNIC: ${data.cnic}`;
                    document.getElementById("patient-gender-age").textContent = `${data.gender}, ${calculateAge(data.dob)} years`;
                    document.getElementById("patient-contact").textContent = data.contact;
                    document.getElementById("patient-last-visit").textContent = data.lastVisit || "N/A";

                    // Clear previous reports
                    reportsList.innerHTML = "";

                    // Add reports to the list
                    if (data.reports && data.reports.length > 0) {
                        data.reports.forEach((report) => {
                            const reportItem = document.createElement("div");
                            reportItem.className = "report-item";
                            reportItem.innerHTML = `
                          <div class="report-header">
                              <span class="report-date">${report.rdate}</span>
                              <button class="btn btn-small">View Details</button>
                          </div>
                          <div class="report-details">
                              <div>
                                  <p class="label">Diagnosis</p>
                                  <p>${report.diagnosis}</p>
                              </div>
                          </div>
                      `;
                            reportsList.appendChild(reportItem);
                        });
                    } else {
                        // No reports available
                        reportsList.innerHTML = `<p>No previous reports found.</p>`;
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching patient data:", error);
                patientResults.classList.add("hidden");
                noPatientFound.classList.remove("hidden");
            });
    });


    async function loadSymptoms() {
    const res = await axios.get("/api/symptoms");
    const symptoms = res.data;
    const $symptomSelect = $('#symptoms'); // jQuery because Select2 needs it!

    // Clear existing options (just in case)
    $symptomSelect.empty();

    // Add options
    symptoms.forEach(s => {
        const option = new Option(s.name, s.id, false, false);
        $symptomSelect.append(option);
    });

    // Initialize Select2 on the element
    $symptomSelect.select2({
        placeholder: "Select or type symptoms",
        allowClear: true,
        width: '100%' // Optional but pretty
    });
}


    // Fetch diseases on symptom change
    $('#symptoms').on('change', async function () {
    const selected = $(this).val(); // jQuery Select2 gives an array of selected values

    const res = await axios.post("/api/diseases", {
        symptom_ids: selected
    });

    const diseases = res.data;
    const diseaseSelect = document.getElementById("disease");
    diseaseSelect.innerHTML = "";

    diseases.forEach(d => {
        const option = document.createElement("option");
        option.value = d.name;
        option.text = d.name;
        diseaseSelect.appendChild(option);
    });
});

    loadSymptoms();



    document.getElementById('report_id').addEventListener('change', function () {
    const reportId = this.value;
    populateMedicineSelect(reportId);

});
    function populateMedicineSelect(reportId){
    fetch(`/get_medicines/${reportId}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('medicines-container');
            const dropdowns = container.querySelectorAll('select[name="mname"]');

            dropdowns.forEach(dropdown => {
                dropdown.innerHTML = ''; // Clear existing
                data.forEach(med => {
                    const option = document.createElement('option');
                    option.value = med.name;
                    option.text = med.name;
                    dropdown.appendChild(option);
                });
            });
        })
        .catch(err => console.error("Error fetching medicines:", err));
    }


    function calculateAge(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }


    // Add Medicine Row
    const addMedicineBtn = document.getElementById("add-medicine")
    const medicinesContainer = document.getElementById("medicines-container")

    addMedicineBtn.addEventListener("click", () => {
        const medicineRow = document.createElement("div")
        medicineRow.className = "medicine-row"
        medicineRow.innerHTML = `
              <div class="medicine-name">
                  <label>Medicine Name</label>
                  <select name="mname">
                    <option value="">Select Medicine</option>
                </select>

              </div>
              <div class="medicine-dosage">
                  <label>Dosage</label>
                  <input type="text" name="dosage" placeholder="Dosage">
              </div>
              <div class="medicine-frequency">
                  <label>Frequency</label>
                  <select name="freq">
                      <option value="">Select</option>
                      <option value="once">Once daily</option>
                      <option value="twice">Twice daily</option>
                      <option value="thrice">Thrice daily</option>
                      <option value="four">Four times daily</option>
                  </select>
              </div>
              <div class="medicine-duration">
                  <label>Duration</label>
                  <input type="text" name="dur" placeholder="Days">
              </div>
          `
        medicinesContainer.appendChild(medicineRow)
        populateMedicineSelect(document.getElementById("report_id").value);
    })

    // Day Status Change
    const dayStatusSelects = document.querySelectorAll(".day-status")

    dayStatusSelects.forEach((select) => {
        select.addEventListener("change", function () {
            const timeSelects = this.nextElementSibling.querySelectorAll("select")
            if (this.value === "off") {
                timeSelects.forEach((timeSelect) => {
                    timeSelect.disabled = true
                })
            } else {
                timeSelects.forEach((timeSelect) => {
                    timeSelect.disabled = false
                })
            }
        })
    })

    // Simple Calendar Implementation
    const calendarContainer = document.getElementById("calendar")

    function generateCalendar() {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()

        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        // Create calendar HTML
        let calendarHTML = `
              <div class="calendar">
                  <div class="calendar-header">
                      <button class="btn btn-small btn-outline">&lt;</button>
                      <h3>${monthNames[month]} ${year}</h3>
                      <button class="btn btn-small btn-outline">&gt;</button>
                  </div>
                  <div class="calendar-grid">
                      <div class="calendar-day">Sun</div>
                      <div class="calendar-day">Mon</div>
                      <div class="calendar-day">Tue</div>
                      <div class="calendar-day">Wed</div>
                      <div class="calendar-day">Thu</div>
                      <div class="calendar-day">Fri</div>
                      <div class="calendar-day">Sat</div>
          `

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += `<div class="calendar-day other-month"></div>`
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            // Check if this day is selected (for demo, June 15 and July 4 are selected)
            const isSelected = (month === 5 && day === 15) || (month === 6 && day === 4)
            calendarHTML += `
                  <div class="calendar-day ${isSelected ? "selected" : ""}" data-date="${year}-${month + 1}-${day}">
                      ${day}
                  </div>
              `
        }

        calendarHTML += `</div></div>`
        calendarContainer.innerHTML = calendarHTML

        // Add click event to calendar days
        const calendarDays = document.querySelectorAll(".calendar-day:not(:nth-child(-n+7))")
        calendarDays.forEach((day) => {
            if (!day.classList.contains("other-month")) {
                day.addEventListener("click", function () {
                    this.classList.toggle("selected")
                })
            }
        })
    }

    generateCalendar()

    // Remove day off badge
    const removeDayBtns = document.querySelectorAll(".remove-day")
    removeDayBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            this.parentElement.remove()
        })
    })

    // Form Submissions (prevent default for demo)
    // const forms = document.querySelectorAll("form")
    // forms.forEach((form) => {
    //   form.addEventListener("submit", (e) => {
    //     e.preventDefault()
    //     alert("Form submitted successfully! (Demo only)")
    //   })
    // })

    const reportBtn = document.querySelector('.tab-btn[data-tab="reports"]');
    reportBtn.addEventListener('click', function () {
        document.getElementById('report-doctor-cnic').value = document.getElementById('doctor-cnic').textContent; // Replace with desired CNIC
    });
    const prescrBtn = document.querySelector('.tab-btn[data-tab="prescriptions"]');;
    prescrBtn.addEventListener('click', () => {
        fetch('/sendReportId')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch report id');
                }
                return response.json();
            })
            .then(data => {
                const report_id = data.value;
                document.getElementById('report_id').value = report_id;
                populateMedicineSelect(report_id);
            })
            .catch(error => {
                console.error('Error fetching report id', error);
            }
            );
    })



})

