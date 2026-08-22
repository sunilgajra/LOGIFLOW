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

  useEffect(() => {
    const bookCourierId = searchParams.get('bookCourierId');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const weight = searchParams.get('weight');

    if (bookCourierId || origin || destination || weight) {
      setBookingForm((prev: any) => ({
        ...prev,
        courier_id: couriers.some((c: any) => c.id === bookCourierId) ? bookCourierId : (couriers[0]?.id || ''),
        origin: origin || prev.origin,
        pincode: destination || prev.pincode,
        destination: destination || prev.destination,
        actual_weight: weight || prev.actual_weight
      }));
      setShowBookModal(true);
    }
  }, [searchParams, couriers]);

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

    // 1. Instant React state update
    setData(prev => prev.map((s: any) => 
      (s.id === targetId || s.awb_number === targetId || s.awb_number === row.awb_number || s.id === row.id) 
        ? { ...s, internal_status: 'BOOKED' } 
        : s
    ));

    // 2. Instant localStorage persistence
    try {
      const stored = localStorage.getItem('demo_shipments');
      if (stored) {
        let list = JSON.parse(stored);
        const idx = list.findIndex((s: any) => String(s.id) === String(targetId) || String(s.awb_number) === String(targetId) || String(s.awb_number) === String(row.awb_number));
        if (idx !== -1) {
          list[idx].internal_status = 'BOOKED';
        } else {
          list.unshift({ ...row, internal_status: 'BOOKED' });
        }
        localStorage.setItem('demo_shipments', JSON.stringify(list));
      }
    } catch (e) {}

    // 3. Backend / API update
    try {
      await fetchApi(`/shipments/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...row, internal_status: 'BOOKED' })
      });
    } catch (e) {
      console.error('Failed to approve shipment:', e);
    }
  }, [page, search, activeStatusTab]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'LR NUMBER & MWB',
        accessorKey: 'awb_number',
        cell: (info: any) => {
          const row = info.row.original;
          const mwb = `2805${(row.awb_number || '').replace(/[^0-9]/g, '').slice(-10) || '1311998010'}`;
          return (
            <div>
              <button 
                type="button"
                onClick={() => setTrackingAwb(row.awb_number)}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-xs cursor-pointer block"
              >
                {row.awb_number}
              </button>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">{mwb}</span>
            </div>
          );
        },
      },
      {
        header: 'MANIFESTED ON',
        accessorKey: 'booking_date',
        cell: (info: any) => (
          <div className="text-xs font-medium text-slate-700">
            <p className="font-bold">{info.getValue() ? format(new Date(info.getValue() as string), 'dd MMM, yyyy') : '19 Aug, 2026'}</p>
            <p className="text-[10px] text-slate-400 font-mono">02:15 PM</p>
          </div>
        ),
      },
      {
        header: 'PRODUCT DETAILS',
        accessorKey: 'declared_value',
        cell: (info: any) => {
          const row = info.row.original;
          const val = row.declared_value || 10000;
          return (
            <div className="text-xs">
              <p className="font-bold text-slate-900">1 Invoice</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">₹{val.toLocaleString('en-IN')} | Pre-paid</p>
            </div>
          );
        }
      },
      {
        header: 'FREIGHT MODE',
        accessorKey: 'service_type',
        cell: (info: any) => (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded uppercase font-mono">
            BTC
          </span>
        )
      },
      {
        header: 'PICKUP & DELIVERY ADDRESS',
        accessorKey: 'receiver_address',
        cell: (info: any) => {
          const row = info.row.original;
          const originLocation = row.sender_name || row.client?.company_name || 'Prostam';
          const originCityPin = `${row.origin || row.city || 'Pune'} - ${row.sender_address ? (row.sender_address.match(/\d{6}/)?.[0] || '411060') : '411060'}`;
          
          const deliveryLocation = row.receiver_name || 'Canteen Stores Department';
          const deliveryCityPin = `${row.city || 'Bikaner'} - ${row.pincode || '334001'}`;

          return (
            <div className="flex items-start space-x-2.5 py-0.5 text-xs">
              <div className="flex flex-col items-center mt-1">
                <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white shrink-0" />
                <div className="w-0.5 h-6 border-l-2 border-dotted border-slate-400 dark:border-slate-500 my-0.5" />
                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                  {originLocation} <span className="text-slate-400 font-medium">({originCityPin})</span>
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                  {deliveryLocation} <span className="text-slate-400 font-medium">({deliveryCityPin})</span>
                </div>
              </div>
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

  const [selectedBatchLabels, setSelectedBatchLabels] = useState<any[] | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(filterClientId || '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Shipments</h1>
        <div className="flex flex-wrap items-center gap-2">
          {clients.length > 0 && user?.role !== 'CLIENT' && (
            <select
              value={selectedClientFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedClientFilter(val);
                fetchShipments(1, search, activeStatusTab);
              }}
              className="bg-white border border-slate-300 rounded-md text-xs font-semibold px-3 py-2 text-slate-700 shadow-xs cursor-pointer"
            >
              <option value="">-- All Clients --</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          )}

          <button 
            onClick={() => {
              const clientObj = clients.find((c: any) => c.id === selectedClientFilter);
              const labelsToPrint = selectedClientFilter 
                ? data.filter((s: any) => s.client_id === selectedClientFilter || s.client?.id === selectedClientFilter || s.client?.company_name === clientObj?.company_name)
                : data;
              if (!labelsToPrint || labelsToPrint.length === 0) {
                alert('No shipments available to print for this selection');
                return;
              }
              setSelectedBatchLabels(labelsToPrint);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-1.5 text-blue-400" />
            Bulk Print 4x6 Labels {selectedClientFilter ? `(${clients.find((c: any) => c.id === selectedClientFilter)?.company_name || 'Client'})` : `(${data.length})`}
          </button>

          <button onClick={() => setShowBookModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Book Shipment
          </button>
          <button 
            onClick={exportToCsv}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-md text-xs font-bold transition-colors flex items-center cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          {[
            { id: '', label: 'All Orders' },
            { id: 'MANIFESTED', label: 'Manifested (Awaiting Pickup)', badge: data.filter((s: any) => s.internal_status === 'MANIFESTED' || s.internal_status === 'PENDING_APPROVAL' || s.internal_status === 'BOOKED').length },
            { id: 'PENDING_APPROVAL', label: 'Pending Admin Approval' },
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

      {/* Thermal 4x6 Shipping Label Modal */}
      {selectedLabel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity print:hidden" aria-hidden="true" onClick={() => setSelectedLabel(null)}>
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen print:hidden" aria-hidden="true">&#8203;</span>
            
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md print:w-[4in] print:h-[6in] print:shadow-none print:rounded-none">
              
              {/* Toolbar */}
              <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex justify-between items-center rounded-t-xl print:hidden">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold">4x6 Thermal Label Preview</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => window.print()} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print 4x6 Label
                  </button>
                  <button onClick={() => setSelectedLabel(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 4x6 Label Printable Container */}
              <div id="printable-label" className="p-4 bg-white text-black font-sans text-xs w-[4in] min-h-[6in] border border-black mx-auto print:border-none print:p-0">
                {/* 1. Header Row */}
                <div className="border-b-2 border-black pb-2 mb-2 flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black tracking-tight leading-none">LogiFlow</h1>
                    <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider">Express Logistics</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold block text-slate-600">DATE: {selectedLabel.booking_date ? format(new Date(selectedLabel.booking_date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                    <span className="text-xs font-black uppercase bg-black text-white px-1.5 py-0.5 rounded inline-block mt-0.5">
                      {selectedLabel.courier?.courier_name || 'DELHIVERY AIR'}
                    </span>
                  </div>
                </div>

                {/* 2. Routing Code Box */}
                <div className="border-2 border-black p-1.5 mb-2 bg-black text-white flex justify-between items-center rounded-xs">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest text-slate-300 block">Hub Sort Code</span>
                    <span className="text-lg font-black tracking-widest font-mono">
                      {selectedLabel.city?.substring(0, 3).toUpperCase() || 'DEL'}/{selectedLabel.state?.substring(0, 2).toUpperCase() || 'N1'}-{selectedLabel.pincode || '400001'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold bg-white text-black px-1.5 py-0.5 rounded uppercase">
                      {selectedLabel.service_type || 'EXPRESS'}
                    </span>
                  </div>
                </div>

                {/* 3. Deliver To (Consignee) */}
                <div className="border-b-2 border-black pb-2 mb-2">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">SHIP TO (CONSIGNEE):</span>
                  <p className="text-sm font-black leading-tight text-black">{selectedLabel.receiver_name}</p>
                  <p className="text-[11px] font-semibold leading-tight text-slate-800 mt-0.5">{selectedLabel.receiver_address || selectedLabel.address}</p>
                  <p className="text-xs font-black text-black mt-1 uppercase">
                    {selectedLabel.city}, {selectedLabel.state} - {selectedLabel.pincode}
                  </p>
                  <p className="text-[11px] font-bold text-slate-900 mt-0.5">Ph: {selectedLabel.receiver_phone || selectedLabel.phone || 'N/A'}</p>
                </div>

                {/* 4. Sender Details */}
                <div className="border-b-2 border-black pb-2 mb-2">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">SHIP FROM (SENDER):</span>
                  <p className="text-xs font-bold text-black">{selectedLabel.client?.company_name || selectedLabel.sender_name || 'LogiFlow Merchant'}</p>
                  <p className="text-[10px] text-slate-700 leading-tight">{selectedLabel.sender_address || selectedLabel.client?.address || 'Authorized LogiFlow Origin Fulfillment Center'}</p>
                </div>

                {/* 5. Package Details & Payment Grid */}
                <div className="border-2 border-black p-1.5 mb-2 grid grid-cols-3 gap-1 text-center bg-slate-50">
                  <div className="border-r border-black pr-1">
                    <span className="text-[8px] font-bold uppercase text-slate-500 block">Actual Wt</span>
                    <span className="text-xs font-black">{selectedLabel.actual_weight || '1.0'} kg</span>
                  </div>
                  <div className="border-r border-black px-1">
                    <span className="text-[8px] font-bold uppercase text-slate-500 block">Pieces</span>
                    <span className="text-xs font-black">{selectedLabel.number_of_pieces || 1} Pcs</span>
                  </div>
                  <div className="pl-1">
                    <span className="text-[8px] font-bold uppercase text-slate-500 block">Payment</span>
                    <span className={`text-[10px] font-black px-1 rounded block ${selectedLabel.cod_amount ? 'bg-black text-white' : 'bg-slate-200 text-black'}`}>
                      {selectedLabel.cod_amount ? `COD: ₹${selectedLabel.cod_amount}` : 'PREPAID'}
                    </span>
                  </div>
                </div>

                {/* 6. Code-128 Barcode */}
                <div className="text-center pt-1 border-t border-slate-300">
                  <div className="flex justify-center my-1">
                    <Barcode 
                      value={selectedLabel.awb_number || 'DELH88291034'} 
                      width={1.8} 
                      height={65} 
                      fontSize={13} 
                      margin={0} 
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Scan Barcode at Dispatch & Sorting Hub
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Thermal 4x6 Shipping Label Modal (Per Client / Selection) */}
      {selectedBatchLabels && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity print:hidden" aria-hidden="true" onClick={() => setSelectedBatchLabels(null)}>
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen print:hidden" aria-hidden="true">&#8203;</span>
            
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-2xl print:w-full print:shadow-none print:rounded-none">
              
              {/* Toolbar */}
              <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex justify-between items-center rounded-t-xl print:hidden">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold">Bulk 4x6 Thermal Label Print ({selectedBatchLabels.length} Labels)</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => window.print()} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print All {selectedBatchLabels.length} Thermal Labels
                  </button>
                  <button onClick={() => setSelectedBatchLabels(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Batch Labels Container */}
              <div id="printable-label" className="p-4 bg-slate-100 max-h-[75vh] overflow-y-auto space-y-6 print:p-0 print:bg-white print:max-h-none print:space-y-0">
                {selectedBatchLabels.map((lbl: any, idx: number) => (
                  <div 
                    key={lbl.id || idx} 
                    className="p-4 bg-white text-black font-sans text-xs w-[4in] min-h-[6in] border border-black mx-auto shadow-sm print:border-none print:p-0 print:shadow-none mb-6 print:mb-0"
                    style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
                  >
                    {/* Header Row */}
                    <div className="border-b-2 border-black pb-2 mb-2 flex justify-between items-start">
                      <div>
                        <h1 className="text-xl font-black tracking-tight leading-none">LogiFlow</h1>
                        <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider">Express Logistics</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold block text-slate-600">DATE: {lbl.booking_date ? format(new Date(lbl.booking_date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                        <span className="text-xs font-black uppercase bg-black text-white px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {lbl.courier?.courier_name || 'DELHIVERY AIR'}
                        </span>
                      </div>
                    </div>

                    {/* Routing Code Box */}
                    <div className="border-2 border-black p-1.5 mb-2 bg-black text-white flex justify-between items-center rounded-xs">
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-slate-300 block">Hub Sort Code</span>
                        <span className="text-lg font-black tracking-widest font-mono">
                          {lbl.city?.substring(0, 3).toUpperCase() || 'DEL'}/{lbl.state?.substring(0, 2).toUpperCase() || 'N1'}-{lbl.pincode || '400001'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold bg-white text-black px-1.5 py-0.5 rounded uppercase">
                          {lbl.service_type || 'EXPRESS'}
                        </span>
                      </div>
                    </div>

                    {/* Deliver To (Consignee) */}
                    <div className="border-b-2 border-black pb-2 mb-2">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">SHIP TO (CONSIGNEE):</span>
                      <p className="text-sm font-black leading-tight text-black">{lbl.receiver_name}</p>
                      <p className="text-[11px] font-semibold leading-tight text-slate-800 mt-0.5">{lbl.receiver_address || lbl.address}</p>
                      <p className="text-xs font-black text-black mt-1 uppercase">
                        {lbl.city}, {lbl.state} - {lbl.pincode}
                      </p>
                      <p className="text-[11px] font-bold text-slate-900 mt-0.5">Ph: {lbl.receiver_phone || lbl.phone || 'N/A'}</p>
                    </div>

                    {/* Sender Details */}
                    <div className="border-b-2 border-black pb-2 mb-2">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">SHIP FROM (SENDER):</span>
                      <p className="text-xs font-bold text-black">{lbl.client?.company_name || lbl.sender_name || 'LogiFlow Merchant'}</p>
                      <p className="text-[10px] text-slate-700 leading-tight">{lbl.sender_address || lbl.client?.address || 'Authorized LogiFlow Origin Fulfillment Center'}</p>
                    </div>

                    {/* Package Details & Payment Grid */}
                    <div className="border-2 border-black p-1.5 mb-2 grid grid-cols-3 gap-1 text-center bg-slate-50">
                      <div className="border-r border-black pr-1">
                        <span className="text-[8px] font-bold uppercase text-slate-500 block">Actual Wt</span>
                        <span className="text-xs font-black">{lbl.actual_weight || '1.0'} kg</span>
                      </div>
                      <div className="border-r border-black px-1">
                        <span className="text-[8px] font-bold uppercase text-slate-500 block">Pieces</span>
                        <span className="text-xs font-black">{lbl.number_of_pieces || 1} Pcs</span>
                      </div>
                      <div className="pl-1">
                        <span className="text-[8px] font-bold uppercase text-slate-500 block">Payment</span>
                        <span className={`text-[10px] font-black px-1 rounded block ${lbl.cod_amount ? 'bg-black text-white' : 'bg-slate-200 text-black'}`}>
                          {lbl.cod_amount ? `COD: ₹${lbl.cod_amount}` : 'PREPAID'}
                        </span>
                      </div>
                    </div>

                    {/* Code-128 Barcode */}
                    <div className="text-center pt-1 border-t border-slate-300">
                      <div className="flex justify-center my-1">
                        <Barcode 
                          value={lbl.awb_number || 'DELH88291034'} 
                          width={1.8} 
                          height={65} 
                          fontSize={13} 
                          margin={0} 
                        />
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        Label {idx + 1} of {selectedBatchLabels.length} — Scan Barcode at Hub
                      </p>
                    </div>
                  </div>
                ))}
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
