// src/utils/toastHandler.js
import toast from 'react-hot-toast';

export const showToast = (type, message, options = {}) => {

  const defaultOptions = {
    duration: 4000,
    position: 'top-center',
    ...options,
  };
  

  switch (type) {
    case 'success':
      toast.success(message, defaultOptions);
      break;
    case 'error':
      toast.error(message, defaultOptions);
      break;
    case 'loading':
      toast.loading(message, defaultOptions);
      break;
    default:
      toast(message, defaultOptions);
  }
};