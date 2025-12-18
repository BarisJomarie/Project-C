const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');
const { logAudit } = require('./auditsController');

let otpStore = {}; // temporary storage for email → OTP mapping
const crypto = require('crypto');
const { error } = require('console');



//------------------------------------------------------------SIGNIN-------------------------------------------------------------------------------------------------
exports.signUp = (req, res) => {
  const {
    userCode, username, lastname, firstname, middlename, extension,
    email, password, role, security_question, security_answer, 
    //if user is rph or faculty
    department, course
  } = req.body;

  // Check for existing email or username
  const checker = `SELECT * FROM users WHERE email = ? OR username = ? OR user_code = ?`;
  db.query(checker, [email, username, userCode], async (err, result) => {
    if (err) return res.status(500).send({ message: 'DB query failed', error: err });
    if (result.length > 0) return res.status(400).send({ message: 'Email, User Code or Username already exists.' });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const defaultProfileImg = 'default_profile.jpg';

      // Insert user into DB
      db.query(
        `INSERT INTO users 
        (user_code, username, lastname, firstname, middlename, extension, email, password, profile_img, role, security_question, security_answer, department, course)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userCode, username, lastname, firstname, middlename, extension, email, hashedPassword, defaultProfileImg, role, security_question, security_answer, department, course],
        async (err, result) => {
          if (err) {
            console.error('DB insert error:', err);
            return res.status(500).send({ message: 'Failed to add user' });
          }

          const fullName = [lastname, firstname, middlename ? middlename + '.' : '', extension ? extension.toUpperCase() : '']
            .filter(part => part) // removes empty strings
            .join(' ');

            const emailBody = `
              Hello ${fullName},

              Your account has been successfully registered.
              Your password is: ${password}

              You can change this password later after logging in.

              Thank you for joining us!
              `;


          // Send welcome email
          try {
            await sendEmail(
              email,
              'Welcome to SDG Classification and Analytics!',
              emailBody
            );
          } catch (emailErr) {
            console.error('Failed to send email:', emailErr);
          }
          res.status(200).send({ message: 'User Registered!', emailSent: true });
          const audit = await logAudit( userCode, role, 'User Registered', 'user');
          console.log(audit);
        }
      );
    } catch (hashErr) {
      console.error('Password hashing failed:', hashErr);
      res.status(500).send({ message: 'Failed to hash password' });
    }
  });
};



//------------------------------------------------------------LOGIN-------------------------------------------------------------------------------------------------
// SIGN IN: Step 1 (send OTP)
exports.signIn = (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).send({ message: 'Invalid input' });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.query(query, [email], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(401).send({ message: 'User not found' });

    const user = result[0];

    // Check if account is locked
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lock_until) - new Date()) / (1000 * 60));
      return res.status(403).send({ message: `Account locked. Try again in ${minutesLeft} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);


  if (!isMatch) {
      // Increment failed attempts
      const attempts = user.failed_attempts + 1;
      let lockUntil = null;
      let message = 'Invalid email or password.';

      if (attempts >= 5) {
        // Lock account for 30 minutes
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        message = 'Too many failed attempts. Account locked for 30 minutes.';
      }

      const updateQuery = `UPDATE users SET failed_attempts = ?, lock_until = ? WHERE email = ?`;
      db.query(updateQuery, [attempts, lockUntil, email]);

      return res.status(401).send({ message });
    }

    // Reset failed attempts after successful login
    const resetQuery = `UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE email = ?`;
    db.query(resetQuery, [email]);

    // Proceed with OTP flow
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = { code: otp, expires: Date.now() + 5 * 60 * 1000 }; // expires in 5 min

    await sendEmail(
      email,
      'SDG Classification and Analytics : Login Verification Code',
      `Hello ${user.firstname},\n\nYour login verification code is: ${otp}. This code will expire in 5 minutes.`
    );

    return res.status(200).send({ message: 'OTP sent to email. Please verify.', email });
  });
};

// VERIFY OTP: Step 2 (finalize login)
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) return res.status(400).send({ message: 'No verification code sent. Please login again.' });

  const record = otpStore[email];
  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.status(400).send({ message: 'Verification code expired. Please login again.' });
  }

  if (parseInt(otp) !== record.code) {
    return res.status(400).send({ message: 'Invalid verification code.' });
  }

  delete otpStore[email];

  // Fetch user info for token
  const query = `SELECT * FROM users WHERE email = ?`;
  db.query(query, [email], (err, result) => {
    if (err) return res.status(500).send(err);
    const user = result[0];

    // isActive turn 1
    const updateActiveQuery = `UPDATE users SET isActive = 1 WHERE email = ?`;
    db.query(updateActiveQuery, [email], (updateErr) => {
      if (updateErr) console.error('Failed to update isActive status:', updateErr);

      // Generate JWT token
      try {
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role, user_code: user.user_code },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        // Audit
        logAudit(user.user_code, user.role, 'User Logged In', 'user')
          .then(auditId => {
            console.log(auditId);
          })
          .catch(err => {
            console.error("Audit log error:", err);
          });


        return res.status(200).json({
          message: 'Login verified successfully!',
          token,
          user: {
            id: user.id,
            user_code: user.user_code,
            username: user.username,
            email: user.email,
            role: user.role,
            profile_img: user.profile_img,
            department_id: user.department,
          },
        });
      } catch (jwtErr) {
        console.error('JWT signing error:', jwtErr);
        return res.status(500).json({ error: 'Error generating authentication token.' });
      }
    });
  });
};



//------------------------------------------------------------RESENDING OTP-------------------------------------------------------------------------------------------------
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ message: 'Email is required.' });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.query(query, [email], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0)
      return res.status(404).send({ message: 'User not found.' });

    const user = result[0];

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = { code: otpCode, expires: Date.now() + 5 * 60 * 1000 }; // 5 mins

    try {
      await sendEmail(
        email,
        'SDG Classification and Analytics : New Login Verification Code',
        `Hello ${user.firstname},\n\nYour new verification code is: ${otpCode}. This code will expire in 5 minutes.`
      );
      res.status(200).send({ message: 'New verification code sent!' });
    } catch (error) {
      console.error('Resend OTP failed:', error);
      res.status(500).send({ message: 'Failed to resend verification code.' });
    }
  });
};



//------------------------------------------------------------LOGOUT-------------------------------------------------------------------------------------------------
exports.logout = (req, res) => {
  const userId = req.user.id;

  // 1️etch user first to get details for audit
  const userQuery = `SELECT user_code, role FROM users WHERE id = ?`;
  db.query(userQuery, [userId], (userErr, userResult) => {
    if (userErr || userResult.length === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    const { user_code, role } = userResult[0];

    // Update active status
    const updateQuery = `UPDATE users SET isActive = 0 WHERE id = ?`;
    db.query(updateQuery, [userId], (updateErr) => {
      if (updateErr) {
        console.error('Failed to update user active status:', updateErr);
        return res.status(500).send({ message: 'Failed to logout' });
      }

      logAudit( req.user.user_code, req.user.role, 'User Logged Out', 'user')
      .then(auditId => {
        console.log(auditId);
      })
      .catch(err => {
        console.error("Audit log error: ", err);
      });
      return res.status(200).send({ message: 'User logged out successfully' });
    });
  });
};

exports.tokenExpired = (req, res) => {
  const { user_code, user_role } = req.body;

  if (!user_code || !user_role) {
    return res.status(400).json({ error: 'Missing user_code or user_role' });
  }

  logAudit( user_code, user_role, 'Session Ended - Token Expired', 'user')
  .then(auditId => {
    console.log(auditId);
  })
  .catch(err => {
    console.error('Audit log error: ', err);
  });

  db.query(query, [user_code, user_role], (err) => {
    if (err) {
      console.error('Failed to log token expiration:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ message: 'Token expiration logged successfully.' });
  });
};



//------------------------------------------------------------FORGOT PASSWORD-------------------------------------------------------------------------------------------------
// Step 1: Send reset link to email
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ message: 'Email is required.' });


  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(404).send({ message: 'User not found.' });


    const user = result[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour


    const updateQuery = 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?';
    db.query(updateQuery, [token, expiry, email], async (err2) => {
      if (err2) return res.status(500).send(err2);

      const FRONTEND_URL = process.env.FRONTEND_URL;
      const resetLink = `${FRONTEND_URL}/reset-password/${token}`; // adjust if needed


      await sendEmail(
        email,
        'Password Reset Request',
        `You requested to reset your password.\n\nClick the link below to continue:\n${resetLink}\n\nThis link expires in 1 hour.`
      );


      res.status(200).send({ message: 'Password reset link sent to your email.' });
    });
  });
};

// Step 2: Verify reset token
exports.verifyResetToken = (req, res) => {
  const { token } = req.params;


  const query = 'SELECT email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()';
  db.query(query, [token], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(400).send({ message: 'Invalid or expired reset link.' });


    res.status(200).send({ message: 'Valid reset token', email: result[0].email });
  });
};

// Step 3: Verify security question
exports.verifySecurityAnswer = (req, res) => {
  const { email, security_answer } = req.body;


  if (!email || !security_answer) {
    return res.status(400).send({ success: false, message: 'Email and security answer are required.' });
  }


  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, result) => {
    if (err) return res.status(500).send({ success: false, message: 'Database error.', error: err });
    if (result.length === 0) return res.status(404).send({ success: false, message: 'User not found.' });


    const user = result[0];
    const isMatch = user.security_answer?.toLowerCase() === security_answer.trim().toLowerCase();


    if (!isMatch) {
      return res.status(400).send({ success: false, message: 'Incorrect security answer.' });
    }


    res.status(200).send({
      success: true,
      message: 'Security question verified successfully.'
    });
  });
};

// Step 4: Update password
exports.resetPassword = (req, res) => {
  const { email, newPassword } = req.body;

  const beforeQuery = 'SELECT * FROM users WHERE email = ?';

  db.query(beforeQuery, [email], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.length === 0) return res.status(404).json({ message: 'No user found' });

    const user_code = result[0].user_code;
    const user_role = result[0].role;

    bcrypt.hash(newPassword, 10)
      .then(hashedPassword => {
        const query = 'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?';
        db.query(query, [hashedPassword, email], (err) => {
          if (err) {
            console.error('DB update error:', err);
            return res.status(500).json({ message: 'Failed to update password' });
          }

          res.status(200).json({ message: 'Password updated successfully!' });

          logAudit(user_code, user_role, `Password reset for ${email}`, 'user')
            .then(auditId => console.log(auditId))
            .catch(err => console.error('Audit log error:', err));
        });
      })
      .catch(err => {
        console.error('Password hashing failed:', err);
        res.status(500).json({ message: 'Failed to hash password' });
      });
  });
};

// LOGIC QUESTION FOR RESET PASSWORD ----------------------------------
exports.getSecurityQuestion = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ message: "Email is required." });

  const query = "SELECT security_question FROM users WHERE email = ?";
  db.query(query, [email], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(404).send({ message: "User not found." });


    res.status(200).send({ security_question: result[0].security_question });
  });
};
