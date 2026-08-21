import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchApi } from '../api';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Download, Filter, Search, X, Printer, Plus, Edit2 } from 'lucide-react';
import Barcode from 'react-barcode';

import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TrackingModal from '../components/TrackingModal';

const Shipments = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const filterClientId = searchParams.get('clientId');
  const filterStatus = searchParams.get('status');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<string>(filterStatus || '');
  
  const [selectedPod, setSelectedPod] = useState<any | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<any | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [trackingAwb, setTrackingAwb] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [editShipment, setEditShipment] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const emptyBookingForm = {
    courier_id: '',
    client_id: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    city: '',
    state: '',
    pincode: '',
    origin: '',
    destination: '',
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    actual_weight: '',
    length: '',
    width: '',
    height: '',
    number_of_pieces: '1',
    declared_value: '',
    package_type: 'PARCEL',
    service_type: 'EXPRESS',
    remarks: '',
    require_appointment: 'NO',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_slot: '10:00 AM - 01:00 PM',
    dock_number: '',
    appointment_token: '',
    appointment_notes: '',
  };
  const [bookingForm, setBookingForm] = useState<any>(emptyBookingForm);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const fetchShipments = (pageIndex: number, searchQuery: string = '', statusTab: string = activeStatusTab) => {
    setLoading(true);
    let url = `/shipments?page=${pageIndex}&limit=10`;
    if (searchQuery) url += `&search=${searchQuery}`;
    if (filterClientId) url += `&clientId=${filterClientId}`;
    if (statusTab) url += `&status=${statusTab}`;
    
    fetchApi(url)
      .then(res => {
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchShipments(page, search, activeStatusTab);
    fetchApi('/clients').then(res => setClients(Array.isArray(res) ? res : [])).catch(console.error);
    fetchApi('/couriers').then(res => setCouriers(Array.isArray(res) ? res : [])).catch(console.error);
  }, [page, filterClientId, filterStatus]);

  const handleBookShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitting(true);
    try {
      const payload = {
        ...bookingForm,
        client_id: user?.role === 'CLIENT' ? (user?.client_id || 'client-1') : bookingForm.client_id
      };

      await fetchApi('/shipments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowBookModal(false);
      fetchShipments(1, search, activeStatusTab);
      setBookingForm(emptyBookingForm);
    } catch (err) {
      console.error(err);
      alert('Failed to book shipment');
    }
    setBookingSubmitting(false);
  };

  const openEditModal = (shipment: any) => {
    setEditShipment(shipment);
    setEditForm({
      client_id: shipment.client_id || '',
      courier_id: shipment.courier_id || '',
      receiver_name: shipment.receiver_name || '',
      receiver_phone: shipment.receiver_phone || '',
      receiver_address: shipment.receiver_address || '',
      sender_name: shipment.sender_name || '',
      sender_phone: shipment.sender_phone || '',
      sender_address: shipment.sender_address || '',
      city: shipment.city || '',
      state: shipment.state || '',
      pincode: shipment.pincode || '',
      origin: shipment.origin || '',
      destination: shipment.destination || '',
      actual_weight: shipment.actual_weight || '',
      number_of_pieces: shipment.number_of_pieces || '1',
      declared_value: shipment.declared_value || '',
      service_type: shipment.service_type || 'EXPRESS',
      package_type: shipment.package_type || 'PARCEL',
      internal_status: shipment.internal_status || 'BOOKED',
      remarks: shipment.remarks || '',
    });
  };

  const handleEditShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShipment) return;
    setEditSubmitting(true);
    try {
      await fetchApi(`/shipments/${editShipment.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setEditShipment(null);
      fetchShipments(page, search);
    } catch (err) {
      console.error(err);
      alert('Failed to update shipment');
    }
    setEditSubmitting(false);
  };

  const exportToCsv = () => {
    if (data.length === 0) return alert('No data to export');
    
    const headers = ['AWB', 'Client', 'Receiver', 'Destination', 'Status', 'Booking Date'];
    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => [
        row.awb_number,
        row.client?.company_name || 'N/A',
        (row.receiver_name || '').replace(/,/g, ''),
        `${row.city || ''}, ${row.state || ''}`.replace(/,/g, ''),
        row.internal_status,
        row.booking_date ? format(new Date(row.booking_date), 'dd MMM yyyy') : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shipments_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments(1, search);
  };

  const handleApproveShipment = useCallback(async (row: any) => {
    const targetId = row.id || row.awb_number;

    // Instant local UI state update
    setData(prev => prev.map((s: any) => 
      (s.id === targetId || s.awb_number === targetId || s.id === row.id) 
        ? { ...s, internal_status: 'BOOKED' } 
        : s
    ));

    try {
      await fetchApi(`/shipments/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...row, internal_status: 'BOOKED' })
      });
      fetchShipments(page, search, activeStatusTab);
    } catch (e) {
      console.error('Failed to approve shipment:', e);
    }
  }, [page, search, activeStatusTab]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'AWB Number',
        accessorKey: 'awb_number',
        cell: (info: any) => (
          <button 
            type="button"
            onClick={() => setTrackingAwb(info.getValue() as string)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {info.getValue() as string}
          </button>
        ),
      },
      {
        header: 'Date',
        accessorKey: 'booking_date',
        cell: (info: any) => info.getValue() ? format(new Date(info.getValue() as string), 'dd MMM yyyy') : '-',
      },
      {
        header: 'Sender (Client)',
        accessorKey: 'client.company_name',
        cell: (info: any) => {
          const row = info.row.original;
          return (
            <div>
              <p className="text-sm font-medium text-slate-900">{row.client?.company_name || 'N/A'}</p>
              {row.client?.contact_person && (
                <p className="text-xs text-slate-500">{row.client.contact_person}</p>
              )}
              {row.client?.address && (
                <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{row.client.address}</p>
              )}
            </div>
          );
        }
      },
      {
        header: 'Courier',
        accessorKey: 'courier.courier_name',
      },
      {
        header: 'Weight / CBM',
        accessorKey: 'actual_weight',
        cell: (info: any) => {
          const row = info.row.original;
          const actual = row.actual_weight;
          const vol = row.volumetric_weight;
          if (!actual && !vol) return <span className="text-slate-400 text-xs italic">Not Provided</span>;
          
          return (
            <div className="text-sm">
              {actual ? <p className="text-slate-900"><span className="font-medium text-slate-500 text-xs">ACT:</span> {actual} kg</p> : null}
              {vol ? <p className="text-slate-900 mt-0.5"><span className="font-medium text-slate-500 text-xs">VOL:</span> {vol} kg</p> : null}
            </div>
          );
        }
      },
      {
        header: 'Receiver',
        accessorKey: 'receiver_name',
        cell: (info: any) => {
          const row = info.row.original;
          return (
            <div>
              <p className="text-sm font-medium text-slate-900">{row.receiver_name}</p>
              <p className="text-xs text-slate-500">{row.receiver_phone || ''}</p>
              <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                {row.receiver_address ? `${row.receiver_address}, ${row.city}` : row.city}
              </p>
            </div>
          );
        }
      },
      {
        header: 'Status',
        accessorKey: 'internal_status',
        cell: (info: any) => {
          const status = info.getValue() as string;
          let color = 'bg-slate-100 text-slate-800 border-slate-300';
          let label = status;

          if (status === 'PENDING_APPROVAL') {
            color = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
            label = 'Pending Admin Approval';
          } else if (status === 'BOOKED' || status === 'CONFIRMED') {
            color = 'bg-blue-50 text-blue-800 border-blue-300 font-medium';
            label = 'Order Confirmed & Booked';
          } else if (status === 'OUT_FOR_PICKUP') {
            color = 'bg-purple-50 text-purple-800 border-purple-300 font-medium';
            label = 'Out For Pickup';
          } else if (status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') {
            color = 'bg-indigo-50 text-indigo-800 border-indigo-300 font-medium';
            label = 'In Transit';
          } else if (status === 'DELIVERED') {
            color = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium';
            label = 'Delivered';
          } else if (status === 'RTO' || status === 'EXCEPTION') {
            color = 'bg-rose-50 text-rose-800 border-rose-300 font-medium';
            label = 'RTO / Exception';
          }
          
          return (
            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 rounded-full border ${color}`}>
              {label}
            </span>
          );
        }
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: (info: any) => {
          const row = info.row.original;
          const isPending = row.internal_status === 'PENDING_APPROVAL';

          return (
            <div className="flex items-center space-x-2">
              {user?.role !== 'CLIENT' && isPending && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleApproveShipment(row);
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1 rounded shadow-sm transition-colors flex items-center cursor-pointer"
                >
                  Confirm Order
                </button>
              )}
              {user?.role !== 'CLIENT' && (
                <button 
                  type="button"
                  onClick={() => openEditModal(row)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded border border-indigo-200 flex items-center"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </button>
              )}
              <button 
                type="button"
                onClick={() => setSelectedLabel(row)}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200 flex items-center"
              >
                <Printer className="w-3 h-3 mr-1" />
                Label
              </button>
              {row.internal_status === 'DELIVERED' && (row.podImageUrl || row.podSignature) && (
                <button 
                  type="button"
                  onClick={() => setSelectedPod(row)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-200"
                >
                  View E-POD
                </button>
              )}
            </div>
          );
        }
      }
    ].filter(col => {
      if (user?.role === 'CLIENT' && col.header === 'Sender (Client)') return false;
      return true;
    }),
    [user?.role, couriers, handleApproveShipment]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleTabChange = (status: string) => {
    setActiveStatusTab(status);
    setPage(1);
    let url = `/shipments?page=1&limit=10`;
    if (search) url += `&search=${search}`;
    if (filterClientId) url += `&clientId=${filterClientId}`;
    if (status) url += `&status=${status}`;
    
    setLoading(true);
    fetchApi(url)
      .then(res => {
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch(console.error);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Shipments</h1>
        <div className="flex space-x-3">
          <button onClick={() => setShowBookModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Book Shipment
          </button>
          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button 
            onClick={exportToCsv}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          {[
            { id: '', label: 'All Orders' },
            { id: 'PENDING_APPROVAL', label: 'Pending Admin Approval', badge: data.filter((s: any) => s.internal_status === 'PENDING_APPROVAL').length },
            { id: 'BOOKED', label: 'Confirmed / Booked' },
            { id: 'IN_TRANSIT', label: 'In Transit' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'RTO', label: 'RTO / Exception' },
          ].map((tab) => {
            const isActive = activeStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-white">
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

      {/* Book Shipment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowBookModal(false)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-3xl">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Book New Shipment</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Fill in all details to create a new shipment</p>
                </div>
                <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBookShipment}>
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">

                  {/* Courier & Client Assignment */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wide">🚚 Courier & Client</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assign Courier</label>
                        <select
                          value={bookingForm.courier_id}
                          onChange={e => setBookingForm({...bookingForm, courier_id: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">-- No Courier --</option>
                          {couriers.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.courier_name}</option>
                          ))}
                        </select>
                        <p className="text-xs text-indigo-600 mt-1">Selecting a courier will auto-generate an AWB</p>
                      </div>
                      {user?.role !== 'CLIENT' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Client <span className="text-red-500">*</span></label>
                          <select
                            value={bookingForm.client_id}
                            onChange={e => setBookingForm({...bookingForm, client_id: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
                            required
                          >
                            <option value="">-- Select a Client --</option>
                            {clients.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.company_name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                        <select
                          value={bookingForm.service_type}
                          onChange={e => setBookingForm({...bookingForm, service_type: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="EXPRESS">Express</option>
                          <option value="STANDARD">Standard</option>
                          <option value="ECONOMY">Economy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Notes</label>
                        <input
                          type="text"
                          value={bookingForm.remarks}
                          onChange={e => setBookingForm({...bookingForm, remarks: e.target.value})}
                          placeholder="Any internal notes..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Receiver Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">📦 Receiver Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Name <span className="text-red-500">*</span></label>
                        <input required type="text" value={bookingForm.receiver_name}
                          onChange={e => setBookingForm({...bookingForm, receiver_name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Phone</label>
                        <input type="text" value={bookingForm.receiver_phone}
                          onChange={e => setBookingForm({...bookingForm, receiver_phone: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Address <span className="text-red-500">*</span></label>
                        <input required type="text" value={bookingForm.receiver_address}
                          onChange={e => setBookingForm({...bookingForm, receiver_address: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
                        <input required type="text" value={bookingForm.city}
                          onChange={e => setBookingForm({...bookingForm, city: e.target.value, destination: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State / Zone <span className="text-red-500">*</span></label>
                        <input required type="text" placeholder="e.g. MH, S1" value={bookingForm.state}
                          onChange={e => setBookingForm({...bookingForm, state: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                        <input type="text" value={bookingForm.pincode}
                          onChange={e => setBookingForm({...bookingForm, pincode: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Origin Zone <span className="text-red-500">*</span></label>
                        <input required type="text" placeholder="e.g. MH, W1" value={bookingForm.origin}
                          onChange={e => setBookingForm({...bookingForm, origin: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>

                  {/* Sender Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">📤 Sender Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sender Name</label>
                        <input type="text" value={bookingForm.sender_name}
                          onChange={e => setBookingForm({...bookingForm, sender_name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sender Phone</label>
                        <input type="text" value={bookingForm.sender_phone}
                          onChange={e => setBookingForm({...bookingForm, sender_phone: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sender Address</label>
                        <input type="text" value={bookingForm.sender_address}
                          onChange={e => setBookingForm({...bookingForm, sender_address: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">⚖️ Package Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Actual Weight (kg) <span className="text-red-500">*</span></label>
                        <input required type="number" step="0.01" value={bookingForm.actual_weight}
                          onChange={e => setBookingForm({...bookingForm, actual_weight: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pieces</label>
                        <input type="number" value={bookingForm.number_of_pieces}
                          onChange={e => setBookingForm({...bookingForm, number_of_pieces: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Declared Value</label>
                        <input type="number" value={bookingForm.declared_value}
                          onChange={e => setBookingForm({...bookingForm, declared_value: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Package Type</label>
                        <select value={bookingForm.package_type}
                          onChange={e => setBookingForm({...bookingForm, package_type: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500">
                          <option value="PARCEL">Parcel</option>
                          <option value="DOCUMENT">Document</option>
                          <option value="PALLET">Pallet</option>
                        </select>
                      </div>
                    </div>
                    {/* Dimensions */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Length (cm)</label>
                        <input type="number" placeholder="cm" value={bookingForm.length}
                          onChange={e => setBookingForm({...bookingForm, length: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Width (cm)</label>
                        <input type="number" placeholder="cm" value={bookingForm.width}
                          onChange={e => setBookingForm({...bookingForm, width: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                        <input type="number" placeholder="cm" value={bookingForm.height}
                          onChange={e => setBookingForm({...bookingForm, height: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>

                  {/* Consignee Warehouse Dock Appointment */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide flex items-center">
                        📅 Consignee Warehouse Dock Appointment
                      </h4>
                      <select
                        value={bookingForm.require_appointment}
                        onChange={e => setBookingForm({...bookingForm, require_appointment: e.target.value})}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-300 bg-white text-purple-900"
                      >
                        <option value="NO">No Appointment Required</option>
                        <option value="YES">Schedule Dock Appointment</option>
                      </select>
                    </div>

                    {bookingForm.require_appointment === 'YES' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-purple-200 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Appointment Date</label>
                          <input
                            type="date"
                            required
                            value={bookingForm.appointment_date}
                            onChange={e => setBookingForm({...bookingForm, appointment_date: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Time Slot Window</label>
                          <select
                            value={bookingForm.appointment_slot}
                            onChange={e => setBookingForm({...bookingForm, appointment_slot: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-bold"
                          >
                            <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Morning Dock)</option>
                            <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM (Midday Dock)</option>
                            <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM (Afternoon Dock)</option>
                            <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Evening Dock)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Dock / Bay # (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Dock 04 / Gate 2"
                            value={bookingForm.dock_number}
                            onChange={e => setBookingForm({...bookingForm, dock_number: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Pass / Token # (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. APT-992014"
                            value={bookingForm.appointment_token}
                            onChange={e => setBookingForm({...bookingForm, appointment_token: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-mono"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Unloading Instructions</label>
                          <input
                            type="text"
                            placeholder="e.g., Palletized, Hydraulic Liftgate, Forklift driver required."
                            value={bookingForm.appointment_notes}
                            onChange={e => setBookingForm({...bookingForm, appointment_notes: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-200 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowBookModal(false)} className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={bookingSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-60">
                    {bookingSubmitting ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* E-POD Modal */}
      {selectedPod && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setSelectedPod(null)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl leading-6 font-bold text-slate-900">E-POD Verification</h3>
                    <p className="text-sm text-slate-500 mt-1">AWB: <span className="font-semibold text-slate-700">{selectedPod.awb_number}</span></p>
                  </div>
                  <button onClick={() => setSelectedPod(null)} className="text-slate-400 hover:text-slate-500 bg-slate-100 p-1.5 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg mb-6 text-sm border border-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold">Delivered To</span>
                      <span className="block text-slate-900 font-medium text-base">{selectedPod.receiver_name}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold">Delivery Time</span>
                      <span className="block text-slate-900 font-medium text-base">
                        {selectedPod.deliveredAt ? format(new Date(selectedPod.deliveredAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedPod.podSignature && (
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-2">Customer Signature</p>
                      <div className="border-2 border-slate-200 border-dashed rounded-lg p-4 bg-white flex justify-center">
                        <img src={selectedPod.podSignature} alt="Customer Signature" className="max-h-48 object-contain" />
                      </div>
                    </div>
                  )}
                  {selectedPod.podImageUrl && (
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-2">Photo Proof</p>
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-100 flex justify-center p-2">
                        <img 
                          src={selectedPod.podImageUrl} 
                          alt="Delivery Photo Proof" 
                          className="max-h-[600px] w-auto object-contain cursor-zoom-in" 
                          onClick={() => {
                            const newTab = window.open();
                            if (newTab) newTab.document.write(`<img src="${selectedPod.podImageUrl}" style="max-width: 100%; height: auto;" />`);
                          }}
                          title="Click to view full size"
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-center mt-2">Click image to view in full size</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setSelectedPod(null)}
                  className="w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-6 py-2.5 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Label Modal */}
      {selectedLabel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Modal Overlay - hidden when printing */}
            <div className="fixed inset-0 transition-opacity print:hidden" aria-hidden="true" onClick={() => setSelectedLabel(null)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen print:hidden" aria-hidden="true">&#8203;</span>
            
            {/* Modal Content / Printable Label */}
            <div id="printable-label" className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-[4in] min-h-[6in] print:w-full print:h-full print:shadow-none print:rounded-none">
              
              {/* Toolbar - hidden when printing */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center rounded-t-xl print:hidden">
                <h3 className="text-sm font-bold text-slate-700">Shipping Label Preview</h3>
                <div className="flex space-x-2">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center">
                    <Printer className="w-3 h-3 mr-1" /> Print
                  </button>
                  <button onClick={() => setSelectedLabel(null)} className="text-slate-500 hover:text-slate-700 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Label Body */}
              <div className="p-6 bg-white flex flex-col h-full print:p-0">
                <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter">LogiFlow</h1>
                    <p className="text-xs font-bold text-gray-500">EXPRESS DELIVERY</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{selectedLabel.booking_date ? format(new Date(selectedLabel.booking_date), 'dd MMM yyyy') : 'N/A'}</p>
                    <p className="text-xs font-bold uppercase">{selectedLabel.courier?.courier_name || 'Standard'}</p>
                  </div>
                </div>

                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-1">To (Receiver):</p>
                      <p className="font-bold text-lg leading-tight">{selectedLabel.receiver_name}</p>
                      <p className="text-sm">{selectedLabel.address}</p>
                      <p className="text-sm font-bold mt-1">{selectedLabel.city}, {selectedLabel.state} {selectedLabel.pincode}</p>
                      <p className="text-sm mt-1">Ph: {selectedLabel.phone}</p>
                    </div>

                    <div className="border-t-2 border-black pt-4 mb-6">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-1">From (Sender):</p>
                      <p className="font-bold text-sm">{selectedLabel.client?.company_name || 'LogiFlow User'}</p>
                      <p className="text-xs">Authorized Shipping Center</p>
                    </div>
                    
                    <div className="border-t-2 border-b-2 border-black py-4 mb-6 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-500 mb-1">Weight:</p>
                        <p className="font-bold">{selectedLabel.actual_weight || '1.0'} kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase text-gray-500 mb-1">Routing Code:</p>
                        <p className="font-black text-2xl uppercase">{selectedLabel.city?.substring(0, 3) || 'RTE'}-{selectedLabel.pincode?.substring(0, 2) || '00'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <div className="flex justify-center mb-2">
                      <Barcode value={selectedLabel.awb_number} width={2} height={80} fontSize={16} margin={0} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-mono">Scan to Track</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingAwb && (
        <TrackingModal awbNumber={trackingAwb} onClose={() => setTrackingAwb(null)} />
      )}

      {/* Edit Shipment Modal */}
      {editShipment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setEditShipment(null)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-3xl">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Shipment</h3>
                  <p className="text-sm text-slate-500 mt-0.5">AWB: <span className="font-semibold text-indigo-600">{editShipment.awb_number}</span></p>
                </div>
                <button onClick={() => setEditShipment(null)} className="text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditShipment}>
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">

                  {/* Courier & Client Assignment */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wide">🚚 Courier Assignment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assign Courier</label>
                        <select
                          value={editForm.courier_id}
                          onChange={e => setEditForm({...editForm, courier_id: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">-- No Courier --</option>
                          {couriers.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.courier_name}</option>
                          ))}
                        </select>
                        <p className="text-xs text-indigo-600 mt-1">Selecting a courier will auto-generate a new AWB via the courier API</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                          value={editForm.internal_status}
                          onChange={e => setEditForm({...editForm, internal_status: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="BOOKED">BOOKED</option>
                          <option value="PICKED_UP">PICKED UP</option>
                          <option value="IN_TRANSIT">IN TRANSIT</option>
                          <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="EXCEPTION">EXCEPTION</option>
                          <option value="RTO">RTO</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                        <select
                          value={editForm.client_id}
                          onChange={e => setEditForm({...editForm, client_id: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- No Client --</option>
                          {clients.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.company_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Notes</label>
                        <input
                          type="text"
                          value={editForm.remarks}
                          onChange={e => setEditForm({...editForm, remarks: e.target.value})}
                          placeholder="Any internal notes..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Receiver Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">📦 Receiver Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Name</label>
                        <input type="text" value={editForm.receiver_name} onChange={e => setEditForm({...editForm, receiver_name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Phone</label>
                        <input type="text" value={editForm.receiver_phone} onChange={e => setEditForm({...editForm, receiver_phone: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Address</label>
                        <input type="text" value={editForm.receiver_address} onChange={e => setEditForm({...editForm, receiver_address: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                        <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State / Zone</label>
                        <input type="text" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                        <input type="text" value={editForm.pincode} onChange={e => setEditForm({...editForm, pincode: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Origin Zone</label>
                        <input type="text" value={editForm.origin} onChange={e => setEditForm({...editForm, origin: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>

                  {/* Sender Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">📤 Sender Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sender Name</label>
                        <input type="text" value={editForm.sender_name} onChange={e => setEditForm({...editForm, sender_name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sender Phone</label>
                        <input type="text" value={editForm.sender_phone} onChange={e => setEditForm({...editForm, sender_phone: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sender Address</label>
                        <input type="text" value={editForm.sender_address} onChange={e => setEditForm({...editForm, sender_address: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">⚖️ Package Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Actual Weight (kg)</label>
                        <input type="number" step="0.01" value={editForm.actual_weight} onChange={e => setEditForm({...editForm, actual_weight: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pieces</label>
                        <input type="number" value={editForm.number_of_pieces} onChange={e => setEditForm({...editForm, number_of_pieces: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Declared Value</label>
                        <input type="number" value={editForm.declared_value} onChange={e => setEditForm({...editForm, declared_value: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Package Type</label>
                        <select value={editForm.package_type} onChange={e => setEditForm({...editForm, package_type: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500">
                          <option value="PARCEL">Parcel</option>
                          <option value="DOCUMENT">Document</option>
                          <option value="PALLET">Pallet</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-200 flex justify-end space-x-3">
                  <button type="button" onClick={() => setEditShipment(null)} className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={editSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-60">
                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Shipments;
