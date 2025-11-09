import { useState, useEffect } from 'react';
import Head from 'next/head';

const Camera = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RefreshCw = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Search = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function Home() {
  const [sheetId, setSheetId] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDR: 0,
    totalCR: 0,
    netPosition: 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('ledger_sheet_id');
      if (savedId) {
        setSheetId(savedId);
      }
    }
  }, []);

  useEffect(() => {
    if (connected && sheetId) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, sheetId]);

  const extractSheetId = (input) => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
  };

  // Add this validation function near the top of your component
const validateSheetId = (id) => {
  const cleanId = id.trim();
  return /^[a-zA-Z0-9-_]{20,}$/.test(cleanId);
};

// Replace the existing connectToSheet function with this:
const connectToSheet = async () => {
  setLoading(true);
  setError('');
  
  try {
    const id = extractSheetId(sheetId);
    
    // Add validation
    if (!id || !validateSheetId(id)) {
      throw new Error('https://docs.google.com/spreadsheets/d/1F1X-2FVVUKQUs4HSsGpgb1Qqk7-zieKtd_E29teQ7x0/edit?usp=sharing');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('ledger_sheet_id', id);
    }
    
    await fetchData(id);
    setConnected(true);
    
  } catch (err) {
    setError(err.message || 'Failed to connect to Google Sheets');
    setConnected(false);
  } finally {
    setLoading(false);
  }
};

const fetchData = async (id = sheetId) => {
  try {
    setLoading(true);
    const extractedId = extractSheetId(id);
    
    // Use API route instead of direct fetch
    const response = await fetch(`/api/sheet-data?sheetId=${extractedId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch data');
    }
    
    // Parse the data from API response
    const json = JSON.parse(result.data.substring(47).slice(0, -2));
    
    // ... rest of your existing data processing code
    const rows = json.table.rows.slice(2);
    const balanceData = rows.map(row => ({
      name: row.c[0]?.v || '',
      balance: parseFloat(row.c[1]?.v || 0),
      drCr: row.c[2]?.v || '',
      link: row.c[3]?.v || ''
    })).filter(item => item.name);

    setBalanceSheet(balanceData);
    
    // ... rest of your stats calculation
    const totalDR = balanceData
      .filter(item => item.drCr === 'DR')
      .reduce((sum, item) => sum + Math.abs(item.balance), 0);
    
    const totalCR = balanceData
      .filter(item => item.drCr === 'CR')
      .reduce((sum, item) => sum + Math.abs(item.balance), 0);
    
    setStats({
      totalCustomers: balanceData.length,
      totalDR,
      totalCR,
      netPosition: totalDR - totalCR
    });

    setLastUpdate(new Date());
    setError('');
    
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const disconnect = () => {
    setConnected(false);
    setSheetId('');
    setBalanceSheet([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ledger_sheet_id');
    }
  };

  const filteredData = balanceSheet.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'dr' && item.drCr === 'DR') ||
      (filterType === 'cr' && item.drCr === 'CR') ||
      (filterType === 'nill' && item.drCr === 'Nill');
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!connected) {
    return (
      <>
        <Head>
          <title>Ledger Web App</title>
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Ledger Web App</h1>
              <p className="text-gray-600">Connect to your Google Sheets ledger</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Sheets URL or ID
                </label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  placeholder="Paste your sheet URL here"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={connectToSheet}
                disabled={!sheetId || loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect to Sheet'
                )}
              </button>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                  <span>Sheet must be publicly accessible</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                  <span>Must have Balance Sheet tab</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Ledger Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Ledger Dashboard</h1>
                  <p className="text-sm text-blue-100">Live Data</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => fetchData()}
                  className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                
                <button
                  onClick={disconnect}
                  className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total DR</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDR)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total CR</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCR)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Position</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(Math.abs(stats.netPosition))}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('dr')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterType === 'dr' ? 'bg-red-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  DR
                </button>
                <button
                  onClick={() => setFilterType('cr')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterType === 'cr' ? 'bg-green-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  CR
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between">
    <h2 className="text-xl font-bold">Balance Sheet</h2>
    {lastUpdate && (
      <p className="text-sm">Updated: {lastUpdate.toLocaleTimeString()}</p>
    )}
  </div>

  {loading ? (
    <div className="p-8 text-center">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
      <p className="text-gray-600">Loading balance sheet data...</p>
    </div>
  ) : filteredData.length === 0 ? (
    <div className="p-8 text-center">
      <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500 text-lg mb-2">No customers found</p>
      <p className="text-gray-400 text-sm">
        {searchTerm || filterType !== 'all' 
          ? 'Try adjusting your search or filter criteria'
          : 'No customer data available in the sheet'
        }
      </p>
    </div>
  ) : (
    <table className="w-full">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Balance</th>
          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">DR/CR</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {filteredData.map((customer, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium">{customer.name}</td>
            <td className="px-6 py-4 text-right font-semibold">{formatCurrency(Math.abs(customer.balance))}</td>
            <td className="px-6 py-4 text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                customer.drCr === 'DR' ? 'bg-red-100 text-red-700' :
                customer.drCr === 'CR' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {customer.drCr}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>
