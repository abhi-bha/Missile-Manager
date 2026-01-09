export interface Coordinates {
  x: number;
  y: number;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
}

export type MissionStatus = 'ARMED' | 'LAUNCHING' | 'IMPACTED' | 'ANALYZING' | 'COMPLETE';

export interface Mission {
  id: string;
  target: GeoLocation;
  status: MissionStatus;
}

export interface DamageReport {
  missionId: string;
  location: string;
  impactRadius: string;
  casualtyEstimate: string;
  infrastructureDamage: string;
  environmentalImpact: string;
  summary: string;
}

export interface SimulationState {
  missions: Mission[];
  logs: string[];
}
