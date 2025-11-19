// src/api/transportApi.ts

import { StudentTransportDetails } from '../types/transport';

// --- MOCK DATA ---
const MOCK_TRANSPORT_DATA: StudentTransportDetails = {
  routeId: 'RT-105',
  routeName: 'Hitech City - Kondapur Route',
  vehicle: {
    busNumber: 'Bus 12',
    vehicleNumber: 'TS 08 UB 4554',
    capacity: 40,
  },
  driver: {
    id: 'DRV-001',
    name: 'Ramesh Kumar',
    contactNumber: '9876543210',
    // photoUrl: '...' (Optional)
  },
  myStop: {
    stopName: 'Kothaguda X Roads',
    pickupTime: '08:15 AM',
    dropTime: '04:30 PM',
  },
  feeStatus: 'PAID',
};

export const getStudentTransportDetails = async (studentId: string): Promise<StudentTransportDetails> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_TRANSPORT_DATA);
    }, 800);
  });
};