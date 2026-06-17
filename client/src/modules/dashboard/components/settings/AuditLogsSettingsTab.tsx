'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/lib/apiClient';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Btn, Card, Badge } from '../Primitives';

interface AuditLog {
  id: number;
  userId: number | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  action: string;
  entity: string;
  entityId: string;
  entityLabel: string | null;
  before: any;
  after: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export default function AuditLogsSettingsTab({ t }: { t: any }) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [entity, action]);

  const { data, isLoading, refetch } = useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', page, limit, entity, action, debouncedSearch],
    queryFn: async () => {
      const params: any = { page, limit };
      if (entity) params.entity = entity;
      if (action) params.action = action;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await apiClient.get<AuditLogsResponse>('/audit-logs', { params });
      return res.data;
    },
  });

  const getActionBadgeColor = (act: string) => {
    switch (act.toUpperCase()) {
      case 'CREATE':
        return { bg: '#def7ec', text: '#03543f' }; // Light green
      case 'DELETE':
        return { bg: '#fde8e8', text: '#9b1c1c' }; // Light red
      case 'TOGGLE':
        return { bg: '#e1effe', text: '#1e429f' }; // Light blue
      case 'UPDATE':
      default:
        return { bg: '#fef08a', text: '#713f12' }; // Light yellow/orange
    }
  };

  const getEntityBadgeColor = (ent: string) => {
    switch (ent) {
      case 'SiteSettings':
      case 'Settings':
        return { bg: '#f3e8ff', text: '#6b21a8' };
      case 'HomepageStats':
        return { bg: '#e0f2fe', text: '#075985' };
      case 'Coupon':
        return { bg: '#dcfce7', text: '#166534' };
      case 'Promotion':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'PaymentMethodOption':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'HeroSlider':
        return { bg: '#e0f2fe', text: '#0369a1' };
      case 'Product':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'Category':
        return { bg: '#fae8ff', text: '#86198f' };
      case 'ManualSale':
        return { bg: '#ffedd5', text: '#9a3412' };
      case 'Order':
        return { bg: '#e0e7ff', text: '#3730a3' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Filters Area */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Search */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Search keyword
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, User, Action..."
            className="w-full box-border rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        {/* Entity Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Filter by Resource
          </label>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full cursor-pointer box-border rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">All Resources</option>
            <option value="SiteSettings">Site Settings</option>
            <option value="HomepageStats">Homepage Stats & Delivery</option>
            <option value="PaymentMethodOption">Payment Methods</option>
            <option value="HeroSlider">Hero Sliders</option>
            <option value="Coupon">Coupons</option>
            <option value="Promotion">Promotions</option>
            <option value="Product">Products</option>
            <option value="Category">Categories</option>
            <option value="ManualSale">Point of Sale & Manual Sales</option>
            <option value="Order">E-Commerce Orders</option>
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Filter by Action
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full cursor-pointer box-border rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="TOGGLE">TOGGLE</option>
          </select>
        </div>
      </div>

      {/* Main List / Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading audit logs...
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No audit logs found matching the filter criteria.
          </div>
        ) : (
          <table className="w-full table-auto border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/75 text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Operator / User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Client Info</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.data.map((log) => {
                const actionBadge = getActionBadgeColor(log.action);
                const entityBadge = getEntityBadgeColor(log.entity);
                const date = new Date(log.createdAt);
                
                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      <div className="font-semibold text-foreground">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div>
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {log.user ? (
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {log.user.avatarUrl ? (
                              <img src={log.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              `${log.user.firstName?.[0] || ''}${log.user.lastName?.[0] || ''}`.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground leading-none mb-0.5">
                              {log.user.firstName} {log.user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground leading-none">
                              {log.user.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground font-medium italic">System Process</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge label={log.action} bg={actionBadge.bg} color={actionBadge.text} />
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="mb-1">
                        <Badge label={log.entity} bg={entityBadge.bg} color={entityBadge.text} />
                      </div>
                      <div className="truncate text-xs font-semibold text-foreground" title={log.entityLabel || ''}>
                        {log.entityLabel || `${log.entity} #${log.entityId}`}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate">
                      <div className="font-mono text-foreground">{log.ipAddress || 'Unknown IP'}</div>
                      <div className="truncate" title={log.userAgent || ''}>{log.userAgent || 'Unknown Agent'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-xs font-bold"
                      >
                        Details
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            Showing Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Btn
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Btn>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-foreground leading-none">
                  Audit Log Details
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Log #{selectedLog.id} • Created at {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border-none bg-transparent p-1.5 text-muted-foreground hover:bg-gray-100 hover:text-foreground cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Operator & Client Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-border">
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Operator</h4>
                  {selectedLog.user ? (
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        {selectedLog.user.firstName} {selectedLog.user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{selectedLog.user.email}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic font-semibold">System Process</div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Client Context</h4>
                  <div className="text-xs text-foreground space-y-1">
                    <div><span className="font-semibold">IP Address:</span> <span className="font-mono">{selectedLog.ipAddress || 'N/A'}</span></div>
                    <div className="truncate" title={selectedLog.userAgent || ''}><span className="font-semibold">User Agent:</span> {selectedLog.userAgent || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Resource & Action info */}
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground mr-2">Action:</span>
                  <Badge
                    label={selectedLog.action}
                    bg={getActionBadgeColor(selectedLog.action).bg}
                    color={getActionBadgeColor(selectedLog.action).text}
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground mr-2">Resource:</span>
                  <Badge
                    label={selectedLog.entity}
                    bg={getEntityBadgeColor(selectedLog.entity).bg}
                    color={getEntityBadgeColor(selectedLog.entity).text}
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground mr-2">Resource ID:</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded">{selectedLog.entityId}</span>
                </div>
              </div>

              {/* State Diff comparison */}
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">State Changes</h4>
                <div className="rounded-xl border border-border overflow-hidden bg-gray-900 text-gray-100 font-mono text-xs shadow-inner">
                  <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-[11px] font-semibold text-gray-400 flex justify-between">
                    <span>Field Name</span>
                    <span>Old Value → New Value</span>
                  </div>
                  <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                    <DiffViewer before={selectedLog.before} after={selectedLog.after} action={selectedLog.action} />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-border px-6 py-4 bg-gray-50/50">
              <Btn variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Diff Viewer component
function DiffViewer({ before, after, action }: { before: any; after: any; action: string }) {
  if (action === 'DELETE' && before) {
    return (
      <div className="space-y-1">
        <div className="text-red-400 mb-1 text-[11px]">All values deleted:</div>
        {Object.entries(before).map(([key, val]) => (
          <div key={key} className="flex flex-col md:flex-row md:items-start gap-1 py-1 border-b border-gray-800/50">
            <span className="text-amber-400 font-semibold min-w-[160px] truncate">{key}:</span>
            <span className="text-red-400 line-through truncate max-w-md">{formatVal(val)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (action === 'CREATE' && after) {
    return (
      <div className="space-y-1">
        <div className="text-green-400 mb-1 text-[11px]">Initial values created:</div>
        {Object.entries(after).map(([key, val]) => (
          <div key={key} className="flex flex-col md:flex-row md:items-start gap-1 py-1 border-b border-gray-800/50">
            <span className="text-amber-400 font-semibold min-w-[160px] truncate">{key}:</span>
            <span className="text-green-400 truncate max-w-md">{formatVal(val)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (!before && !after) {
    return <div className="text-gray-400 italic">No state data captured for this action.</div>;
  }

  // UPDATE diff calculation
  const bObj = before || {};
  const aObj = after || {};
  const allKeys = Array.from(new Set([...Object.keys(bObj), ...Object.keys(aObj)]));
  
  // Exclude boilerplate timestamps if they haven't changed meaningfully
  const filteredKeys = allKeys.filter((key) => {
    if (['updatedAt', 'createdAt', 'lastUpdated'].includes(key)) {
      return false;
    }
    const valB = JSON.stringify(bObj[key]);
    const valA = JSON.stringify(aObj[key]);
    return valB !== valA;
  });

  if (filteredKeys.length === 0) {
    return <div className="text-gray-400 italic">No fields were modified or captured.</div>;
  }

  return (
    <div className="space-y-2">
      {filteredKeys.map((key) => {
        const valB = bObj[key];
        const valA = aObj[key];

        return (
          <div key={key} className="py-1.5 border-b border-gray-800/60 last:border-b-0">
            <div className="text-amber-400 font-semibold mb-1">{key}:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 border-l border-gray-700">
              <div className="bg-red-950/40 text-red-300 p-1.5 rounded border border-red-900/30 overflow-x-auto whitespace-pre truncate">
                <span className="text-[10px] text-red-500 uppercase font-bold block mb-0.5">Before</span>
                {formatVal(valB)}
              </div>
              <div className="bg-green-950/40 text-green-300 p-1.5 rounded border border-green-900/30 overflow-x-auto whitespace-pre truncate">
                <span className="text-[10px] text-green-500 uppercase font-bold block mb-0.5">After</span>
                {formatVal(valA)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatVal(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'object') {
    return JSON.stringify(val, null, 2);
  }
  return String(val);
}
