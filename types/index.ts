export interface Conference {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export interface Talk {
  id: string;
  conferenceId: string;
  title: string;
  startTime: Date;
  endTime?: Date;
}

export interface Note {
  id: string;
  talkId: string;
  textContent: string;
  images: string[];
  audioRecordings: string[];
  timestamp: Date;
}