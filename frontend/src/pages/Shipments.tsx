import React, { useEffect, useState, useMemo } from 'react';
import { fetchApi } from '../api';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
  ColumnDef 
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { Download, Filter, Search } from 'lucide-react';

const Shipments = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchShipments = (pageIndex: number, searchQuery: string = '') => {
    setLoading(true);
    let url = `/shipments?page=${pageIndex}&limit=10`;
    if (searchQuery) url += `&search=${searchQuery}`;
    
    fetchApi(url)
      .then(res => {
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchShipments(page, search);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments(1, search);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'AWB Number',
        accessorKey: 'awb_number',
        cell: info => <span className="font-medium text-blue-600">{info.getValue() as string}</span>,
      },
      {
        header: 'Date',
        accessorKey: 'booking_date',
        cell: info => info.getValue() ? format(new Date(info.getValue() as string), 'dd MMM yyyy') : '-',
      },
      {
        header: 'Client',
        accessorKey: 'client.company_name',
      },
      {
        header: 'Courier',
        accessorKey: 'courier.courier_name',
      },
      {
        header: 'Receiver',
        accessorKey: 'receiver_name',
        cell: info => {
          const row = info.row.original;
          return (
            <div>
              <p className="text-sm text-slate-900">{row.receiver_name}</p>
              <p className="text-xs text-slate-500">{row.city}</p>
            </div>
          );
        }
      },
      {
        header: 'Status',
        accessorKey: 'internal_status',
        cell: info => {
          const status = info.getValue() as string;
          let color = 'bg-slate-100 text-slate-800';
          if (status === 'DELIVERED') color = 'bg-emerald-100 text-emerald-800';
          else if (status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') color = 'bg-blue-100 text-blue-800';
          else if (status === 'RTO' || status === 'EXCEPTION') color = 'bg-rose-100 text-rose-800';
          
          return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
              {status}
            </span>
          );
        }
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Shipments</h1>
        <div className="flex space-x-3">
          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <form onSubmit={handleSearch} className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by AWB or Receiver..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                    Loading shipments...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                    No shipments found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipments;
