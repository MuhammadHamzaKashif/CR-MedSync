from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import db, Doctor, Patient, Disease, Medicine, Symptom, Staff, Chemical, Report, Prescription, Review, Appointment, Company
from config import Config
from sqlalchemy import text
from routes import bp as api_bp

app = Flask(__name__)
app.config.from_object(Config)
app.register_blueprint(api_bp)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        user_type = request.form.get("userType")
        name = request.form.get("name")
        dob = datetime.strptime(request.form.get("dob"), '%Y-%m-%d')
        email = request.form.get("email")
        password = generate_password_hash(request.form.get("password"))
        contact = request.form.get("contact")
        cnic = request.form.get("cnic")
        profile_pic = request.files['profilePic']
        if profile_pic:
            path = f"../static/img/pic/{cnic}.jpg"
            profile_pic.save(path)


        if user_type == "doctor":
            new_user = Doctor(
                name=name, dob=dob, email=email, password=password, contact=contact, cnic=cnic,
                qualification=request.form.get("qualification"),
                timing=request.form.get("timing"),
                speciality=request.form.get("speciality"),
                availability=request.form.get("availability"),
                pic = path
            )
        elif user_type == "patient":
            new_user = Patient(
                name=name, dob=dob, email=email, password=password, contact=contact, cnic=cnic,
                address=request.form.get("address"), gender=request.form.get("gender")
            )
        else:
            return jsonify({"message": "Invalid user type"}), 400

        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('signup.html')


@app.route('/login', methods = ['GET', 'POST'])
def login():
    if request.method == 'POST':
        cnic = request.form.get("cnic")
        password = request.form.get("password")
        userType = request.form.get("userType")
        query = ""
        if userType == "doctor":
            query = text("SELECT * FROM doctor WHERE cnic = :cnic")
        elif userType == "patient":
            query = text("SELECT * FROM patient WHERE cnic = :cnic")
        else:
            return jsonify({"message": "Invalid user type"}), 400
        result = db.session.execute(query, {"cnic": cnic}).fetchone()

        if result and check_password_hash(result.password, password):
            session['user_cnic'] = result.cnic  # Store user cnic
            session['user_type'] = userType  # Store user type
            if userType == "doctor":
                return redirect(url_for('doctors'))
            elif userType == "patient":
                return redirect(url_for('patients'))
        else:
            return jsonify({"message": "Invalid cnic or password"}), 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_cnic', None)
    session.pop('user_type', None)
    return redirect(url_for('home'))

@app.route('/doctors')
def doctors():
    if 'user_cnic' not in session or session.get('user_type') != 'doctor':
        return redirect(url_for('login'))
    
    doctor = Doctor.query.get(session['user_cnic'])
    if not doctor:
        return redirect(url_for('login'))
    
    return render_template('doctor.html', doctor=doctor)



@app.route('/doctor/search_patient/<cnic>')
def searchPatient(cnic):
    patient = Patient.query.filter_by(cnic = cnic).first()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    
    reports = Report.query.filter_by(patient_cnic = cnic).all()
    report_data = []
    for report in reports:
        report_data.append({
            "id": report.id,
            "disease_id": report.disease_id,
            "doctor_cnic": report.doctor_cnic,
            "diagnosis": report.diagnosis,
            "rdate": report.rdate.strftime('%Y-%m-%d'),
        })
    
    patient_data = {
        "name": patient.name,
        "cnic": patient.cnic,
        "dob": patient.dob.strftime('%Y-%m-%d'),  # Format date as string
        "gender": patient.gender,
        "contact": patient.contact,
        "email": patient.email,
        "address": patient.address,
        "lastVisit": reports[0].rdate.strftime('%Y-%m-%d') if reports else None,
        "reports": report_data,
    }
    return jsonify(patient_data)

@app.route('/doctor/save_report', methods=['POST'])
def saveReport():
    pcnic = request.form.get('pcnic')
    dcnic = request.form.get('dcnic')
    rdate = request.form.get('rdate')
    disease = request.form.get('disease')
    diagnosis = request.form.get('diagnosis')
    test = request.form.get('tests')
    note = request.form.get('note')
    new_report = Report(
        patient_cnic = pcnic,
        doctor_cnic = dcnic,
        disease_id = Disease.query.filter_by(name=disease).first().id,
        diagnosis = (diagnosis + "\nTests: " + test + " \nAdditional notes: " + note),
        rdate = rdate
    )
    db.session.add(new_report)
    db.session.commit()
    session['report_id'] = new_report.id
    return redirect(url_for('doctors'))

@app.route('/doctor/save_prescription', methods = ['POST'])
def savePrescription():
    rId = request.form.get('rId')
    pcnic = request.form.get('pcnic')
    pdate = request.form.get('pdate')
    mnames = request.form.getlist('mname')
    dosages = request.form.getlist('dosage')
    freqs = request.form.getlist('freq')
    durs = request.form.getlist('dur')
    prescs = []
    for i in range(len(mnames)):
        new_prescription = Prescription(
            report_id = rId,
            pcnic = pcnic,
            medicine_id = Medicine.query.filter_by(name = mnames[i]).first().id,
            dosage = f"{dosages[i]} Frequency: {freqs[i]} Duration: {durs[i]}"
        )
        prescs.append(new_prescription)
        db.session.add(new_prescription)
    db.session.commit()
    return redirect(url_for('doctors'))

@app.route('/doctor/filter_diseases', methods=['POST'])
def filter_diseases():
    data = request.get_json()
    symptom_ids = data.get('symptom_ids', [])

    if not symptom_ids:
        return jsonify([])

    # SQLAlchemy query to get diseases that match ANY of the symptom_ids
    diseases = Disease.query.join(Disease.symptoms).filter(Symptom.id.in_(symptom_ids)).distinct().all()
    
    return jsonify([{'id': d.id, 'name': d.name} for d in diseases])


@app.route('/sendReportId')
def sendReportId():
    return jsonify(value = session.get('report_id', -1))

@app.route('/doctorByCnic/<cnic>')
def getDoctorNameByCnic(cnic):
    print(f"Cnic for DBC: {cnic}")
    doctor = Doctor.query.filter_by(cnic = cnic).first()
    print(f"Dname: {doctor.name}")
    if doctor is None:
        return jsonify({"error": "Doctor not found"}), 404
    return jsonify(doctor.name)

@app.route('/patients')
def patients():
    if 'user_cnic' not in session or session.get('user_type') != 'patient':
        return redirect(url_for('login'))
    
    patient = Patient.query.get(session['user_cnic'])
    if not patient:
        return redirect(url_for('login'))
    
    return render_template('patient.html', patient= patient)


@app.route('/patient/search_doctor/<name>')
def searchDoctor(name):
    doctor = Doctor.query.filter(Doctor.name.ilike(f"%{name}%")).all()
    if not doctor:
        return jsonify({"error" : "No doctor found"})
    doctor_data = []
    query = text("SELECT AVG(rating) FROM review GROUP BY doctor_cnic HAVING doctor_cnic = :cnic")
    for i in range(len(doctor)):
        rating_res = db.session.execute(query, {"cnic": doctor[i].cnic}).fetchone()
        rating = float(rating_res[0]) if rating_res else None 
        data = {
            "name" : doctor[i].name,
            "cnic" : doctor[i].cnic,
            "pic" : doctor[i].pic,
            "speciality" : doctor[i].speciality,
            "timing" : doctor[i].timing,
            "rating" : rating
        }
        doctor_data.append(data)
        
    return jsonify(doctor_data)

@app.route('/patient/book_appointment', methods = ['POST'])
def bookAppointment():
    pcnic = request.form.get('pcnic')
    dname = request.form.get('dname')
    dcnic = Doctor.query.filter_by(name = dname).first().cnic
    date = request.form.get('date')
    time = request.form.get('time')
    a = Appointment.query.filter_by(doctor_cnic = dcnic, date = date, time = time).first()
    if (a):
        return jsonify("Time slot not available...")

    new_appointment = Appointment(
        patient_cnic = pcnic,
        doctor_cnic = dcnic,
        date = date,
        time = time
    )
    db.session.add(new_appointment)
    db.session.commit()
    return redirect(url_for('patients'))

@app.route('/patient/review', methods=['POST'])
def giveReview():
    dcnic = request.form.get('dcnic')
    pcnic = request.form.get('pcnic')
    rating = request.form.get('rating')
    review = request.form.get('review-text')
    new_review = Review(
        patient_cnic = pcnic,
        doctor_cnic = dcnic,
        rating = rating,
        comment = review,
        time = datetime.now()
    )
    db.session.add(new_review)
    db.session.commit()
    return redirect(url_for('patients'))

@app.route('/patient/<pcnic>/prev_reviews')
def getPreviousReviews(pcnic):
    reviews = Review.query.filter_by(patient_cnic = pcnic).all()
    prev_reviews = []
    for review in reviews:
        r = {
            "pcnic" : pcnic,
            "dname" : Doctor.query.filter_by(cnic = review.doctor_cnic).first().name,
            "rating" : review.rating,
            "review" : review.comment,
            "pic" : Doctor.query.filter_by(cnic = review.doctor_cnic).first().pic
        }
        print(r)
        prev_reviews.append(r)
    return jsonify(prev_reviews)

@app.route('/diseases')
def diseases():
    diseases = Disease.query.all()
    return render_template('diseases.html', diseases=diseases)



@app.route('/medicines')
def medicines():
    medicines = Medicine.query.all()
    return render_template('medicines.html', medicines=medicines)


@app.route('/get_medicines/<report_id>')
def get_medicines(report_id):
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    disease = Disease.query.get(report.disease_id)
    if not disease:
        return jsonify({"error": "Disease not found"}), 404

    chemical_id = disease.chemical_id
    medicines = Medicine.query.filter_by(chemical_id=chemical_id).all()

    medicine_data = [{"id": med.id, "name": med.name} for med in medicines]
    return jsonify(medicine_data)


@app.route('/symptoms')
def symptoms():
    symptoms = Symptom.query.all()
    return render_template('symptoms.html', symptoms=symptoms)

@app.route('/staff')
def staff():
    staff = Staff.query.all()
    return render_template('staff.html', staff=staff)

@app.route('/chemicals')
def chemicals():
    chemicals = Chemical.query.all()
    return render_template('chemicals.html', chemicals=chemicals)

@app.route('/reports/<pcnic>')
def reports(pcnic):
    reports = Report.query.filter_by(patient_cnic = pcnic).all()
    prev_reports = []
    for r in reports:
        report = {
            "dname" : Doctor.query.filter_by(cnic = r.doctor_cnic).first().name,
            "diagnosis" : r.diagnosis,
            "date" : r.rdate,
            "disease" : Disease.query.filter_by(id = r.disease_id).first().name
        }
        prev_reports.append(report)

    return jsonify(prev_reports)

@app.route('/prescriptions/<pcnic>')
def prescriptions(pcnic):
    prescriptions = Prescription.query.filter_by(pcnic=pcnic).all()
    prev_presc = []
    placed_presc = []
    for p in prescriptions:
        if p.report_id not in placed_presc:
            placed_presc.append(p.report_id)
            related_prescs = Prescription.query.filter_by(report_id=p.report_id).all()
            prescription = {
                "dname" : Doctor.query.filter_by(cnic = (Report.query.filter_by(id =  p.report_id).first()).doctor_cnic).first().name,
                "name": "Prescription #" + str(p.report_id),
                "medicines": [Medicine.query.filter_by(id=presc.medicine_id).first().name for presc in related_prescs],
                "dosages": [presc.dosage for presc in related_prescs],
                "date" : Report.query.filter_by(id = p.report_id).first().rdate
            }
            prev_presc.append(prescription)

    return jsonify(prev_presc)

@app.route('/reviews')
def reviews():
    reviews = Review.query.all()
    return render_template('reviews.html', reviews=reviews)


@app.route('/appointments/<pcnic>')
def appointments(pcnic):
    appointments = Appointment.query.filter_by(patient_cnic = pcnic).all()
    apps = []
    for appointment in appointments:
        apps.append({
            "date": appointment.date.isoformat(),  # 'YYYY-MM-DD'
            "time": appointment.time.strftime("%H:%M"),  # 'HH:MM'
            "dcnic": appointment.doctor_cnic,
            "dname": Doctor.query.filter_by(cnic = appointment.doctor_cnic).first().name
        })
    return jsonify(apps)


@app.route('/companies')
def companies():
    companies = Company.query.all()
    return render_template('companies.html', companies=companies)

if __name__ == '__main__':
    app.run(debug=True)