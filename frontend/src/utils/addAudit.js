import axios from 'axios';

export const addAuditLog = async ({ userData, token, action = 'User Action', actor_type = 'user' }) => {
  if (!token || !userData?.user_code || !userData?.role) return;

  try {
    await axios.post('http://localhost:5000/api/users/audit-log', {
      user_code: userData.user_code,
      user_role: userData.role,
      action,
      actor_type
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Audit log added');
  } catch (err) {
    console.error('Failed to add audit log', err);
  }
};
