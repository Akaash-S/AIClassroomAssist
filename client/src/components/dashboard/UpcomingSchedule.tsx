interface ScheduleItem {
  id: number;
  dayAbbr: string;
  day: number;
  title: string;
  timeRange: string;
}

const UpcomingSchedule = () => {
  // In a real app, this would come from a database query
  const scheduleItems: ScheduleItem[] = [
    {
      id: 1,
      dayAbbr: "MON",
      day: 20,
      title: "Neural Networks Lecture",
      timeRange: "10:00 AM - 11:30 AM",
    },
    {
      id: 2,
      dayAbbr: "WED",
      day: 22,
      title: "Office Hours",
      timeRange: "2:00 PM - 4:00 PM",
    },
    {
      id: 3,
      dayAbbr: "FRI",
      day: 24,
      title: "Data Security Workshop",
      timeRange: "1:00 PM - 3:30 PM",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Upcoming Schedule</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {scheduleItems.map((item) => (
          <div key={item.id} className="px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 text-center">
                <div className="text-sm font-semibold text-gray-800">{item.dayAbbr}</div>
                <div className="text-lg font-bold text-primary">{item.day}</div>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-medium text-gray-800">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.timeRange}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingSchedule;
