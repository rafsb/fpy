import json
from cryptography.fernet import Fernet
from interfaces.controller import controller
from interfaces.table_traits import table_t

# Generate a secret key for encryption/decryption
SECRET_KEY = Fernet.generate_key()
cipher_suite = Fernet(SECRET_KEY)


class UserModel(table_t):
    pass


class User(controller):

    @staticmethod
    def encrypt_session_key(username, pc_key):
        session_data = json.dumps({"username": username, "pc_key": pc_key})
        encrypted_data = cipher_suite.encrypt(session_data.encode())
        return encrypted_data.decode()

    @staticmethod
    def decrypt_session_key(encrypted_key):
        try:
            decrypted_data = cipher_suite.decrypt(encrypted_key.encode())
            return json.loads(decrypted_data.decode())
        except:
            return None

    @staticmethod
    def logged(encrypted_key=None):
        if not encrypted_key:
            return False

        session_data = User.decrypt_session_key(encrypted_key)
        if not session_data:
            return False

        username = session_data.get('username')
        pc_key = session_data.get('pc_key')

        # Here you should implement additional checks:
        # 1. Verify if the username exists in your user database
        # 2. Check if the pc_key matches the one stored for this user
        # 3. Optionally, check if the session has not expired

        # For this example, we'll just check if both username and pc_key are present
        return bool(username and pc_key)

    @staticmethod
    def get_user(user_id):
        return UserModel().fetch(filters=[{ 'id': user_id }]).rows[0]

    @staticmethod
    def create_user(user_data):
        new_user = UserModel(**user_data)
        return new_user.save()

    @staticmethod
    def update_user(user_id, user_data):
        user = User.get_user(user_id)
        if user:
            for key, value in user_data.items(): setattr(user, key, value)
            return user.save()
        return None

    @staticmethod
    def delete_user(user_id):
        user = User.get_user(user_id)
        if user:
            return user.delete()
        return False

    @staticmethod
    def list_users():
        return UserModel().fetch().rows


def register(app, args=None):
    # Register routes or perform any necessary setup
    pass
