import type {
  CourseOffering,
  DashboardSnapshot,
  Room,
  Section,
  Teacher,
} from "@/types/domain";

export const rooms: Room[] = [
  {
    id: "r-101",
    name: "A-101",
    building: "Academic Block A",
    floor: 1,
    capacity: 60,
    roomType: "THEORY",
    features: ["Projector", "Smart Board"],
    isActive: true,
  },
  {
    id: "r-204",
    name: "Lab-204",
    building: "Innovation Block",
    floor: 2,
    capacity: 40,
    roomType: "LAB",
    features: ["40 Workstations", "High-Speed Internet"],
    isActive: true,
  },
  {
    id: "r-310",
    name: "Seminar-310",
    building: "Academic Block B",
    floor: 3,
    capacity: 120,
    roomType: "AUDITORIUM",
    features: ["Audio System", "Hybrid Camera"],
    isActive: true,
  },
];

export const teachers: Teacher[] = [
  {
    id: "t-01",
    name: "Dr. Meera Khanna",
    department: "Computer Science",
    maxDailyLoad: 4,
    unavailableDayCodes: ["FRI"],
  },
  {
    id: "t-02",
    name: "Prof. Arjun Nair",
    department: "Computer Science",
    maxDailyLoad: 3,
    unavailableDayCodes: ["MON"],
  },
];

export const sections: Section[] = [
  {
    id: "sec-btech-cse-4a",
    name: "B.Tech CSE 4A",
    program: "B.Tech CSE",
    semester: 4,
    size: 58,
  },
  {
    id: "sec-btech-cse-6b",
    name: "B.Tech CSE 6B",
    program: "B.Tech CSE",
    semester: 6,
    size: 42,
  },
];

export const courseOfferings: CourseOffering[] = [
  {
    id: "co-01",
    courseCode: "CS204",
    title: "Data Structures",
    department: "Computer Science",
    teacherId: "t-01",
    sectionId: "sec-btech-cse-4a",
    dayCode: "MON",
    startTime: "09:00",
    endTime: "10:00",
    requiredCapacity: 58,
    requiredRoomType: "THEORY",
    deliveryType: "LECTURE",
    priorityScore: 10,
    isLocked: true,
    teacherUnavailableDays: [],
    requiredFeatures: ["Projector"],
  },
  {
    id: "co-02",
    courseCode: "CS318",
    title: "Machine Learning Lab",
    department: "Computer Science",
    teacherId: "t-02",
    sectionId: "sec-btech-cse-6b",
    dayCode: "TUE",
    startTime: "11:00",
    endTime: "13:00",
    requiredCapacity: 42,
    requiredRoomType: "LAB",
    deliveryType: "LAB",
    priorityScore: 9,
    isLocked: false,
    teacherUnavailableDays: ["MON"],
    requiredFeatures: ["40 Workstations", "High-Speed Internet"],
  },
  {
    id: "co-03",
    courseCode: "CS333",
    title: "AI Systems Design",
    department: "Computer Science",
    teacherId: "t-01",
    sectionId: "sec-btech-cse-6b",
    dayCode: "WED",
    startTime: "10:00",
    endTime: "11:00",
    requiredCapacity: 42,
    requiredRoomType: "THEORY",
    deliveryType: "LECTURE",
    priorityScore: 8,
    isLocked: false,
    teacherUnavailableDays: ["FRI"],
    requiredFeatures: ["Smart Board"],
  },
];

export const dashboardSnapshot: DashboardSnapshot = {
  metrics: [
    { label: "Draft Timetable Coverage", value: "92%", change: "+8% this week" },
    { label: "Unscheduled Sessions", value: "4", change: "-3 after constraints update" },
    { label: "Room Utilization", value: "78%", change: "+6% after best-fit allocation" },
    { label: "Teacher Conflict Alerts", value: "2", change: "Needs coordinator review" },
  ],
  insights: [
    {
      id: "insight-1",
      title: "Lab demand spikes on Tuesday",
      description:
        "Three high-priority sessions compete for two active labs between 11:00 and 13:00.",
      severity: "high",
    },
    {
      id: "insight-2",
      title: "Semester 4 has long idle gaps",
      description:
        "B.Tech CSE 4A has a 2-hour gap after lunch on Wednesday. Rebalancing would improve student experience.",
      severity: "medium",
    },
    {
      id: "insight-3",
      title: "Auditorium underused",
      description:
        "Seminar-310 is active for only one large-format session this week and can absorb overflow events.",
      severity: "low",
    },
  ],
};
