import bcrypt from 'bcryptjs';
import { UserRepository } from '../repository/user/userRepository.js';
import { query, queryOne } from '../config/query.js';

const userRepository = new UserRepository();

export const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Username, password, and role are required' });
    }

    const existing = await userRepository.findByUsername(username);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await userRepository.create({
      username,
      password: hashedPassword,
      role,
    });

    const token = await userRepository.authenticate(username, password, false);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: user.id_user, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const token = await userRepository.authenticate(username, password, rememberMe);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = await userRepository.findByUsername(username);

    let nama = user.username;
    if (user.role === 'tutor') {
      const tutor = await queryOne('SELECT nama_tutor FROM tutor WHERE id_user = ? LIMIT 1', [user.id_user]);
      if (tutor) nama = tutor.nama_tutor;
    } else if (user.role === 'siswa') {
      const siswa = await queryOne('SELECT nama FROM siswa WHERE id_user = ? LIMIT 1', [user.id_user]);
      if (siswa) nama = siswa.nama;
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id_user, username: user.username, role: user.role, nama },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUsername = async (req, res) => {
  try {
    const { id_user, username } = req.body;

    if (!id_user || !username) {
      return res.status(400).json({ success: false, message: 'id_user dan username wajib diisi' });
    }

    const existing = await userRepository.findByUsername(username);
    if (existing && existing.id_user !== id_user) {
      return res.status(409).json({ success: false, message: 'Username sudah digunakan' });
    }

    await query(
      'UPDATE users SET username = ? WHERE id_user = ?',
      [username, id_user]
    );

    res.json({ success: true, message: 'Username berhasil diperbarui', username });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await userRepository.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { passwordBaru, konfirmasiPassword } = req.body;
    const userId = req.userId;

    if (!passwordBaru || !konfirmasiPassword) {
      return res.status(400).json({ success: false, message: 'Password baru dan konfirmasi password wajib diisi' });
    }

    if (passwordBaru.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    if (passwordBaru !== konfirmasiPassword) {
      return res.status(400).json({ success: false, message: 'Password baru dan konfirmasi password tidak cocok' });
    }

    const hashedPassword = await bcrypt.hash(passwordBaru, 12);
    await query('UPDATE users SET password = ? WHERE id_user = ?', [hashedPassword, userId]);

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
