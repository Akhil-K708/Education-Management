export interface Driver {
  id: string;
  name: string;
  contactNumber: string;
  photoUrl?: string;
}

export interface Vehicle {
  vehicleNumber: string; 
  busNumber: string;     
  capacity: number;
}

export interface RoutePoint {
  stopName: string;
  pickupTime: string;
  dropTime: string;
}

export interface StudentTransportDetails {
  routeId: string;
  routeName: string;
  vehicle: Vehicle;
  driver: Driver;
  myStop: RoutePoint;
  feeStatus: 'PAID' | 'PENDING' | 'OVERDUE';
}