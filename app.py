from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import db, Doctor, Patient, Disease, Medicine, Symptom, Staff, Chemical, Report, Prescription, Review, Appointment, Company
from config import Config
from sqlalchemy import text

app = Flask(__name__)
app.config.from_object(Config)
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

@app.route('/sendReportId')
def sendReportId():
    return jsonify(value = session.get('report_id', -1))



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
        rating = db.session.execute(query, {"cnic": doctor[i].cnic}).fetchone()
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
    dcnic = Doctor.query.filter_by(name = request.form.get('dname')).first()
    date = request.form.get('date')
    time = request.form.get('time')
    if (Appointment.query.filter_by(doctor_cnic = dcnic, date = date, time = time).first().id is not None):
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


@app.route('/diseases')
def diseases():
    diseases = Disease.query.all()
    return render_template('diseases.html', diseases=diseases)

@app.route('/medicines')
def medicines():
    medicines = Medicine.query.all()
    return render_template('medicines.html', medicines=medicines)

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

@app.route('/reports')
def reports():
    reports = Report.query.all()
    return render_template('reports.html', reports=reports)

@app.route('/prescriptions')
def prescriptions():
    prescriptions = Prescription.query.all()
    return render_template('prescriptions.html', prescriptions=prescriptions)

@app.route('/reviews')
def reviews():
    reviews = Review.query.all()
    return render_template('reviews.html', reviews=reviews)

@app.route('/appointments')
def appointments():
    appointments = Appointment.query.all()
    return render_template('appointments.html', appointments=appointments)

@app.route('/companies')
def companies():
    companies = Company.query.all()
    return render_template('companies.html', companies=companies)

if __name__ == '__main__':
    app.run(debug=True)