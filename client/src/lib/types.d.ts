declare module 'lamejs' {
  export interface Mp3Encoder {
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, bitRate: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }
}

export interface Task {
  id: number;
  lectureId: number;
  courseId: number;
  title: string;
  description?: string;
  type: string;
  dueDate?: string | Date;
  priority?: number;
  completed: boolean;
  calendarEventId?: string;
  createdAt?: string | Date;
}