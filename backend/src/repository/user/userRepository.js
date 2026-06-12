import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../../config/query.js';

const JWT_SECRET = process.env.JWT_SECRET;

const TABLE = 'users';

export class UserRepository {
  async findByUsername(username) {
    return await queryOne(
      `SELECT id_user, username, password, role FROM \`${TABLE}\` WHERE username = ? LIMIT 1`,
      [username]
    );
  }

  async create({ username, password, role }) {
    const result = await query(
      `INSERT INTO \`${TABLE}\` (username, password, role) VALUES (?, ?, ?)`,
      [username, password, role]
    );
    return await this.findById(result.insertId);
  }

  async findById(id) {
    return await queryOne(
      `SELECT id_user, username, role FROM \`${TABLE}\` WHERE id_user = ? LIMIT 1`,
      [id]
    );
  }

  async authenticate(username, password, rememberMe) {
    const user = await this.findByUsername(username);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const expiresIn = rememberMe ? '90d' : '1h';
    return jwt.sign({ id: user.id_user }, JWT_SECRET, { expiresIn });
  }
}
