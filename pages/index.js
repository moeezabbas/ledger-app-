import React, { useState, useEffect } from 'react';
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
    const savedId = localStorage.getItem('ledger_sheet_id');
    if (savedId) {
      setSheetId(savedId);
    }
  }, []);

  useEffect(() => {
    if (connected) {
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

  const connectToSheet = async () => {
    setLoading(true);
    setError('');
    
    try {
      const id = extractSheetId(sheetId);
      
      if (!id || id.length < 20) {
        throw new Error('Invalid Google Sheets ID or URL');
      }

      localStorage.setItem('ledger_sheet_id', id);
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
      const extractedId = extractSheetId(id);
      
      const balanceResponse = await fetch(
        `https://docs.google.com/spreadsheets/d/${extractedId}/gviz/tq?tqx=out:json&sheet=Balance%20Sheet`
      );
      
      if (!balanceResponse.ok) {
        throw new Error('Could not access sheet. Make sure it is publicly accessible.');
      }

      const balanceText = await balanceResponse.text();
      const balanceJson = JSON.parse(balanceText.substring(47).slice(0, -2));
      
      const rows = balanceJson.table.rows.slice(2);
      const balanceData = rows.map(row => ({
        name: row.c[0]?.v || '',
        balance: parseFloat(row.c[1]?.v || 0),
        drCr: row.c[2]?.v || '',
        link: row.c[3]?.v || ''
      })).filter(item => item.name);

      setBalanceSheet(balanceData);
      
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
      console.error('Fetch error:', err);
      setError('Failed to fetch data. Check sheet permissions and try again.');
    }
  };

  const disconnect = () => {
    setConnected(false);
    setSheetId('');
    setBalanceSheet([]);
    localStorage.removeItem('ledger_sheet_id');
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
          <title>Ledger Web App - Connect</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Ledger Web App</h1>
              <p className="text-gray-600">Connect to your Google Sheets ledger for live updates</p>
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
                  placeholder="Paste full URL or sheet ID here"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Example: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
                </p>
              </div>

              <button
                onClick={connectToSheet}
                disabled={!sheetId || loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
                Setup Requirements
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Sheet must be <strong>publicly accessible</strong> (Anyone with link can view)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Must have "Balance Sheet" tab with columns: Name, Balance, DR/CR, Link</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Data updates automatically every 30 seconds</span>
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Ledger Dashboard</h1>
                  <p className="text-sm text-blue-100">Live from Google Sheets</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => fetchData()}
                  className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                
                <button
                  onClick={disconnect}
                  className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
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
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalCustomers}</p>
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
                  <p className={`text-2xl font-bold ${stats.netPosition >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(Math.abs(stats.netPosition))}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('dr')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'dr' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  DR
                </button>
                <button
                  onClick={() => setFilterType('cr')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'cr' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  CR
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Balance Sheet</h2>
              {lastUpdate && (
                <p className="text-sm text-blue-100">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Balance (PKR)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      DR/CR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(Math.abs(customer.balance))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          customer.drCr === 'DR' 
                            ? 'bg-red-100 text-red-700' 
                            : customer.drCr === 'CR'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.drCr}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredData.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No customers found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Data syncs automatically every 30 seconds</p>
            <p className="mt-1">Showing {filteredData.length} of {balanceSheet.length} customers</p>
          </div>
        </div>
      </div>
    </>
  );
}
```

---

# 📁 **PROJECT STRUCTURE**
```
ledger-webapp/
├── package.json          ← FILE 1
├── next.config.js        ← FILE 2
└── pages/
    └── index.js          ← FILE 3
