

// success
// warning
// error

import '../styles/toast.css';

export const showToast = (type, title, message, duration = 4000) => {
  const toastBox = document.getElementById('toast-box');
  if (!toastBox) return;

  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  toast.innerHTML = `<strong>${title}</strong>:<div class="toast-message">${message}</div>`;

  const progress = document.createElement('div');
  progress.classList.add('toast-progress');
  progress.style.animationDuration = `${duration - 500}ms`;
  toast.appendChild(progress);


  toast.addEventListener('click', () => {
    toast.remove();
  });

  toastBox.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
};
