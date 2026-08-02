import React from 'react';

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'Không có dữ liệu.' }) => (
  <div className="p-8 text-center text-slate-400 text-sm">{message}</div>
);
