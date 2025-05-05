import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:kirito500@localhost/cr_medsync'
    SQLALCHEMY_TRACK_MODIFICATIONS = False