import Swal from 'sweetalert2';

interface ConfirmOptions {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: 'warning' | 'error' | 'info' | 'question';
}

export async function confirmDialog(options: ConfirmOptions = {}): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title || 'Are you sure?',
    text: options.text || 'This action cannot be undone.',
    icon: options.icon || 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e91e8c',
    cancelButtonColor: '#6b7280',
    confirmButtonText: options.confirmButtonText || 'Yes, proceed',
    cancelButtonText: options.cancelButtonText || 'Cancel',
    reverseButtons: true,
  });
  return result.isConfirmed;
}
