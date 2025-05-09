from flask import Blueprint, jsonify, request, render_template
from models import db, Symptom, Disease
from sqlalchemy import func





main_routes = Blueprint('main', __name__)

@main_routes.route('/')
def home():
    return render_template('index.html')

# @main_routes.route('/signup')
# def signupPage():
#     return render_template('signup.html')

# @main_routes.route('/users', methods=['GET'])
# def get_users():
#     users = User.query.all()
#     return jsonify([{"id": user.id, "username": user.username} for user in users])


# @main_routes.route('/users', methods=['POST'])
# def create_user():
#     data = request.get_json()
#     username = data.get('username')
#     email = data.get('email')
#     password_hash = data.get('password_hash')

#     if not username or not email or not password_hash:
#         return jsonify({"error": "Missing required fields"}), 400

#     new_user = User(username=username, email=email, password_hash=password_hash)
#     db.session.add(new_user)
#     db.session.commit()

#     return jsonify({"message": "User created successfully"}), 201


bp = Blueprint('api', __name__)

@bp.route("/api/symptoms")
def get_symptoms():
    symptoms = Symptom.query.with_entities(Symptom.id, Symptom.name).distinct().all()
    return jsonify([{"id": s.id, "name": s.name} for s in symptoms])

@bp.route("/api/diseases", methods=["POST"])
def get_diseases_for_symptoms():
    data = request.json
    symptom_ids = data.get("symptom_ids", [])

    if not symptom_ids:
        return jsonify([])

    disease_ids = db.session.query(Symptom.disease_id)\
                    .filter(Symptom.id.in_(symptom_ids)).distinct()

    diseases = Disease.query.filter(Disease.id.in_(disease_ids)).all()
    return jsonify([
        {"id": d.id, "name": d.name, "description": d.description}
        for d in diseases
    ])


