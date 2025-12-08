import { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Printer, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../services/api';
import { format } from 'date-fns';

const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await attendanceAPI.getAll(params);
      setLogs(data);
    } catch (error) {
      toast.error('Failed to fetch attendance logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchLogs();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Time', 'Name', 'User ID', 'Role', 'Department', 'Event Type', 'Confidence'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd'),
        format(new Date(log.timestamp), 'HH:mm:ss'),
        log.user?.name || '',
        log.user?.user_id || '',
        log.user?.role || '',
        log.user?.department || '',
        log.event_type,
        log.confidence ? (log.confidence * 100).toFixed(1) + '%' : ''
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Attendance report exported');
  };

  const handleExportToday = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const params = {
        start_date: today,
        end_date: today
      };

      const todayLogs = await attendanceAPI.getAll(params);

      if (todayLogs.length === 0) {
        toast.error('No attendance logs for today');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Time', 'Name', 'User ID', 'Role', 'Department', 'Event Type', 'Confidence'];
      const csvContent = [
        headers.join(','),
        ...todayLogs.map(log => [
          format(new Date(log.timestamp), 'yyyy-MM-dd'),
          format(new Date(log.timestamp), 'HH:mm:ss'),
          log.user?.name || '',
          log.user?.user_id || '',
          log.user?.role || '',
          log.user?.department || '',
          log.event_type,
          log.confidence ? (log.confidence * 100).toFixed(1) + '%' : ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_today_${today}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Today's attendance report exported (${todayLogs.length} records)`);
    } catch (error) {
      toast.error('Failed to export today\'s logs');
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  // Skeleton Loader Component
  const TableSkeleton = () => (
    <div className="animate-pulse space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="w-24 h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
        <p className="text-gray-600 mt-2">Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
        {startDate && endDate && (
          <p className="text-gray-600">
            Period: {format(new Date(startDate), 'MMM dd, yyyy')} - {format(new Date(endDate), 'MMM dd, yyyy')}
          </p>
        )}
        <p className="text-gray-600 mt-1">Total Records: {logs.length}</p>
        <hr className="mt-4 border-gray-300" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Logs</h1>
          <p className="text-gray-600 mt-1">View and manage attendance records</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handleExportToday}
            className="btn btn-secondary flex items-center"
            title="Download today's attendance logs as CSV"
          >
            <FileDown className="w-5 h-5 mr-2" />
            Today's Logs
          </button>
          <button
            onClick={handleExport}
            className="btn btn-primary flex items-center"
            title="Download all displayed logs as CSV"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary flex items-center"
            title="Print attendance logs"
          >
            <Printer className="w-5 h-5 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card print:hidden">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex-1">
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="btn btn-primary flex items-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.user?.user_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.user?.role === 'employee'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {log.user?.role || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.user?.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.event_type === 'entry'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {log.event_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.confidence ? (
                      <span className={`font-medium ${
                        log.confidence > 0.9 ? 'text-green-600' :
                        log.confidence > 0.7 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(log.confidence * 100).toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.location || log.camera_id || '-'}
                  </td>
                </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance logs</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No attendance records found for the selected period.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
