import db from '../../../config/db.js';
import { generateToken, loginUser, registerUser, getAuditLogs } from '../../../controllers/userController.js';

export const AuthService = {
  generateToken,
  findUserByEmail: (email: string) => db.users.findOne({ email: email.toLowerCase() }),
};

export { loginUser, registerUser, getAuditLogs };
