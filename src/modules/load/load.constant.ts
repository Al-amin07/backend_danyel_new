export const LoadStatusArray = [
  'Pending Assignment',
  'Awaiting Pickup',
  'Assigned',
  'In Transit',
  'At Pickup',
  'En Route to Pickup',
  'Delivered',
  'Cancelled',
] as const;
export const LoadPaymentStatusArray = ['PENDING', 'PAID', 'UNPAID'] as const;

export type TLoadStatus = (typeof LoadStatusArray)[number];
export type TLoadPaymentStatus = (typeof LoadPaymentStatusArray)[number];

// 🔹 Type from the array
export type LoadStatus = (typeof LoadStatusArray)[number];

// 🔹 Function to return notes
export function getLoadNote(status: LoadStatus, driverName?: string): string {
  switch (status) {
    case 'Pending Assignment':
      return 'Load is awaiting assignment to a driver.';

    case 'Assigned':
      return `Load assigned to ${driverName ?? 'the driver'}
      }.`;

    case 'At Pickup':
      return `Driver ${driverName ?? ''} has arrived at the pickup location.`;

    case 'En Route to Pickup':
      return `Driver ${driverName ?? ''} is on the way to the pickup location.`;

    case 'In Transit':
      return `Load is currently in transit with ${driverName ?? 'the driver'} `;

    case 'Delivered':
      return `Load successfully delivered by ${driverName ?? 'the driver'}`;

    case 'Cancelled':
      return 'This load has been cancelled.';

    default:
      return 'Status update not available.';
  }
}
