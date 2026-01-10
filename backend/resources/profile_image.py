from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
import os
from werkzeug.utils import secure_filename
from extensions import db
from models.user import User
from utils.helpers import make_response_data, get_current_user

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'instance', 'profile_images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class ProfileImageUploadResource(Resource):
    @jwt_required()
    def post(self):
        user = get_current_user()
        if 'file' not in request.files:
            return make_response_data(success=False, message='No file part', status_code=400)
        file = request.files['file']
        if file.filename == '':
            return make_response_data(success=False, message='No selected file', status_code=400)
        if file and allowed_file(file.filename):
            filename = secure_filename(f"user_{user.id}_" + file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            user.profile_image = f'/profile_images/{filename}'
            db.session.commit()
            return make_response_data(data={'profile_image': user.profile_image}, message='Profile image uploaded.')
        return make_response_data(success=False, message='Invalid file type', status_code=400)
