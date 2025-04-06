interface StatCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string | number;
}

const StatCard = ({ icon, iconColor, bgColor, label, value }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`rounded-full ${bgColor} p-3 mr-4`}>
          <i className={`${icon} ${iconColor}`}></i>
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
