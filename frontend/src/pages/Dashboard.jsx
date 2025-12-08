import { useState, useEffect } from 'react';
import { Users, UserCheck, GraduationCap, Activity, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardData, attendanceData] = await Promise.all([
        attendanceAPI.getDashboardStats(),
        attendanceAPI.getStats(),
      ]);
      setStats(dashboardData);
      setAttendanceStats(attendanceData);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Skeleton Components
  const StatCardSkeleton = () => (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );

  const ChartSkeleton = () => (
    <div className="card animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Employees',
      value: stats?.total_employees || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      title: 'Students',
      value: stats?.total_students || 0,
      icon: GraduationCap,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      title: 'Today Present',
      value: stats?.current_present || 0,
      icon: Activity,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
    {
      title: 'Attendance Rate',
      value: `${stats?.attendance_rate || 0}%`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Unknown Faces',
      value: stats?.unknown_faces_today || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
  ];

  // Role distribution chart data
  const roleChartData = {
    labels: ['Employees', 'Students'],
    datasets: [
      {
        data: [stats?.total_employees || 0, stats?.total_students || 0],
        backgroundColor: ['#10b981', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  // Department distribution chart data
  const departmentChartData = {
    labels: Object.keys(attendanceStats?.by_department || {}),
    datasets: [
      {
        label: 'Attendance by Department',
        data: Object.values(attendanceStats?.by_department || {}),
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of attendance and recognition system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </>
        ) : (
          statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-4 rounded-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Role Distribution */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h2>
              <div className="flex justify-center">
                <div className="w-64 h-64">
                  <Doughnut data={roleChartData} options={{ maintainAspectRatio: true }} />
                </div>
              </div>
            </div>

            {/* Department Attendance */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance by Department</h2>
              <Bar
                data={departmentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceStats?.recent_entries?.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.user?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.user?.role === 'employee'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {entry.user?.role || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.user?.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.confidence ? `${(entry.confidence * 100).toFixed(1)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
