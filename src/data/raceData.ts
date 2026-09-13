export interface Race {
  race: string;
  date: string;
  time: string;
  distance: string;
  type: string;
  garminUrl: string;
}

export const raceData: Record<
  string,
  Race[]
> = {};