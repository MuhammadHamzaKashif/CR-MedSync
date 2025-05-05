from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Doctor(db.Model):
    name = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.DateTime, nullable = False)
    email = db.Column(db.String(100), nullable = False)
    password = db.Column(db.String(255), nullable = False)
    contact = db.Column(db.String(20), nullable = False)
    cnic = db.Column(db.Integer, primary_key = True)
    qualification = db.Column(db.String(100), nullable = False)
    timing = db.Column(db.String(100), nullable = False)
    speciality = db.Column(db.String(100), nullable=False)
    availability = db.Column(db.String(100), nullable=False)
    pic = db.Column(db.String(255))

class Patient(db.Model):
    name = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.DateTime, nullable = False)
    email = db.Column(db.String(100), nullable = False)
    password = db.Column(db.String(255), nullable = False)
    contact = db.Column(db.String(20), nullable = False)
    address = db.Column(db.Text, nullable = False)
    cnic = db.Column(db.Integer, primary_key = True)
    gender = db.Column(db.String(10), nullable=False)

class Disease(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    rarity = db.Column(db.Integer, nullable = False)
    mortality_rate = db.Column(db.Double, nullable = False)
    chemical_id = db.Column(db.Integer, db.ForeignKey('chemical.id'), nullable = False)
    description = db.Column(db.Text, nullable=False)

class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    company_id = db.Column(db.Integer, nullable = False)
    chemical_id = db.Column(db.Integer, db.ForeignKey('chemical.id'), nullable = False)
    price = db.Column(db.Integer, nullable = False)
    side_effects = db.Column(db.Text, nullable=False)

class Symptom(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    disease_id = db.Column(db.Integer, db.ForeignKey('disease.id'), nullable=False)


class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.DateTime, nullable = False)
    email = db.Column(db.String(100), nullable = False)
    contact = db.Column(db.String(20), nullable = False)
    cnic = db.Column(db.Integer, nullable = False)
    role = db.Column(db.String(100), nullable=False)

class Chemical(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    formula = db.Column(db.Text, nullable = False)

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_cnic = db.Column(db.Integer, db.ForeignKey('patient.cnic'), nullable=False)
    doctor_cnic = db.Column(db.Integer, db.ForeignKey('doctor.cnic'), nullable=False)
    disease_id = db.Column(db.Integer, db.ForeignKey('disease.id'), nullable=False)
    diagnosis = db.Column(db.Text, nullable=False)
    rdate = db.Column(db.DateTime, nullable = False)

class Prescription(db.Model):
    __tablename__ = 'prescription'
    report_id = db.Column(db.Integer, db.ForeignKey('report.id'), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicine.id'), nullable=False)
    pcnic = db.Column(db.String(13), db.ForeignKey('patient.cnic'), nullable=False)
    dosage = db.Column(db.String(100), nullable=False)
    __table_args__ = (
        db.PrimaryKeyConstraint('report_id', 'medicine_id'),
    )
    
class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_cnic = db.Column(db.Integer, db.ForeignKey('patient.cnic'), nullable=False)
    doctor_cnic = db.Column(db.Integer, db.ForeignKey('doctor.cnic'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=False)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_cnic = db.Column(db.Integer, db.ForeignKey('patient.cnic'), nullable=False)
    doctor_cnic = db.Column(db.Integer, db.ForeignKey('doctor.cnic'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)