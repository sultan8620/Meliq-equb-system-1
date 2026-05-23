import Swal from 'sweetalert2';

export const confirmAction = async (message: string, isDestructive = false): Promise<boolean> => {
  const result = await Swal.fire({
    title: message,
    icon: isDestructive ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: isDestructive ? '#ef4444' : '#6366f1',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      popup: 'rounded-2xl font-sans',
      title: 'text-lg font-bold text-slate-800',
    }
  });
  return result.isConfirmed;
};

export const promptAction = async (message: string, defaultValue = ''): Promise<string | null> => {
  const result = await Swal.fire({
    title: message,
    input: 'text',
    inputValue: defaultValue,
    showCancelButton: true,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-2xl font-sans',
      input: 'border-slate-200 rounded-xl text-sm focus:ring-indigo-500'
    }
  });
  return result.isConfirmed ? result.value : null;
};
